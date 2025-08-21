import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";
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

// Koppla till Postgres (docker-compose db)
const pool = new Pool({
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "postgres",
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "ads_saas",
});

// Testa DB
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// Testa enkel upload
app.get("/upload", async (req, res) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: "test.txt",
      Body: "Hello from Node + MinIO 🚀",
    });

    await s3.send(command);
    res.json({ message: "File uploaded to MinIO!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Uppladdning misslyckades" });
  }
});

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Upload valfri fil
app.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen fil bifogad (key = 'file')" });
    }

    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,           // t.ex. "annonsera-saas"
      Key: req.file.originalname,               // filnamnet i bucketen
      Body: req.file.buffer,                    // filinnehåll
      ContentType: req.file.mimetype,           // MIME-typ
    });

    await s3.send(cmd);
    res.json({ ok: true, key: req.file.originalname });
  } catch (err: any) {
    console.error("upload-file error:", err?.name, err?.message);
    res.status(500).json({ error: "Upload failed" });
  }
});


// Lista filer i hinken
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

// Start servern
app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  await ensureBucketExists(process.env.S3_BUCKET!);
});
