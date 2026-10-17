import { readFile } from "node:fs/promises";
import path from "node:path";
import { runJobAction } from "@/actions/admin";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { OUTBOX_DIR } from "@/lib/email/send";
import { integrations } from "@/lib/env";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Emails" };

const TYPE_LABEL: Record<string, string> = {
  booking_confirmation: "Confirmation",
  booking_notification: "Alert to Mohsen",
  reminder: "Reminder",
  followup: "Follow-up",
  cancellation: "Cancellation",
  reschedule: "Rescheduled",
  contact_notification: "Contact message",
};

export default async function OutboxPage({ searchParams }: { searchParams: Promise<{ ran?: string; sent?: string; view?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const log = (await store.listEmailLog()).slice(0, 100);
  const preview = sp.view ? log.find((e) => e.id === sp.view && e.status === "preview") : undefined;
  let previewHtml = "";
  if (preview?.providerId && /^[\w.-]+\.html$/.test(preview.providerId)) {
    previewHtml = await readFile(path.join(OUTBOX_DIR, preview.providerId), "utf8").catch(() => "");
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Emails</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {integrations.resend
              ? "Sent through Resend."
              : "Email sending is not connected yet, so emails are saved here as previews instead of being sent."}
          </p>
        </div>
        <div className="actions" style={{ gap: 10 }}>
          <form action={runJobAction}>
            <input type="hidden" name="job" value="reminders" />
            <button type="submit" className="btn btn-outline btn-sm">Send due reminders now</button>
          </form>
          <form action={runJobAction}>
            <input type="hidden" name="job" value="followups" />
            <button type="submit" className="btn btn-outline btn-sm">Send due follow-ups now</button>
          </form>
        </div>
      </div>

      {sp.ran ? (
        <p className="notice ok-notice" role="status" style={{ marginBottom: 20 }}>
          {sp.ran === "followups" ? "Follow-ups" : "Reminders"} checked: {sp.sent ?? 0} sent. These also run automatically every day once the site is live.
        </p>
      ) : null}

      {previewHtml ? (
        <div style={{ marginBottom: 28 }}>
          <div className="actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <strong>{preview?.subject}</strong>
            <a href="/admin/outbox" className="btn btn-ghost">Close preview</a>
          </div>
          <iframe title="Email preview" srcDoc={previewHtml} sandbox="" style={{ width: "100%", height: 720, border: "1px solid var(--line)", background: "#000" }} />
        </div>
      ) : null}

      {log.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e) => (
                <tr key={e.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{formatDateTime(e.createdAt, site.timezone)}</td>
                  <td>{TYPE_LABEL[e.type] ?? e.type}</td>
                  <td>{e.to}</td>
                  <td>{e.subject}</td>
                  <td>
                    {e.status === "preview" ? (
                      <a className="gold" href={`/admin/outbox?view=${e.id}`}>View preview</a>
                    ) : (
                      <span className={`status ${e.status === "sent" ? "completed" : "cancelled"}`} title={e.error ?? undefined}>
                        {e.status === "sent" ? "Sent" : "Failed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">Emails appear here as soon as someone books or sends a message.</div>
      )}
    </>
  );
}
