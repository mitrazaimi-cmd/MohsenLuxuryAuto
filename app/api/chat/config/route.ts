import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

// Public widget settings, fetched by the browser after the page loads so the
// site's pages can stay static.

export async function GET() {
  if (!integrations.gemini) return Response.json({ widget: false, page: false });
  // Before 0002_chatbot.sql runs on Supabase there are no settings: keep the widget hidden.
  const bot = await store.getChatbotSettings().catch(() => null);
  if (!bot) return Response.json({ widget: false, page: false });
  const on = bot.enabled;
  return Response.json(
    {
      widget: on && bot.widgetEnabled,
      page: on && bot.pageEnabled,
      assistantName: bot.assistantName,
      welcomeMessage: bot.welcomeMessage,
      starterQuestions: bot.starterQuestions,
      launcherLabel: bot.launcherLabel,
      position: bot.widgetPosition,
      greetingDelaySeconds: bot.greetingDelaySeconds,
      hiddenPaths: bot.hiddenPaths,
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
