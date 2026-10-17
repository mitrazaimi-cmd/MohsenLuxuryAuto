import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/actions/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const unread = (await store.listMessages()).filter((m) => !m.read).length;
  const missing = [
    !integrations.supabase && "database (Supabase)",
    !integrations.google && "Google Calendar",
    !integrations.resend && "email sending (Resend)",
  ].filter(Boolean);

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/" aria-label="View website">
          <Image className="blend" src="/brand/logo.png" alt="Mohsen Luxury Auto" width={1774} height={887} />
        </Link>
        <AdminNav unread={unread} />
        <div style={{ marginTop: 28, fontSize: "0.78rem" }} className="muted">
          <div style={{ wordBreak: "break-all" }}>{admin}</div>
          <form action={logoutAction} style={{ marginTop: 10 }}>
            <button type="submit" className="btn btn-ghost" style={{ minHeight: 36, fontSize: "0.7rem" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="admin-main">
        {missing.length ? (
          <p className="mode-banner">
            Local mode for: {missing.join(", ")}. Everything works on this computer; see the README to connect
            each service.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
