import { ChatWidget } from "@/components/chat/chat-widget";
import { RevealObserver } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fullName, site } from "@/config/site";

function jsonLd() {
  const { contact, social } = site;
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName(),
    jobTitle: site.person.title,
    description: `${site.descriptor}. Master Certified, 20 years in luxury automotive sales. ${site.slogan}.`,
    url: site.url,
    image: `${site.url}/images/mohsen-portrait.webp`,
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    knowsLanguage: site.person.languages.map((l) => l.replace("Some ", "")),
    sameAs: [social.linkedin, social.instagram, social.facebook].filter(Boolean),
    brand: { "@type": "Brand", name: site.name, slogan: site.slogan, logo: `${site.url}/brand/logo.png` },
    ...(contact.dealershipName
      ? {
          worksFor: {
            "@type": "AutoDealer",
            name: contact.dealershipName,
            address: {
              "@type": "PostalAddress",
              streetAddress: contact.addressParts.street,
              addressLocality: contact.addressParts.city,
              addressRegion: contact.addressParts.region,
              postalCode: contact.addressParts.postalCode,
              addressCountry: "US",
            },
          },
        }
      : {}),
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
      <ChatWidget />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
    </>
  );
}
