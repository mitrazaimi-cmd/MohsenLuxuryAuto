import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { integrations } from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await store.getSettings();
  const services = [
    ["Database", integrations.supabase, "Supabase"],
    ["Calendar", integrations.google, "Google Calendar"],
    ["Email sending", integrations.resend, "Resend"],
  ] as const;

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Settings</h1>
        </div>
      </div>
      <div className="grid grid-3" style={{ marginBottom: 32, maxWidth: 820 }}>
        {services.map(([label, on, name]) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <div className="label" style={{ color: "var(--muted)" }}>{label}</div>
            <div style={{ marginTop: 6, color: on ? "var(--ok)" : "var(--gold)" }}>{on ? `Connected: ${name}` : "Local mode"}</div>
          </div>
        ))}
      </div>
      <SettingsForm settings={settings} />
    </>
  );
}
