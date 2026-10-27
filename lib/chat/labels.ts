import type { ChatChannel, ConversationStatus } from "@/lib/db/types";

export const CHANNEL_LABEL: Record<ChatChannel, string> = {
  web: "Chat button",
  page: "/chat page",
  telegram: "Telegram",
  playground: "Playground (test)",
};

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "Browsing",
  lead: "Lead",
  booked: "Booked",
  handoff: "Asked for Mohsen",
};
