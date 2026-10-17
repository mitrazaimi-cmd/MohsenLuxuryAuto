"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminState } from "@/actions/admin";
import type { Settings } from "@/lib/db/types";

const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
] as const;

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveSettingsAction, {});
  const num = (name: keyof Settings, label: string, hint: string, min: number, max: number) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="number" min={min} max={max} className="input" defaultValue={Number(settings[name])} />
      <span className="hint">{hint}</span>
    </div>
  );

  return (
    <form action={action} className="form" style={{ maxWidth: 820 }}>
      <section className="card gold-top" aria-labelledby="hours-title">
        <h2 id="hours-title" className="h3" style={{ marginTop: 0, marginBottom: 6 }}>Working hours</h2>
        <p className="muted" style={{ marginBottom: 20 }}>Eastern Time. Consultations are offered only inside these hours.</p>
        <div style={{ display: "grid", gap: 12 }}>
          {DAYS.map(([key, label]) => {
            const h = settings.workingHours[key];
            return (
              <div key={key} className="inline-form" style={{ gap: 14 }}>
                <label className="checkbox" style={{ width: 150 }}>
                  <input type="checkbox" name={`${key}_open`} defaultChecked={!!h} />
                  <span>{label}</span>
                </label>
                <label htmlFor={`${key}_start`} className="sr-only">{label} start</label>
                <input id={`${key}_start`} name={`${key}_start`} type="time" className="input" defaultValue={h?.start ?? "09:00"} />
                <span className="muted">to</span>
                <label htmlFor={`${key}_end`} className="sr-only">{label} end</label>
                <input id={`${key}_end`} name={`${key}_end`} type="time" className="input" defaultValue={h?.end ?? "18:00"} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="card" aria-labelledby="slots-title">
        <h2 id="slots-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Consultation slots</h2>
        <div className="form-row">
          {num("slotMinutes", "Consultation length (minutes)", "Default 45", 15, 180)}
          {num("bufferMinutes", "Break between consultations (minutes)", "Default 15", 0, 120)}
          {num("windowDays", "How far ahead clients can book (days)", "Default 30", 1, 120)}
          {num("minNoticeHours", "Minimum notice (hours)", "Default 12", 0, 168)}
        </div>
        <div className="field" style={{ marginTop: 22 }}>
          <label htmlFor="blockedDates">Days off</label>
          <textarea id="blockedDates" name="blockedDates" className="textarea" style={{ minHeight: 80 }} defaultValue={settings.blockedDates.join("\n")} placeholder="2026-12-25" />
          <span className="hint">One date per line, as YYYY-MM-DD. With Google Calendar connected, busy times there are blocked automatically too.</span>
        </div>
      </section>

      <section className="card" aria-labelledby="notify-title">
        <h2 id="notify-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Notifications</h2>
        <div className="field">
          <label htmlFor="notificationEmail">Send booking alerts to</label>
          <input id="notificationEmail" name="notificationEmail" type="email" className="input" defaultValue={settings.notificationEmail} placeholder="mohsen@example.com" />
          <span className="hint">Leave empty to use the admin email.</span>
        </div>
      </section>

      {state.message ? (
        <div className={`notice ${state.ok ? "ok-notice" : "error-notice"}`} role={state.ok ? "status" : "alert"}>
          {state.message}
        </div>
      ) : null}
      <div>
        <button type="submit" className="btn btn-gold" disabled={pending} aria-disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
