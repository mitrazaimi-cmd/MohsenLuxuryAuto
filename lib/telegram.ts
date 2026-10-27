import "server-only";
import { integrations } from "@/lib/env";

// Telegram Bot API over plain HTTPS. The bot token comes from @BotFather.

type InlineKeyboard = { text: string; callback_data: string }[][];

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { first_name?: string; last_name?: string; username?: string };
    text?: string;
    contact?: { phone_number: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number } };
  };
}

export async function telegram<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result;
}

/** Sends text in chunks under Telegram's 4096-character limit; buttons go on the last chunk. */
export async function sendTelegram(
  chatId: string | number,
  text: string,
  opts: { buttons?: InlineKeyboard; askPhone?: boolean } = {},
) {
  if (!integrations.telegram) return;
  const parts = text.match(/[\s\S]{1,3900}(?=\s|$)|[\s\S]{1,3900}/g) ?? [text];
  for (const [i, part] of parts.entries()) {
    const last = i === parts.length - 1;
    let reply_markup: Record<string, unknown> | undefined;
    if (last && opts.buttons?.length) reply_markup = { inline_keyboard: opts.buttons };
    else if (last && opts.askPhone) {
      reply_markup = {
        keyboard: [[{ text: "Share my phone number", request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true,
      };
    }
    await telegram("sendMessage", { chat_id: chatId, text: part, reply_markup, link_preview_options: { is_disabled: true } });
  }
}

export async function setTelegramWebhook(url: string) {
  return telegram("setWebhook", {
    url,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function telegramWebhookInfo() {
  return telegram<{ url: string; pending_update_count: number; last_error_message?: string }>("getWebhookInfo", {});
}

export async function telegramBotName() {
  return (await telegram<{ username: string }>("getMe", {})).username;
}
