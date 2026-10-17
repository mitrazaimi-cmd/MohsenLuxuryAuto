import { getAdmin } from "@/lib/auth";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // block spreadsheet formula injection
  return `"${safe.replace(/"/g, '""')}"`;
};

// GET /api/admin/contacts-csv?optedIn=1
export async function GET(request: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const optedIn = new URL(request.url).searchParams.get("optedIn") === "1";
  const contacts = (await store.listContacts()).filter((c) => !optedIn || (c.marketingOptIn && !c.unsubscribed));
  const header = ["Name", "Email", "Phone", "Newsletter opt-in", "Consent date", "Unsubscribed", "Source", "Created"];
  const rows = contacts.map((c) =>
    [c.name, c.email, c.phone, c.marketingOptIn ? "yes" : "no", c.consentAt ?? "", c.unsubscribed ? "yes" : "no", c.source, c.createdAt]
      .map(cell)
      .join(","),
  );
  const csv = "\uFEFF" + [header.map(cell).join(","), ...rows].join("\r\n");
  const name = `mohsen-contacts${optedIn ? "-opted-in" : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
