import "server-only";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export function newId() {
  return randomUUID();
}

export function newToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
