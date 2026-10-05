import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "We could not complete that request. Please try again." }, { status: 500 });
}
export function verifySameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
