import { getAdmin } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // block spreadsheet formula injection
  return `"${safe.replace(/"/g, '""')}"`;
};

// GET /api/admin/conversations-csv: chatbot conversations (not their transcripts).
export async function GET() {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const rows = (await store.listConversations({ limit: 5000 })).filter((c) => c.channel !== "playground");
  const header = ["Started", "Last message", "Channel", "Status", "Name", "Email", "Phone", "Messages", "Cost (USD)", "Reviewed", "Note"];
  const lines = rows.map((c) =>
    [c.createdAt, c.lastMessageAt, c.channel, c.status, c.visitorName, c.visitorEmail, c.visitorPhone, c.messageCount, Number(c.costUsd).toFixed(4), c.reviewed ? "yes" : "no", c.note]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chat-conversations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
