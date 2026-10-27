import { after } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { overDailyCap, runTurn } from "@/lib/chat/agent";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";
import { ensureSiteSynced } from "@/lib/kb/ingest";
import { rateLimit } from "@/lib/rate-limit";
import { newToken, safeEqual } from "@/lib/tokens";

// Website chat (widget and /chat page). Replies as server-sent events:
// "session" (conversation id + token), "status", "slots", "booked", then "reply".

export const maxDuration = 60;

const body = z.object({
  id: z.string().uuid().optional(),
  token: z.string().max(100).optional(),
  message: z.string().trim().min(1).max(1000),
  page: z.string().max(300).default(""),
  channel: z.enum(["web", "page", "playground"]).default("web"),
});

const MAX_MESSAGES_PER_CONVERSATION = 120;

function sse(events: { event: string; data: unknown }[]) {
  return new Response(events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join(""), {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const reply = (text: string) => sse([{ event: "reply", data: { text } }]);

export async function POST(req: Request) {
  if (!integrations.gemini) return Response.json({ error: "The assistant is not configured." }, { status: 503 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please write a message (up to 1000 characters)." }, { status: 400 });
  const { id, token, message, page, channel } = parsed.data;

  const bot = await store.getChatbotSettings();
  // The admin playground works even while the public channels are switched off.
  if (channel === "playground") {
    if (!(await getAdmin())) return Response.json({ error: "Please sign in to the admin panel." }, { status: 401 });
  } else if (!bot.enabled || (channel === "web" ? !bot.widgetEnabled : !bot.pageEnabled)) {
    return Response.json({ error: "The assistant is offline right now." }, { status: 503 });
  }
  if (!(await rateLimit("chat", 20, 5 * 60_000))) {
    return reply("You're sending messages faster than I can keep up. Please wait a minute and try again.");
  }
  if (await overDailyCap(bot)) {
    return reply("I'm not available for the rest of today. Please call Mohsen directly, or book a consultation on the booking page.");
  }

  let conversation = id ? await store.getConversation(id) : null;
  if (!conversation || conversation.channel === "telegram" || !token || !safeEqual(conversation.externalId, token)) {
    conversation = await store.createConversation({ channel, externalId: newToken(), pageUrl: page });
  } else if (page && page !== conversation.pageUrl) {
    conversation = await store.updateConversation(conversation.id, { pageUrl: page });
  }
  if (conversation.messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
    return reply("This conversation has reached its length limit. Please start a new chat, or call Mohsen directly.");
  }
  // Re-index the website once per deploy, after this response.
  after(() => ensureSiteSynced().catch((err) => console.error("[kb] site sync failed:", err)));

  const session = { id: conversation.id, token: conversation.externalId };
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      send("session", session);
      const result = await runTurn({ conversation: conversation!, channel, userText: message, emit: (e) => send(e.type, e) });
      send("reply", { text: result.text });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
