import { ChatbotTabs } from "@/components/admin/chatbot-tabs";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

export const metadata = { title: "Chatbot" };

export default async function ChatbotLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  // On Supabase the chatbot tables come from 0002_chatbot.sql; say so instead of crashing.
  const ready = await store.getChatbotSettings().then(
    () => true,
    () => false,
  );

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Chatbot</h1>
        </div>
      </div>
      <ChatbotTabs />
      {!integrations.gemini ? (
        <p className="mode-banner">
          The assistant needs a Gemini API key: add GEMINI_API_KEY (Google AI Studio) to the environment. Until then
          the chat button stays hidden on the website.
        </p>
      ) : null}
      {ready ? (
        children
      ) : (
        <div className="notice error-notice">
          The chatbot tables aren&apos;t in the database yet. Run <code>supabase/migrations/0002_chatbot.sql</code> in
          the Supabase SQL editor, then reload this page.
        </div>
      )}
    </>
  );
}
