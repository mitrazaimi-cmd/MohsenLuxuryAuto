"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminState } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { CHAT_MODELS } from "@/lib/chat/gemini";
import { store, type ChatbotSettings, type ConversationStatus } from "@/lib/db";
import { integrations, siteUrl } from "@/lib/env";
import { addPdfSource, reindexSource, saveTextSource, syncSite } from "@/lib/kb/ingest";
import { sendTelegram, setTelegramWebhook } from "@/lib/telegram";
import { newToken } from "@/lib/tokens";

const text = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const lines = (fd: FormData, k: string, maxItems: number, maxLen = 120) =>
  text(fd, k, 5000)
    .split("\n")
    .map((l) => l.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
const num = (fd: FormData, k: string, min: number, max: number, fallback: number) => {
  const n = Number(fd.get(k));
  return Number.isFinite(n) && fd.get(k) !== "" ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const on = (fd: FormData, k: string) => fd.get(k) === "on";

// ---------- settings ----------

/** Saves the Behavior or the Channels tab; each form only touches its own fields. */
export async function saveChatbotSettingsAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const s = await store.getChatbotSettings();
  let next: ChatbotSettings;

  if (fd.get("section") === "behavior") {
    const assistantName = text(fd, "assistantName", 60);
    const welcomeMessage = text(fd, "welcomeMessage", 600);
    if (!assistantName || !welcomeMessage) return { message: "Please give the assistant a name and a welcome message." };
    const model = text(fd, "model", 60);
    const thinking = text(fd, "thinkingLevel", 10);
    next = {
      ...s,
      assistantName,
      welcomeMessage,
      starterQuestions: lines(fd, "starterQuestions", 6),
      tone: text(fd, "tone", 600),
      instructions: text(fd, "instructions", 4000),
      avoidTopics: text(fd, "avoidTopics", 1000),
      suggestBookingAfter: num(fd, "suggestBookingAfter", 1, 10, s.suggestBookingAfter),
      requirePhone: on(fd, "requirePhone"),
      handoffMessage: text(fd, "handoffMessage", 300) || s.handoffMessage,
      model: model in CHAT_MODELS ? model : s.model,
      thinkingLevel: thinking === "medium" || thinking === "high" ? thinking : "low",
      maxReplyWords: num(fd, "maxReplyWords", 40, 400, s.maxReplyWords),
      dailyMessageCap: num(fd, "dailyMessageCap", 10, 20000, s.dailyMessageCap),
      retentionDays: num(fd, "retentionDays", 7, 3650, s.retentionDays),
    };
  } else {
    next = {
      ...s,
      enabled: on(fd, "enabled"),
      widgetEnabled: on(fd, "widgetEnabled"),
      pageEnabled: on(fd, "pageEnabled"),
      telegramEnabled: on(fd, "telegramEnabled"),
      launcherLabel: text(fd, "launcherLabel", 40) || s.launcherLabel,
      widgetPosition: fd.get("widgetPosition") === "left" ? "left" : "right",
      greetingDelaySeconds: num(fd, "greetingDelaySeconds", 0, 600, 0),
      hiddenPaths: lines(fd, "hiddenPaths", 20, 100).map((p) => (p.startsWith("/") ? p : `/${p}`)),
    };
  }
  await store.saveChatbotSettings(next);
  revalidatePath("/admin/chatbot", "layout");
  return { ok: true, message: "Saved. The assistant uses the new settings right away." };
}

// ---------- knowledge ----------

const KB = "/admin/chatbot/knowledge";
const MAX_PDF = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB

export async function syncSiteAction() {
  await requireAdmin();
  await syncSite();
  revalidatePath(KB);
}

export async function uploadPdfAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { message: "Please choose a PDF file." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return { message: "Only PDF files can be added here." };
  if (file.size > MAX_PDF) return { message: "That PDF is over 4 MB. Please compress it or split it into parts." };
  const source = await addPdfSource(file);
  revalidatePath(KB);
  return source.status === "ready"
    ? { ok: true, message: `Added "${source.title}" (${source.chunkCount} sections).` }
    : { message: source.error || "The PDF could not be added." };
}

export async function saveTextSourceAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const kind = fd.get("kind") === "qa" ? "qa" : "text";
  const title = text(fd, "title", 200);
  const body = text(fd, "body", 50_000);
  if (!title || body.length < 5) {
    return { message: kind === "qa" ? "Please write both the question and the answer." : "Please add a title and the text." };
  }
  const id = text(fd, "id", 60) || undefined;
  const source = await saveTextSource({ id, kind, title, body });
  revalidatePath(KB);
  return source.status === "ready" ? { ok: true, message: "Saved and added to the knowledge base." } : { message: source.error };
}

export async function toggleSourceAction(fd: FormData) {
  await requireAdmin();
  await store.saveKbSource({ id: text(fd, "id", 60), enabled: fd.get("enabled") === "1" });
  revalidatePath(KB);
}

export async function reindexSourceAction(fd: FormData) {
  await requireAdmin();
  await reindexSource(text(fd, "id", 60));
  revalidatePath(KB);
}

export async function deleteSourceAction(fd: FormData) {
  await requireAdmin();
  await store.deleteKbSource(text(fd, "id", 60));
  revalidatePath(KB);
}

// ---------- conversations ----------

const STATUSES: ConversationStatus[] = ["open", "lead", "booked", "handoff"];

export async function updateConversationAction(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id", 60);
  const status = text(fd, "status", 20) as ConversationStatus;
  await store.updateConversation(id, {
    reviewed: on(fd, "reviewed"),
    note: text(fd, "note", 2000),
    ...(STATUSES.includes(status) ? { status } : {}),
  });
  revalidatePath(`/admin/chatbot/conversations/${id}`);
  revalidatePath("/admin/chatbot/conversations");
}

// ---------- Telegram ----------

const CHANNELS = "/admin/chatbot/channels";

export async function connectTelegramAction() {
  await requireAdmin();
  if (!integrations.telegram) redirect(`${CHANNELS}?tg=missing`);
  let result = "connected";
  try {
    await setTelegramWebhook(`${siteUrl()}/api/telegram/webhook`);
  } catch (err) {
    console.error("[telegram] setWebhook failed:", err);
    result = "failed";
  }
  revalidatePath(CHANNELS);
  redirect(`${CHANNELS}?tg=${result}`);
}

/** Creates a one-time code; Mohsen opens t.me/<bot>?start=<code> to receive alerts in Telegram. */
export async function newTelegramLinkCodeAction() {
  await requireAdmin();
  const s = await store.getChatbotSettings();
  await store.saveChatbotSettings({ ...s, telegramLinkCode: newToken(12) });
  revalidatePath(CHANNELS);
}

export async function testTelegramAlertAction() {
  await requireAdmin();
  const s = await store.getChatbotSettings();
  let result = "sent";
  try {
    if (!s.telegramAdminChatId) throw new Error("No chat linked");
    await sendTelegram(s.telegramAdminChatId, "Test alert from your website assistant. Alerts are working.");
  } catch (err) {
    console.error("[telegram] test alert failed:", err);
    result = "test-failed";
  }
  redirect(`${CHANNELS}?tg=${result}`);
}

export async function unlinkTelegramAction() {
  await requireAdmin();
  const s = await store.getChatbotSettings();
  await store.saveChatbotSettings({ ...s, telegramAdminChatId: "", telegramLinkCode: "" });
  revalidatePath(CHANNELS);
}
