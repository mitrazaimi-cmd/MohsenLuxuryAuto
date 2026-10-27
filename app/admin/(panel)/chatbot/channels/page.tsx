import {
  connectTelegramAction,
  newTelegramLinkCodeAction,
  testTelegramAlertAction,
  unlinkTelegramAction,
} from "@/actions/chatbot";
import { ChannelsForm } from "@/components/admin/chatbot-forms";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { integrations, siteUrl } from "@/lib/env";
import { telegramBotName, telegramWebhookInfo } from "@/lib/telegram";

export const metadata = { title: "Chatbot channels" };

const TG_NOTICE: Record<string, [boolean, string]> = {
  connected: [true, "Telegram is connected: messages to the bot now reach the assistant."],
  failed: [false, "Telegram didn't accept the connection. Check TELEGRAM_BOT_TOKEN and that the site is public (https)."],
  missing: [false, "Add TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET to the environment first."],
  sent: [true, "Test alert sent. Check Telegram."],
  "test-failed": [false, "The test alert couldn't be sent. Link your Telegram again."],
};

export default async function ChannelsPage({ searchParams }: { searchParams: Promise<{ tg?: string }> }) {
  await requireAdmin();
  const tg = (await searchParams).tg ?? "";
  const settings = await store.getChatbotSettings();
  const webhookUrl = `${siteUrl()}/api/telegram/webhook`;

  let botName = "";
  let webhook: Awaited<ReturnType<typeof telegramWebhookInfo>> | null = null;
  if (integrations.telegram) {
    [botName, webhook] = await Promise.all([
      telegramBotName().catch(() => ""),
      telegramWebhookInfo().catch(() => null),
    ]);
  }
  const connected = webhook?.url === webhookUrl;
  const notice = TG_NOTICE[tg];

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <ChannelsForm settings={settings} />

      <section className="card" aria-labelledby="tg-title" style={{ maxWidth: 820 }}>
        <h2 id="tg-title" className="h3" style={{ marginTop: 0 }}>Telegram</h2>
        {notice ? (
          <div className={`notice ${notice[0] ? "ok-notice" : "error-notice"}`} role="status" style={{ marginTop: 14 }}>
            {notice[1]}
          </div>
        ) : null}
        {!integrations.telegram ? (
          <ol className="muted" style={{ marginTop: 14, paddingLeft: 18, display: "grid", gap: 6 }}>
            <li>In Telegram, open @BotFather, send /newbot, and choose a name (e.g. Mohsen Luxury Auto).</li>
            <li>Copy the token it gives you into TELEGRAM_BOT_TOKEN, and set TELEGRAM_WEBHOOK_SECRET to any long random text.</li>
            <li>Redeploy, then come back here and press &quot;Connect&quot;.</li>
          </ol>
        ) : (
          <div style={{ display: "grid", gap: 18, marginTop: 14 }}>
            <div>
              <div>
                Bot: {botName ? <a className="gold" href={`https://t.me/${botName}`} target="_blank" rel="noopener noreferrer">@{botName}</a> : "unknown (check the token)"}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {connected ? "Connected to this website." : "Not connected to this website yet."}
                {webhook?.last_error_message ? ` Last error: ${webhook.last_error_message}` : ""}
              </div>
              <form action={connectTelegramAction} style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-outline btn-sm">{connected ? "Reconnect" : "Connect"}</button>
              </form>
              {!settings.telegramEnabled ? (
                <p className="muted" style={{ fontSize: "0.82rem", marginTop: 8 }}>Also tick &quot;Telegram bot&quot; above so it answers visitors.</p>
              ) : null}
            </div>

            <div>
              <div style={{ color: "var(--silver-hi)" }}>Alerts for Mohsen</div>
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                New leads and visitors asking for you arrive in your own Telegram, as well as by email.
              </p>
              {settings.telegramAdminChatId ? (
                <div className="inline-form" style={{ gap: 8, marginTop: 10 }}>
                  <span style={{ color: "var(--ok)" }}>Linked</span>
                  <form action={testTelegramAlertAction}>
                    <button type="submit" className="btn btn-outline btn-sm">Send a test alert</button>
                  </form>
                  <form action={unlinkTelegramAction}>
                    <button type="submit" className="btn btn-ghost btn-sm">Unlink</button>
                  </form>
                </div>
              ) : settings.telegramLinkCode && botName ? (
                <p style={{ marginTop: 10 }}>
                  On the phone where Mohsen uses Telegram, open{" "}
                  <a className="gold" href={`https://t.me/${botName}?start=${settings.telegramLinkCode}`} target="_blank" rel="noopener noreferrer">
                    t.me/{botName}?start=…
                  </a>{" "}
                  and press Start. Then reload this page.
                </p>
              ) : (
                <form action={newTelegramLinkCodeAction} style={{ marginTop: 10 }}>
                  <button type="submit" className="btn btn-outline btn-sm">Link my Telegram</button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
