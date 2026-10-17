import { store } from "@/lib/db";
import { getAvailability } from "@/lib/slots";

export const dynamic = "force-dynamic";

// GET /api/availability            → open slots for new bookings
// GET /api/availability?token=...  → open slots when rescheduling that booking
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  let ignoreBookingId: string | undefined;
  if (token) {
    const b = await store.getBookingByToken(token);
    if (!b) return Response.json({ error: "Booking not found" }, { status: 404 });
    ignoreBookingId = b.id;
  }
  try {
    const days = await getAvailability({ ignoreBookingId });
    return Response.json({ days }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[availability]", err);
    return Response.json({ error: "Availability is temporarily unavailable." }, { status: 503 });
  }
}
