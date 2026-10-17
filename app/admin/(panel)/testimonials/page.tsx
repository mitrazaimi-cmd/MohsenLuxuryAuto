import { ContentAdmin } from "@/components/admin/content-admin";

export const metadata = { title: "Testimonials" };

export default function TestimonialsAdminPage() {
  return (
    <ContentAdmin
      kind="testimonials"
      title="Testimonials"
      intro="Real words from real clients, shown on the Home and Portfolio pages. The first one is featured."
      fields={[
        { name: "quote", label: "What the client said", type: "textarea", required: true },
        { name: "clientName", label: "Client name", type: "text", hint: "As they agreed to be named, e.g. James R." },
        { name: "model", label: "Model", type: "text", hint: "Optional, e.g. GLE 450" },
      ]}
      summary={(i) => ({ heading: `“${String(i.quote).slice(0, 110)}${String(i.quote).length > 110 ? "…" : ""}”`, sub: [i.clientName, i.model].filter(Boolean).join(" · ") })}
    />
  );
}
