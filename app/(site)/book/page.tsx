import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Consultation",
  alternates: { canonical: "/book" },
  description: "Choose a time for a purchase or leasing consultation with Mohsen, Master Certified Mercedes-Benz sales specialist.",
};

export default async function BookPage() {
  const settings = await store.getSettings();
  return (
    <section className="section" style={{ paddingTop: 72 }}>
      <div className="container">
        <div className="section-head" style={{ marginBottom: 48 }}>
          <span className="eyebrow">Book a consultation</span>
          <h1 className="h1" style={{ marginTop: 16 }}>Purchase &amp; leasing consultation</h1>
          <div className="rule" />
          <p className="lede" style={{ marginTop: 24 }}>
            Pick a time that suits you. You will get an instant confirmation, and Mohsen will have everything ready.
          </p>
        </div>
        <BookingFlow slotMinutes={settings.slotMinutes} emailsEnabled={integrations.resend} />
      </div>
    </section>
  );
}
