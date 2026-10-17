import "server-only";
import { site } from "@/config/site";
import { integrations } from "@/lib/env";
import { createEvent, deleteEvent, updateEvent } from "@/lib/calendar";
import { store, type BookingWithContact } from "@/lib/db";
import { notifyAddress, sendEmail } from "@/lib/email/send";
import {
  cancellationEmail,
  confirmationEmail,
  followupEmail,
  notificationEmail,
  reminderEmail,
  rescheduleEmail,
} from "@/lib/email/templates";
import { bookingIcs } from "@/lib/ics";
import { addDays, dateKey, zonedToUtc } from "@/lib/time";

const ics = (b: BookingWithContact, method?: "PUBLISH" | "CANCEL") => [
  { filename: "consultation.ics", content: bookingIcs(b, method), contentType: "text/calendar" },
];

async function notifyMohsen(b: BookingWithContact, kind: "new" | "rescheduled" | "cancelled") {
  const to = (await notifyAddress()) || (integrations.resend ? "" : "mohsen (preview)");
  if (!to) return;
  const mail = notificationEmail(b, kind);
  await sendEmail({ type: "booking_notification", to, ...mail, bookingId: b.id, contactId: b.contactId });
}

/** After a booking is stored: put it on Mohsen's calendar, then email both sides. */
export async function afterBookingCreated(bookingId: string) {
  let b = await store.getBooking(bookingId);
  if (!b) return;
  try {
    const eventId = await createEvent(b);
    if (eventId) {
      await store.updateBooking(b.id, { googleEventId: eventId });
      b = { ...b, googleEventId: eventId };
    }
  } catch (err) {
    console.error("[calendar] create failed:", err); // Mohsen still gets the email alert below.
  }
  const mail = confirmationEmail(b);
  await Promise.all([
    sendEmail({ type: "booking_confirmation", to: b.contact.email, ...mail, bookingId: b.id, contactId: b.contactId, attachments: ics(b) }),
    notifyMohsen(b, "new"),
  ]);
}

export async function cancelBooking(b: BookingWithContact, opts: { notifyClient: boolean; notifyAdmin: boolean }) {
  await store.updateBooking(b.id, { status: "cancelled" });
  try {
    await deleteEvent(b.googleEventId);
  } catch (err) {
    console.error("[calendar] delete failed:", err);
  }
  const tasks: Promise<unknown>[] = [];
  if (opts.notifyClient) {
    const mail = cancellationEmail(b);
    tasks.push(sendEmail({ type: "cancellation", to: b.contact.email, ...mail, bookingId: b.id, contactId: b.contactId, attachments: ics(b, "CANCEL") }));
  }
  if (opts.notifyAdmin) tasks.push(notifyMohsen(b, "cancelled"));
  await Promise.all(tasks);
}

export async function rescheduleBooking(b: BookingWithContact, startAt: string, endAt: string) {
  // Throws SlotTakenError if someone else holds the new time.
  await store.updateBooking(b.id, { startAt, endAt, reminderSentAt: null });
  const updated: BookingWithContact = { ...b, startAt, endAt };
  try {
    await updateEvent(updated);
  } catch (err) {
    console.error("[calendar] update failed:", err);
  }
  const mail = rescheduleEmail(updated);
  await Promise.all([
    sendEmail({ type: "reschedule", to: b.contact.email, ...mail, bookingId: b.id, contactId: b.contactId, attachments: ics(updated) }),
    notifyMohsen(updated, "rescheduled"),
  ]);
}

/** Day-before reminders: every upcoming booking that starts tomorrow (business timezone). */
export async function runReminders() {
  const tomorrow = addDays(dateKey(new Date(), site.timezone), 1);
  const from = zonedToUtc(tomorrow, "00:00", site.timezone).toISOString();
  const to = zonedToUtc(addDays(tomorrow, 1), "00:00", site.timezone).toISOString();
  const due = (await store.listBookings({ from, to, status: "upcoming" })).filter((b) => !b.reminderSentAt);
  let sent = 0;
  for (const b of due) {
    const mail = reminderEmail(b);
    if (await sendEmail({ type: "reminder", to: b.contact.email, ...mail, bookingId: b.id, contactId: b.contactId })) {
      await store.updateBooking(b.id, { reminderSentAt: new Date().toISOString() });
      sent++;
    }
  }
  return { checked: due.length, sent };
}

/**
 * Follow-ups the day after the meeting. A booking still marked "upcoming" after
 * it ended counts as held; mark no-shows in the admin panel to skip them.
 */
export async function runFollowups() {
  const now = Date.now();
  const from = new Date(now - 7 * 86_400_000).toISOString();
  const to = new Date(now - 12 * 3_600_000).toISOString();
  const all = await store.listBookings({ from, to });
  const due = all.filter(
    (b) => (b.status === "completed" || b.status === "upcoming") && !b.followupSentAt && Date.parse(b.endAt) < now - 12 * 3_600_000,
  );
  let sent = 0;
  for (const b of due) {
    const mail = followupEmail(b);
    if (await sendEmail({ type: "followup", to: b.contact.email, ...mail, bookingId: b.id, contactId: b.contactId })) {
      await store.updateBooking(b.id, {
        followupSentAt: new Date().toISOString(),
        status: b.status === "upcoming" ? "completed" : b.status,
      });
      sent++;
    }
  }
  return { checked: due.length, sent };
}
