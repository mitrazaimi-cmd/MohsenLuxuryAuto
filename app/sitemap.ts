import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // /portfolio is left out while it only repeats the homepage reviews (no delivery photos or stories yet).
  const pages = ["", "/services", "/about", "/contact", "/book", "/privacy"];
  return pages.map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/book" ? 0.9 : 0.7,
  }));
}
