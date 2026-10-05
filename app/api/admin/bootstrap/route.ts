import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  setupToken: z.string().min(32).max(128),
  email: z.string().trim().email().max(254),
  password: z.string().min(20).max(256),
});
const response = (body: Record<string, string>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected) return response({ error: "Owner setup is unavailable." }, 404);
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return response({ error: "Request rejected." }, 403);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 4096) return response({ error: "Request is too large." }, 413);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "Enter the setup details and try again." }, 400); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return response({ error: "Enter a valid email, a setup code, and a password of at least 20 characters." }, 400);
  const supplied = Buffer.from(parsed.data.setupToken);
  const configured = Buffer.from(expected);
  if (supplied.length !== configured.length || !timingSafeEqual(supplied, configured)) return response({ error: "The setup code is not valid." }, 403);

  try {
    const created = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(74189903)`;
      if (await tx.adminUser.count() > 0) return false;
      await tx.adminUser.create({
        data: {
          email: parsed.data.email.toLowerCase(),
          passwordHash: await bcrypt.hash(parsed.data.password, 12),
          role: "ADMIN",
        },
      });
      return true;
    });
    if (!created) return response({ error: "The owner account has already been created. Sign in at /admin." }, 409);
    return response({ ok: "Owner account created. Sign in at /admin." }, 201);
  } catch {
    return response({ error: "Could not finish setup. Try again in a moment." }, 500);
  }
}
