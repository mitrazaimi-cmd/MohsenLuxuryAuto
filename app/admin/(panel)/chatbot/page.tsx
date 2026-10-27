import Link from "next/link";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { store, type ChatConversation } from "@/lib/db";
import { integrations } from "@/lib/env";
import { kbVersion } from "@/lib/kb/ingest";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Chatbot" };

const DAYS = 30;

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--silver-hi)", lineHeight: 1.1 }}>{value}</div>
      <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>{label}</div>
    </div>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default async function ChatbotOverviewPage() {
  await requireAdmin();
  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const [all, recentQuestions, sources, bot] = await Promise.all([
    store.listConversations({ since, limit: 5000 }),
    store.listRecentUserMessages(since, 500),
    store.listKbSources(),
    store.getChatbotSettings(),
  ]);
  const conversations = all.filter((c) => c.channel !== "playground");
  const count = (f: (c: ChatConversation) => boolean) => conversations.filter(f).length;
  const booked = count((c) => c.status === "booked");
  const leads = count((c) => c.status !== "open");
  const handoffs = count((c) => c.status === "handoff");
  const cost = all.reduce((n, c) => n + Number(c.costUsd), 0);
  const unanswered = recentQuestions.filter((m) => m.meta?.unanswered).slice(0, 12);
  const site_ = sources.find((s) => s.kind === "site");

  const checklist = [
    { done: integrations.gemini, text: "Gemini API key (GEMINI_API_KEY) for the conversations" },
    { done: integrations.voyage, text: "Voyage AI key (VOYAGE_API_KEY) for meaning-based search; without it, keyword search only" },
    { done: site_?.status === "ready" && site_.version === kbVersion(), text: "Website content synced to the knowledge base for this deploy" },
    { done: sources.some((s) => s.kind !== "site"), text: "At least one PDF, text or Q&A of your own in Knowledge" },
    { done: Boolean(bot.telegramAdminChatId), text: "Telegram alerts linked (Widget & channels)" },
  ];

  return (
    <>
      <h2 className="h3" style={{ marginBottom: 16 }}>Last {DAYS} days</h2>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Stat value={conversations.length} label="Conversations" />
        <Stat value={leads} label={`Leads (${pct(leads, conversations.length)} of conversations)`} />
        <Stat value={booked} label={`Consultations booked (${pct(booked, conversations.length)})`} />
        <Stat value={handoffs} label="Asked for Mohsen" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 40 }}>
        <Stat value={count((c) => c.channel === "web")} label="From the chat button" />
        <Stat value={count((c) => c.channel === "page")} label="From the /chat page" />
        <Stat value={count((c) => c.channel === "telegram")} label="From Telegram" />
        <Stat value={`$${cost.toFixed(2)}`} label="AI cost (incl. playground)" />
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <section className="card" aria-labelledby="gaps-title">
          <h2 id="gaps-title" className="h3" style={{ marginTop: 0 }}>Questions without a good answer</h2>
          <p className="muted" style={{ fontSize: "0.85rem", margin: "8px 0 16px" }}>
            The knowledge base had nothing relevant. Add a Q&amp;A or a text in Knowledge to cover them.
          </p>
          {unanswered.length ? (
            <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none" }}>
              {unanswered.map((m) => (
                <li key={m.id} style={{ borderBottom: "1px solid var(--line-soft)", paddingBottom: 10 }}>
                  <Link href={`/admin/chatbot/conversations/${m.conversationId}`} style={{ color: "var(--silver-hi)" }}>
                    {m.text.slice(0, 160)}
                  </Link>
                  <div className="muted" style={{ fontSize: "0.75rem" }}>{formatDateTime(m.createdAt, site.timezone)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None yet.</p>
          )}
        </section>

        <section className="card" aria-labelledby="setup-title">
          <h2 id="setup-title" className="h3" style={{ marginTop: 0, marginBottom: 16 }}>Setup checklist</h2>
          <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
            {checklist.map((c) => (
              <li key={c.text} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: c.done ? "var(--ok)" : "var(--gold)", minWidth: 18 }}>{c.done ? "✓" : "○"}</span>
                <span style={{ color: c.done ? "var(--silver)" : "var(--silver-hi)" }}>{c.text}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ fontSize: "0.82rem", marginTop: 18 }}>
            The assistant is {bot.enabled ? "on" : "paused"}. Test changes safely in the{" "}
            <Link href="/admin/chatbot/playground" className="gold">Playground</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
