import Link from "next/link";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { CHANNEL_LABEL, STATUS_LABEL } from "@/lib/chat/labels";
import { store, type ChatChannel, type ConversationStatus } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Chatbot conversations" };

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const channel = sp.channel && sp.channel in CHANNEL_LABEL ? (sp.channel as ChatChannel) : undefined;
  const status = sp.status && sp.status in STATUS_LABEL ? (sp.status as ConversationStatus) : undefined;
  const rows = (await store.listConversations({ channel, status, limit: 300 })).filter(
    (c) => channel === "playground" || c.channel !== "playground",
  );

  return (
    <>
      <form className="filter-bar inline-form" style={{ marginBottom: 20, gap: 10 }}>
        <label htmlFor="channel" className="sr-only">Channel</label>
        <select id="channel" name="channel" className="select" defaultValue={channel ?? ""}>
          <option value="">All channels</option>
          {Object.entries(CHANNEL_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" className="select" defaultValue={status ?? ""}>
          <option value="">Any status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-outline btn-sm">Filter</button>
        <a href="/api/admin/conversations-csv" className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}>
          Export CSV
        </a>
      </form>

      {rows.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Last message</th>
                <th>Visitor</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/admin/chatbot/conversations/${c.id}`} className="gold">
                      {formatDateTime(c.lastMessageAt, site.timezone)}
                    </Link>
                    {!c.reviewed ? <div className="muted" style={{ fontSize: "0.75rem" }}>Not reviewed</div> : null}
                  </td>
                  <td>
                    <div style={{ color: "var(--silver-hi)" }}>{c.visitorName || "Anonymous visitor"}</div>
                    <div className="muted">{[c.visitorEmail, c.visitorPhone].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td>
                    <span className={`status ${c.status === "booked" ? "upcoming" : c.status === "open" ? "cancelled" : "completed"}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td>{CHANNEL_LABEL[c.channel]}</td>
                  <td>{c.messageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">Conversations with the assistant appear here.</div>
      )}
    </>
  );
}
