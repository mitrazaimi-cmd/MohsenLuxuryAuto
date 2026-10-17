// Timezone helpers without extra dependencies. All instants are stored in UTC;
// wall-clock values ("2026-10-21", "10:00") are interpreted in the business timezone.

const partsCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    partsCache.set(tz, f);
  }
  return f;
}

export function zonedParts(date: Date, tz: string) {
  const p: Record<string, string> = {};
  for (const part of partsFormatter(tz).formatToParts(date)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
    weekday: p.weekday.toLowerCase().slice(0, 3) as Weekday,
  };
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

function offsetMs(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** "2026-10-21" + "10:00" in tz → UTC Date (DST-safe). */
export function zonedToUtc(dateStr: string, timeStr: string, tz: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - offsetMs(new Date(guess), tz);
  const second = guess - offsetMs(new Date(result), tz);
  if (second !== result) result = second;
  return new Date(result);
}

/** UTC Date → "YYYY-MM-DD" in tz. */
export function dateKey(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDays(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function weekdayOf(dateStr: string): Weekday {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function formatDate(date: Date | string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, tz: string) {
  return `${formatDate(date, tz)} at ${formatTime(date, tz)}`;
}
