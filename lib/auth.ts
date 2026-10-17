import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/env";
import { safeEqual } from "@/lib/tokens";

// Single-admin login (Mohsen): ADMIN_EMAIL + ADMIN_PASSWORD from the environment,
// kept in a signed, http-only session cookie for 7 days.

const COOKIE = "mla_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return new TextEncoder().encode(s);
}

export function checkCredentials(email: string, password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const emailOk = adminEmails().includes(email.trim().toLowerCase());
  const passOk = expected.length >= 10 && safeEqual(password, expected);
  return emailOk && passOk;
}

export async function startSession(email: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const email = payload.sub ?? "";
    return payload.role === "admin" && adminEmails().includes(email) ? email : null;
  } catch {
    return null;
  }
}

/** Use at the top of every admin page, action and route. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
