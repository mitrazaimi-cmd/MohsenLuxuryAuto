import type { Weekday } from "@/lib/time";

export type BookingStatus = "upcoming" | "completed" | "cancelled" | "no_show";
export type ContentKind = "portfolio_items" | "testimonials" | "client_stories";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  consentAt: string | null;
  unsubscribed: boolean;
  unsubscribeToken: string;
  source: ContactSource;
  createdAt: string;
  updatedAt: string;
}

export type ContactSource = "booking" | "contact_form" | "chatbot" | "telegram";

export interface Booking {
  id: string;
  contactId: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  modelInterest: string;
  condition: "new" | "cpo" | "not_sure";
  purchaseType: "purchase" | "lease" | "finance" | "not_sure";
  tradeIn: boolean;
  meetingType: "in_person" | "phone" | "video";
  contactMethod: "phone" | "email" | "text";
  notes: string;
  adminNote: string;
  googleEventId: string | null;
  manageToken: string;
  reminderSentAt: string | null;
  followupSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithContact extends Booking {
  contact: Contact;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  clientFirstName: string;
  model: string;
  caption: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  model: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ClientStory {
  id: string;
  title: string;
  clientFirstName: string;
  model: string;
  need: string;
  recommendation: string;
  result: string;
  imageUrl: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ContentMap {
  portfolio_items: PortfolioItem;
  testimonials: Testimonial;
  client_stories: ClientStory;
}

export interface EmailLog {
  id: string;
  contactId: string | null;
  bookingId: string | null;
  type: EmailType;
  to: string;
  subject: string;
  status: "sent" | "preview" | "failed";
  providerId: string | null;
  error: string | null;
  createdAt: string;
}

export type EmailType =
  | "booking_confirmation"
  | "booking_notification"
  | "reminder"
  | "followup"
  | "cancellation"
  | "reschedule"
  | "contact_notification"
  | "chat_lead"
  | "chat_handoff";

export interface WorkingHours {
  start: string; // "09:00"
  end: string; // "18:00"
}

export interface Settings {
  slotMinutes: number;
  bufferMinutes: number;
  windowDays: number;
  minNoticeHours: number;
  workingHours: Record<Weekday, WorkingHours | null>;
  blockedDates: string[]; // "YYYY-MM-DD"
  notificationEmail: string;
}

export const defaultSettings: Settings = {
  slotMinutes: 45,
  bufferMinutes: 15,
  windowDays: 30,
  minNoticeHours: 12,
  workingHours: {
    mon: { start: "09:00", end: "18:00" },
    tue: { start: "09:00", end: "18:00" },
    wed: { start: "09:00", end: "18:00" },
    thu: { start: "09:00", end: "18:00" },
    fri: { start: "09:00", end: "18:00" },
    sat: { start: "10:00", end: "16:00" },
    sun: null,
  },
  blockedDates: [],
  notificationEmail: "",
};

export class SlotTakenError extends Error {
  constructor() {
    super("That time was just booked by someone else.");
  }
}

export interface NewBooking {
  contactId: string;
  startAt: string;
  endAt: string;
  modelInterest: string;
  condition: Booking["condition"];
  purchaseType: Booking["purchaseType"];
  tradeIn: boolean;
  meetingType: Booking["meetingType"];
  contactMethod: Booking["contactMethod"];
  notes: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  source: ContactSource;
}

// ---------- chatbot ----------

export type ChatChannel = "web" | "page" | "telegram" | "playground";
export type ConversationStatus = "open" | "lead" | "booked" | "handoff";

export interface ChatConversation {
  id: string;
  channel: ChatChannel;
  /** The visitor's secret browser token, or the Telegram chat id. */
  externalId: string;
  status: ConversationStatus;
  contactId: string | null;
  bookingId: string | null;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  pageUrl: string;
  messageCount: number;
  costUsd: number;
  reviewed: boolean;
  note: string;
  notifiedAt: string | null;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  text: string;
  /** Raw model steps (thoughts, tool calls and results) replayed as history on the next turn. */
  steps: unknown[];
  /** Tools used, knowledge sources cited, token usage, and whether the knowledge base had an answer. */
  meta: ChatMessageMeta;
  createdAt: string;
}

export interface ChatMessageMeta {
  tools?: string[];
  sources?: string[];
  unanswered?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  model?: string;
}

export type KbKind = "site" | "pdf" | "text" | "qa";

export interface KbSource {
  id: string;
  kind: KbKind;
  title: string;
  url: string;
  /** Full text for text and Q&A sources (PDF and site text lives only in the chunks). */
  body: string;
  status: "ready" | "processing" | "error";
  error: string;
  /** For the website source: the deploy (git commit) it was last synced from. */
  version: string;
  enabled: boolean;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KbChunk {
  id: string;
  sourceId: string;
  heading: string;
  content: string;
  contentHash: string;
  embedding: number[] | null;
  createdAt: string;
}

export type NewKbChunk = Pick<KbChunk, "heading" | "content" | "contentHash" | "embedding">;

export interface KbMatch {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  heading: string;
  content: string;
  score: number;
}

export interface ChatbotSettings {
  enabled: boolean;
  widgetEnabled: boolean;
  pageEnabled: boolean;
  telegramEnabled: boolean;
  assistantName: string;
  welcomeMessage: string;
  starterQuestions: string[];
  launcherLabel: string;
  widgetPosition: "right" | "left";
  /** Seconds before the launcher shows a greeting bubble; 0 turns it off. */
  greetingDelaySeconds: number;
  /** Pages (path prefixes) where the widget stays hidden. */
  hiddenPaths: string[];
  tone: string;
  instructions: string;
  avoidTopics: string;
  /** Answers given before the assistant suggests a consultation. */
  suggestBookingAfter: number;
  requirePhone: boolean;
  handoffMessage: string;
  model: string;
  thinkingLevel: "low" | "medium" | "high";
  maxReplyWords: number;
  dailyMessageCap: number;
  retentionDays: number;
  telegramAdminChatId: string;
  telegramLinkCode: string;
}

export const defaultChatbotSettings: ChatbotSettings = {
  enabled: true,
  widgetEnabled: true,
  pageEnabled: true,
  telegramEnabled: false,
  assistantName: "Mohsen's Assistant",
  welcomeMessage:
    "Welcome. I'm Mohsen's assistant. Ask me anything about Mercedes-Benz models, leasing or financing, or how a consultation works.",
  starterQuestions: [
    "Which SUV fits a family of five?",
    "Lease or finance: what's the difference?",
    "How does a consultation work?",
    "Can I book a test drive?",
  ],
  launcherLabel: "Ask a question",
  widgetPosition: "right",
  greetingDelaySeconds: 0,
  hiddenPaths: [],
  tone: "Warm, calm and refined, like a trusted personal advisor. Short paragraphs. Never pushy.",
  instructions: "",
  avoidTopics: "Exact prices, discounts or payment quotes; inventory promises; competitors' dealerships.",
  suggestBookingAfter: 2,
  requirePhone: true,
  handoffMessage: "I've let Mohsen know. He'll reach out to you personally, usually the same day.",
  model: "gemini-3.1-pro-preview",
  thinkingLevel: "low",
  maxReplyWords: 120,
  dailyMessageCap: 500,
  retentionDays: 365,
  telegramAdminChatId: "",
  telegramLinkCode: "",
};

/** The storage contract. Both the local file store and Supabase implement it. */
export interface Store {
  upsertContact(input: ContactInput): Promise<Contact>;
  getContact(id: string): Promise<Contact | null>;
  listContacts(q?: string): Promise<Contact[]>;
  unsubscribe(token: string): Promise<Contact | null>;

  createBooking(input: NewBooking): Promise<Booking>; // throws SlotTakenError on overlap
  getBooking(id: string): Promise<BookingWithContact | null>;
  getBookingByToken(token: string): Promise<BookingWithContact | null>;
  listBookings(filter: { from?: string; to?: string; status?: BookingStatus }): Promise<BookingWithContact[]>;
  listActiveBookingsBetween(from: string, to: string): Promise<Booking[]>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking>; // throws SlotTakenError on overlap

  createMessage(input: Omit<ContactMessage, "id" | "read" | "createdAt">): Promise<ContactMessage>;
  listMessages(): Promise<ContactMessage[]>;
  setMessageRead(id: string, read: boolean): Promise<void>;

  listContent<K extends ContentKind>(kind: K, opts?: { publishedOnly?: boolean }): Promise<ContentMap[K][]>;
  saveContent<K extends ContentKind>(kind: K, item: Partial<ContentMap[K]> & { id?: string }): Promise<ContentMap[K]>;
  deleteContent(kind: ContentKind, id: string): Promise<void>;

  logEmail(entry: Omit<EmailLog, "id" | "createdAt">): Promise<void>;
  listEmailLog(bookingId?: string): Promise<EmailLog[]>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  saveMedia(file: File): Promise<string>; // returns a public URL

  createConversation(input: Pick<ChatConversation, "channel" | "externalId" | "pageUrl">): Promise<ChatConversation>;
  getConversation(id: string): Promise<ChatConversation | null>;
  findConversation(channel: ChatChannel, externalId: string): Promise<ChatConversation | null>;
  updateConversation(id: string, patch: Partial<ChatConversation>): Promise<ChatConversation>;
  listConversations(filter: { channel?: ChatChannel; status?: ConversationStatus; since?: string; limit?: number }): Promise<ChatConversation[]>;
  deleteConversationsBefore(iso: string): Promise<number>;
  addChatMessages(messages: Omit<ChatMessage, "id" | "createdAt">[]): Promise<void>;
  listChatMessages(conversationId: string, opts?: { last?: number }): Promise<ChatMessage[]>;
  listRecentUserMessages(since: string, limit: number): Promise<ChatMessage[]>;
  countUserMessagesSince(iso: string): Promise<number>;

  listKbSources(): Promise<KbSource[]>;
  getKbSource(id: string): Promise<KbSource | null>;
  saveKbSource(item: Partial<KbSource> & { id?: string }): Promise<KbSource>;
  deleteKbSource(id: string): Promise<void>;
  listKbChunks(sourceId: string): Promise<KbChunk[]>;
  replaceKbChunks(sourceId: string, chunks: NewKbChunk[]): Promise<void>;
  searchKb(query: { embedding: number[] | null; terms: string[]; limit: number }): Promise<KbMatch[]>;

  getChatbotSettings(): Promise<ChatbotSettings>;
  saveChatbotSettings(settings: ChatbotSettings): Promise<void>;
}
