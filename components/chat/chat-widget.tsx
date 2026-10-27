"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Close, MessageCircle } from "@/components/icons";
import { ChatPanel, type PublicChatConfig } from "./chat-panel";

interface WidgetConfig extends PublicChatConfig {
  widget: boolean;
  launcherLabel: string;
  position: "right" | "left";
  greetingDelaySeconds: number;
  hiddenPaths: string[];
}

const GREETED = "mla-chat-greeted";

// The floating "Ask a question" button on every public page. Hidden on /chat,
// on paths listed in Admin → Chatbot, and whenever the assistant is switched off.
export function ChatWidget() {
  const pathname = usePathname();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState(false);

  useEffect(() => {
    fetch("/api/chat/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c: WidgetConfig | null) => setConfig(c))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    if (!config?.greetingDelaySeconds || open) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(GREETED) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setGreeting(true), config.greetingDelaySeconds * 1000);
    return () => clearTimeout(t);
  }, [config, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!config?.widget || pathname === "/chat" || config.hiddenPaths.some((p) => p && pathname.startsWith(p))) return null;

  function show() {
    setOpen(true);
    setGreeting(false);
    try {
      sessionStorage.setItem(GREETED, "1");
    } catch {}
  }

  return (
    <div className={`chat-widget ${config.position === "left" ? "left" : "right"}`}>
      {open ? (
        <div className="chat-window" role="dialog" aria-modal="false" aria-label={config.assistantName}>
          <ChatPanel config={config} channel="web" onClose={() => setOpen(false)} />
        </div>
      ) : null}
      {greeting && !open ? (
        <div className="chat-greeting">
          <button type="button" className="chat-greeting-text" onClick={show}>
            {config.welcomeMessage.split(/(?<=[.!?])\s/)[0]}
          </button>
          <button type="button" className="icon-btn" onClick={() => setGreeting(false)} aria-label="Dismiss">
            <Close width={14} height={14} />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="chat-launcher"
        onClick={() => (open ? setOpen(false) : show())}
        aria-expanded={open}
        aria-label={open ? "Close chat" : config.launcherLabel}
      >
        {open ? <Close width={22} height={22} /> : <MessageCircle width={22} height={22} />}
        {open ? null : <span>{config.launcherLabel}</span>}
      </button>
    </div>
  );
}
