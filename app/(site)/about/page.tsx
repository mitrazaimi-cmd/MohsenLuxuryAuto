import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { ArrowRight, Award, Globe } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { SectionHead } from "@/components/section-head";
import { Stats } from "@/components/stats";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Mohsen is a Master Certified Mercedes-Benz sales specialist with 20 years at Mercedes-Benz, known for full disclosure, patience, and a relationship that continues after delivery.",
};

const values = [
  { n: "I", title: "Integrity", text: "Everything is disclosed up front, with no hidden costs." },
  { n: "II", title: "Customer satisfaction", text: "Every decision starts with what is best for the client." },
  { n: "III", title: "Best value", text: "You leave knowing you got the most for your money." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About me" title={`Hi, I'm ${site.person.firstName}`}>
        A Master Certified Mercedes-Benz sales specialist with 20 years at Mercedes-Benz, and still the person who
        picks up when you call.
      </PageHero>

      <section className="section" aria-labelledby="story-title">
        <div className="container split">
          {/* TODO: replace with Mohsen's professional portrait (next/image, 4:5). */}
          <div className="frame portrait corners reveal" role="img" aria-label="Portrait of Mohsen (photo coming soon)">
            <span className="frame-label">Portrait coming soon</span>
          </div>
          <div>
            <SectionHead eyebrow="My story" title="It started with an S-Class" id="story-title" />
            <div className="reveal" style={{ display: "grid", gap: 18 }}>
              <p className="lede">
                I have loved cars since I was a child. The first time I sat behind the wheel of an S-Class, I knew I
                wanted to give that experience to other people.
              </p>
              <p>
                Twenty years later, I am a Master Certified Mercedes-Benz sales specialist. I take the time to show
                every client each car patiently, advise on what truly fits their needs, and follow up on every sale.
              </p>
              <p>
                That is why most of my clients come to me through referrals, and why 80 to 85 percent of them come
                back when it is time for their next Mercedes-Benz.
              </p>
              <p className="quote" style={{ fontSize: "1.1rem", marginTop: 8 }}>
                “Mohsen always takes good care of us. He is always available, and everybody can easily get in touch
                with him.”
              </p>
              <p className="quote-by" style={{ marginTop: 0 }}>A returning client</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight" aria-label="Track record">
        <div className="container">
          <Stats />
          <div className="grid grid-2 reveal" style={{ marginTop: 48 }}>
            <div className="card">
              <Award className="icon" />
              <h3 className="h3">Top salesperson</h3>
              <p>About 20 cars delivered every month, with the highest customer satisfaction and an outstanding CSI score.</p>
            </div>
            <div className="card">
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
          <div className="grid grid-3">
            {values.map((v) => (
              <article key={v.title} className="card gold-top reveal">
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
