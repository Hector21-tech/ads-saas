import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";
import cors from "cors";
import { z } from "zod";
import { prisma } from "./db";  // <- egen fil som du skapade (db.ts)
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initiera S3
const s3 = new S3Client({
  region: "us-east-1", // krävs även om MinIO inte bryr sig
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// Radera en fil
app.delete("/assets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Hämta asset från DB
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    // Ta bort från S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: asset.key,
    }));

    // Ta bort från DB
    await prisma.asset.delete({ where: { id } });

    res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error("delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Se till att bucket finns
async function ensureBucketExists(bucket: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✅ Bucket "${bucket}" finns redan`);
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      console.log(`ℹ️  Bucket "${bucket}" saknas – skapar...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`✅ Bucket "${bucket}" skapad!`);
    } else {
      console.error("Fel vid kontroll av bucket:", err);
    }
  }
}

// Hämta presigned URL för en fil
app.get("/assets/:id/url", async (req, res) => {
  const { id } = req.params;

  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const cmd = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: asset.key,
    });

    // URL gäller i 60 sekunder
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    res.json({ url });
  } catch (err) {
    console.error("presign error:", err);
    res.status(500).json({ error: "Could not generate presigned URL" });
  }
});

// Koppla till Postgres (docker-compose db)
const pool = new Pool({
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "postgres",
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "ads_saas",
});

// === Health check (Postgres) ===
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// === Prisma endpoints ===

// Users
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

app.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const user = await prisma.user.create({ data: parsed.data });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Email finns redan" });
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Campaigns
const createCampaignSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2),
  city: z.string().min(2),
  radiusKm: z.number().int().positive(),
  budgetKr: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

app.post("/campaigns", async (req, res) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: parsed.data.userId,
        name: parsed.data.name,
        city: parsed.data.city,
        radiusKm: parsed.data.radiusKm,
        budgetKr: parsed.data.budgetKr,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });
    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/campaigns", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "userId saknas" });

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Upload valfri fil + spara i Asset
app.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Ingen fil bifogad (key = 'file')" });

    const key = req.file.originalname;
    const mime = req.file.mimetype;
    const size = req.file.size;

    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: req.file.buffer,
      ContentType: mime,
    });

    await s3.send(cmd);

    const asset = await prisma.asset.create({
      data: { key, mime, size },
    });

    res.json({ ok: true, key, assetId: asset.id });
  } catch (err: any) {
    console.error("upload-file error:", err?.name, err?.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Lista filer i S3
app.get("/list", async (_req, res) => {
  try {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET! }));
    res.json({
      items: (r.Contents || []).map((o) => ({ key: o.Key, size: o.Size })),
    });
  } catch (err: any) {
    console.error("list error:", err?.name, err?.message);
    res.status(500).json({ error: "List failed" });
  }
});

app.get("/assets", async (_req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch assets" });
  }
});

// Start servern
app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  await ensureBucketExists(process.env.S3_BUCKET!);
});
