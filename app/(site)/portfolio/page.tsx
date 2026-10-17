import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/cta-band";
import { Gallery } from "@/components/gallery";
import { PageHero } from "@/components/page-hero";
import { SectionHead } from "@/components/section-head";
import { Stats } from "@/components/stats";
import { TestimonialList } from "@/components/testimonials";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Delivery days, client stories and reviews from Mohsen's Mercedes-Benz clients, 80 to 85 percent of whom come back.",
};

const placeholders = ["GLC", "GLE", "AMG", "EQ electric", "Maybach", "Certified Pre-Owned"];

export default async function PortfolioPage() {
  const [items, testimonials, stories] = await Promise.all([
    store.listContent("portfolio_items", { publishedOnly: true }),
    store.listContent("testimonials", { publishedOnly: true }),
    store.listContent("client_stories", { publishedOnly: true }),
  ]);

  return (
    <>
      <PageHero eyebrow="Portfolio" title="Delivery days and the stories behind them">
        Every delivery ends with a photo of the client and their new car, shared with their permission.
      </PageHero>

      <section className="section tight" aria-label="Track record">
        <div className="container">
          <Stats />
        </div>
      </section>

      <section className="section" aria-labelledby="deliveries-title">
        <div className="container">
          <SectionHead eyebrow="Deliveries" title="Welcome to the family" id="deliveries-title" />
          {items.length ? (
            <Gallery items={items} />
          ) : (
            <div className="gallery" aria-label="Delivery photos coming soon">
              {placeholders.map((m) => (
                <figure key={m} className="reveal" style={{ margin: 0 }}>
                  <div className="frame corners">
                    <span className="frame-label">Delivery photos coming soon</span>
                  </div>
                  <figcaption style={{ marginTop: 12 }}>
                    <b className="eyebrow" style={{ letterSpacing: "0.22em" }}>{m}</b>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {stories.length ? (
        <section className="section" aria-labelledby="stories-title">
          <div className="container">
            <SectionHead eyebrow="Client stories" title="What they needed, and how we got there" id="stories-title" />
            <div className="grid" style={{ gap: 32 }}>
              {stories.map((s) => (
                <article key={s.id} className="card gold-top reveal split" style={{ gap: 40 }}>
                  {s.imageUrl ? (
                    <div className="frame">
                      <Image src={s.imageUrl} alt={`${s.clientFirstName || "Client"} with their ${s.model || "Mercedes-Benz"}`} fill sizes="(max-width: 960px) 100vw, 50vw" unoptimized />
                    </div>
                  ) : null}
                  <div style={{ gridColumn: s.imageUrl ? undefined : "1 / -1" }}>
                    {s.model ? <span className="eyebrow">{s.model}</span> : null}
                    <h3 className="h3" style={{ fontSize: "1.4rem", marginTop: 12 }}>{s.title}</h3>
                    <dl style={{ display: "grid", gap: 18, margin: "24px 0 0" }}>
                      {[
                        ["The need", s.need],
                        ["The recommendation", s.recommendation],
                        ["The result", s.result],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt className="label gold">{k}</dt>
                            <dd style={{ margin: "6px 0 0" }}>{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length ? (
        <section className="section" aria-labelledby="reviews-title">
          <div className="container">
            <SectionHead eyebrow="Reviews" title="In clients' words" id="reviews-title" center />
            <TestimonialList items={testimonials} />
          </div>
        </section>
      ) : null}

      <CtaBand title="Your delivery day could be next" />
    </>
  );
}
