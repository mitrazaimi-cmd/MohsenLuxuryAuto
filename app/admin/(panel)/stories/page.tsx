import { ContentAdmin } from "@/components/admin/content-admin";
import { site } from "@/config/site";

export const metadata = { title: "Client stories" };

export default function StoriesAdminPage() {
  return (
    <ContentAdmin
      kind="client_stories"
      title="Client stories"
      intro="Short stories for the Portfolio page: what the client needed, what you recommended, and how it turned out."
      fields={[
        { name: "title", label: "Title", type: "text", required: true, hint: "e.g. A fleet of three GLEs for a growing practice" },
        { name: "clientFirstName", label: "Client first name", type: "text" },
        { name: "model", label: "Model", type: "select", options: site.models.filter((m) => m !== "Other / not sure") },
        { name: "need", label: "The need", type: "textarea" },
        { name: "recommendation", label: "The recommendation", type: "textarea" },
        { name: "result", label: "The result", type: "textarea" },
        { name: "imageUrl", label: "Photo (optional)", type: "image" },
      ]}
      summary={(i) => ({ heading: String(i.title), sub: [i.clientFirstName, i.model].filter(Boolean).join(" · "), image: String(i.imageUrl || "") || undefined })}
    />
  );
}
