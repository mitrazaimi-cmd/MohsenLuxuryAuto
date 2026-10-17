import { ContentAdmin } from "@/components/admin/content-admin";
import { site } from "@/config/site";

export const metadata = { title: "Portfolio photos" };

export default function PortfolioAdminPage() {
  return (
    <ContentAdmin
      kind="portfolio_items"
      title="Portfolio photos"
      intro="Delivery photos with clients, shown on the Portfolio page. Only post photos the client has agreed to share. JPG, PNG or WebP, under 4 MB."
      fields={[
        { name: "imageUrl", label: "Photo", type: "image", required: true },
        { name: "clientFirstName", label: "Client first name", type: "text", hint: "Optional. First name only." },
        { name: "model", label: "Model", type: "select", options: site.models.filter((m) => m !== "Other / not sure") },
        { name: "caption", label: "Caption", type: "text", hint: "e.g. Another happy delivery. Welcome to the family, Sarah." },
      ]}
      summary={(i) => ({
        heading: String(i.caption || `${i.clientFirstName || "Client"}'s ${i.model || "delivery"}`),
        sub: [i.clientFirstName, i.model].filter(Boolean).join(" · "),
        image: String(i.imageUrl || ""),
      })}
    />
  );
}
