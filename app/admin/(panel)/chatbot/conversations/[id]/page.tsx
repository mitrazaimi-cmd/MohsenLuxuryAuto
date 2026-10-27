import Link from "next/link";
import { notFound } from "next/navigation";
import { updateConversationAction } from "@/actions/chatbot";
import { RichText } from "@/components/chat/rich-text";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { store, type ConversationStatus } from "@/lib/db";
import { CHANNEL_LABEL, STATUS_LABEL } from "@/lib/chat/labels";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await store.getConversation(id);
  if (!c) notFound();
  const messages = await store.listChatMessages(id);
  const tz = site.timezone;

  return (
    <div className="booking-layout" style={{ alignItems: "start" }}>
      <section aria-label="Transcript" className="card" style={{ padding: 20 }}>
        <Link href="/admin/chatbot/conversations" className="muted" style={{ fontSize: "0.82rem" }}>
          ← All conversations
        </Link>
        <div className="chat-log" style={{ padding: "16px 0 0", overflow: "visible" }}>
          {messages.map((m) => (
            <div key={m.id} className={`chat-msg ${m.role}`} style={{ maxWidth: "92%" }}>
              {m.role === "assistant" ? <RichText text={m.text} /> : <p>{m.text}</p>}
              <div className="muted" style={{ fontSize: "0.7rem", marginTop: 6 }}>
                {formatDateTime(m.createdAt, tz)}
                {m.meta?.tools?.length ? ` · used ${m.meta.tools.join(", ")}` : ""}
                {m.meta?.sources?.length ? ` · sources: ${m.meta.sources.join(", ")}` : ""}
                {m.meta?.unanswered ? " · no good answer in the knowledge base" : ""}
              </div>
            </div>
          ))}
          {!messages.length ? <p className="muted">No messages.</p> : null}
        </div>
      </section>

      <aside className="card booking-aside" style={{ padding: 24, display: "grid", gap: 14 }}>
        <div>
          <div className="label" style={{ color: "var(--muted)" }}>Visitor</div>
          <div style={{ color: "var(--silver-hi)", marginTop: 4 }}>{c.visitorName || "Anonymous visitor"}</div>
          {c.visitorEmail ? <a className="gold" href={`mailto:${c.visitorEmail}`}>{c.visitorEmail}</a> : null}
          {c.visitorPhone ? <div><a href={`tel:${c.visitorPhone.replace(/[^\d+]/g, "")}`}>{c.visitorPhone}</a></div> : null}
        </div>
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          {CHANNEL_LABEL[c.channel]} · {c.messageCount} messages · ${Number(c.costUsd).toFixed(3)}
          <br />
          Started {formatDateTime(c.createdAt, tz)}
          {c.pageUrl ? <><br />Last page: {c.pageUrl}</> : null}
        </div>
        {c.bookingId ? (
          <Link href="/admin?view=upcoming" className="btn btn-outline btn-sm">See the booking</Link>
        ) : null}
        <form action={updateConversationAction} style={{ display: "grid", gap: 12 }}>
          <input type="hidden" name="id" value={c.id} />
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" className="select" defaultValue={c.status}>
              {(Object.keys(STATUS_LABEL) as ConversationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="note">Private note</label>
            <textarea id="note" name="note" className="textarea" style={{ minHeight: 80 }} defaultValue={c.note} />
          </div>
          <label className="checkbox">
            <input type="checkbox" name="reviewed" defaultChecked={c.reviewed} />
            <span>Reviewed</span>
          </label>
          <button type="submit" className="btn btn-gold btn-sm">Save</button>
        </form>
      </aside>
    </div>
  );
}
