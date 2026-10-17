import "server-only";
import { JWT } from "google-auth-library";
import { integrations, siteUrl } from "@/lib/env";
import type { BookingWithContact } from "@/lib/db";
import { site } from "@/config/site";

// Google Calendar via a service account that Mohsen's calendar is shared with
// ("Make changes to events"). Without Google keys, the calendar is a no-op and
// availability only considers bookings made on the site.

const API = "https://www.googleapis.com/calendar/v3";

let jwt: JWT | null = null;
function auth() {
  jwt ??= new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return jwt;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = await auth().getAccessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${await res.text()}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const calendarId = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);

export interface Busy {
  start: string;
  end: string;
}

export async function getBusy(from: Date, to: Date): Promise<Busy[]> {
  if (!integrations.google) return [];
  const data = await call<{ calendars: Record<string, { busy: Busy[] }> }>("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
    }),
  });
  return Object.values(data.calendars)[0]?.busy ?? [];
}

const labels = {
  meeting: { in_person: "In person", phone: "Phone call", video: "Video call" },
  purchase: { purchase: "Purchase", lease: "Lease", finance: "Finance", not_sure: "Not sure yet" },
  condition: { new: "New", cpo: "Certified Pre-Owned", not_sure: "Not sure yet" },
  contact: { phone: "Phone call", email: "Email", text: "Text message" },
} as const;

export function describeBooking(b: BookingWithContact) {
  return [
    `Client: ${b.contact.name}`,
    `Email: ${b.contact.email}`,
    `Phone: ${b.contact.phone}`,
    `Meeting: ${labels.meeting[b.meetingType]}`,
    `Interested in: ${b.modelInterest || "Not sure yet"} (${labels.condition[b.condition]})`,
    `Plan: ${labels.purchase[b.purchaseType]}`,
    `Trade-in: ${b.tradeIn ? "Yes" : "No"}`,
    `Prefers: ${labels.contact[b.contactMethod]}`,
    b.notes ? `Notes: ${b.notes}` : "",
    "",
    `Manage in admin: ${siteUrl()}/admin`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export { labels as bookingLabels };

function eventBody(b: BookingWithContact) {
  return {
    summary: `Consultation: ${b.contact.name} (${b.modelInterest || "Mercedes-Benz"})`,
    description: describeBooking(b),
    location: b.meetingType === "in_person" ? site.contact.address || undefined : undefined,
    start: { dateTime: b.startAt, timeZone: site.timezone },
    end: { dateTime: b.endAt, timeZone: site.timezone },
    reminders: { useDefault: true },
  };
}

export async function createEvent(b: BookingWithContact): Promise<string | null> {
  if (!integrations.google) return null;
  const ev = await call<{ id: string }>(`/calendars/${calendarId()}/events`, {
    method: "POST",
    body: JSON.stringify(eventBody(b)),
  });
  return ev.id;
}

export async function updateEvent(b: BookingWithContact) {
  if (!integrations.google || !b.googleEventId) return;
  await call(`/calendars/${calendarId()}/events/${encodeURIComponent(b.googleEventId)}`, {
    method: "PATCH",
    body: JSON.stringify(eventBody(b)),
  });
}

export async function deleteEvent(eventId: string | null) {
  if (!integrations.google || !eventId) return;
  try {
    await call(`/calendars/${calendarId()}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  } catch (err) {
    if (!String(err).includes(" 410:") && !String(err).includes(" 404:")) throw err;
  }
}
