"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Bookings" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/chatbot", label: "Chatbot" },
  { href: "/admin/portfolio", label: "Portfolio photos" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/stories", label: "Client stories" },
  { href: "/admin/outbox", label: "Emails" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href || (l.href !== "/admin" && pathname.startsWith(`${l.href}/`)) ? "page" : undefined}
        >
          {l.label}
          {l.href === "/admin/messages" && unread ? <span className="badge" aria-label={`${unread} unread`}>{unread}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
