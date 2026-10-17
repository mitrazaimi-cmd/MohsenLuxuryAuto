import Link from "next/link";
import { ArrowRight } from "./icons";
import { Swoosh } from "./swoosh";

export function CtaBand({
  title = "Let's find the Mercedes-Benz that fits you",
  text = "Book a relaxed, one-on-one consultation. Everything disclosed up front, no pressure, and a clear plan for purchase, lease or finance.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div className="container narrow reveal">
        <Swoosh />
        <span className="eyebrow">Expect the Best</span>
        <h2 id="cta-title" className="h2" style={{ marginTop: 16 }}>
          {title}
        </h2>
        <p className="lede">{text}</p>
        <div className="actions">
          <Link href="/book" className="btn btn-gold">
            Book a Consultation <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
