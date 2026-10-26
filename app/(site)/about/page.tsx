import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { ArrowRight, Award, Globe, Instagram, Linkedin } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { SectionHead } from "@/components/section-head";
import { Stats } from "@/components/stats";
import { fullName, site } from "@/config/site";
import portrait from "@/public/images/mohsen-portrait.webp";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Mohsen Mohimani is a Master Certified Sales & Leasing Consultant at Mercedes-Benz of West Chester, with 20 years of experience in luxury automotive sales and dealership management.",
};

const career = [
  {
    role: "Master Certified Sales & Leasing Consultant",
    place: "Mercedes-Benz of West Chester",
    text: "One point of contact for every client, with an outstanding customer-satisfaction (CSI) record.",
  },
  {
    role: "General Manager / Sales Manager",
    place: "Lancaster County Motor",
    text: "An insider's understanding of dealership operations, now working in his clients' favor.",
  },
  {
    role: "Registered Representative (Series 6 & 63)",
    place: "Prudential Financial",
    text: "A foundation of clear numbers, honest advice, and strict standards.",
  },
];

const values = [
  { n: "I", title: "Integrity", text: "Everything is disclosed up front, with no hidden costs." },
  { n: "II", title: "Customer satisfaction", text: "Every decision starts with what is best for the client." },
  { n: "III", title: "Best value", text: "You leave knowing you got the most for your money." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero center eyebrow="About me" title={fullName()}>
        Mohsen Mohimani is a Master Certified Sales &amp; Leasing Consultant at Mercedes-Benz of West Chester, with
        20 years in luxury automotive sales. Clients don&apos;t just buy from Mohsen — they come back to him, year after
        year, because one person they trust handles everything: honest numbers, every cost disclosed up front, and a
        relationship that continues long after delivery day. It&apos;s why 80 to 85 percent of his clients return for
        their next Mercedes-Benz.
      </PageHero>

      <section className="section" aria-labelledby="story-title">
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="frame portrait corners reveal">
            <Image
              src={portrait}
              alt={`${fullName()}, ${site.person.title}`}
              fill
              sizes="(max-width: 960px) 100vw, 560px"
              placeholder="blur"
              priority
              style={{ objectFit: "cover", objectPosition: "50% 20%" }}
            />
          </div>
          <div>
            <SectionHead eyebrow="My story" title="A relationship-first approach" id="story-title" />
            <div className="reveal" style={{ display: "grid", gap: 18 }}>
              <p className="lede">
                Before Mercedes-Benz, Mohsen ran dealerships from the inside — as General Manager and Sales Manager at
                Lancaster County Motor, he learned how pricing, inventory, and deals really work. Today he puts that
                insider&apos;s knowledge on his clients&apos; side of the table. Earlier still, as a Registered
                Representative (Series 6 &amp; 63) at Prudential Financial, he built the disciplined, analytical approach
                behind how he presents every purchase, lease, and finance option: clearly, patiently, and with nothing
                hidden.
              </p>
              <p>
                His philosophy: <span className="gold" style={{ fontFamily: "var(--font-serif)", fontWeight: 700, letterSpacing: "0.12em" }}>EXPECT THE BEST</span>.
              </p>
              <p className="quote" style={{ fontSize: "1.1rem", marginTop: 12 }}>
                “Mohsen always takes good care of us. He is always available, and everybody can easily get in touch
                with him.”
              </p>
              <p className="quote-by" style={{ marginTop: 0 }}>A returning client</p>
              {site.social.linkedin || site.social.instagram ? (
                <div className="actions" style={{ marginTop: 8 }}>
                  {site.social.linkedin ? (
                    <a href={site.social.linkedin} className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                      <Linkedin /> View on LinkedIn
                    </a>
                  ) : null}
                  {site.social.instagram ? (
                    <a href={site.social.instagram} className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                      <Instagram /> Follow on Instagram
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="career-title">
        <div className="container">
          <SectionHead eyebrow="Experience" title="Every side of the business" id="career-title" center>
            Sales, dealership management and financial services: experience that turns into clear numbers and
            honest advice for every client.
          </SectionHead>
          <ol className="steps boxed grid-3 reveal" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {career.map((c, i) => (
              <li key={c.place} className="step gold-hover">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span className="eyebrow">{c.place}</span>
                  <h3 className="h3" style={{ marginTop: 8 }}>{c.role}</h3>
                  <p>{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section tight" aria-label="Track record">
        <div className="container">
          <Stats />
          <div className="grid grid-2 reveal" style={{ marginTop: 48 }}>
            <div className="card gold-hover">
              <Award className="icon" />
              <h3 className="h3">Top salesperson</h3>
              <p>The highest customer satisfaction and an outstanding CSI score.</p>
            </div>
            <div className="card gold-hover">
              <Globe className="icon" />
              <h3 className="h3">{site.person.languages.length} languages</h3>
              <p>English, Farsi and some Spanish, so every detail is clear.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="mission-title">
        <div className="container">
          <SectionHead eyebrow="Mission" title="Customer satisfaction, first" id="mission-title" center>
            To put customer satisfaction first by taking the time to show every client each car patiently, advising
            them on what truly fits their needs, and following up on every sale.
          </SectionHead>
          <div className="grid grid-3 reveal">
            {values.map((v) => (
              <article key={v.title} className="card gold-hover">
                <span className="num">{v.n}</span>
                <h3 className="h3">{v.title}</h3>
                <p>{v.text}</p>
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

      <CtaBand title="Let's talk about your next Mercedes-Benz" />
    </>
  );
}
