import { config as loadEnv } from "dotenv";
loadEnv({ path: [".env.local", ".env"] });
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function hiddenPassword(): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error("Run this command in an interactive terminal to enter the password without displaying it.");
  stdout.write("New administrator password (hidden; at least 20 characters): ");
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  let value = "";
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", read);
      stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const read = (key: string) => {
      if (key === "\u0003") { finish(new Error("Cancelled.")); return; }
      if (key === "\r" || key === "\n") { finish(); return; }
      if (key === "\u007f" || key === "\b") { value = value.slice(0, -1); return; }
      if (key.length === 1 && value.length < 256) value += key;
    };
    stdin.on("data", read);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL in .env.local before bootstrapping the administrator.");
  const terminal = createInterface({ input: stdin, output: stdout });
  const email = (process.env.ADMIN_EMAIL || await terminal.question("First administrator email: ")).trim().toLowerCase();
  terminal.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid administrator email address.");
  const password = await hiddenPassword();
  const confirmation = await hiddenPassword();
  if (password.length < 20) throw new Error("Use an administrator password of at least 20 characters.");
  if (password !== confirmation) throw new Error("The passwords did not match. Nothing was changed.");
  const db = new PrismaClient();
  try {
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(74189903)`;
      if (await tx.adminUser.count() > 0) throw new Error("An administrator already exists. First-account bootstrap is permanently closed.");
      await tx.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" } });
    });
    console.info(`Administrator ${email} created. The password was not logged.`);
  } finally { await db.$disconnect(); }
}

main().catch(error => { console.error("Admin bootstrap failed:", error instanceof Error ? error.message : "unknown error"); process.exitCode = 1; });
