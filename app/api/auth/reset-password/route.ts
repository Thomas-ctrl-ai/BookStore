import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  recoveryCode: z.string().min(32).max(128),
  email: z.string().trim().email().max(254),
  password: z.string().min(20).max(256),
});
const response = (body: Record<string, string>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected) return response({ error: "Password recovery is unavailable." }, 404);
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return response({ error: "Request rejected." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return response({ error: "Request is too large." }, 413);

  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "Enter your recovery details and try again." }, 400); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return response({ error: "Enter your email, recovery code, and a password of at least 20 characters." }, 400);

  const supplied = Buffer.from(parsed.data.recoveryCode);
  const configured = Buffer.from(expected);
  if (supplied.length !== configured.length || !timingSafeEqual(supplied, configured)) {
    return response({ error: "The recovery details could not be verified." }, 403);
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, active: true },
    });
    if (!admin?.active) return response({ error: "The recovery details could not be verified." }, 403);

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async (tx) => {
      await tx.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
      await tx.adminSession.deleteMany({ where: { userId: admin.id } });
    });
    return response({ ok: "Password updated. Sign in with your new password." });
  } catch (error) {
    console.error("[admin-password-recovery] Failed", error instanceof Error ? error.name : "unknown error");
    return response({ error: "Password recovery is temporarily unavailable. Please try again." }, 500);
  }
}
