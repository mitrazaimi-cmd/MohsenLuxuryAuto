import "server-only";
import type { Interactions } from "@google/genai";
import { z } from "zod";
import { site } from "@/config/site";
import { bookConsultation } from "@/lib/bookings";
import { store, SlotTakenError, type ChatChannel, type ChatConversation, type ChatbotSettings } from "@/lib/db";
import { notifyAddress, sendEmail } from "@/lib/email/send";
import { chatAlertEmail } from "@/lib/email/templates";
import { integrations, siteUrl } from "@/lib/env";
import { searchKnowledge } from "@/lib/kb/search";
import { getAvailability, isSlotOpen } from "@/lib/slots";
import { sendTelegram } from "@/lib/telegram";
import { formatDate, formatTime, zonedParts } from "@/lib/time";

export interface Slot {
  startAt: string;
  label: string;
}

/** What the chat UI shows besides text: status lines, time buttons, a booking card. */
export type TurnEvent =
  | { type: "status"; text: string }
  | { type: "slots"; slots: Slot[] }
  | { type: "booked"; when: string; meeting: string; manageUrl: string };

export interface ToolContext {
  conversation: ChatConversation;
  channel: ChatChannel;
  bot: ChatbotSettings;
  emit: (e: TurnEvent) => void;
  /** Filled by tools for the turn's stored metadata. */
  sources: Set<string>;
  unanswered: boolean;
}

export const TOOLS: Interactions.Tool[] = [
  {
    type: "function",
    name: "search_knowledge",
    description:
      "Search Mohsen's knowledge base (the website, uploaded documents and notes) for facts about models, services, leasing and financing, the consultation process and policies. Use it before answering anything not in your instructions.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "A focused search query in English." } },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "get_available_times",
    description:
      "Get open consultation times from Mohsen's calendar (Eastern Time). The visitor sees them as buttons. Returns start_at values to use when booking.",
    parameters: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "Earliest day to look at, as YYYY-MM-DD. Omit for the next available days." },
        part_of_day: { type: "string", enum: ["any", "morning", "afternoon", "evening"] },
      },
    },
  },
  {
    type: "function",
    name: "book_consultation",
    description:
      "Book the consultation. Call only after the visitor has confirmed the time and their details. start_at must be one of the values returned by get_available_times.",
    parameters: {
      type: "object",
      properties: {
        start_at: { type: "string", description: "ISO start time from get_available_times." },
        name: { type: "string", description: "Full name." },
        email: { type: "string" },
        phone: { type: "string" },
        meeting_type: { type: "string", enum: ["in_person", "phone", "video"] },
        model_interest: { type: "string", description: "Model of interest, if mentioned (e.g. GLE, AMG, EQ)." },
        purchase_type: { type: "string", enum: ["purchase", "lease", "finance", "not_sure"] },
        trade_in: { type: "boolean" },
        notes: { type: "string", description: "A short summary of what the visitor is looking for, for Mohsen." },
      },
      required: ["start_at", "name", "email", "meeting_type"],
    },
  },
  {
    type: "function",
    name: "save_lead",
    description:
      "Save a visitor's contact details and interest so Mohsen can follow up, when they share details but don't book now.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        summary: { type: "string", description: "What they're interested in and anything Mohsen should know." },
      },
      required: ["summary"],
    },
  },
  {
    type: "function",
    name: "notify_mohsen",
    description:
      "Alert Mohsen personally (email and Telegram) when the visitor asks for him or a human, or needs something you can't handle.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the visitor wants Mohsen, in one or two sentences." },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

const STATUS: Record<string, string> = {
  search_knowledge: "Looking that up…",
  get_available_times: "Checking Mohsen's calendar…",
  book_consultation: "Booking your consultation…",
  save_lead: "Saving your details…",
  notify_mohsen: "Letting Mohsen know…",
};

const phone = z.string().trim().max(40).regex(/^[0-9+().\-\s]{7,}$/, "That phone number doesn't look complete.");
const email = z.string().trim().toLowerCase().email("That email address doesn't look right.").max(200);

const bookingArgs = z.object({
  start_at: z.string().datetime(),
  name: z.string().trim().min(2, "A full name is needed.").max(120),
  email,
  phone: z.union([phone, z.literal("")]).default(""),
  meeting_type: z.enum(["in_person", "phone", "video"]).default("in_person"),
  model_interest: z.string().trim().max(60).default(""),
  purchase_type: z.enum(["purchase", "lease", "finance", "not_sure"]).default("not_sure"),
  trade_in: z.boolean().default(false),
  notes: z.string().trim().max(1500).default(""),
});

const contactArgs = z.object({
  name: z.string().trim().max(120).default(""),
  email: z.union([email, z.literal("")]).default(""),
  phone: z.union([phone, z.literal("")]).default(""),
});

const meetingLabel = { in_person: "in person at the dealership", phone: "by phone", video: "by video" } as const;

export function slotLabel(iso: string) {
  const day = formatDate(iso, site.timezone).replace(/, \d{4}$/, "");
  return `${day}, ${formatTime(iso, site.timezone)}`;
}

/** Stores what the visitor told us on the conversation, and links a contact once there's a name and email. */
async function rememberVisitor(ctx: ToolContext, input: z.infer<typeof contactArgs>) {
  const c = ctx.conversation;
  const patch: Partial<ChatConversation> = {
    visitorName: input.name || c.visitorName,
    visitorEmail: input.email || c.visitorEmail,
    visitorPhone: input.phone || c.visitorPhone,
  };
  if (patch.visitorName && patch.visitorEmail && !c.contactId && ctx.channel !== "playground") {
    const contact = await store.upsertContact({
      name: patch.visitorName,
      email: patch.visitorEmail,
      phone: patch.visitorPhone ?? "",
      marketingOptIn: false,
      source: ctx.channel === "telegram" ? "telegram" : "chatbot",
    });
    patch.contactId = contact.id;
  }
  ctx.conversation = await store.updateConversation(c.id, patch);
}

/** Email + Telegram alert to Mohsen (skipped for admin test chats). */
export async function alertMohsen(c: ChatConversation, kind: "lead" | "handoff", summary: string, bot: ChatbotSettings) {
  if (c.channel === "playground") return;
  const to = (await notifyAddress()) || (integrations.resend ? "" : "mohsen (preview)");
  const mail = chatAlertEmail(c, kind, summary);
  await Promise.all([
    to ? sendEmail({ type: kind === "lead" ? "chat_lead" : "chat_handoff", to, ...mail, contactId: c.contactId }) : null,
    bot.telegramAdminChatId
      ? sendTelegram(
          bot.telegramAdminChatId,
          [
            kind === "handoff" ? "🔔 A visitor would like to talk to you" : "✨ New lead from the chat",
            [c.visitorName, c.visitorPhone, c.visitorEmail].filter(Boolean).join(" · ") || "No contact details yet",
            "",
            summary,
            "",
            `${siteUrl()}/admin/chatbot/conversations/${c.id}`,
          ].join("\n"),
        ).catch((err) => console.error("[telegram] alert failed:", err))
      : null,
  ]);
}

async function availableTimes(args: { from_date?: string; part_of_day?: string }): Promise<Slot[]> {
  const days = await getAvailability();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(args.from_date ?? "") ? args.from_date! : "";
  const part = args.part_of_day ?? "any";
  const fits = (iso: string) => {
    const h = zonedParts(new Date(iso), site.timezone).hour;
    return part === "morning" ? h < 12 : part === "afternoon" ? h >= 12 && h < 17 : part === "evening" ? h >= 17 : true;
  };
  // A few times on each of the next open days, so the visitor gets a real choice.
  const picked: Slot[] = [];
  for (const d of days.filter((d) => d.date >= from)) {
    const slots = d.slots.filter(fits);
    if (!slots.length) continue;
    const step = Math.max(1, Math.floor(slots.length / 3));
    for (let i = 0, n = 0; i < slots.length && n < 3 && picked.length < 8; i += step, n++) {
      picked.push({ startAt: slots[i], label: slotLabel(slots[i]) });
    }
    if (picked.length >= 8) break;
  }
  return picked;
}

/** Runs one tool call and returns the text the model sees. */
export async function runTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<string> {
  ctx.emit({ type: "status", text: STATUS[name] ?? "One moment…" });
  switch (name) {
    case "search_knowledge": {
      const query = String(args.query ?? "").slice(0, 300);
      const { matches, unanswered } = await searchKnowledge(query);
      if (unanswered) ctx.unanswered = true;
      if (!matches.length) return "No results. The knowledge base doesn't cover this.";
      for (const m of matches) ctx.sources.add(m.sourceTitle);
      return matches
        .map((m, i) => `[${i + 1}] ${m.heading} (source: ${m.sourceTitle})\n${m.content}`)
        .join("\n\n---\n\n")
        .concat(unanswered ? "\n\nNote: these results may not answer the question directly." : "");
    }

    case "get_available_times": {
      const slots = await availableTimes(args);
      if (!slots.length) return "No open times in the booking window. Offer to have Mohsen call them to find a time.";
      ctx.emit({ type: "slots", slots });
      return `Open times (Eastern Time):\n${slots.map((s) => `- ${s.label} → start_at: ${s.startAt}`).join("\n")}`;
    }

    case "book_consultation": {
      if (ctx.conversation.status === "booked") return "This visitor already booked a consultation in this conversation.";
      const parsed = bookingArgs.safeParse(args);
      if (!parsed.success) return `Not booked: ${parsed.error.issues.map((i) => i.message).join(" ")} Ask the visitor to correct it.`;
      const a = parsed.data;
      if (ctx.bot.requirePhone && !a.phone) return "Not booked: a phone number is required. Ask the visitor for it.";
      if (ctx.channel === "playground") {
        // Admin test chat: check the time, but don't create a booking or send emails.
        if (!(await isSlotOpen(a.start_at))) return "Not booked: that time was just taken. Call get_available_times and offer other times.";
        const when = `${formatDate(a.start_at, site.timezone)} at ${formatTime(a.start_at, site.timezone)}`;
        ctx.emit({ type: "booked", when: `${when} (test, not saved)`, meeting: meetingLabel[a.meeting_type], manageUrl: `${siteUrl()}/admin/chatbot/playground` });
        return `Booked for ${when}, ${meetingLabel[a.meeting_type]}. A confirmation email is on its way to ${a.email}. Confirm warmly and briefly; ask if there's anything else.`;
      }
      try {
        const { contact, booking } = await bookConsultation({
          name: a.name,
          email: a.email,
          phone: a.phone,
          startAt: a.start_at,
          modelInterest: a.model_interest,
          condition: "not_sure",
          purchaseType: a.purchase_type,
          tradeIn: a.trade_in,
          meetingType: a.meeting_type,
          contactMethod: a.phone ? "phone" : "email",
          notes: [a.notes, `Booked through the ${ctx.channel === "telegram" ? "Telegram" : "website"} chat.`].filter(Boolean).join("\n"),
          marketingOptIn: false,
          source: ctx.channel === "telegram" ? "telegram" : "chatbot",
        });
        ctx.conversation = await store.updateConversation(ctx.conversation.id, {
          status: "booked",
          bookingId: booking.id,
          contactId: contact.id,
          visitorName: a.name,
          visitorEmail: a.email,
          visitorPhone: a.phone || ctx.conversation.visitorPhone,
        });
        const when = `${formatDate(booking.startAt, site.timezone)} at ${formatTime(booking.startAt, site.timezone)}`;
        const manageUrl = `${siteUrl()}/manage/${booking.manageToken}`;
        ctx.emit({ type: "booked", when, meeting: meetingLabel[a.meeting_type], manageUrl });
        return `Booked for ${when}, ${meetingLabel[a.meeting_type]}. A confirmation email is on its way to ${a.email}. They can reschedule or cancel at ${manageUrl}. Confirm warmly and briefly; ask if there's anything else.`;
      } catch (err) {
        if (err instanceof SlotTakenError) return "Not booked: that time was just taken. Call get_available_times and offer other times.";
        console.error("[chat] booking failed:", err);
        return `Not booked because of a system error. Apologize and give Mohsen's phone (${site.contact.phone}) or the booking page (${siteUrl()}/book).`;
      }
    }

    case "save_lead": {
      const parsed = contactArgs.safeParse(args);
      if (!parsed.success) return `Not saved: ${parsed.error.issues.map((i) => i.message).join(" ")}`;
      if (!parsed.data.email && !parsed.data.phone && !ctx.conversation.visitorEmail && !ctx.conversation.visitorPhone) {
        return "Not saved: ask for an email or phone number first.";
      }
      await rememberVisitor(ctx, parsed.data);
      if (ctx.conversation.status === "open") ctx.conversation = await store.updateConversation(ctx.conversation.id, { status: "lead" });
      if (!ctx.conversation.notifiedAt) {
        await alertMohsen(ctx.conversation, "lead", String(args.summary ?? "").slice(0, 1500), ctx.bot);
        ctx.conversation = await store.updateConversation(ctx.conversation.id, { notifiedAt: new Date().toISOString() });
      }
      return "Saved. Mohsen will follow up personally.";
    }

    case "notify_mohsen": {
      const parsed = contactArgs.safeParse(args);
      if (parsed.success) await rememberVisitor(ctx, parsed.data);
      const c = ctx.conversation;
      if (!c.visitorEmail && !c.visitorPhone) return "Not sent: ask for a phone number or email first, so Mohsen can reach them.";
      if (c.status !== "booked") ctx.conversation = await store.updateConversation(c.id, { status: "handoff" });
      await alertMohsen(ctx.conversation, "handoff", String(args.reason ?? "").slice(0, 1500), ctx.bot);
      ctx.conversation = await store.updateConversation(c.id, { notifiedAt: new Date().toISOString() });
      return `Mohsen has been notified. Tell the visitor: "${ctx.bot.handoffMessage}"`;
    }

    default:
      return `Unknown tool ${name}.`;
  }
}
