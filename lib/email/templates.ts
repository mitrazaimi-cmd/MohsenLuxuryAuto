import "server-only";
import { fullName, site } from "@/config/site";
import { siteUrl } from "@/lib/env";
import { bookingLabels, describeBooking } from "@/lib/calendar";
import type { BookingWithContact, ContactMessage } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/time";

// Table-based, inline-styled HTML so it renders in Gmail, Outlook and Apple Mail.
// Brand: black background, silver text, gold accents, Mohsen's signature.

const C = { black: "#000000", surface: "#0D0D0D", line: "#262626", silver: "#C9C9C9", hi: "#EDEDED", muted: "#9A9A9A", gold: "#D9AE5F" };
const SERIF = "'Cinzel', 'Times New Roman', Georgia, serif";
const SANS = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Layout {
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  unsubscribeToken?: string;
}

function layout({ preheader, eyebrow, heading, body, cta, unsubscribeToken }: Layout) {
  const base = siteUrl();
  const contactBits = [site.contact.phone, site.contact.email].filter(Boolean).map(esc).join(" &nbsp;|&nbsp; ");
  const address = site.contact.address ? esc(site.contact.address) : esc(site.location);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.black};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.black};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.black};">
  <tr><td align="center" style="padding:8px 0 28px;">
    <img src="${base}/brand/logo-email.png" width="260" alt="Mohsen Luxury Auto" style="display:block;width:260px;max-width:70%;height:auto;border:0;">
  </td></tr>
  <tr><td style="height:1px;background:${C.gold};line-height:1px;font-size:1px;">&nbsp;</td></tr>
  <tr><td style="padding:36px 32px 8px;background:${C.surface};">
    <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">${esc(eyebrow)}</p>
    <h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:500;font-size:24px;line-height:1.3;letter-spacing:1px;color:${C.hi};">${esc(heading)}</h1>
    <div style="font-family:${SANS};font-size:15px;line-height:1.7;color:${C.silver};">${body}</div>
  </td></tr>
  ${
    cta
      ? `<tr><td style="padding:12px 32px 36px;background:${C.surface};">
    <a href="${cta.url}" style="display:inline-block;background:${C.gold};color:#000000;font-family:${SANS};font-weight:600;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;padding:15px 28px;">${esc(cta.label)}</a>
  </td></tr>`
      : `<tr><td style="padding:0 0 28px;background:${C.surface};">&nbsp;</td></tr>`
  }
  <tr><td style="padding:28px 32px 0;">
    <p style="margin:0;font-family:${SERIF};font-size:15px;letter-spacing:2px;color:${C.hi};">${esc(fullName().toUpperCase())}</p>
    <p style="margin:4px 0 0;font-family:${SANS};font-size:12px;color:${C.gold};">${esc(site.person.title)}</p>
    ${contactBits ? `<p style="margin:6px 0 0;font-family:${SANS};font-size:12px;color:${C.muted};">${contactBits}</p>` : ""}
    <p style="margin:4px 0 0;font-family:${SANS};font-size:12px;color:${C.muted};">${address}</p>
  </td></tr>
  <tr><td style="padding:28px 32px 0;font-family:${SANS};font-size:11px;line-height:1.6;color:#6E6E6E;">
    ${esc(site.name)} · ${esc(site.slogan)}<br>
    ${unsubscribeToken ? `<a href="${base}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}" style="color:#8C8C8C;">Email preferences</a>` : ""}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function detailsTable(b: BookingWithContact) {
  const tz = site.timezone;
  const rows: [string, string][] = [
    ["Date", formatDate(b.startAt, tz)],
    ["Time", formatTime(b.startAt, tz)],
    ["Meeting", bookingLabels.meeting[b.meetingType]],
    ["Where", b.meetingType === "in_person" ? site.contact.address || site.location : b.meetingType === "phone" ? "Mohsen will call you" : "A video link will follow"],
    ["Interested in", b.modelInterest || "Not sure yet"],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border-top:1px solid ${C.line};">
${rows
  .map(
    ([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};width:38%;">${esc(k)}</td>
<td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;color:${C.hi};">${esc(v)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

const p = (text: string) => `<p style="margin:0 0 16px;">${text}</p>`;
const firstName = (name: string) => esc(name.trim().split(/\s+/)[0] ?? name);
const manageUrl = (b: BookingWithContact) => `${siteUrl()}/manage/${b.manageToken}`;

export function confirmationEmail(b: BookingWithContact) {
  return {
    subject: `Your consultation is confirmed: ${formatDate(b.startAt, site.timezone)}`,
    html: layout({
      preheader: `See you ${formatDate(b.startAt, site.timezone)} at ${formatTime(b.startAt, site.timezone)}.`,
      eyebrow: "Consultation confirmed",
      heading: `Thank you, ${firstName(b.contact.name)}.`,
      body:
        p("Your purchase and leasing consultation is booked. I will have everything ready, so we can focus on what truly fits your needs, with every cost disclosed up front.") +
        detailsTable(b) +
        p("A calendar invite is attached. If anything changes, you can reschedule or cancel with the button below, or simply reply to this email.") +
        p("I am always one call away."),
      cta: { label: "Manage my booking", url: manageUrl(b) },
      unsubscribeToken: b.contact.unsubscribeToken,
    }),
  };
}

export function notificationEmail(b: BookingWithContact, kind: "new" | "rescheduled" | "cancelled") {
  const title = { new: "New consultation booked", rescheduled: "Consultation rescheduled", cancelled: "Consultation cancelled" }[kind];
  return {
    subject: `${title}: ${b.contact.name}, ${formatDate(b.startAt, site.timezone)} ${formatTime(b.startAt, site.timezone)}`,
    html: layout({
      preheader: `${b.contact.name} · ${b.modelInterest || "Mercedes-Benz"}`,
      eyebrow: "Booking alert",
      heading: title,
      body:
        detailsTable(b) +
        `<pre style="margin:0 0 16px;white-space:pre-wrap;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.silver};">${esc(describeBooking(b))}</pre>`,
      cta: { label: "Open admin", url: `${siteUrl()}/admin` },
    }),
  };
}

export function reminderEmail(b: BookingWithContact) {
  return {
    subject: `Tomorrow: your consultation with Mohsen at ${formatTime(b.startAt, site.timezone)}`,
    html: layout({
      preheader: "A quick reminder for tomorrow.",
      eyebrow: "See you tomorrow",
      heading: `Looking forward to it, ${firstName(b.contact.name)}.`,
      body:
        p("Just a reminder about our consultation tomorrow.") +
        detailsTable(b) +
        p(b.tradeIn ? "Since you have a trade-in, please bring the title or loan details and your current registration." : "If you are considering financing or leasing, a driver's license and proof of insurance help us move quickly.") +
        p("Need a different time? It only takes a moment to change."),
      cta: { label: "Reschedule or cancel", url: manageUrl(b) },
      unsubscribeToken: b.contact.unsubscribeToken,
    }),
  };
}

export function followupEmail(b: BookingWithContact) {
  return {
    subject: "Thank you for your time",
    html: layout({
      preheader: "Any questions after our consultation?",
      eyebrow: "Thank you",
      heading: `It was a pleasure, ${firstName(b.contact.name)}.`,
      body:
        p("Thank you for taking the time to meet. If any questions came up afterwards, about a model, the numbers, or the next step, just reply to this email or call me. There is never any pressure.") +
        p("When you are ready to take the next step, or would simply like to see another model, you can book a new time below."),
      cta: { label: "Book another consultation", url: `${siteUrl()}/book` },
      unsubscribeToken: b.contact.unsubscribeToken,
    }),
  };
}

export function cancellationEmail(b: BookingWithContact) {
  return {
    subject: "Your consultation has been cancelled",
    html: layout({
      preheader: "Your booking is cancelled.",
      eyebrow: "Booking cancelled",
      heading: `All set, ${firstName(b.contact.name)}.`,
      body:
        p(`Your consultation on ${esc(formatDate(b.startAt, site.timezone))} at ${esc(formatTime(b.startAt, site.timezone))} is cancelled.`) +
        p("Whenever the timing is right, I would be glad to help. You can book a new time at any point."),
      cta: { label: "Book a new time", url: `${siteUrl()}/book` },
      unsubscribeToken: b.contact.unsubscribeToken,
    }),
  };
}

export function rescheduleEmail(b: BookingWithContact) {
  return {
    subject: `Your consultation has moved to ${formatDate(b.startAt, site.timezone)}`,
    html: layout({
      preheader: `New time: ${formatDate(b.startAt, site.timezone)} at ${formatTime(b.startAt, site.timezone)}.`,
      eyebrow: "New time confirmed",
      heading: "Your consultation has moved.",
      body: p("Here are the updated details. An updated calendar invite is attached.") + detailsTable(b),
      cta: { label: "Manage my booking", url: manageUrl(b) },
      unsubscribeToken: b.contact.unsubscribeToken,
    }),
  };
}

export function contactNotificationEmail(m: ContactMessage) {
  return {
    subject: `New message from ${m.name}`,
    html: layout({
      preheader: m.message.slice(0, 90),
      eyebrow: "Website message",
      heading: `Message from ${m.name}`,
      body:
        p(`<strong style="color:${C.hi};">${esc(m.email)}</strong>${m.phone ? ` · ${esc(m.phone)}` : ""}`) +
        `<p style="margin:0 0 16px;white-space:pre-wrap;">${esc(m.message)}</p>`,
      cta: { label: "Open admin", url: `${siteUrl()}/admin/messages` },
    }),
  };
}
