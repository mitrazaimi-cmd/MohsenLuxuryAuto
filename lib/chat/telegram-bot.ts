import "server-only";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";
import { sendTelegram, telegram, type TelegramUpdate } from "@/lib/telegram";
import { overDailyCap, runTurn } from "./agent";
import { slotLabel, type Slot } from "./tools";

// Telegram channel: each Telegram chat is one conversation. Times come back as
// inline buttons ("slot:<iso>"), and visitors can share their phone with one tap.

/** Telegram shows plain text: turn the assistant's light Markdown into readable text. */
function plain(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\((\S+?)\)/g, "$1 ($2)")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const bot = await store.getChatbotSettings();
  let chatId: number | undefined;
  let text = "";

  if (update.callback_query) {
    const q = update.callback_query;
    chatId = q.message?.chat.id;
    await telegram("answerCallbackQuery", { callback_query_id: q.id }).catch(() => {});
    if (q.data?.startsWith("slot:")) text = `I'd like ${slotLabel(q.data.slice(5))}.`;
  } else if (update.message) {
    const m = update.message;
    chatId = m.chat.id;
    if (m.chat.type !== "private") return; // groups aren't supported
    if (m.contact) text = `My phone number is ${m.contact.phone_number}.`;
    else text = (m.text ?? "").trim();

    if (text.startsWith("/start")) {
      const code = text.slice(6).trim();
      if (code && bot.telegramLinkCode && code === bot.telegramLinkCode) {
        await store.saveChatbotSettings({ ...bot, telegramAdminChatId: String(chatId), telegramLinkCode: "" });
        await sendTelegram(chatId, "Connected. Chatbot alerts (new leads, and visitors asking for you) will arrive here.");
        return;
      }
      await sendTelegram(chatId, plain(bot.welcomeMessage));
      return;
    }
  }
  if (!chatId || !text) return;

  if (!integrations.gemini || !bot.enabled || !bot.telegramEnabled) {
    await sendTelegram(chatId, "The assistant is offline right now. Please call Mohsen directly.");
    return;
  }
  if (await overDailyCap(bot)) {
    await sendTelegram(chatId, "I'm not available for the rest of today. Please call Mohsen directly.");
    return;
  }

  const externalId = String(chatId);
  const conversation =
    (await store.findConversation("telegram", externalId)) ??
    (await store.createConversation({ channel: "telegram", externalId, pageUrl: "" }));

  await telegram("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});
  let slots: Slot[] = [];
  const result = await runTurn({
    conversation,
    channel: "telegram",
    userText: text.slice(0, 1000),
    emit: (e) => {
      if (e.type === "slots") slots = e.slots;
    },
  });

  const reply = plain(result.text);
  const booked = result.events.some((e) => e.type === "booked");
  const askPhone = bot.requirePhone && !result.conversation.visitorPhone && /phone/i.test(reply) && !slots.length;
  await sendTelegram(chatId, reply, {
    buttons: booked ? undefined : slots.map((s) => [{ text: s.label, callback_data: `slot:${s.startAt}` }]),
    askPhone,
  });
}
