import "server-only";
import type { Interactions } from "@google/genai";
import { site } from "@/config/site";
import { store, type ChatChannel, type ChatConversation, type ChatbotSettings } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { addDays, dateKey, zonedToUtc } from "@/lib/time";
import { chatModel, costUsd, gemini } from "./gemini";
import { systemInstruction, turnContext } from "./prompt";
import { runTool, TOOLS, type ToolContext, type TurnEvent } from "./tools";

// One visitor message → one assistant reply. Gemini runs stateless (store: false):
// every turn resends the stored steps, thoughts and their signatures included, so
// the model keeps its reasoning across turns and the conversation lives in our DB.

const MAX_ROUNDS = 6; // model calls per turn; the last one may not call tools
const HISTORY_MESSAGES = 30;

export interface TurnResult {
  text: string;
  events: TurnEvent[];
  conversation: ChatConversation;
}

const fallbackText = () =>
  `I'm sorry, I couldn't answer just now. You can reach Mohsen directly at ${site.contact.phone}, or book a consultation at ${siteUrl()}/book.`;

/** Steps the model added this call. Skips anything echoed back from the input, if the API includes it. */
function newSteps(steps: Interactions.Step[]) {
  let start = 0;
  steps.forEach((s, i) => {
    if (s.type === "user_input" || s.type === "function_result") start = i + 1;
  });
  return steps.slice(start);
}

function outputText(steps: Interactions.Step[]) {
  return steps
    .filter((s): s is Interactions.ModelOutputStep => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("")
    .trim();
}

/** True when today's visitor messages (Eastern Time) reached the cap in Behavior settings. */
export async function overDailyCap(bot: ChatbotSettings) {
  const start = zonedToUtc(dateKey(new Date(), site.timezone), "00:00", site.timezone).toISOString();
  return (await store.countUserMessagesSince(start)) >= bot.dailyMessageCap;
}

export async function runTurn(opts: {
  conversation: ChatConversation;
  channel: ChatChannel;
  userText: string;
  emit?: (e: TurnEvent) => void;
}): Promise<TurnResult> {
  const [bot, booking, past] = await Promise.all([
    store.getChatbotSettings(),
    store.getSettings(),
    store.listChatMessages(opts.conversation.id, { last: HISTORY_MESSAGES }),
  ]);
  const model = chatModel(bot.model);

  // History must start at a visitor message.
  const firstUser = past.findIndex((m) => m.role === "user");
  const history = (firstUser < 0 ? [] : past.slice(firstUser)).flatMap((m) => m.steps as Interactions.Step[]);
  const answersSoFar = past.filter((m) => m.role === "assistant").length;
  const userStep: Interactions.Step = { type: "user_input", content: [{ type: "text", text: opts.userText }] };

  const events: TurnEvent[] = [];
  const ctx: ToolContext = {
    conversation: opts.conversation,
    channel: opts.channel,
    bot,
    emit: (e) => {
      events.push(e);
      opts.emit?.(e);
    },
    sources: new Set(),
    unanswered: false,
  };
  const system = `${systemInstruction(bot, booking)}\n${turnContext(opts.conversation, opts.channel, answersSoFar)}`;

  const input: Interactions.Step[] = [...history, userStep];
  let turnSteps: Interactions.Step[] = [];
  const toolsUsed = new Set<string>();
  let inputTokens = 0;
  let outputTokens = 0;
  let text = "";

  try {
    for (let round = 0; round < MAX_ROUNDS && !text; round++) {
      const res = await gemini().interactions.create({
        model,
        system_instruction: system,
        input,
        tools: TOOLS,
        generation_config: {
          thinking_level: bot.thinkingLevel,
          max_output_tokens: 4096, // includes thinking tokens
          tool_choice: round === MAX_ROUNDS - 1 ? "none" : "auto",
        },
        store: false,
        stream: false,
      });
      inputTokens += res.usage?.total_input_tokens ?? 0;
      outputTokens += (res.usage?.total_output_tokens ?? 0) + (res.usage?.total_thought_tokens ?? 0);
      const out = newSteps(res.steps ?? []);
      input.push(...out);
      turnSteps.push(...out);

      const calls = out.filter((s): s is Interactions.FunctionCallStep => s.type === "function_call");
      if (!calls.length) {
        text = outputText(out) || res.output_text?.trim() || "";
        if (!text) throw new Error(`Empty reply (status ${res.status})`);
        break;
      }
      // One at a time: booking and lead tools update the conversation the next tool reads.
      const results: Interactions.FunctionResultStep[] = [];
      for (const call of calls) {
        toolsUsed.add(call.name);
        const result = await runTool(call.name, call.arguments ?? {}, ctx).catch((err) => {
          console.error(`[chat] tool ${call.name} failed:`, err);
          return "The tool failed. Apologize briefly and offer Mohsen's phone number instead.";
        });
        results.push({ type: "function_result", call_id: call.id, name: call.name, result });
      }
      input.push(...results);
      turnSteps.push(...results);
    }
  } catch (err) {
    console.error("[chat] turn failed:", err);
    text = "";
  }

  if (!text) {
    text = fallbackText();
    // Keep the stored history well-formed: no dangling tool calls, and a reply after the question.
    turnSteps = [{ type: "model_output", content: [{ type: "text", text }] }];
  }

  const cost = costUsd(model, inputTokens, outputTokens);
  await store.addChatMessages([
    {
      conversationId: opts.conversation.id,
      role: "user",
      text: opts.userText,
      steps: [userStep],
      meta: { unanswered: ctx.unanswered || undefined },
    },
    {
      conversationId: opts.conversation.id,
      role: "assistant",
      text,
      steps: turnSteps,
      meta: {
        tools: [...toolsUsed],
        sources: [...ctx.sources],
        inputTokens,
        outputTokens,
        costUsd: cost,
        model,
      },
    },
  ]);
  const conversation = await store.updateConversation(opts.conversation.id, {
    messageCount: ctx.conversation.messageCount + 2,
    costUsd: Number(ctx.conversation.costUsd) + cost,
    lastMessageAt: new Date().toISOString(),
  });
  return { text, events, conversation };
}

/** Deletes conversations older than the retention period (run by the daily cron). */
export async function pruneConversations() {
  const bot = await store.getChatbotSettings();
  const cutoff = zonedToUtc(addDays(dateKey(new Date(), site.timezone), -bot.retentionDays), "00:00", site.timezone);
  return store.deleteConversationsBefore(cutoff.toISOString());
}
