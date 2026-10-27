"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/chatbot", label: "Overview" },
  { href: "/admin/chatbot/conversations", label: "Conversations" },
  { href: "/admin/chatbot/knowledge", label: "Knowledge" },
  { href: "/admin/chatbot/behavior", label: "Behavior" },
  { href: "/admin/chatbot/channels", label: "Widget & channels" },
  { href: "/admin/chatbot/playground", label: "Playground" },
];

export function ChatbotTabs() {
  const pathname = usePathname();
  return (
    <div className="tabs" role="navigation" aria-label="Chatbot sections">
      {TABS.map((t) => {
        const active = t.href === "/admin/chatbot" ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
