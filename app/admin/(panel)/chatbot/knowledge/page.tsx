import { after } from "next/server";
import { deleteSourceAction, reindexSourceAction, syncSiteAction, toggleSourceAction } from "@/actions/chatbot";
import { PdfUploadForm, TextSourceForm } from "@/components/admin/chatbot-forms";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth";
import { store, type KbKind } from "@/lib/db";
import { deployVersion, integrations } from "@/lib/env";
import { ensureSiteSynced } from "@/lib/kb/ingest";
import { searchKnowledge } from "@/lib/kb/search";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Chatbot knowledge" };
export const maxDuration = 60; // indexing a PDF or the website runs inside the server actions

const KIND_LABEL: Record<KbKind, string> = { site: "Website", pdf: "PDF", text: "Text", qa: "Q&A" };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = ((await searchParams).q ?? "").trim().slice(0, 300);
  const [sources, results] = await Promise.all([store.listKbSources(), q ? searchKnowledge(q, 5) : null]);
  const siteSource = sources.find((s) => s.kind === "site");
  const others = sources.filter((s) => s.kind !== "site");
  after(() => ensureSiteSynced().catch((err) => console.error("[kb] site sync failed:", err)));

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {!integrations.voyage ? (
        <p className="mode-banner" style={{ margin: 0 }}>
          Keyword search only: add VOYAGE_API_KEY (voyageai.com) so the assistant also finds answers phrased in other
          words, and in other languages. Then press &quot;Re-index&quot; on each source.
        </p>
      ) : null}

      <section className="card gold-top" aria-labelledby="site-title">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <h2 id="site-title" className="h3" style={{ marginTop: 0 }}>Website</h2>
            <p className="muted" style={{ fontSize: "0.88rem", marginTop: 6 }}>
              Every public page is added automatically after each deploy.{" "}
              {siteSource
                ? `${siteSource.chunkCount} sections · ${siteSource.status === "processing" ? "syncing now" : `last synced ${formatDateTime(siteSource.updatedAt, site.timezone)}`}${siteSource.version === deployVersion() ? " (current deploy)" : " (a newer deploy is waiting)"}`
                : "Not synced yet."}
            </p>
            {siteSource?.error ? <p className="error" style={{ marginTop: 6 }}>{siteSource.error}</p> : null}
          </div>
          <form action={syncSiteAction}>
            <button type="submit" className="btn btn-outline btn-sm">Sync now</button>
          </form>
        </div>
      </section>

      <div className="grid grid-3" style={{ alignItems: "start" }}>
        <section className="card" aria-labelledby="pdf-title">
          <h2 id="pdf-title" className="h3" style={{ marginTop: 0, marginBottom: 16 }}>Add a PDF</h2>
          <PdfUploadForm />
        </section>
        <section className="card" aria-labelledby="text-title">
          <h2 id="text-title" className="h3" style={{ marginTop: 0, marginBottom: 16 }}>Add text</h2>
          <TextSourceForm kind="text" />
        </section>
        <section className="card" aria-labelledby="qa-title">
          <h2 id="qa-title" className="h3" style={{ marginTop: 0, marginBottom: 16 }}>Add a Q&amp;A</h2>
          <TextSourceForm kind="qa" />
        </section>
      </div>

      <section aria-labelledby="sources-title">
        <h2 id="sources-title" className="h3" style={{ marginBottom: 14 }}>Your sources</h2>
        {others.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {others.map((s) => (
                  <tr key={s.id} style={{ opacity: s.enabled ? 1 : 0.55 }}>
                    <td>
                      <div style={{ color: "var(--silver-hi)" }}>{s.title}</div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        {s.chunkCount} sections · updated {formatDateTime(s.updatedAt, site.timezone)}
                      </div>
                      {s.kind === "text" || s.kind === "qa" ? (
                        <details className="row-details" style={{ marginTop: 8 }}>
                          <summary>Edit</summary>
                          <div style={{ marginTop: 12, maxWidth: 560 }}>
                            <TextSourceForm kind={s.kind} source={s} />
                          </div>
                        </details>
                      ) : null}
                    </td>
                    <td>{KIND_LABEL[s.kind]}</td>
                    <td>
                      <span className={`status ${s.status === "ready" ? "upcoming" : s.status === "error" ? "cancelled" : "completed"}`}>
                        {s.enabled ? s.status : "off"}
                      </span>
                      {s.error ? <div className="error" style={{ fontSize: "0.78rem", marginTop: 6, maxWidth: 260 }}>{s.error}</div> : null}
                    </td>
                    <td>
                      <div className="inline-form" style={{ gap: 8 }}>
                        <form action={toggleSourceAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="enabled" value={s.enabled ? "0" : "1"} />
                          <button type="submit" className="btn btn-outline btn-sm">{s.enabled ? "Turn off" : "Turn on"}</button>
                        </form>
                        <form action={reindexSourceAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="btn btn-outline btn-sm">Re-index</button>
                        </form>
                        <form action={deleteSourceAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="btn btn-danger btn-sm">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Your PDFs, texts and Q&amp;As appear here.</div>
        )}
      </section>

      <section className="card" aria-labelledby="test-title">
        <h2 id="test-title" className="h3" style={{ marginTop: 0 }}>Test a question</h2>
        <p className="muted" style={{ fontSize: "0.88rem", margin: "6px 0 16px" }}>
          See which passages the assistant would read before answering.
        </p>
        <form className="inline-form" style={{ gap: 10 }}>
          <label htmlFor="q" className="sr-only">Question</label>
          <input id="q" name="q" className="input" style={{ flex: 1, minWidth: 220 }} defaultValue={q} placeholder="Can I lease an EQ with a trade-in?" />
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
        </form>
        {results ? (
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {results.unanswered ? (
              <p className="error">Nothing in the knowledge base answers this well. Consider adding a Q&amp;A.</p>
            ) : null}
            {results.matches.map((m) => (
              <div key={m.chunkId} style={{ borderLeft: "2px solid var(--gold-soft)", paddingLeft: 14 }}>
                <div style={{ color: "var(--silver-hi)", fontSize: "0.9rem" }}>
                  {m.heading}
                  <span className="muted" style={{ fontSize: "0.78rem" }}>
                    {" "}· {m.sourceTitle}
                    {m.relevance !== null ? ` · relevance ${Math.round(m.relevance * 100)}%` : ""}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: "0.84rem", marginTop: 4, whiteSpace: "pre-wrap" }}>
                  {m.content.slice(0, 420)}
                  {m.content.length > 420 ? "…" : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
