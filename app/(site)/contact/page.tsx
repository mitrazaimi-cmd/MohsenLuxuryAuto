import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { ArrowRight, Calendar, Instagram, Mail, MapPin, Phone } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { SectionHead } from "@/components/section-head";
import { site, socialHandle, telHref } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call, email or send Mohsen a message. Or book a purchase and leasing consultation directly.",
};

const faqs = [
  {
    q: "How do I book a consultation?",
    a: `Book online in under a minute, or call ${site.contact.phone}. A consultation takes about 45 minutes — in person at the dealership, by phone or by video — with no obligation and no pressure.`,
  },
  {
    q: "What should I bring?",
    a: "Your driver's license, proof of insurance, your trade-in's title or loan details if you have one, and a rough monthly budget, or the total you'd like to stay within.",
  },
  {
    q: "Can I test drive the models I'm considering?",
    a: "Yes. Your consultation includes a side-by-side look at the models that fit how you drive, and a test drive when you're ready.",
  },
  {
    q: "Do you help with leasing and financing, or only purchases?",
    a: "All three. You'll see transparent numbers for purchase, lease and finance, with every cost disclosed before you decide.",
  },
  {
    q: "Do you take trade-ins?",
    a: "Yes — you'll get an honest value for your trade-in as part of the consultation. Bringing the title or loan details helps speed things up.",
  },
  {
    q: "Which models do you specialize in?",
    a: "GLC and GLE, AMG, EQ electric, Maybach and Certified Pre-Owned, as well as business and fleet purchases. If you're not sure which fits, that's exactly what the consultation is for.",
  },
  {
    q: "Which languages can we speak?",
    a: "Mohsen works in English and Farsi, and some Spanish.",
  },
];

export default function ContactPage() {
  const { contact, social } = site;
  // The dealership's name as well, so the map card names it rather than just the street.
  const mapQuery = contact.address ? encodeURIComponent(`${contact.dealershipName}, ${contact.address}`) : "";

  return (
    <>
      <PageHero center eyebrow="Contact me" title="Always one call away">
        Questions about a model, a lease, or your current Mercedes-Benz? Reach out any way you like. Every message
        is answered personally.
      </PageHero>

      <section className="section">
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="reveal">
            <h2 className="h2" style={{ fontSize: "1.5rem" }}>Send a message</h2>
            <div className="rule" style={{ marginBottom: 32 }} />
            <ContactForm />
          </div>

          <div className="reveal" style={{ display: "grid", gap: 24 }}>
            <div className="card gold-top" style={{ display: "grid", gap: 16 }}>
              <Calendar className="icon" />
              <h2 className="h3" style={{ marginTop: 4 }}>Prefer to book directly?</h2>
              <p>Pick a time that suits you for a purchase or leasing consultation. It takes under a minute.</p>
              <div>
                <Link href="/book" className="btn btn-gold">
                  Book a Consultation <ArrowRight />
                </Link>
              </div>
            </div>

            <div className="card" style={{ display: "grid", gap: 20 }}>
              <ContactRow Icon={Phone} label="Phone">
                {contact.phone ? <a href={telHref(contact.phone)}>{contact.phone}</a> : <span className="todo">To be added</span>}
              </ContactRow>
              <ContactRow Icon={Mail} label="Email">
                {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span className="todo">To be added</span>}
              </ContactRow>
              {social.instagram ? (
                <ContactRow Icon={Instagram} label="Instagram">
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                    {socialHandle(social.instagram)}
                  </a>
                </ContactRow>
              ) : null}
              <ContactRow Icon={MapPin} label={contact.dealershipName || "Dealership"}>
                {contact.address || <span>{site.location} <span className="todo">(full address to be added)</span></span>}
              </ContactRow>
            </div>

            {mapQuery ? (
              <div style={{ border: "1px solid var(--line)", lineHeight: 0 }}>
                <iframe
                  title={`Map to ${contact.address}`}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  width="100%"
                  height="300"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0, filter: "grayscale(1) invert(0.92) contrast(0.9)" }}
                />
              </div>
            ) : (
              <div className="frame" style={{ aspectRatio: "16 / 9" }} aria-hidden="true">
                <span className="frame-label">Map appears once the address is added</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title">
        <div className="container">
          <SectionHead eyebrow="FAQ" title="Questions, answered" id="faq-title" center />
          <div className="grid grid-3 reveal" style={{ gap: 24 }}>
            {faqs.map((f) => (
              <article key={f.q} className="card gold-hover">
                <h3 className="h3" style={{ fontSize: "1.15rem" }}>{f.q}</h3>
                <p style={{ marginTop: 10 }}>{f.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({
  Icon,
  label,
  children,
}: {
  Icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr)", gap: 14 }}>
      <Icon width={20} height={20} style={{ color: "var(--gold)", marginTop: 4 }} />
      <div>
        <div className="label" style={{ color: "var(--muted)" }}>{label}</div>
        <div style={{ color: "var(--silver-hi)", marginTop: 4 }}>{children}</div>
      </div>
    </div>
  );
}
