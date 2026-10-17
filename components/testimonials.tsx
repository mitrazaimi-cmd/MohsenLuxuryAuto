import type { Testimonial } from "@/lib/db/types";

export function TestimonialList({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <>
      <figure className="testimonial-feature reveal" style={{ margin: "0 auto" }}>
        <span className="quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote className="quote" style={{ margin: 0 }}>
          {first.quote}
        </blockquote>
        <figcaption className="quote-by">
          {first.clientName}
          {first.model ? ` · ${first.model}` : ""}
        </figcaption>
      </figure>
      {rest.length ? (
        <div className="grid grid-3" style={{ marginTop: 64 }}>
          {rest.map((t) => (
            <figure key={t.id} className="card reveal" style={{ margin: 0 }}>
              <blockquote className="quote" style={{ margin: 0, fontSize: "1.05rem" }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="quote-by">
                {t.clientName}
                {t.model ? ` · ${t.model}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </>
  );
}
