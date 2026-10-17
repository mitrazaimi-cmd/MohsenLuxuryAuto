import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/db";
import { site } from "@/config/site";
import { formatDate } from "@/lib/time";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const [contacts, bookings] = await Promise.all([store.listContacts(q), store.listBookings({})]);
  const counts = new Map<string, number>();
  for (const b of bookings) counts.set(b.contactId, (counts.get(b.contactId) ?? 0) + 1);
  const optedIn = contacts.filter((c) => c.marketingOptIn && !c.unsubscribed).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 style={{ marginTop: 8 }}>Contacts</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {contacts.length} contacts · {optedIn} opted in to news and offers
          </p>
        </div>
        <div className="actions" style={{ gap: 10 }}>
          <a className="btn btn-outline btn-sm" href="/api/admin/contacts-csv">Export all (CSV)</a>
          <a className="btn btn-gold btn-sm" href="/api/admin/contacts-csv?optedIn=1">Export opted-in (CSV)</a>
        </div>
      </div>

      <form className="inline-form" style={{ marginBottom: 20 }}>
        <label htmlFor="q" className="sr-only">Search contacts</label>
        <input id="q" name="q" className="input" placeholder="Search name, email or phone" defaultValue={q} style={{ minWidth: 280 }} />
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
      </form>

      {contacts.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Bookings</th>
                <th>News &amp; offers</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--silver-hi)" }}>{c.name}</td>
                  <td><a className="gold" href={`mailto:${c.email}`}>{c.email}</a></td>
                  <td>{c.phone || <span className="muted">—</span>}</td>
                  <td>{counts.get(c.id) ?? 0}</td>
                  <td>{c.unsubscribed ? <span className="muted">Unsubscribed</span> : c.marketingOptIn ? <span className="status completed">Opted in</span> : <span className="muted">No</span>}</td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{formatDate(c.createdAt, site.timezone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">{q ? "No contacts match that search." : "Contacts appear here after the first booking or message."}</div>
      )}
    </>
  );
}
