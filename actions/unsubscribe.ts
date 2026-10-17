"use server";

import { redirect } from "next/navigation";
import { store } from "@/lib/db";

export async function unsubscribeAction(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  if (token) await store.unsubscribe(token);
  redirect("/unsubscribe?done=1");
}
