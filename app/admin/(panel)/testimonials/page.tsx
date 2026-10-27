import { ContentAdmin } from "@/components/admin/content-admin";

export const metadata = { title: "Testimonials" };

export default function TestimonialsAdminPage() {
  return (
    <ContentAdmin
      kind="testimonials"
      title="Testimonials"
      intro="Real words from real clients, shown on the Home and Portfolio pages. With a photo, the words sit beside it; without one, they're centered like a letter."
      fields={[
        { name: "quote", label: "What the client said", type: "textarea", required: true, hint: "Leave an empty line between paragraphs." },
        { name: "clientName", label: "Client name", type: "text", hint: "As they agreed to be named, e.g. James R." },
        { name: "model", label: "Model", type: "text", hint: "Optional, e.g. GLE 450" },
        { name: "imageUrl", label: "Photo", type: "image", hint: "Optional, e.g. the delivery day, with the client's permission. Under 4 MB." },
      ]}
      summary={(i) => ({ heading: `“${String(i.quote).slice(0, 110)}${String(i.quote).length > 110 ? "…" : ""}”`, sub: [i.clientName, i.model].filter(Boolean).join(" · ") })}
    />
  );
}
