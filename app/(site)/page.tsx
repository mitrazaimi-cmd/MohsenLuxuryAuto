import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { HeroLogo } from "@/components/hero-logo";
import { ArrowRight, Award, Check, Clock, Handshake, Shield } from "@/components/icons";
import { SectionHead } from "@/components/section-head";
import { Stats } from "@/components/stats";
import { TestimonialList } from "@/components/testimonials";
import { fullName, site } from "@/config/site";
import { store } from "@/lib/db";
import heroPortrait from "@/public/images/mohsen-hero.webp";
import whyPhoto from "@/public/images/why-clients-handshake.jpg";

export const dynamic = "force-dynamic";

const messages = [
  {
    Icon: Clock,
    title: "Always available",
    text: "One call and Mohsen picks up: before you buy, on delivery day, and every year after. No call centers, no being passed around.",
  },
  {
    Icon: Handshake,
    title: "Beyond delivery",
    text: "The relationship doesn't end when you get the keys. It is why 80 to 85 percent of clients come back for their next Mercedes-Benz.",
  },
  {
    Icon: Shield,
    title: "Everything disclosed",
    text: "Every number is on the table from the first conversation. No hidden costs, no surprises at signing, no pressure.",
  },
];

const steps = [
  { title: "A conversation, not a pitch", text: "We talk about how you drive, what you need, and your budget, at the dealership or by phone." },
  { title: "The right model, side by side", text: "GLC, GLE, AMG, EQ or Maybach: Mohsen shows you the differences that matter, behind the wheel." },
  { title: "Clear numbers for buy, lease or finance", text: "A transparent comparison of every option, including your trade-in, so the decision is easy." },
  { title: "Paperwork handled, personal delivery", text: "One point of contact from the first test drive to the moment you drive away, and long after." },
];

export default async function HomePage() {
  const testimonials = await store.listContent("testimonials", { publishedOnly: true });

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
          <h1 id="hero-title" className="sr-only">
            Mohsen Luxury Auto: Premium Mercedes-Benz Sales Specialist in Philadelphia, PA
          </h1>
          <HeroLogo />
          <div className="hero-intro">
            <div className="frame portrait corners hero-portrait">
              <Image
                src={heroPortrait}
                alt={`${fullName()}, ${site.person.title}`}
                fill
                sizes="(max-width: 760px) 300px, 340px"
                placeholder="blur"
                priority
                style={{ objectFit: "cover", objectPosition: "50% 20%" }}
              />
            </div>
            <div>
              <p className="slogan">Expect the Best</p>
              <div className="rule" />
              <p className="lede">
                A Mercedes-Benz without the usual dealership stress. A Master Certified specialist who discloses
                everything up front, handles every detail, and is always one call away.
              </p>
              <div className="actions">
                <Link href="/book" className="btn btn-gold">
                  Book a Consultation <ArrowRight />
                </Link>
                <Link href="/services" className="btn btn-outline">
                  How it works
                </Link>
              </div>
              <p className="hero-note">No-obligation consultation · Purchase, lease or finance</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <Stats />
      </div>

      <section className="section" aria-labelledby="why-title">
        <div className="container">
          <div className="split why-intro">
            <SectionHead eyebrow="Why clients come back" title="One specialist. Every detail." id="why-title">
              The experience of buying a luxury car should feel like the car itself: refined, effortless and
              completely transparent.
            </SectionHead>
            <div className="frame corners reveal why-photo">
              <Image
                src={whyPhoto}
                alt="Mohsen shaking hands with a client as he hands her the key to her new Mercedes-Benz"
                fill
                sizes="(max-width: 960px) 100vw, 560px"
                placeholder="blur"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <div className="grid grid-3">
            {messages.map(({ Icon, title, text }) => (
              <article key={title} className="card gold-top hover reveal">
                <Icon className="icon" />
                <h3 className="h3">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="actions reveal" style={{ justifyContent: "center", marginTop: 48 }}>
            <Link href="/book" className="btn btn-gold">
              Book a Consultation <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="container split">
          <div>
            <SectionHead eyebrow="Your consultation" title="From first question to personal delivery" id="how-title">
              One relaxed consultation gives you a clear plan, with no obligation and nothing left unexplained.
            </SectionHead>
            <ul className="check-list reveal">
              {["No obligation, no pressure", "In person, by phone or by video", "New and Certified Pre-Owned", "Business and fleet purchases"].map((t) => (
                <li key={t}>
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="actions reveal" style={{ marginTop: 36 }}>
              <Link href="/services" className="btn btn-outline">
                Explore services <ArrowRight />
              </Link>
            </div>
          </div>
          <ol className="steps reveal" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h3">{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {testimonials.length ? (
        <section className="section" aria-labelledby="words-title">
          <div className="container">
            <SectionHead eyebrow="In clients' words" title="Trusted by returning clients" id="words-title" center />
            <TestimonialList items={testimonials.slice(0, 4)} />
            <div className="actions reveal" style={{ justifyContent: "center", marginTop: 56 }}>
              <Link href="/portfolio" className="btn btn-outline">
                See deliveries and stories <ArrowRight />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section tight" aria-labelledby="edge-title">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow">Comparing with BMW?</span>
            <h2 id="edge-title" className="h2" style={{ marginTop: 16 }}>
              Feel the difference behind the wheel
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              A Mercedes-Benz drives noticeably smoother. Mohsen knows every model well enough to show you
              exactly where, on a test drive planned around what you care about.
            </p>
          </div>
          <div className="card reveal" style={{ display: "grid", gap: 18 }}>
            <Award className="icon" />
            <p>
              <strong>Master Certified</strong>, with 20 years in luxury automotive sales, the highest customer satisfaction and an
              outstanding CSI score.
            </p>
            <p className="muted">Speaks English, Farsi and some Spanish.</p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
