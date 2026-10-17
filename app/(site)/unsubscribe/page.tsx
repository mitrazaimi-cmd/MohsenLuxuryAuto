import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeAction } from "@/actions/unsubscribe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };

// Two-step on purpose: email scanners that prefetch links must not unsubscribe people.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;
  return (
    <section className="section" style={{ paddingTop: 88 }}>
      <div className="container narrow" style={{ textAlign: "center" }}>
        <span className="eyebrow">Email preferences</span>
        <h1 className="h1" style={{ marginTop: 16 }}>{done ? "You're unsubscribed" : "Unsubscribe"}</h1>
        <div className="rule" style={{ margin: "24px auto 0" }} />
        {done ? (
          <p className="lede" style={{ marginTop: 24 }}>
            You will no longer receive news and offers. Emails about a consultation you book will still arrive.
          </p>
        ) : token ? (
          <form action={unsubscribeAction} style={{ marginTop: 32 }}>
            <input type="hidden" name="token" value={token} />
            <p className="lede">Stop receiving news and offers from {"Mohsen Luxury Auto"}?</p>
            <div className="actions" style={{ justifyContent: "center", marginTop: 28 }}>
              <button type="submit" className="btn btn-gold">Unsubscribe</button>
              <Link href="/" className="btn btn-outline">Keep me subscribed</Link>
            </div>
          </form>
        ) : (
          <p className="lede" style={{ marginTop: 24 }}>Please use the link in one of our emails.</p>
        )}
      </div>
    </section>
  );
}
