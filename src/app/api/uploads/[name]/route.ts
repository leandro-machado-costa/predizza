import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const filePath = path.join(process.cwd(), "data", "uploads", name);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(name).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
