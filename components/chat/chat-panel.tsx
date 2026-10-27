"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Calendar, Check, Close, Refresh, Send } from "@/components/icons";
import { RichText } from "./rich-text";

// The conversation UI shared by the floating widget, the /chat page and the
// admin playground. Talks to /api/chat over server-sent events.

export interface PublicChatConfig {
  assistantName: string;
  welcomeMessage: string;
  starterQuestions: string[];
}

interface Slot {
  startAt: string;
  label: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  slots?: Slot[];
  slotsUsed?: boolean;
  booked?: { when: string; meeting: string; manageUrl: string };
}

interface Session {
  id: string;
  token: string;
}

type Channel = "web" | "page" | "playground";

const storageKey = (channel: Channel) => `mla-chat-${channel}`;

function loadSaved(channel: Channel): { session: Session | null; messages: Message[] } {
  if (channel === "playground") return { session: null, messages: [] };
  try {
    const raw = localStorage.getItem(storageKey(channel));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { session: null, messages: [] };
}

function save(channel: Channel, session: Session | null, messages: Message[]) {
  if (channel === "playground") return;
  try {
    localStorage.setItem(storageKey(channel), JSON.stringify({ session, messages: messages.slice(-60) }));
  } catch {}
}

/** Parses a server-sent-events body into (event, data) pairs as they arrive. */
async function* readEvents(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = /^event: (.+)$/m.exec(raw)?.[1] ?? "message";
      const data = /^data: (.+)$/m.exec(raw)?.[1];
      if (data) yield { event, data: JSON.parse(data) };
    }
  }
}

export function ChatPanel({
  config,
  channel,
  onClose,
  autoFocus = true,
}: {
  config: PublicChatConfig;
  channel: Channel;
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = loadSaved(channel);
    setMessages(saved.messages);
    setSession(saved.session);
  }, [channel]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setError("");
    setDraft("");
    setPending(true);
    setStatus("Thinking…");
    // Time buttons work once: after any new message they're spent.
    const withUser: Message[] = [...messages.map((m) => (m.slots ? { ...m, slotsUsed: true } : m)), { role: "user", text: message }];
    setMessages(withUser);

    let current = session;
    const reply: Message = { role: "assistant", text: "" };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(current ?? {}), message, page: location.pathname, channel }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "The assistant is unavailable right now.");
      }
      for await (const { event, data } of readEvents(res)) {
        if (event === "session") current = data as Session;
        else if (event === "status") setStatus(data.text);
        else if (event === "slots") reply.slots = data.slots;
        else if (event === "booked") reply.booked = { when: data.when, meeting: data.meeting, manageUrl: data.manageUrl };
        else if (event === "reply") reply.text = data.text;
      }
      if (!reply.text) throw new Error("No reply came back. Please try again.");
      const next = [...withUser, reply];
      setMessages(next);
      setSession(current);
      save(channel, current, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      save(channel, current, withUser);
      setSession(current);
    } finally {
      setPending(false);
      setStatus("");
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  }

  function reset() {
    setMessages([]);
    setSession(null);
    setError("");
    save(channel, null, []);
    inputRef.current?.focus();
  }

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div>
          <div className="chat-title">{config.assistantName}</div>
          <div className="chat-sub">Mohsen Luxury Auto · AI assistant</div>
        </div>
        <div className="chat-head-actions">
          {messages.length ? (
            <button type="button" className="icon-btn" onClick={reset} aria-label="Start a new conversation" title="New conversation">
              <Refresh width={18} height={18} />
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close chat">
              <Close width={20} height={20} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="chat-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
        <div className="chat-msg assistant">
          <RichText text={config.welcomeMessage} />
        </div>
        {!messages.length && config.starterQuestions.length ? (
          <div className="chat-chips" aria-label="Suggested questions">
            {config.starterQuestions.map((q) => (
              <button key={q} type="button" className="chat-chip" onClick={() => send(q)} disabled={pending}>
                {q}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === "assistant" ? <RichText text={m.text} /> : <p>{m.text}</p>}
            {m.slots?.length && !m.slotsUsed && !m.booked ? (
              <div className="chat-slots" aria-label="Available times">
                {m.slots.map((s) => (
                  <button key={s.startAt} type="button" className="chat-slot" onClick={() => send(`I'd like ${s.label}.`)} disabled={pending}>
                    <Calendar width={15} height={15} /> {s.label}
                  </button>
                ))}
              </div>
            ) : null}
            {m.booked ? (
              <div className="chat-booked">
                <Check width={18} height={18} />
                <div>
                  <strong>Consultation booked</strong>
                  <div>{m.booked.when}, {m.booked.meeting}</div>
                  <a href={m.booked.manageUrl}>Manage booking</a>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {pending ? (
          <div className="chat-msg assistant chat-typing" aria-label={status || "Thinking"}>
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            {status ? <span className="chat-status">{status}</span> : null}
          </div>
        ) : null}
        {error ? <div className="chat-error" role="alert">{error}</div> : null}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <label htmlFor={`chat-input-${channel}`} className="sr-only">Your message</label>
        <textarea
          id={`chat-input-${channel}`}
          ref={inputRef}
          rows={1}
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about a model, leasing, or a consultation…"
          disabled={pending}
        />
        <button type="submit" className="chat-send" disabled={pending || !draft.trim()} aria-label="Send">
          <Send width={18} height={18} />
        </button>
      </form>
      <p className="chat-note">
        AI assistant. Answers can be imperfect; Mohsen confirms every detail. <a href="/privacy">Privacy</a>
      </p>
    </div>
  );
}
