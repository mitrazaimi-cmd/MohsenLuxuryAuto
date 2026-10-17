import "server-only";
import { site } from "@/config/site";
import { getBusy } from "@/lib/calendar";
import { store, type Settings } from "@/lib/db";
import { addDays, dateKey, weekdayOf, zonedToUtc } from "@/lib/time";

export interface DaySlots {
  date: string; // YYYY-MM-DD in the business timezone
  slots: string[]; // ISO start times (UTC)
}

interface Interval {
  start: number;
  end: number;
}

/** Candidate slot starts for one day, before removing busy times. */
function daySlots(date: string, s: Settings): Interval[] {
  const hours = s.workingHours[weekdayOf(date)];
  if (!hours || s.blockedDates.includes(date)) return [];
  const open = zonedToUtc(date, hours.start, site.timezone).getTime();
  const close = zonedToUtc(date, hours.end, site.timezone).getTime();
  const len = s.slotMinutes * 60_000;
  const step = (s.slotMinutes + s.bufferMinutes) * 60_000;
  const out: Interval[] = [];
  for (let t = open; t + len <= close; t += step) out.push({ start: t, end: t + len });
  return out;
}

/**
 * Open slots across the booking window. `ignoreBookingId` lets a client
 * reschedule without their own booking blocking the times around it.
 */
export async function getAvailability(opts: { ignoreBookingId?: string } = {}): Promise<DaySlots[]> {
  const settings = await store.getSettings();
  const now = Date.now();
  const today = dateKey(new Date(now), site.timezone);
  const lastDay = addDays(today, settings.windowDays);
  const from = zonedToUtc(today, "00:00", site.timezone);
  const to = zonedToUtc(addDays(lastDay, 1), "00:00", site.timezone);

  const [calendarBusy, bookings] = await Promise.all([
    getBusy(from, to),
    store.listActiveBookingsBetween(from.toISOString(), to.toISOString()),
  ]);

  const buffer = settings.bufferMinutes * 60_000;
  const ownEvent = bookings.find((b) => b.id === opts.ignoreBookingId)?.googleEventId;
  const ownBooking = bookings.find((b) => b.id === opts.ignoreBookingId);
  const busy: Interval[] = [
    ...bookings
      .filter((b) => b.id !== opts.ignoreBookingId)
      .map((b) => ({ start: Date.parse(b.startAt) - buffer, end: Date.parse(b.endAt) + buffer })),
    // The booking's own Google event shows up in free/busy; skip that exact interval.
    ...calendarBusy
      .filter(
        (b) =>
          !(ownEvent && ownBooking && Date.parse(b.start) === Date.parse(ownBooking.startAt) &&
            Date.parse(b.end) === Date.parse(ownBooking.endAt)),
      )
      .map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) })),
  ];

  const earliest = now + settings.minNoticeHours * 3_600_000;
  const days: DaySlots[] = [];
  for (let date = today; date <= lastDay; date = addDays(date, 1)) {
    const slots = daySlots(date, settings)
      .filter((slot) => slot.start >= earliest)
      .filter((slot) => !busy.some((b) => b.start < slot.end && b.end > slot.start))
      .map((slot) => new Date(slot.start).toISOString());
    days.push({ date, slots });
  }
  return days;
}

/** Re-validates one requested start time against current availability. */
export async function isSlotOpen(startIso: string, opts: { ignoreBookingId?: string } = {}) {
  const days = await getAvailability(opts);
  const target = new Date(startIso).toISOString();
  return days.some((d) => d.slots.includes(target));
}

export async function slotEnd(startIso: string) {
  const s = await store.getSettings();
  return new Date(Date.parse(startIso) + s.slotMinutes * 60_000).toISOString();
}
