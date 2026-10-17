import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdmin().catch(() => null)) redirect("/admin");
  return (
    <main id="main" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "48px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Image className="blend" src="/brand/logo.png" alt="Mohsen Luxury Auto" width={1774} height={887} style={{ width: 240, height: "auto", margin: "0 auto 40px" }} priority />
        <div className="card gold-top">
          <span className="eyebrow">Admin</span>
          <h1 className="h3" style={{ marginTop: 12, fontSize: "1.4rem" }}>Sign in</h1>
          <div style={{ marginTop: 28 }}>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
