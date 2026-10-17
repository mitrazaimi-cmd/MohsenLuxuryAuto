import { toggleMessageReadAction } from "@/actions/admin";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await store.listMessages();
  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Messages</h1>
        </div>
      </div>
      {messages.length ? (
        <div className="admin-card-list">
          {messages.map((m) => (
            <article key={m.id} className={`card${m.read ? "" : " gold-top"}`} style={{ padding: 24 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: "var(--silver-hi)", fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: "0.9rem" }}>
                    <a className="gold" href={`mailto:${m.email}`}>{m.email}</a>
                    {m.phone ? <span className="muted"> · {m.phone}</span> : null}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: "0.82rem" }}>{formatDateTime(m.createdAt, site.timezone)}</div>
              </div>
              <p style={{ marginTop: 14, whiteSpace: "pre-wrap" }}>{m.message}</p>
              <form action={toggleMessageReadAction} style={{ marginTop: 16 }}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                <button type="submit" className="btn btn-outline btn-sm">{m.read ? "Mark as unread" : "Mark as read"}</button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">Messages from the contact form appear here.</div>
      )}
    </>
  );
}
