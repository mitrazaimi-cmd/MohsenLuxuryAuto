import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newId, newToken } from "@/lib/tokens";
import { mediaExtension } from "./local";
import {
  type Booking,
  type BookingWithContact,
  type ChatConversation,
  type ChatMessage,
  type ChatbotSettings,
  type Contact,
  type ContentKind,
  type ContentMap,
  type KbChunk,
  type KbMatch,
  type KbSource,
  type Settings,
  type Store,
  defaultChatbotSettings,
  defaultSettings,
  SlotTakenError,
} from "./types";

// Production store. Runs server-side only, with the service-role key.

let client: SupabaseClient | null = null;
function db() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function snake(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [toSnake(k), v]),
  );
}

function camel<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v])) as T;
}

function check<T>(res: { data: T; error: { code?: string; message: string } | null }): T {
  if (res.error) {
    if (res.error.code === "23P01") throw new SlotTakenError(); // exclusion_violation
    throw new Error(res.error.message);
  }
  return res.data;
}

/** Like check(), for queries that always return rows (lists, .single()). */
function must<T>(res: { data: T | null; error: { code?: string; message: string } | null }): T {
  const data = check(res);
  if (data === null) throw new Error("Unexpected empty result");
  return data;
}

const BOOKING_WITH_CONTACT = "*, contact:contacts(*)";

function mapBookingRow(row: Record<string, unknown>): BookingWithContact {
  const { contact, ...rest } = row;
  return { ...camel<Booking>(rest), contact: camel<Contact>(contact as Record<string, unknown>) };
}

export const supabaseStore: Store = {
  async upsertContact(input) {
    const email = input.email.toLowerCase();
    const existing = check(await db().from("contacts").select("*").eq("email", email).maybeSingle());
    const now = new Date().toISOString();
    if (existing) {
      const patch: Record<string, unknown> = { name: input.name };
      if (input.phone) patch.phone = input.phone;
      if (input.marketingOptIn && !existing.marketing_opt_in) {
        Object.assign(patch, { marketing_opt_in: true, consent_at: now, unsubscribed: false });
      }
      const row = check(await db().from("contacts").update(patch).eq("id", existing.id).select().single());
      return camel<Contact>(row);
    }
    const row = check(
      await db()
        .from("contacts")
        .insert({
          name: input.name,
          email,
          phone: input.phone,
          marketing_opt_in: input.marketingOptIn,
          consent_at: input.marketingOptIn ? now : null,
          unsubscribe_token: newToken(),
          source: input.source,
        })
        .select()
        .single(),
    );
    return camel<Contact>(row);
  },

  async getContact(id) {
    const row = check(await db().from("contacts").select("*").eq("id", id).maybeSingle());
    return row ? camel<Contact>(row) : null;
  },

  async listContacts(q) {
    let query = db().from("contacts").select("*").order("created_at", { ascending: false }).limit(1000);
    const needle = q?.trim().replace(/[%,()]/g, "");
    if (needle) query = query.or(`name.ilike.%${needle}%,email.ilike.%${needle}%,phone.ilike.%${needle}%`);
    return must(await query).map((r) => camel<Contact>(r));
  },

  async unsubscribe(token) {
    const row = check(
      await db()
        .from("contacts")
        .update({ unsubscribed: true, marketing_opt_in: false })
        .eq("unsubscribe_token", token)
        .select()
        .maybeSingle(),
    );
    return row ? camel<Contact>(row) : null;
  },

  async createBooking(input) {
    const row = check(
      await db()
        .from("bookings")
        .insert({ ...snake({ ...input }), manage_token: newToken() })
        .select()
        .single(),
    );
    return camel<Booking>(row);
  },

  async getBooking(id) {
    const row = check(await db().from("bookings").select(BOOKING_WITH_CONTACT).eq("id", id).maybeSingle());
    return row ? mapBookingRow(row) : null;
  },

  async getBookingByToken(token) {
    const row = check(
      await db().from("bookings").select(BOOKING_WITH_CONTACT).eq("manage_token", token).maybeSingle(),
    );
    return row ? mapBookingRow(row) : null;
  },

  async listBookings({ from, to, status }) {
    let query = db().from("bookings").select(BOOKING_WITH_CONTACT).order("start_at").limit(1000);
    if (from) query = query.gte("start_at", from);
    if (to) query = query.lt("start_at", to);
    if (status) query = query.eq("status", status);
    return must(await query).map((r) => mapBookingRow(r));
  },

  async listActiveBookingsBetween(from, to) {
    const rows = must(
      await db()
        .from("bookings")
        .select("*")
        .in("status", ["upcoming", "completed"])
        .gt("end_at", from)
        .lt("start_at", to),
    );
    return rows.map((r) => camel<Booking>(r));
  },

  async updateBooking(id, patch) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = patch;
    const row = check(await db().from("bookings").update(snake(rest)).eq("id", id).select().single());
    return camel<Booking>(row);
  },

  async createMessage(input) {
    const row = check(await db().from("contact_messages").insert(snake({ ...input })).select().single());
    return camel(row);
  },

  async listMessages() {
    const rows = must(
      await db().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500),
    );
    return rows.map((r) => camel(r));
  },

  async setMessageRead(id, read) {
    check(await db().from("contact_messages").update({ read }).eq("id", id));
  },

  async listContent<K extends ContentKind>(kind: K, opts?: { publishedOnly?: boolean }) {
    let query = db()
      .from(kind)
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (opts?.publishedOnly) query = query.eq("published", true);
    return must(await query).map((r) => camel<ContentMap[K]>(r));
  },

  async saveContent<K extends ContentKind>(kind: K, item: Partial<ContentMap[K]> & { id?: string }) {
    const { id, createdAt: _c, ...rest } = item as Record<string, unknown>;
    const res = id
      ? await db().from(kind).update(snake(rest)).eq("id", id).select().single()
      : await db().from(kind).insert(snake(rest)).select().single();
    return camel<ContentMap[K]>(must(res));
  },

  async deleteContent(kind, id) {
    check(await db().from(kind).delete().eq("id", id));
  },

  async logEmail(entry) {
    check(await db().from("email_log").insert(snake({ ...entry })));
  },

  async listEmailLog(bookingId) {
    let query = db().from("email_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (bookingId) query = query.eq("booking_id", bookingId);
    return must(await query).map((r) => camel(r));
  },

  async getSettings() {
    const row = check(await db().from("settings").select("value").eq("id", 1).maybeSingle());
    return { ...defaultSettings, ...((row?.value as Partial<Settings>) ?? {}) };
  },

  async saveSettings(settings) {
    check(await db().from("settings").upsert({ id: 1, value: settings, updated_at: new Date().toISOString() }));
  },

  async saveMedia(file) {
    const name = `${newId()}.${mediaExtension(file.type)}`;
    check(
      await db()
        .storage.from("media")
        .upload(name, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false }),
    );
    return db().storage.from("media").getPublicUrl(name).data.publicUrl;
  },

  async createConversation(input) {
    const row = check(await db().from("chat_conversations").insert(snake({ ...input })).select().single());
    return camel<ChatConversation>(row);
  },

  async getConversation(id) {
    const row = check(await db().from("chat_conversations").select("*").eq("id", id).maybeSingle());
    return row ? camel<ChatConversation>(row) : null;
  },

  async findConversation(channel, externalId) {
    const row = check(
      await db()
        .from("chat_conversations")
        .select("*")
        .eq("channel", channel)
        .eq("external_id", externalId)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    return row ? camel<ChatConversation>(row) : null;
  },

  async updateConversation(id, patch) {
    const { id: _id, createdAt: _c, ...rest } = patch;
    const row = check(await db().from("chat_conversations").update(snake(rest)).eq("id", id).select().single());
    return camel<ChatConversation>(row);
  },

  async listConversations({ channel, status, since, limit = 200 }) {
    let query = db().from("chat_conversations").select("*").order("last_message_at", { ascending: false }).limit(limit);
    if (channel) query = query.eq("channel", channel);
    if (status) query = query.eq("status", status);
    if (since) query = query.gte("last_message_at", since);
    return must(await query).map((r) => camel<ChatConversation>(r));
  },

  async deleteConversationsBefore(iso) {
    // chat_messages rows go with them (on delete cascade).
    const rows = must(await db().from("chat_conversations").delete().lt("last_message_at", iso).select("id"));
    return rows.length;
  },

  async addChatMessages(messages) {
    if (!messages.length) return;
    const now = Date.now();
    // Distinct timestamps keep the order stable when one turn stores several messages.
    const rows = messages.map((m, i) => ({ ...snake({ ...m }), created_at: new Date(now + i).toISOString() }));
    check(await db().from("chat_messages").insert(rows));
  },

  async listChatMessages(conversationId, opts) {
    let query = db()
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: !opts?.last });
    if (opts?.last) query = query.limit(opts.last);
    const rows = must(await query).map((r) => camel<ChatMessage>(r));
    return opts?.last ? rows.toReversed() : rows;
  },

  async listRecentUserMessages(since, limit) {
    const rows = must(
      await db()
        .from("chat_messages")
        .select("*")
        .eq("role", "user")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit),
    );
    return rows.map((r) => camel<ChatMessage>(r));
  },

  async countUserMessagesSince(iso) {
    const res = await db()
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", iso);
    check(res);
    return res.count ?? 0;
  },

  async listKbSources() {
    const rows = must(await db().from("kb_sources").select("*").order("created_at", { ascending: false }));
    return rows.map((r) => camel<KbSource>(r));
  },

  async getKbSource(id) {
    const row = check(await db().from("kb_sources").select("*").eq("id", id).maybeSingle());
    return row ? camel<KbSource>(row) : null;
  },

  async saveKbSource(item) {
    const { id, createdAt: _c, updatedAt: _u, ...rest } = item;
    const res = id
      ? await db().from("kb_sources").update(snake(rest)).eq("id", id).select().single()
      : await db().from("kb_sources").insert(snake(rest)).select().single();
    return camel<KbSource>(must(res));
  },

  async deleteKbSource(id) {
    check(await db().from("kb_sources").delete().eq("id", id)); // chunks cascade
  },

  async listKbChunks(sourceId) {
    const rows = must(await db().from("kb_chunks").select("*").eq("source_id", sourceId));
    return rows.map((r) => {
      const c = camel<KbChunk & { embedding: unknown }>(r);
      // pgvector values come back as the text "[0.1,0.2,...]".
      return { ...c, embedding: typeof c.embedding === "string" ? (JSON.parse(c.embedding) as number[]) : null };
    });
  },

  async replaceKbChunks(sourceId, chunks) {
    check(await db().from("kb_chunks").delete().eq("source_id", sourceId));
    for (let i = 0; i < chunks.length; i += 100) {
      const rows = chunks.slice(i, i + 100).map((c) => ({ ...snake({ ...c }), source_id: sourceId }));
      check(await db().from("kb_chunks").insert(rows));
    }
    check(await db().from("kb_sources").update({ chunk_count: chunks.length }).eq("id", sourceId));
  },

  async searchKb({ embedding, terms, limit }) {
    const rows = must(
      await db().rpc("match_kb_chunks", {
        query_embedding: embedding ? JSON.stringify(embedding) : null,
        query_terms: terms.join(" | "),
        match_count: limit,
      }),
    ) as Record<string, unknown>[];
    return rows.map((r) => camel<KbMatch>(r));
  },

  async getChatbotSettings() {
    const row = check(await db().from("chatbot_settings").select("value").eq("id", 1).maybeSingle());
    return { ...defaultChatbotSettings, ...((row?.value as Partial<ChatbotSettings>) ?? {}) };
  },

  async saveChatbotSettings(settings) {
    check(
      await db().from("chatbot_settings").upsert({ id: 1, value: settings, updated_at: new Date().toISOString() }),
    );
  },
};
