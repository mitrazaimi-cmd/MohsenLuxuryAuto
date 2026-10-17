import { deleteContentAction } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { store, type ContentKind } from "@/lib/db";
import { ContentForm, type FieldDef } from "./content-form";

// Server component: list + add/edit/delete for one content type.
export async function ContentAdmin({
  kind,
  title,
  intro,
  fields,
  summary,
}: {
  kind: ContentKind;
  title: string;
  intro: string;
  fields: FieldDef[];
  summary: (item: Record<string, unknown>) => { heading: string; sub?: string; image?: string };
}) {
  await requireAdmin();
  const items = (await store.listContent(kind)) as unknown as Record<string, unknown>[];

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>{title}</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 640 }}>{intro}</p>
        </div>
      </div>

      <section className="card gold-top" style={{ marginBottom: 32 }} aria-labelledby="add-title">
        <h2 id="add-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Add new</h2>
        <ContentForm kind={kind} fields={fields} submitLabel="Add" />
      </section>

      {items.length ? (
        <div className="admin-card-list">
          {items.map((item) => {
            const s = summary(item);
            return (
              <article key={String(item.id)} className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt="" className="thumb" />
                  ) : null}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ color: "var(--silver-hi)", fontWeight: 600 }}>{s.heading}</div>
                    {s.sub ? <div className="muted" style={{ fontSize: "0.88rem" }}>{s.sub}</div> : null}
                  </div>
                  <span className={`status ${item.published ? "completed" : "cancelled"}`}>{item.published ? "Published" : "Hidden"}</span>
                  <form action={deleteContentAction}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="id" value={String(item.id)} />
                    <button type="submit" className="btn btn-danger btn-sm">Delete</button>
                  </form>
                </div>
                <details className="row-details" style={{ marginTop: 14 }}>
                  <summary>Edit</summary>
                  <div style={{ marginTop: 16 }}>
                    <ContentForm kind={kind} fields={fields} item={item} submitLabel="Save changes" />
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">Nothing here yet. Items you add appear on the Portfolio page.</div>
      )}
    </>
  );
}
