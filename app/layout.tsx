import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-cinzel", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.descriptor}, ${site.location}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Buy or lease your Mercedes-Benz with a Master Certified specialist with 20 years of experience. Everything disclosed up front, every detail handled, and always one call away. Book a consultation.",
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${montserrat.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Enables the scroll-reveal hidden state only when JS runs. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
