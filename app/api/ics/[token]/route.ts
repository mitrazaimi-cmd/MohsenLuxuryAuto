import { store } from "@/lib/db";
import { bookingIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

// "Add to calendar" download on the confirmation and manage pages.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await store.getBookingByToken(token);
  if (!b) return new Response("Not found", { status: 404 });
  return new Response(bookingIcs(b, b.status === "cancelled" ? "CANCEL" : "PUBLISH"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="consultation.ics"' },
  });
}
