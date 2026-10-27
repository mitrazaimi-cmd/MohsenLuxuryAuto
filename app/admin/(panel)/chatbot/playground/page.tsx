import { ChatPanel } from "@/components/chat/chat-panel";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";

export const metadata = { title: "Chatbot playground" };

export default async function PlaygroundPage() {
  await requireAdmin();
  const bot = await store.getChatbotSettings();
  return (
    <>
      <p className="muted" style={{ maxWidth: 760, marginBottom: 20 }}>
        Talk to the assistant with the current settings and knowledge, even while it&apos;s switched off for visitors.
        Test mode: bookings aren&apos;t saved and Mohsen isn&apos;t alerted. Test chats appear in Conversations under
        &quot;Playground&quot;.
      </p>
      <div className="chat-page-panel" style={{ margin: 0 }}>
        <ChatPanel
          channel="playground"
          autoFocus={false}
          config={{ assistantName: bot.assistantName, welcomeMessage: bot.welcomeMessage, starterQuestions: bot.starterQuestions }}
        />
      </div>
    </>
  );
}
