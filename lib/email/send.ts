import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { adminEmails, integrations } from "@/lib/env";
import { store, type EmailType } from "@/lib/db";

// Sends through Resend when configured. Otherwise the email is saved as an
// HTML preview in .data/outbox and shown in Admin → Outbox.

export const OUTBOX_DIR = path.join(process.cwd(), ".data", "outbox");

let resend: Resend | null = null;

interface SendInput {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  contactId?: string | null;
  bookingId?: string | null;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export async function sendEmail(input: SendInput) {
  const base = {
    contactId: input.contactId ?? null,
    bookingId: input.bookingId ?? null,
    type: input.type,
    to: input.to,
    subject: input.subject,
  };
  try {
    if (integrations.resend) {
      resend ??= new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: input.to,
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
          contentType: a.contentType,
        })),
      });
      if (error) throw new Error(error.message);
      await store.logEmail({ ...base, status: "sent", providerId: data?.id ?? null, error: null });
    } else {
      await mkdir(OUTBOX_DIR, { recursive: true });
      const file = `${Date.now()}-${input.type}.html`;
      const header = `<!-- To: ${input.to} | Subject: ${input.subject} -->\n`;
      await writeFile(path.join(OUTBOX_DIR, file), header + input.html, "utf8");
      await store.logEmail({ ...base, status: "preview", providerId: file, error: null });
    }
    return true;
  } catch (err) {
    console.error(`[email] ${input.type} to ${input.to} failed:`, err);
    await store.logEmail({ ...base, status: "failed", providerId: null, error: String(err) }).catch(() => {});
    return false;
  }
}

/** Where booking alerts go: the notification email from Settings, else ADMIN_EMAIL. */
export async function notifyAddress() {
  const settings = await store.getSettings();
  return settings.notificationEmail || adminEmails()[0] || "";
}
