import { runFollowups } from "@/lib/bookings";
import { pruneConversations } from "@/lib/chat/agent";
import { safeEqual } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Called by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
// Also deletes chat conversations past the retention period in Admin → Chatbot.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });
  const result = await runFollowups();
  const conversationsDeleted = await pruneConversations().catch((err) => {
    console.error("[cron] chat retention failed:", err);
    return 0;
  });
  return Response.json({ ...result, conversationsDeleted });
}
