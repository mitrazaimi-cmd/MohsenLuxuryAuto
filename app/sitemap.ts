import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/portfolio", "/about", "/contact", "/book", "/privacy"];
  return pages.map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "/portfolio" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/book" ? 0.9 : 0.7,
  }));
}
