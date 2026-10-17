import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

// TODO: have this reviewed before launch. It describes what the site actually does.
export default function PrivacyPage() {
  const email = site.contact.email;
  return (
    <>
      <PageHero eyebrow="Privacy" title="Privacy policy">
        Everything disclosed up front, including how your information is used.
      </PageHero>
      <section className="section">
        <div className="container narrow prose">
          <p className="muted">Last updated: October 2026</p>
          <h2>What we collect</h2>
          <p>
            When you book a consultation or send a message, we collect your name, email address, phone number, and
            the details you choose to share, such as the model you are interested in, whether you have a trade-in,
            and any notes.
          </p>
          <h2>How we use it</h2>
          <ul>
            <li>To schedule and prepare for your consultation, and to contact you about it.</li>
            <li>To send a booking confirmation, a reminder the day before, and a short follow-up afterwards.</li>
            <li>
              Only if you opt in: to send occasional news about new models and offers. You can unsubscribe at any
              time with the link in any email.
            </li>
          </ul>
          <h2>Who we share it with</h2>
          <p>
            We never sell your information. We use trusted service providers to run this site: hosting, a secure
            database, a calendar service to schedule your consultation, and an email service to send your
            confirmations. They process data only on our behalf.
          </p>
          <h2>How long we keep it</h2>
          <p>We keep your details while we have a client relationship with you, or until you ask us to delete them.</p>
          <h2>Your choices</h2>
          <p>
            You can ask to see, correct or delete your information at any time
            {email ? (
              <>
                {" "}by emailing <a className="gold" href={`mailto:${email}`}>{email}</a>
              </>
            ) : (
              " by contacting us through the contact page"
            )}
            .
          </p>
        </div>
      </section>
    </>
  );
}
