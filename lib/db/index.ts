import "server-only";
import { integrations } from "@/lib/env";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export const store: Store = integrations.supabase ? supabaseStore : localStore;
export * from "./types";
