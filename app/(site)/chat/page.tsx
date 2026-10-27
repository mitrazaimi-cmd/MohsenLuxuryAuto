import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ArrowRight } from "@/components/icons";
import { site } from "@/config/site";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

export const metadata: Metadata = {
  title: "Ask Mohsen's Assistant",
  description: "Questions about Mercedes-Benz models, leasing or financing? Ask Mohsen's assistant, and book a consultation when you're ready.",
};

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  if (!integrations.gemini) notFound();
  const bot = await store.getChatbotSettings().catch(() => null);
  if (!bot?.enabled || !bot.pageEnabled) notFound();

  return (
    <section className="section chat-page">
      <div className="container">
        <div className="section-head center">
          <span className="eyebrow gold-title">Ask anything</span>
          <h1 className="h2">{bot.assistantName}</h1>
          <div className="rule" />
          <div className="lede" style={{ marginTop: 24 }}>
            Models, leasing and financing, trade-ins, or how a consultation works. Answers come from Mohsen&apos;s
            own guidance, and you can book a time right here.
          </div>
        </div>
        <div className="chat-page-panel">
          <ChatPanel
            channel="page"
            autoFocus={false}
            config={{ assistantName: bot.assistantName, welcomeMessage: bot.welcomeMessage, starterQuestions: bot.starterQuestions }}
          />
        </div>
        <p className="muted" style={{ textAlign: "center", marginTop: 28 }}>
          Prefer a person? Call {site.contact.phone} or{" "}
          <Link href="/book" className="gold">
            book directly <ArrowRight width={14} height={14} style={{ display: "inline", verticalAlign: "-2px" }} />
          </Link>
        </p>
      </div>
    </section>
  );
}
