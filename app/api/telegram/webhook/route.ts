import { after } from "next/server";
import { handleTelegramUpdate } from "@/lib/chat/telegram-bot";
import { integrations } from "@/lib/env";
import type { TelegramUpdate } from "@/lib/telegram";
import { safeEqual } from "@/lib/tokens";

// Telegram calls this for every message to the bot (registered from Admin →
// Chatbot → Channels). It answers 200 at once and replies in the background.

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!integrations.telegram) return new Response("Not configured", { status: 404 });
  const secret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeEqual(secret, process.env.TELEGRAM_WEBHOOK_SECRET!)) return new Response("Forbidden", { status: 403 });
  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  if (update) after(() => handleTelegramUpdate(update).catch((err) => console.error("[telegram] update failed:", err)));
  return Response.json({ ok: true });
}
