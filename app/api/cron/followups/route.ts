import { runFollowups } from "@/lib/bookings";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Called by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });
  const result = await runFollowups();
  return Response.json(result);
}
