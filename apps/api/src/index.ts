import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { prisma } from "./db";
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authMiddleware, 
  optionalAuthMiddleware
} from "./auth";
import type { AuthRequest } from "./auth";
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
const port = process.env.PORT || 3010;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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

// === Auth endpoints ===

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

app.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { email, password, name } = parsed.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Registration failed" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

app.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out successfully" });
});

app.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// === Prisma endpoints ===

// Users (deprecated - use auth endpoints instead)
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

// Campaigns (protected endpoints)
const createCampaignSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  radiusKm: z.number().int().positive(),
  budgetKr: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

app.post("/campaigns", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: req.user!.id,
        name: parsed.data.name,
        city: parsed.data.city,
        radiusKm: parsed.data.radiusKm,
        budgetKr: parsed.data.budgetKr,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    res.status(201).json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/campaigns", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { ads: true }
        }
      }
    });
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/campaigns/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
      include: {
        ads: true,
        metrics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    res.json(campaign);
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
