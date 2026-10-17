"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const TZ = "America/New_York";
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Day {
  date: string;
  slots: string[];
}

const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const longDate = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });

const asUtcDate = (date: string) => new Date(`${date}T12:00:00Z`);

export function formatSlot(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(d);
  return `${date} at ${timeFmt.format(d)} ET`;
}

/**
 * Two-step picker: a calendar of the booking window (days without open times are
 * disabled), then the open times for the chosen day. `refreshKey` refetches.
 */
export function SlotPicker({
  value,
  onChange,
  token,
  refreshKey = 0,
}: {
  value: string;
  onChange: (iso: string) => void;
  token?: string;
  refreshKey?: number;
}) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/availability${token ? `?token=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load times.");
      setDays(json.days);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load times.");
      setDays([]);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Keep a valid selected day: the day of the chosen slot, else the first open day.
  const firstOpen = days?.find((d) => d.slots.length)?.date ?? "";
  const valueDate = value ? days?.find((d) => d.slots.includes(value))?.date : undefined;
  const activeDate = selectedDate && days?.some((d) => d.date === selectedDate) ? selectedDate : valueDate || firstOpen;
  const active = days?.find((d) => d.date === activeDate);

  const cells = useMemo(() => {
    if (!days?.length) return [];
    const lead = (asUtcDate(days[0].date).getUTCDay() + 6) % 7; // Monday-first offset
    return [...Array<null>(lead).fill(null), ...days];
  }, [days]);

  if (days === null) {
    return (
      <div aria-busy="true" aria-label="Loading available times">
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (error || !firstOpen) {
    return (
      <div className="notice" role="status">
        {error || "There are no open times in the next few weeks."} Please call or email Mohsen and he will find a time for you.{" "}
        <button type="button" className="btn btn-ghost" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 36 }}>
      <fieldset className="field">
        <legend style={{ marginBottom: 14 }}>Choose a day</legend>
        <div className="days" role="group" aria-label="Available days">
          {WEEK.map((w) => (
            <div key={w} className="weekday-head" aria-hidden="true">
              {w}
            </div>
          ))}
          {cells.map((d, i) =>
            d ? (
              <button
                key={d.date}
                type="button"
                className="day"
                disabled={!d.slots.length}
                aria-pressed={d.date === activeDate}
                aria-label={`${longDate.format(asUtcDate(d.date))}${d.slots.length ? `, ${d.slots.length} times available` : ", unavailable"}`}
                onClick={() => setSelectedDate(d.date)}
              >
                <span className="d">{Number(d.date.slice(8))}</span>
                <span className="m">{monthFmt.format(asUtcDate(d.date))}</span>
              </button>
            ) : (
              <span key={`b${i}`} className="day blank" aria-hidden="true" />
            ),
          )}
        </div>
      </fieldset>

      {active ? (
        <fieldset className="field">
          <legend style={{ marginBottom: 14 }}>
            {longDate.format(asUtcDate(active.date))} <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>· Eastern Time</span>
          </legend>
          <div className="times" role="group" aria-label="Available times">
            {active.slots.map((s) => (
              <button key={s} type="button" className="time" aria-pressed={s === value} onClick={() => onChange(s)}>
                {timeFmt.format(new Date(s))}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
