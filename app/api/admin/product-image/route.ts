import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { jsonError, verifySameOrigin } from "@/lib/http";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

function matchesSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, i) => bytes[i] === value);
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(req: Request) {
  if (!await requireApiAdmin()) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!verifySameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a cover image to upload." }, { status: 400 });
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Cover images must be 5 MB or smaller." }, { status: 400 });
    const extension = imageTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(file.type, bytes)) return NextResponse.json({ error: "That file does not appear to be a valid image." }, { status: 400 });
    const blob = await put(`product-covers/${randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return jsonError(error);
  }
}
