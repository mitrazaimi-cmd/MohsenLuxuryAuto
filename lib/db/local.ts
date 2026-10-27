import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { newId, newToken } from "@/lib/tokens";
import { fuseRanks } from "./search";
import {
  type Booking,
  type BookingWithContact,
  type ChatConversation,
  type ChatMessage,
  type ChatbotSettings,
  type ClientStory,
  type Contact,
  type ContactMessage,
  type ContentKind,
  type ContentMap,
  type EmailLog,
  type KbChunk,
  type KbSource,
  type PortfolioItem,
  type Settings,
  type Store,
  type Testimonial,
  defaultChatbotSettings,
  defaultSettings,
  SlotTakenError,
} from "./types";

// Local development store: one JSON file in .data/. Writes are serialized
// through a promise chain so two bookings can't claim the same slot.

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

interface Data {
  contacts: Contact[];
  bookings: Booking[];
  contact_messages: ContactMessage[];
  portfolio_items: PortfolioItem[];
  testimonials: Testimonial[];
  client_stories: ClientStory[];
  email_log: EmailLog[];
  settings: Settings;
  chat_conversations: ChatConversation[];
  chat_messages: ChatMessage[];
  kb_sources: KbSource[];
  kb_chunks: KbChunk[];
  chatbot_settings: ChatbotSettings;
}

function seed(): Data {
  const now = new Date().toISOString();
  return {
    contacts: [],
    bookings: [],
    contact_messages: [],
    portfolio_items: [],
    // The one real client quote from the brand guide.
    testimonials: [
      {
        id: newId(),
        quote:
          "Mohsen always takes good care of us. He is always available, and everybody can easily get in touch with him.",
        clientName: "A returning client",
        model: "",
        imageUrl: "",
        published: true,
        sortOrder: 0,
        createdAt: now,
      },
    ],
    client_stories: [],
    email_log: [],
    settings: defaultSettings,
    chat_conversations: [],
    chat_messages: [],
    kb_sources: [],
    kb_chunks: [],
    chatbot_settings: defaultChatbotSettings,
  };
}

let chain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Data> {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    const data = JSON.parse(raw) as Data;
    data.settings = { ...defaultSettings, ...data.settings };
    // Files written before the chatbot existed lack its tables.
    data.chat_conversations ??= [];
    data.chat_messages ??= [];
    data.kb_sources ??= [];
    data.kb_chunks ??= [];
    data.chatbot_settings = { ...defaultChatbotSettings, ...data.chatbot_settings };
    return data;
  } catch {
    const data = seed();
    await persist(data);
    return data;
  }
}

async function persist(data: Data) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, DB_FILE);
}

function read<T>(fn: (d: Data) => T): Promise<T> {
  const run = chain.then(async () => fn(await load()));
  chain = run.catch(() => undefined);
  return run;
}

function write<T>(fn: (d: Data) => T): Promise<T> {
  const run = chain.then(async () => {
    const data = await load();
    const result = fn(data);
    await persist(data);
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}

const ACTIVE = new Set(["upcoming", "completed"]);

function overlaps(data: Data, startAt: string, endAt: string, ignoreId?: string) {
  const s = Date.parse(startAt);
  const e = Date.parse(endAt);
  return data.bookings.some(
    (b) => b.id !== ignoreId && ACTIVE.has(b.status) && Date.parse(b.startAt) < e && Date.parse(b.endAt) > s,
  );
}

function withContact(data: Data, b: Booking): BookingWithContact {
  const contact = data.contacts.find((c) => c.id === b.contactId)!;
  return { ...b, contact };
}

export const localStore: Store = {
  upsertContact(input) {
    return write((d) => {
      const now = new Date().toISOString();
      const email = input.email.toLowerCase();
      const existing = d.contacts.find((c) => c.email === email);
      if (existing) {
        existing.name = input.name;
        existing.phone = input.phone || existing.phone;
        if (input.marketingOptIn && !existing.marketingOptIn) {
          existing.marketingOptIn = true;
          existing.consentAt = now;
          existing.unsubscribed = false;
        }
        existing.updatedAt = now;
        return { ...existing };
      }
      const contact: Contact = {
        id: newId(),
        name: input.name,
        email,
        phone: input.phone,
        marketingOptIn: input.marketingOptIn,
        consentAt: input.marketingOptIn ? now : null,
        unsubscribed: false,
        unsubscribeToken: newToken(),
        source: input.source,
        createdAt: now,
        updatedAt: now,
      };
      d.contacts.push(contact);
      return { ...contact };
    });
  },

  getContact(id) {
    return read((d) => d.contacts.find((c) => c.id === id) ?? null);
  },

  listContacts(q) {
    return read((d) => {
      const needle = q?.trim().toLowerCase();
      return d.contacts
        .filter((c) => !needle || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(needle))
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  },

  unsubscribe(token) {
    return write((d) => {
      const c = d.contacts.find((x) => x.unsubscribeToken === token);
      if (!c) return null;
      c.unsubscribed = true;
      c.marketingOptIn = false;
      c.updatedAt = new Date().toISOString();
      return { ...c };
    });
  },

  createBooking(input) {
    return write((d) => {
      if (overlaps(d, input.startAt, input.endAt)) throw new SlotTakenError();
      const now = new Date().toISOString();
      const booking: Booking = {
        ...input,
        id: newId(),
        status: "upcoming",
        adminNote: "",
        googleEventId: null,
        manageToken: newToken(),
        reminderSentAt: null,
        followupSentAt: null,
        createdAt: now,
        updatedAt: now,
      };
      d.bookings.push(booking);
      return { ...booking };
    });
  },

  getBooking(id) {
    return read((d) => {
      const b = d.bookings.find((x) => x.id === id);
      return b ? withContact(d, b) : null;
    });
  },

  getBookingByToken(token) {
    return read((d) => {
      const b = d.bookings.find((x) => x.manageToken === token);
      return b ? withContact(d, b) : null;
    });
  },

  listBookings({ from, to, status }) {
    return read((d) =>
      d.bookings
        .filter(
          (b) => (!from || b.startAt >= from) && (!to || b.startAt < to) && (!status || b.status === status),
        )
        .toSorted((a, b) => a.startAt.localeCompare(b.startAt))
        .map((b) => withContact(d, b)),
    );
  },

  listActiveBookingsBetween(from, to) {
    return read((d) =>
      d.bookings.filter((b) => ACTIVE.has(b.status) && b.endAt > from && b.startAt < to).map((b) => ({ ...b })),
    );
  },

  updateBooking(id, patch) {
    return write((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (!b) throw new Error("Booking not found");
      const next = { ...b, ...patch };
      if ((patch.startAt || patch.endAt || patch.status) && ACTIVE.has(next.status)) {
        if (overlaps(d, next.startAt, next.endAt, id)) throw new SlotTakenError();
      }
      Object.assign(b, patch, { updatedAt: new Date().toISOString() });
      return { ...b };
    });
  },

  createMessage(input) {
    return write((d) => {
      const msg: ContactMessage = { ...input, id: newId(), read: false, createdAt: new Date().toISOString() };
      d.contact_messages.push(msg);
      return msg;
    });
  },

  listMessages() {
    return read((d) => d.contact_messages.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  setMessageRead(id, isRead) {
    return write((d) => {
      const m = d.contact_messages.find((x) => x.id === id);
      if (m) m.read = isRead;
    });
  },

  listContent<K extends ContentKind>(kind: K, opts?: { publishedOnly?: boolean }) {
    return read((d) =>
      (d[kind] as ContentMap[K][])
        .filter((item) => !opts?.publishedOnly || item.published)
        .toSorted((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)),
    );
  },

  saveContent<K extends ContentKind>(kind: K, item: Partial<ContentMap[K]> & { id?: string }) {
    return write((d) => {
      const list = d[kind] as ContentMap[K][];
      if (item.id) {
        const existing = list.find((x) => x.id === item.id);
        if (!existing) throw new Error("Item not found");
        Object.assign(existing, item);
        return { ...existing };
      }
      const created = { ...item, id: newId(), createdAt: new Date().toISOString() } as ContentMap[K];
      list.push(created);
      return created;
    });
  },

  deleteContent(kind, id) {
    return write((d) => {
      const list = d[kind] as { id: string }[];
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) list.splice(i, 1);
    });
  },

  logEmail(entry) {
    return write((d) => {
      d.email_log.push({ ...entry, id: newId(), createdAt: new Date().toISOString() });
    });
  },

  listEmailLog(bookingId) {
    return read((d) =>
      d.email_log
        .filter((e) => !bookingId || e.bookingId === bookingId)
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  getSettings() {
    return read((d) => d.settings);
  },

  saveSettings(settings) {
    return write((d) => {
      d.settings = settings;
    });
  },

  async saveMedia(file) {
    const ext = mediaExtension(file.type);
    const name = `${newId()}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return `/api/media/${name}`;
  },

  createConversation(input) {
    return write((d) => {
      const now = new Date().toISOString();
      const c: ChatConversation = {
        ...input,
        id: newId(),
        status: "open",
        contactId: null,
        bookingId: null,
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        messageCount: 0,
        costUsd: 0,
        reviewed: false,
        note: "",
        notifiedAt: null,
        createdAt: now,
        lastMessageAt: now,
      };
      d.chat_conversations.push(c);
      return { ...c };
    });
  },

  getConversation(id) {
    return read((d) => d.chat_conversations.find((c) => c.id === id) ?? null);
  },

  findConversation(channel, externalId) {
    return read(
      (d) =>
        d.chat_conversations
          .filter((c) => c.channel === channel && c.externalId === externalId)
          .toSorted((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))[0] ?? null,
    );
  },

  updateConversation(id, patch) {
    return write((d) => {
      const c = d.chat_conversations.find((x) => x.id === id);
      if (!c) throw new Error("Conversation not found");
      Object.assign(c, patch);
      return { ...c };
    });
  },

  listConversations({ channel, status, since, limit = 200 }) {
    return read((d) =>
      d.chat_conversations
        .filter(
          (c) =>
            (!channel || c.channel === channel) && (!status || c.status === status) && (!since || c.lastMessageAt >= since),
        )
        .toSorted((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .slice(0, limit),
    );
  },

  deleteConversationsBefore(iso) {
    return write((d) => {
      const old = new Set(d.chat_conversations.filter((c) => c.lastMessageAt < iso).map((c) => c.id));
      d.chat_conversations = d.chat_conversations.filter((c) => !old.has(c.id));
      d.chat_messages = d.chat_messages.filter((m) => !old.has(m.conversationId));
      return old.size;
    });
  },

  addChatMessages(messages) {
    return write((d) => {
      const now = Date.now();
      // Distinct timestamps keep the order stable when one turn stores several messages.
      messages.forEach((m, i) =>
        d.chat_messages.push({ ...m, id: newId(), createdAt: new Date(now + i).toISOString() }),
      );
    });
  },

  listChatMessages(conversationId, opts) {
    return read((d) => {
      const all = d.chat_messages
        .filter((m) => m.conversationId === conversationId)
        .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
      return opts?.last ? all.slice(-opts.last) : all;
    });
  },

  listRecentUserMessages(since, limit) {
    return read((d) =>
      d.chat_messages
        .filter((m) => m.role === "user" && m.createdAt >= since)
        .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  },

  countUserMessagesSince(iso) {
    return read((d) => d.chat_messages.filter((m) => m.role === "user" && m.createdAt >= iso).length);
  },

  listKbSources() {
    return read((d) => d.kb_sources.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  getKbSource(id) {
    return read((d) => d.kb_sources.find((x) => x.id === id) ?? null);
  },

  saveKbSource(item) {
    return write((d) => {
      const now = new Date().toISOString();
      if (item.id) {
        const existing = d.kb_sources.find((x) => x.id === item.id);
        if (!existing) throw new Error("Source not found");
        Object.assign(existing, item, { updatedAt: now });
        return { ...existing };
      }
      const created: KbSource = {
        kind: "text",
        title: "",
        url: "",
        body: "",
        status: "processing",
        error: "",
        version: "",
        enabled: true,
        chunkCount: 0,
        ...item,
        id: newId(),
        createdAt: now,
        updatedAt: now,
      };
      d.kb_sources.push(created);
      return { ...created };
    });
  },

  deleteKbSource(id) {
    return write((d) => {
      d.kb_sources = d.kb_sources.filter((x) => x.id !== id);
      d.kb_chunks = d.kb_chunks.filter((c) => c.sourceId !== id);
    });
  },

  listKbChunks(sourceId) {
    return read((d) => d.kb_chunks.filter((c) => c.sourceId === sourceId));
  },

  replaceKbChunks(sourceId, chunks) {
    return write((d) => {
      const now = new Date().toISOString();
      d.kb_chunks = d.kb_chunks.filter((c) => c.sourceId !== sourceId);
      for (const c of chunks) d.kb_chunks.push({ ...c, id: newId(), sourceId, createdAt: now });
      const src = d.kb_sources.find((x) => x.id === sourceId);
      if (src) Object.assign(src, { chunkCount: chunks.length, updatedAt: now });
    });
  },

  searchKb({ embedding, terms, limit }) {
    return read((d) => {
      const sources = new Map(d.kb_sources.filter((s) => s.enabled).map((s) => [s.id, s]));
      const active = d.kb_chunks.filter((c) => sources.has(c.sourceId));
      const semantic = embedding
        ? active
            .filter((c) => c.embedding)
            .map((c) => ({ id: c.id, score: cosine(embedding, c.embedding!) }))
            .toSorted((a, b) => b.score - a.score)
            .slice(0, limit * 3)
            .map((x) => x.id)
        : [];
      const keyword = terms.length
        ? active
            .map((c) => {
              const hay = `${c.heading} ${c.content}`.toLowerCase();
              return { id: c.id, score: terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0) };
            })
            .filter((x) => x.score > 0)
            .toSorted((a, b) => b.score - a.score)
            .slice(0, limit * 3)
            .map((x) => x.id)
        : [];
      return fuseRanks([semantic, keyword], limit).map(({ id, score }) => {
        const c = active.find((x) => x.id === id)!;
        const src = sources.get(c.sourceId)!;
        return {
          chunkId: c.id,
          sourceId: c.sourceId,
          sourceTitle: src.title,
          sourceUrl: src.url,
          heading: c.heading,
          content: c.content,
          score,
        };
      });
    });
  },

  getChatbotSettings() {
    return read((d) => d.chatbot_settings);
  },

  saveChatbotSettings(settings) {
    return write((d) => {
      d.chatbot_settings = settings;
    });
  },
};

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function mediaExtension(type: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  const ext = map[type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  return ext;
}
