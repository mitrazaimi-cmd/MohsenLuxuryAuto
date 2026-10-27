"use client";

import { useActionState, useRef } from "react";
import type { AdminState } from "@/actions/admin";
import { saveChatbotSettingsAction, saveTextSourceAction, uploadPdfAction } from "@/actions/chatbot";
import type { ChatbotSettings, KbSource } from "@/lib/db/types";

function Notice({ state }: { state: AdminState }) {
  if (!state.message) return null;
  return (
    <div className={`notice ${state.ok ? "ok-notice" : "error-notice"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </div>
  );
}

function Submit({ pending, label, busy }: { pending: boolean; label: string; busy: string }) {
  return (
    <div>
      <button type="submit" className="btn btn-gold" disabled={pending} aria-disabled={pending}>
        {pending ? busy : label}
      </button>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function BehaviorForm({
  settings: s,
  models,
}: {
  settings: ChatbotSettings;
  models: { id: string; label: string; price: string }[];
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveChatbotSettingsAction, {});
  return (
    <form action={action} className="form" style={{ maxWidth: 820 }}>
      <input type="hidden" name="section" value="behavior" />

      <section className="card gold-top" aria-labelledby="persona-title">
        <h2 id="persona-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Persona and first impression</h2>
        <div className="form-row">
          <Field id="assistantName" label="Assistant name">
            <input id="assistantName" name="assistantName" className="input" defaultValue={s.assistantName} maxLength={60} />
          </Field>
          <Field id="suggestBookingAfter" label="Suggest a consultation after" hint="Helpful answers before the first gentle suggestion. Buying signals (a model, a timeline) trigger it sooner.">
            <input id="suggestBookingAfter" name="suggestBookingAfter" type="number" min={1} max={10} className="input" defaultValue={s.suggestBookingAfter} />
          </Field>
        </div>
        <Field id="welcomeMessage" label="Welcome message" hint="The first thing visitors read. Say what the assistant can help with.">
          <textarea id="welcomeMessage" name="welcomeMessage" className="textarea" style={{ minHeight: 80 }} defaultValue={s.welcomeMessage} maxLength={600} />
        </Field>
        <Field id="starterQuestions" label="Suggested questions" hint="One per line, up to 6. Shown as buttons before the first message: the fastest way to start a conversation.">
          <textarea id="starterQuestions" name="starterQuestions" className="textarea" style={{ minHeight: 110 }} defaultValue={s.starterQuestions.join("\n")} />
        </Field>
        <Field id="tone" label="Tone and style">
          <textarea id="tone" name="tone" className="textarea" style={{ minHeight: 70 }} defaultValue={s.tone} maxLength={600} />
        </Field>
      </section>

      <section className="card" aria-labelledby="rules-title">
        <h2 id="rules-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Rules and guardrails</h2>
        <Field id="instructions" label="Additional instructions" hint="Anything the assistant should always do or know, e.g. current promotions policy, how to talk about trade-ins, Saturday hours.">
          <textarea id="instructions" name="instructions" className="textarea" style={{ minHeight: 140 }} defaultValue={s.instructions} maxLength={4000} />
        </Field>
        <Field id="avoidTopics" label="Topics to avoid" hint="The assistant declines these politely and offers a consultation instead.">
          <textarea id="avoidTopics" name="avoidTopics" className="textarea" style={{ minHeight: 70 }} defaultValue={s.avoidTopics} maxLength={1000} />
        </Field>
        <Field id="handoffMessage" label="Message when a visitor asks for Mohsen" hint="Mohsen also gets an email and a Telegram alert.">
          <input id="handoffMessage" name="handoffMessage" className="input" defaultValue={s.handoffMessage} maxLength={300} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" name="requirePhone" defaultChecked={s.requirePhone} />
          <span>Require a phone number to book (email is always required)</span>
        </label>
      </section>

      <section className="card" aria-labelledby="model-title">
        <h2 id="model-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Model and limits</h2>
        <div className="form-row">
          <Field id="model" label="Conversation model">
            <select id="model" name="model" className="select" defaultValue={s.model}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label} ({m.price})</option>
              ))}
            </select>
          </Field>
          <Field id="thinkingLevel" label="Thinking depth" hint="Low is fast and enough for most chats.">
            <select id="thinkingLevel" name="thinkingLevel" className="select" defaultValue={s.thinkingLevel}>
              <option value="low">Low (fastest)</option>
              <option value="medium">Medium</option>
              <option value="high">High (slowest)</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field id="maxReplyWords" label="Reply length (words)" hint="Shorter replies read better in a chat window.">
            <input id="maxReplyWords" name="maxReplyWords" type="number" min={40} max={400} className="input" defaultValue={s.maxReplyWords} />
          </Field>
          <Field id="dailyMessageCap" label="Daily message limit" hint="Visitor messages per day across all channels; protects against abuse and runaway costs.">
            <input id="dailyMessageCap" name="dailyMessageCap" type="number" min={10} max={20000} className="input" defaultValue={s.dailyMessageCap} />
          </Field>
          <Field id="retentionDays" label="Keep conversations (days)" hint="Older conversations are deleted automatically each day.">
            <input id="retentionDays" name="retentionDays" type="number" min={7} max={3650} className="input" defaultValue={s.retentionDays} />
          </Field>
        </div>
      </section>

      <Notice state={state} />
      <Submit pending={pending} label="Save behavior" busy="Saving…" />
    </form>
  );
}

export function ChannelsForm({ settings: s }: { settings: ChatbotSettings }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveChatbotSettingsAction, {});
  return (
    <form action={action} className="form" style={{ maxWidth: 820 }}>
      <input type="hidden" name="section" value="channels" />
      <section className="card gold-top" aria-labelledby="where-title">
        <h2 id="where-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Where the assistant appears</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <label className="checkbox"><input type="checkbox" name="enabled" defaultChecked={s.enabled} /><span>Assistant on (switch off to pause every channel)</span></label>
          <label className="checkbox"><input type="checkbox" name="widgetEnabled" defaultChecked={s.widgetEnabled} /><span>Chat button on every page</span></label>
          <label className="checkbox"><input type="checkbox" name="pageEnabled" defaultChecked={s.pageEnabled} /><span>Full chat page at /chat</span></label>
          <label className="checkbox"><input type="checkbox" name="telegramEnabled" defaultChecked={s.telegramEnabled} /><span>Telegram bot</span></label>
        </div>
      </section>
      <section className="card" aria-labelledby="widget-title">
        <h2 id="widget-title" className="h3" style={{ marginTop: 0, marginBottom: 20 }}>Chat button</h2>
        <div className="form-row">
          <Field id="launcherLabel" label="Button text">
            <input id="launcherLabel" name="launcherLabel" className="input" defaultValue={s.launcherLabel} maxLength={40} />
          </Field>
          <Field id="widgetPosition" label="Position">
            <select id="widgetPosition" name="widgetPosition" className="select" defaultValue={s.widgetPosition}>
              <option value="right">Bottom right</option>
              <option value="left">Bottom left</option>
            </select>
          </Field>
          <Field id="greetingDelaySeconds" label="Greeting bubble after (seconds)" hint="0 = off. Shows the welcome line next to the button once per visit.">
            <input id="greetingDelaySeconds" name="greetingDelaySeconds" type="number" min={0} max={600} className="input" defaultValue={s.greetingDelaySeconds} />
          </Field>
        </div>
        <Field id="hiddenPaths" label="Hide the button on these pages" hint="One path per line, e.g. /book. The /chat page never shows it.">
          <textarea id="hiddenPaths" name="hiddenPaths" className="textarea" style={{ minHeight: 70 }} defaultValue={s.hiddenPaths.join("\n")} />
        </Field>
      </section>
      <Notice state={state} />
      <Submit pending={pending} label="Save" busy="Saving…" />
    </form>
  );
}

export function PdfUploadForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(uploadPdfAction, {});
  return (
    <form action={action} className="form">
      <Field id="kb-file" label="PDF file" hint="Brochures, price-free model guides, policies, FAQs. Up to 4 MB; text-based PDFs (not scans).">
        <input id="kb-file" name="file" type="file" accept="application/pdf,.pdf" className="input" required />
      </Field>
      <Notice state={state} />
      <Submit pending={pending} label="Add PDF" busy="Reading and indexing…" />
    </form>
  );
}

export function TextSourceForm({ kind, source }: { kind: "text" | "qa"; source?: KbSource }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveTextSourceAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const qa = kind === "qa";
  const uid = source?.id ?? kind;
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        if (!source) formRef.current?.reset();
      }}
      className="form"
    >
      <input type="hidden" name="kind" value={kind} />
      {source ? <input type="hidden" name="id" value={source.id} /> : null}
      <Field id={`t-${uid}`} label={qa ? "Question" : "Title"}>
        <input id={`t-${uid}`} name="title" className="input" defaultValue={source?.title} maxLength={200} placeholder={qa ? "Do you take trade-ins from other brands?" : "Saturday service hours"} />
      </Field>
      <Field id={`b-${uid}`} label={qa ? "Answer" : "Text"} hint={qa ? undefined : "Use lines starting with # for headings in longer texts."}>
        <textarea id={`b-${uid}`} name="body" className="textarea" style={{ minHeight: qa ? 100 : 180 }} defaultValue={source?.body} />
      </Field>
      <Notice state={state} />
      <Submit pending={pending} label={source ? "Save changes" : qa ? "Add Q&A" : "Add text"} busy="Saving…" />
    </form>
  );
}
