import "server-only";

// Each integration switches on as soon as its keys are present.
// Without keys, the site still runs end to end on this computer:
// data goes to .data/db.json, emails to .data/outbox, and the calendar
// only knows about bookings made on the site.

export const integrations = {
  supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  google: Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  ),
  resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  // Chatbot: Gemini answers; Voyage adds meaning-based search (without it, keyword search only).
  gemini: Boolean(process.env.GEMINI_API_KEY),
  voyage: Boolean(process.env.VOYAGE_API_KEY),
  telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET),
};

/** The deploy this server runs (git commit on Vercel). The website knowledge re-syncs when it changes. */
export function deployVersion() {
  return process.env.VERCEL_GIT_COMMIT_SHA || "local";
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
