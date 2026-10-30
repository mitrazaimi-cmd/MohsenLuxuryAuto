"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { cancelBooking, runFollowups, runReminders } from "@/lib/bookings";
import { store, type BookingStatus, type ContentKind, type Settings } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import type { Weekday } from "@/lib/time";

export interface AdminState {
  ok?: boolean;
  message?: string;
  email?: string;
}

// ---------- session ----------

export async function loginAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  if (!(await rateLimit("login", 8, 15 * 60_000))) return { message: "Too many attempts. Try again in 15 minutes." };
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return { message: "Admin login is not configured yet. Set ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET." };
  }
  if (!checkCredentials(email, password)) return { message: "That email and password don't match.", email };
  await startSession(email);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- bookings ----------

const STATUSES: BookingStatus[] = ["upcoming", "completed", "cancelled", "no_show"];

export async function updateBookingAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "") as BookingStatus;
  const adminNote = fd.get("adminNote");
  const notifyClient = fd.get("notifyClient") === "on";
  const booking = await store.getBooking(id);
  if (!booking) return;

  if (STATUSES.includes(status) && status !== booking.status) {
    if (status === "cancelled") {
      await cancelBooking(booking, { notifyClient, notifyAdmin: false });
    } else {
      await store.updateBooking(id, { status });
    }
  }
  if (typeof adminNote === "string" && adminNote !== booking.adminNote) {
    await store.updateBooking(id, { adminNote: adminNote.slice(0, 2000) });
  }
  revalidatePath("/admin");
}

export async function runJobAction(fd: FormData) {
  await requireAdmin();
  const job = fd.get("job");
  const result = job === "followups" ? await runFollowups() : await runReminders();
  revalidatePath("/admin/outbox");
  redirect(`/admin/outbox?ran=${job}&sent=${result.sent}`);
}

// ---------- messages ----------

export async function toggleMessageReadAction(fd: FormData) {
  await requireAdmin();
  await store.setMessageRead(String(fd.get("id")), fd.get("read") === "1");
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
}

// ---------- content ----------

const KINDS: ContentKind[] = ["portfolio_items", "testimonials", "client_stories"];
const PATHS: Record<ContentKind, string> = {
  portfolio_items: "/admin/portfolio",
  testimonials: "/admin/testimonials",
  client_stories: "/admin/stories",
};
const MAX_UPLOAD = 4 * 1024 * 1024;

const text = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveContentAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const kind = String(fd.get("kind")) as ContentKind;
  if (!KINDS.includes(kind)) return { message: "Unknown content type." };
  const id = text(fd, "id") || undefined;

  let imageUrl = text(fd, "imageUrl", 1000);
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD) return { message: "Photos must be under 4 MB. Please resize and try again." };
    try {
      imageUrl = await store.saveMedia(file);
    } catch (err) {
      return { message: err instanceof Error ? err.message : "Upload failed." };
    }
  }

  const common = {
    published: fd.get("published") === "on",
    sortOrder: Number(fd.get("sortOrder") ?? 0) || 0,
  };

  if (kind === "portfolio_items") {
    if (!imageUrl) return { message: "Please add a photo." };
    await store.saveContent(kind, { id, imageUrl, clientFirstName: text(fd, "clientFirstName", 60), model: text(fd, "model", 60), caption: text(fd, "caption", 200), ...common });
  } else if (kind === "testimonials") {
    const quote = text(fd, "quote");
    if (quote.length < 10) return { message: "Please enter the client's words (at least 10 characters)." };
    await store.saveContent(kind, { id, quote, clientName: text(fd, "clientName", 80), model: text(fd, "model", 60), imageUrl, ...common });
  } else {
    const title = text(fd, "title", 140);
    if (!title) return { message: "Please add a title." };
    await store.saveContent(kind, {
      id,
      title,
      clientFirstName: text(fd, "clientFirstName", 60),
      model: text(fd, "model", 60),
      need: text(fd, "need"),
      recommendation: text(fd, "recommendation"),
      result: text(fd, "result"),
      imageUrl,
      ...common,
    });
  }
  revalidatePath(PATHS[kind]);
  revalidatePath("/portfolio");
  revalidatePath("/");
  return { ok: true, message: id ? "Saved." : "Added." };
}

export async function deleteContentAction(fd: FormData) {
  await requireAdmin();
  const kind = String(fd.get("kind")) as ContentKind;
  if (!KINDS.includes(kind)) return;
  await store.deleteContent(kind, String(fd.get("id")));
  revalidatePath(PATHS[kind]);
  revalidatePath("/portfolio");
  revalidatePath("/");
}

// ---------- settings ----------

const DAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveSettingsAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const num = (k: string, min: number, max: number) => {
    const n = Number(fd.get(k));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
  };
  const workingHours = {} as Settings["workingHours"];
  for (const d of DAYS) {
    const start = String(fd.get(`${d}_start`) ?? "");
    const end = String(fd.get(`${d}_end`) ?? "");
    if (fd.get(`${d}_open`) !== "on") workingHours[d] = null;
    else if (!HHMM.test(start) || !HHMM.test(end) || start >= end) return { message: `Please check the hours for ${d.toUpperCase()}.` };
    else workingHours[d] = { start, end };
  }
  const blockedDates = String(fd.get("blockedDates") ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
  const notificationEmail = text(fd, "notificationEmail", 200);
  if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) return { message: "Please enter a valid notification email." };

  await store.saveSettings({
    slotMinutes: num("slotMinutes", 15, 180),
    bufferMinutes: num("bufferMinutes", 0, 120),
    windowDays: num("windowDays", 1, 120),
    minNoticeHours: num("minNoticeHours", 0, 168),
    workingHours,
    blockedDates: Array.from(new Set(blockedDates)).sort(),
    notificationEmail,
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved. New bookings use them right away." };
}
