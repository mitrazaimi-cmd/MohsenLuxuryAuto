import Link from "next/link";
import { updateBookingAction } from "@/actions/admin";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { bookingLabels } from "@/lib/calendar";
import { store, type BookingStatus, type BookingWithContact } from "@/lib/db";
import { addDays, dateKey, formatDate, formatTime, zonedToUtc } from "@/lib/time";

export const metadata = { title: "Bookings" };

const VIEWS = {
  today: "Today",
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
} as const;
type View = keyof typeof VIEWS;

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

async function load(view: View, model: string) {
  const tz = site.timezone;
  const today = dateKey(new Date(), tz);
  const startToday = zonedToUtc(today, "00:00", tz).toISOString();
  const startTomorrow = zonedToUtc(addDays(today, 1), "00:00", tz).toISOString();
  let rows: BookingWithContact[];
  if (view === "today") rows = (await store.listBookings({ from: startToday, to: startTomorrow })).filter((b) => b.status !== "cancelled");
  else if (view === "upcoming") rows = await store.listBookings({ from: new Date().toISOString(), status: "upcoming" });
  else if (view === "cancelled") rows = (await store.listBookings({ status: "cancelled" })).toReversed();
  else rows = (await store.listBookings({ to: new Date().toISOString() })).filter((b) => b.status !== "cancelled").toReversed();
  return model ? rows.filter((b) => b.modelInterest === model) : rows;
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ view?: string; model?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view: View = sp.view && sp.view in VIEWS ? (sp.view as View) : "upcoming";
  const model = sp.model ?? "";
  const rows = await load(view, model);
  const tz = site.timezone;

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Bookings</h1>
        </div>
        <Link href="/book" className="btn btn-outline btn-sm" target="_blank">
          Open booking page
        </Link>
      </div>

      <div className="tabs" role="navigation" aria-label="Booking views">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link key={v} href={`/admin?view=${v}${model ? `&model=${encodeURIComponent(model)}` : ""}`} aria-current={v === view ? "page" : undefined}>
            {VIEWS[v]}
          </Link>
        ))}
        <form className="inline-form" style={{ marginLeft: "auto" }}>
          <input type="hidden" name="view" value={view} />
          <label htmlFor="model" className="sr-only">Filter by model</label>
          <select id="model" name="model" className="select" defaultValue={model}>
            <option value="">All models</option>
            {site.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">Filter</button>
        </form>
      </div>

      {rows.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Client</th>
                <th>Interest</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ color: "var(--silver-hi)" }}>{formatDate(b.startAt, tz)}</div>
                    <div className="muted">{formatTime(b.startAt, tz)} · {bookingLabels.meeting[b.meetingType]}</div>
                  </td>
                  <td>
                    <div style={{ color: "var(--silver-hi)" }}>{b.contact.name}</div>
                    <div><a className="gold" href={`mailto:${b.contact.email}`}>{b.contact.email}</a></div>
                    <div className="muted">{b.contact.phone} · prefers {bookingLabels.contact[b.contactMethod].toLowerCase()}</div>
                  </td>
                  <td>
                    <div>{b.modelInterest || "Not sure yet"}</div>
                    <div className="muted">
                      {bookingLabels.condition[b.condition]} · {bookingLabels.purchase[b.purchaseType]}
                      {b.tradeIn ? " · Trade-in" : ""}
                    </div>
                    {b.notes ? (
                      <details className="row-details" style={{ marginTop: 6 }}>
                        <summary>Client notes</summary>
                        <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{b.notes}</p>
                      </details>
                    ) : null}
                  </td>
                  <td>
                    <span className={`status ${b.status}`}>{STATUS_LABEL[b.status]}</span>
                    <div className="muted" style={{ fontSize: "0.76rem", marginTop: 6 }}>
                      {b.reminderSentAt ? "Reminder sent" : ""}
                      {b.followupSentAt ? `${b.reminderSentAt ? " · " : ""}Follow-up sent` : ""}
                    </div>
                  </td>
                  <td style={{ minWidth: 260 }}>
                    <form action={updateBookingAction} style={{ display: "grid", gap: 8 }}>
                      <input type="hidden" name="id" value={b.id} />
                      <div className="inline-form">
                        <label htmlFor={`s-${b.id}`} className="sr-only">Status</label>
                        <select id={`s-${b.id}`} name="status" className="select" defaultValue={b.status}>
                          {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-outline btn-sm">Save</button>
                      </div>
                      <label className="checkbox" style={{ fontSize: "0.8rem" }}>
                        <input type="checkbox" name="notifyClient" defaultChecked />
                        <span>Email the client if cancelled</span>
                      </label>
                      <label htmlFor={`n-${b.id}`} className="sr-only">Private note</label>
                      <textarea id={`n-${b.id}`} name="adminNote" className="textarea" style={{ minHeight: 60, fontSize: "0.85rem" }} placeholder="Private note" defaultValue={b.adminNote} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No bookings here yet.</div>
      )}
    </>
  );
}
