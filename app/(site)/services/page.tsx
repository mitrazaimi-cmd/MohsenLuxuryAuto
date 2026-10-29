import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { ArrowRight, Check } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { SectionHead } from "@/components/section-head";
import consultationPhoto from "@/public/images/consultation.webp";
import amg from "@/public/images/specialties/amg.webp";
import businessFleet from "@/public/images/specialties/business-fleet.webp";
import certifiedPreOwned from "@/public/images/specialties/certified-pre-owned.webp";
import eqElectric from "@/public/images/specialties/eq-electric.webp";
import glcGle from "@/public/images/specialties/glc-gle.webp";
import maybach from "@/public/images/specialties/maybach.webp";
import whatToBring from "@/public/images/what-to-bring.webp";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Purchase and leasing consultations for GLC, GLE, AMG, EQ electric, Maybach, Certified Pre-Owned, and business and fleet purchases. One point of contact from test drive to delivery.",
};

const includes = [
  "A conversation about how you drive, what you need and your budget",
  "A side-by-side look at the models that fit, and a test drive when you're ready",
  "Transparent numbers for purchase, lease and finance, with every cost disclosed",
  "An honest value for your trade-in",
  "All the paperwork handled for you",
  "Personal delivery, and a follow-up after every sale",
];

// Photos from Pexels (free for commercial use, no attribution required); the number is the Pexels photo id.
const specialties = [
  {
    photo: glcGle, // 14719372
    alt: "A black Mercedes-Benz GLE SUV seen from the side",
    position: "30% 50%",
    title: "GLC & GLE",
    text: "The most-requested SUVs among business owners and professionals. New and Certified Pre-Owned, mostly financed.",
  },
  {
    photo: amg, // 10292240
    alt: "A matte black Mercedes-AMG GT from the rear",
    title: "AMG",
    text: "Performance models matched to how you actually drive, with the trade-offs explained plainly.",
  },
  {
    photo: eqElectric, // 17000830
    alt: "The open charging port of a black electric car",
    title: "EQ electric",
    text: "Range, charging at home and on the road, and incentives, all walked through before you decide.",
  },
  {
    photo: maybach, // 29288795
    alt: "The Maybach lettering above a lit tail light",
    title: "Maybach",
    text: "The highest level of Mercedes-Benz craftsmanship, with an experience to match.",
  },
  {
    photo: certifiedPreOwned, // 16716122
    alt: "Black leather seats inside a Mercedes-Benz",
    title: "Certified Pre-Owned",
    text: "Exceptional value with the confidence of certification and a full, disclosed history.",
  },
  {
    photo: businessFleet, // 17016698
    alt: "Two black Mercedes-Benz vehicles in a parking garage",
    title: "Business & fleet",
    text: "Several vehicles for your company, coordinated by one contact who understands business owners.",
  },
];

const prepare = [
  "Your driver's license",
  "Proof of insurance",
  "Trade-in title or loan details, if you have one",
  "A rough monthly budget, or the total you'd like to stay within",
];

export default function ServicesPage() {
  return (
    <>
      <PageHero center eyebrow="Services" title="One point of contact, from test drive to delivery">
        Whether you buy, lease or finance, Mohsen handles everything: the first test drive, all the paperwork and
        personal delivery, and stays one call away afterwards.
      </PageHero>

      <section className="section" aria-labelledby="consult-title">
        <div className="container">
          <div className="split intro-split">
            <SectionHead eyebrow="Purchase & leasing consultation" title="What your consultation includes" id="consult-title">
              About 45 minutes, in person at the dealership, by phone or by video. No obligation and no pressure.
            </SectionHead>
            <div className="frame corners reveal photo-3x2">
              <Image
                src={consultationPhoto}
                alt="Mohsen talking a client through her options at a table in the showroom"
                fill
                sizes="(max-width: 960px) 100vw, 560px"
                placeholder="blur"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <ul className="check-list boxed grid-3 reveal">
            {includes.map((t) => (
              <li key={t} className="gold-hover">
                <Check />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="actions reveal" style={{ justifyContent: "center", marginTop: 40 }}>
            <Link href="/book" className="btn btn-gold">
              Book a Consultation <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="spec-title">
        <div className="container">
          <SectionHead eyebrow="Specialties" title="Every Mercedes-Benz, known in depth" id="spec-title" center />
          {/* reveal sits on the grid: on a card its transition would override the card's hover transition. */}
          <div className="grid grid-3 spec-grid reveal">
            {specialties.map(({ photo, alt, position, title, text }) => (
              <article key={title} className="spec-card" tabIndex={0}>
                <Image
                  src={photo}
                  alt={alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px"
                  placeholder="blur"
                  style={{ objectFit: "cover", objectPosition: position ?? "50% 50%" }}
                />
                <div className="spec-body">
                  <h3 className="h3">{title}</h3>
                  <div className="spec-text">
                    <div>
                      <p>{text}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="inline-cta reveal">
            <p className="lede" style={{ fontWeight: 600 }}>
              Not sure which model fits?
              <br />
              That is exactly what the consultation is for.
            </p>
            <Link href="/book" className="btn btn-gold">
              Book a Consultation <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="prep-title">
        <div className="container">
          <div className="split intro-split">
            <SectionHead eyebrow="Before we meet" title="What to bring" id="prep-title">
              Nothing is required for a first conversation. If you would like to move quickly, these help.
            </SectionHead>
            <div className="frame corners reveal photo-3x2">
              <Image
                src={whatToBring}
                alt="Hands sliding a driver's license into a leather document holder beside a car key and a coffee"
                fill
                sizes="(max-width: 960px) 100vw, 560px"
                placeholder="blur"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <ul className="check-list boxed grid-4 reveal">
            {prepare.map((t) => (
              <li key={t} className="gold-hover">
                <Check />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand title="Ready when you are" />
    </>
  );
}
