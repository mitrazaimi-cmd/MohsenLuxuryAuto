import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Check } from "@/components/icons";
import { site } from "@/config/site";
import { bookingLabels } from "@/lib/calendar";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";
import { formatDate, formatTime } from "@/lib/time";

// Until Resend is set up no emails go out, so the page must not promise any.
const confirmBy = { phone: "by phone", email: "by email", text: "by text message" } as const;

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consultation confirmed", robots: { index: false } };

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b: token } = await searchParams;
  const booking = token ? await store.getBookingByToken(token) : null;
  if (!booking) notFound();

  const first = booking.contact.name.split(/\s+/)[0];
  const emails = integrations.resend;
  const by = confirmBy[booking.contactMethod];
  const where =
    booking.meetingType === "in_person"
      ? site.contact.address || `The dealership, ${site.location}`
      : booking.meetingType === "phone"
        ? `Mohsen will call you at ${booking.contact.phone}`
        : emails
          ? "A video link will be sent to your email"
          : "Mohsen will send you the video link";
  const steps = emails
    ? [
        ["Confirmation", "You'll receive an email with the details and a calendar invite."],
        ["A reminder", "The day before, a short reminder with anything useful to bring."],
      ]
    : [
        ["Mohsen confirms", `He will reach you ${by} to confirm the details.`],
        ["Save the date", "Add the consultation to your calendar with the button above, and keep this page in case you need to reschedule."],
      ];

  return (
    <section className="section" style={{ paddingTop: 88 }}>
      <div className="container narrow" style={{ textAlign: "center" }}>
        <div
          aria-hidden="true"
          style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid var(--gold)", display: "grid", placeItems: "center", margin: "0 auto 28px", color: "var(--gold)" }}
        >
          <Check width={28} height={28} />
        </div>
        <span className="eyebrow">Consultation confirmed</span>
        <h1 className="h1" style={{ marginTop: 16 }}>Thank you, {first}</h1>
        <div className="rule" style={{ margin: "24px auto 0" }} />
        <p className="lede" style={{ marginTop: 24 }}>
          {emails ? (
            <>A confirmation is on its way to <strong>{booking.contact.email}</strong>. Mohsen will have everything ready.</>
          ) : (
            <>Your time is reserved. Mohsen will personally confirm {by}, and he will have everything ready.</>
          )}
        </p>

        <div className="summary card gold-top" style={{ textAlign: "left", marginTop: 48 }}>
          <dl style={{ marginTop: 0 }}>
            <div><dt>Date</dt><dd>{formatDate(booking.startAt, site.timezone)}</dd></div>
            <div><dt>Time</dt><dd>{formatTime(booking.startAt, site.timezone)}</dd></div>
            <div><dt>Meeting</dt><dd>{bookingLabels.meeting[booking.meetingType]}: {where}</dd></div>
            {booking.modelInterest ? <div><dt>Interested in</dt><dd>{booking.modelInterest}</dd></div> : null}
          </dl>
        </div>

        <div className="actions" style={{ justifyContent: "center", marginTop: 36 }}>
          <a href={`/api/ics/${encodeURIComponent(booking.manageToken)}`} className="btn btn-gold">
            <Calendar /> Add to my calendar
          </a>
          <Link href={`/manage/${encodeURIComponent(booking.manageToken)}`} className="btn btn-outline">
            Reschedule or cancel
          </Link>
        </div>

        <div style={{ marginTop: 64, textAlign: "left" }}>
          <h2 className="h3">What happens next</h2>
          <ol className="steps" style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
            {[
              ...steps,
              ["Your consultation", "A relaxed conversation, the right models, and clear numbers. No pressure."],
            ].map(([t, d], i) => (
              <li key={t} className="step">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h3" style={{ fontSize: "1rem" }}>{t}</h3>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
