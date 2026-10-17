import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main id="main">
    <section className="section" style={{ paddingTop: 120, textAlign: "center" }}>
      <div className="container narrow">
        <span className="eyebrow">Page not found</span>
        <h1 className="h1" style={{ marginTop: 16 }}>This road doesn&apos;t go anywhere</h1>
        <div className="rule" style={{ margin: "24px auto 0" }} />
        <p className="lede" style={{ marginTop: 24 }}>The page you were looking for has moved or no longer exists.</p>
        <div className="actions" style={{ justifyContent: "center", marginTop: 36 }}>
          <Link href="/" className="btn btn-outline">Home</Link>
          <Link href="/book" className="btn btn-gold">Book a Consultation <ArrowRight /></Link>
        </div>
      </div>
    </section>
    </main>
    <SiteFooter />
    </>
  );
}
