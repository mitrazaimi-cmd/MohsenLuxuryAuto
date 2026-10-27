import { BehaviorForm } from "@/components/admin/chatbot-forms";
import { requireAdmin } from "@/lib/auth";
import { CHAT_MODELS } from "@/lib/chat/gemini";
import { store } from "@/lib/db";

export const metadata = { title: "Chatbot behavior" };

export default async function BehaviorPage() {
  await requireAdmin();
  const settings = await store.getChatbotSettings();
  const models = Object.entries(CHAT_MODELS).map(([id, m]) => ({
    id,
    label: m.label,
    price: `$${m.input} / $${m.output} per 1M tokens in / out`,
  }));
  return (
    <>
      <p className="muted" style={{ maxWidth: 820, marginBottom: 24 }}>
        The assistant always answers from the knowledge base, never quotes prices, never uses pressure, and guides
        visitors toward a consultation once it has helped. These settings shape how it does that.
      </p>
      <BehaviorForm settings={settings} models={models} />
    </>
  );
}
