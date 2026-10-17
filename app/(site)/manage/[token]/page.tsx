import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManageBooking } from "@/components/manage-booking";
import { site, telHref } from "@/config/site";
import { bookingLabels } from "@/lib/calendar";
import { store } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage your consultation", robots: { index: false } };

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await store.getBookingByToken(token);
  if (!booking) notFound();

  const changeable = booking.status === "upcoming" && Date.parse(booking.startAt) > Date.now();
  const statusText: Record<string, string> = {
    cancelled: "This consultation has been cancelled.",
    completed: "This consultation has taken place. Thank you!",
    no_show: "This consultation time has passed.",
  };

  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container narrow">
        <span className="eyebrow">Your consultation</span>
        <h1 className="h1" style={{ marginTop: 16 }}>Manage your booking</h1>
        <div className="rule" />

        <div className="summary card gold-top" style={{ marginTop: 40 }}>
          <dl style={{ marginTop: 0 }}>
            <div><dt>Name</dt><dd>{booking.contact.name}</dd></div>
            <div><dt>When</dt><dd>{formatDate(booking.startAt, site.timezone)} at {formatTime(booking.startAt, site.timezone)}</dd></div>
            <div><dt>Meeting</dt><dd>{bookingLabels.meeting[booking.meetingType]}</dd></div>
          </dl>
        </div>

        <div style={{ marginTop: 40 }}>
          {changeable ? (
            <ManageBooking token={token} current={booking.startAt} />
          ) : (
            <div className="notice" role="status">
              {statusText[booking.status] ?? "This consultation time has passed."}{" "}
              <Link href="/book" className="gold">Book a new time</Link>
              {site.contact.phone ? <> or call <a href={telHref(site.contact.phone)} className="gold">{site.contact.phone}</a></> : null}.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
