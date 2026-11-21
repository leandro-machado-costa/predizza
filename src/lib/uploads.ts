import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function saveUploadFile(file: File): Promise<string | null> {
  if (!file || !file.size) return null;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name || "") || ".jpg";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const dest = path.join(UPLOAD_DIR, name);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return `/api/uploads/${name}`;
}
