import { RevealObserver } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fullName, site } from "@/config/site";

function jsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.name,
    slogan: site.slogan,
    description: `${site.descriptor}. Master Certified, 20 years with Mercedes-Benz.`,
    url: site.url,
    image: `${site.url}/brand/logo.png`,
    areaServed: site.location,
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.address ? { address: site.contact.address } : {}),
    knowsLanguage: site.person.languages.map((l) => l.replace("Some ", "")),
    employee: { "@type": "Person", name: fullName(), jobTitle: site.person.title },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
    </>
  );
}
