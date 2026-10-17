import "server-only";
import { site } from "@/config/site";
import { siteUrl } from "@/lib/env";
import type { BookingWithContact } from "@/lib/db";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** A calendar invite the client can add to their own calendar. */
export function bookingIcs(b: BookingWithContact, method: "PUBLISH" | "CANCEL" = "PUBLISH") {
  const location =
    b.meetingType === "in_person"
      ? site.contact.address || site.location
      : b.meetingType === "phone"
        ? "Phone call"
        : "Video call (link to follow)";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mohsen Luxury Auto//Consultation//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${b.id}@mohsenluxuryauto`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(b.startAt)}`,
    `DTEND:${stamp(b.endAt)}`,
    `SUMMARY:${esc("Mercedes-Benz consultation with Mohsen")}`,
    `DESCRIPTION:${esc(`Your purchase and leasing consultation.\nManage your booking: ${siteUrl()}/manage/${b.manageToken}`)}`,
    `LOCATION:${esc(location)}`,
    method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
