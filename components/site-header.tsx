"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site, telHref } from "@/config/site";
import { Phone } from "./icons";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Me" },
  { href: "/contact", label: "Contact" },
];

// On phones and tablets the nav drops to its own row under the logo (always visible, no
// hamburger), and a call button takes the menu button's place: "always one call away".
export function SiteHeader() {
  const pathname = usePathname();
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);
  const phone = site.contact.phone;

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand-link" aria-label="Mohsen Luxury Auto, home">
          <Image src="/brand/logo-header.png" alt="" width={800} height={300} priority sizes="140px" />
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-cta">
          <Link href="/book" className="btn btn-gold btn-sm">
            Book<span className="long">&nbsp;a Consultation</span>
          </Link>
          {phone ? (
            <a href={telHref(phone)} className="call-btn" aria-label={`Call Mohsen at ${phone}`}>
              <Phone />
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
