import Image from "next/image";
import Link from "next/link";
import { site, telHref } from "@/config/site";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "./icons";

export function SiteFooter() {
  const { contact, social } = site;
  const socials = [
    { href: social.instagram, label: "Instagram", Icon: Instagram },
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: social.facebook, label: "Facebook", Icon: Facebook },
  ].filter((s) => s.href);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Image className="footer-logo" src="/brand/logo.png" alt="Mohsen Luxury Auto" width={1774} height={887} sizes="220px" />
            <p className="muted" style={{ marginTop: 20, maxWidth: 360 }}>
              {site.descriptor}. Master Certified, with 20 years in luxury automotive sales. {site.location}.
            </p>
            {socials.length ? (
              <div className="actions" style={{ marginTop: 20, gap: 10 }}>
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} className="icon-btn" aria-label={label} target="_blank" rel="noopener noreferrer">
                    <Icon />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <h2>Explore</h2>
            <ul>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/about">About Me</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/book" className="gold">Book a Consultation</Link></li>
            </ul>
          </div>
          <div>
            <h2>Get in touch</h2>
            <ul>
              {contact.phone ? (
                <li><a href={telHref(contact.phone)} style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><Phone width={16} height={16} /> {contact.phone}</a></li>
              ) : null}
              {contact.email ? (
                <li><a href={`mailto:${contact.email}`} style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><Mail width={16} height={16} /> {contact.email}</a></li>
              ) : null}
              <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <MapPin width={16} height={16} style={{ marginTop: 6, flexShrink: 0 }} />
                <span>{contact.address || site.location}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}. {site.slogan}.
          </span>
          <a className="credit nowrap" href={`mailto:${site.credit.email}`}>
            Designed &amp; developed by {site.credit.name}
          </a>
          <span>
            <Link href="/privacy">Privacy</Link>
            <span aria-hidden="true"> &nbsp;·&nbsp; </span>
            Mercedes-Benz and model names are trademarks of Mercedes-Benz Group AG.
          </span>
        </div>
      </div>
    </footer>
  );
}
