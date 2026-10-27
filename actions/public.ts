"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { bookConsultation, cancelBooking, rescheduleBooking } from "@/lib/bookings";
import { store, SlotTakenError } from "@/lib/db";
import { notifyAddress, sendEmail } from "@/lib/email/send";
import { contactNotificationEmail } from "@/lib/email/templates";
import { integrations } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { isSlotOpen, slotEnd } from "@/lib/slots";
import { bookingSchema, contactSchema, fieldErrors, formObject, type FieldErrors } from "@/lib/validation";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
}

const SLOT_GONE = "That time was just taken. Please choose another time.";

export async function createBookingAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formObject(fd);
  if (values.company) return { ok: true }; // honeypot: silently ignore bots
  if (!(await rateLimit("booking", 5, 10 * 60_000))) {
    return { message: "Too many attempts. Please wait a few minutes and try again.", values };
  }

  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields.", values };
  }
  const input = parsed.data;

  let manageToken: string;
  try {
    const { booking } = await bookConsultation({
      ...input,
      tradeIn: input.tradeIn === "yes",
      marketingOptIn: input.marketingOptIn === "on",
      source: "booking",
    });
    manageToken = booking.manageToken;
  } catch (err) {
    if (err instanceof SlotTakenError) return { errors: { startAt: SLOT_GONE }, message: SLOT_GONE, values };
    console.error("[booking] failed:", err);
    return { message: "Something went wrong on our side. Please try again, or call us directly.", values };
  }
  redirect(`/book/confirmed?b=${encodeURIComponent(manageToken)}`);
}

export async function sendContactAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formObject(fd);
  if (values.company) return { ok: true };
  if (!(await rateLimit("contact", 5, 10 * 60_000))) {
    return { message: "Too many messages. Please wait a few minutes and try again.", values };
  }
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields.", values };
  }
  try {
    const msg = await store.createMessage(parsed.data);
    await store.upsertContact({ ...parsed.data, marketingOptIn: false, source: "contact_form" });
    after(async () => {
      const to = (await notifyAddress()) || (integrations.resend ? "" : "mohsen (preview)");
      if (to) await sendEmail({ type: "contact_notification", to, ...contactNotificationEmail(msg) });
    });
  } catch (err) {
    console.error("[contact] failed:", err);
    return { message: "Something went wrong on our side. Please try again.", values };
  }
  return { ok: true, message: "Thank you. Your message is on its way, and Mohsen will get back to you personally." };
}

async function bookingForToken(token: string) {
  const b = await store.getBookingByToken(token);
  if (!b || b.status !== "upcoming" || Date.parse(b.startAt) < Date.now()) return null;
  return b;
}

export async function cancelByTokenAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const b = await bookingForToken(token);
  if (!b) return { message: "This booking can no longer be changed online. Please call or email Mohsen." };
  await cancelBooking(b, { notifyClient: true, notifyAdmin: true });
  return { ok: true, message: "Your consultation is cancelled. A confirmation is on its way to your inbox." };
}

export async function rescheduleByTokenAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const startAt = String(fd.get("startAt") ?? "");
  const b = await bookingForToken(token);
  if (!b) return { message: "This booking can no longer be changed online. Please call or email Mohsen." };
  if (!startAt || !(await isSlotOpen(startAt, { ignoreBookingId: b.id }))) {
    return { errors: { startAt: SLOT_GONE }, message: SLOT_GONE };
  }
  try {
    await rescheduleBooking(b, new Date(startAt).toISOString(), await slotEnd(startAt));
  } catch (err) {
    if (err instanceof SlotTakenError) return { errors: { startAt: SLOT_GONE }, message: SLOT_GONE };
    throw err;
  }
  return { ok: true, message: "Your consultation has moved. The updated details are on their way to your inbox." };
}
