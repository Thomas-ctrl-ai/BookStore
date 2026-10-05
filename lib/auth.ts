import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "pnk_admin_session";
export function tokenHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return prisma.adminSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: { id: true, email: true, active: true, role: true } } } }).then(async (session) => {
    if (!session || session.expiresAt <= new Date() || !session.user.active) {
      if (session) await prisma.adminSession.deleteMany({ where: { id: session.id } });
      return null;
    }
    return session.user;
  });
}
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent((await headers()).get("x-pathname") ?? "/admin")}`);
  return admin;
}
export async function requireApiAdmin() { return getAdmin(); }
export async function newSessionToken() { return randomBytes(32).toString("hex"); }
