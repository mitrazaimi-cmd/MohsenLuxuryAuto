import "server-only";
import { headers } from "next/headers";

// Small in-memory limiter for public forms. Per server instance, which is
// enough to blunt scripted spam; the honeypot field catches most bots.

const hits = new Map<string, number[]>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function rateLimit(bucket: string, limit: number, windowMs: number) {
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
