# Mohsen Luxury Auto: Website

The website for Mohsen Luxury Auto. Its one goal: guide every visitor to **book a purchase or leasing consultation with Mohsen**.

- **Design:** follows `Mohsen_Luxury_Auto_Brand_Guide.md`. The design system lives in `design-system/mohsen-luxury-auto/MASTER.md`; it was generated with the ui-ux-pro-max skill and corrected to the brand guide, which always wins.
- **Pages:** Home, Services, Portfolio, About Me, Contact, Book a Consultation, booking confirmation, manage booking (reschedule/cancel), privacy, unsubscribe, and an admin panel at `/admin`.
- **Stack:** Next.js 16 (App Router, TypeScript), Supabase (database + photo storage), Google Calendar (availability + events), Resend (email), hosted on Vercel.

## Run it on this computer

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin; the login is in `.env.local` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

**Local mode.** With no service keys, everything still works end to end:

| Service missing | What happens instead |
|---|---|
| Supabase | Data is saved in `.data/db.json`; photos in `.data/uploads/` |
| Google Calendar | Only bookings made on the site block times |
| Resend | Emails are saved as previews: **Admin → Emails → View preview** |

Each service switches on automatically as soon as its keys are in `.env.local` (and in Vercel for the live site). Restart `npm run dev` after editing `.env.local`.

## Going live, stage by stage

### Stage 1: Database (Supabase)

You need: a free Supabase account.

1. Create a project at https://supabase.com (region: East US).
2. Open **SQL Editor**, paste all of `supabase/migrations/0001_init.sql`, and run it. This creates the tables, security rules, the `media` photo bucket, and the first testimonial.
3. **Project Settings → API**: copy the Project URL into `SUPABASE_URL` and the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key secret; it is used only on the server.

### Stage 2: Calendar (Google Calendar)

You need: Mohsen's Google account and a free Google Cloud project.

1. At https://console.cloud.google.com create a project and enable the **Google Calendar API**.
2. **IAM & Admin → Service Accounts**: create a service account, then **Keys → Add key → JSON** and download the file.
3. In Google Calendar (Mohsen's account): **Settings → the calendar → Share with specific people**. Add the service account's email with **Make changes to events**.
4. Fill in `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the JSON
   - `GOOGLE_PRIVATE_KEY`: `private_key` from the JSON, in double quotes, keeping the `\n`
   - `GOOGLE_CALENDAR_ID`: from **Calendar settings → Integrate calendar** (usually Mohsen's Gmail address)

From then on, busy times in Mohsen's calendar are never offered, and every booking appears in his calendar with the client's details.

### Stage 3: Email (Resend)

You need: the website's domain (for example mohsenluxuryauto.com) and a free Resend account (3,000 emails per month).

1. Register the domain (any registrar).
2. At https://resend.com → **Domains**, add the domain and add the DNS records Resend shows you at your registrar. Wait for "Verified".
3. **API Keys**: create a key and put it in `RESEND_API_KEY`.
4. Set `EMAIL_FROM`, e.g. `Mohsen Luxury Auto <mohsen@mohsenluxuryauto.com>`, and `EMAIL_REPLY_TO` to the inbox Mohsen reads.

Emails sent: booking confirmation (with a calendar invite), an alert to Mohsen, a reminder the day before, a follow-up the day after, plus reschedule and cancellation confirmations. Contacts who tick the news-and-offers box are stored with their consent; export them from **Admin → Contacts**.

### Stage 4: Hosting (Vercel)

You need: a free Vercel account and a GitHub account.

1. Put this folder in a GitHub repository (`.env.local` and `.data/` are already ignored).
2. At https://vercel.com import the repository.
3. **Settings → Environment Variables**: add every variable from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the real domain; generate new `ADMIN_PASSWORD`, `SESSION_SECRET` and `CRON_SECRET` values for production.
4. **Settings → Domains**: connect the domain.
5. `vercel.json` already schedules the daily jobs: reminders at 13:00 UTC (8–9 AM Eastern) and follow-ups at 15:00 UTC (10–11 AM Eastern). Vercel sends `CRON_SECRET` automatically.

The live site needs Supabase (Stage 1). Vercel's file system is temporary, so local mode is for this computer only.

## Admin panel (`/admin`)

- **Bookings:** today, upcoming, past, cancelled; filter by model; change status (cancelling frees the time, removes the calendar event and can email the client); private notes.
- **Contacts:** search; export all, or only those opted in to news, as CSV.
- **Messages:** contact-form inbox.
- **Portfolio photos / Testimonials / Client stories:** add, edit, order, hide/publish, with photo upload (under 4 MB).
- **Emails:** every email sent (or previewed), plus buttons to run reminders and follow-ups now.
- **Settings:** working hours, consultation length, break between consultations, booking window, minimum notice, days off, alert email.

Mark a booking **No-show** to skip its follow-up email. Bookings still "Upcoming" after they end are treated as held: they get the follow-up and move to "Completed".

## Placeholders to fill in

All of Mohsen's public details live in **`config/site.ts`**. Empty fields are hidden or softly marked on the site.

| What | Where |
|---|---|
| Last name, phone, email, dealership name and address | `config/site.ts` → `person`, `contact` |
| Instagram, LinkedIn, Facebook links | `config/site.ts` → `social` |
| Professional portrait | `app/(site)/about/page.tsx` (marked TODO) |
| Delivery photos, testimonials, client stories | Admin panel |
| Domain | `NEXT_PUBLIC_SITE_URL` |
| Privacy policy review | `app/(site)/privacy/page.tsx` |
| Logo light and one-color versions | Not needed by the site yet |

## Project map

```
app/(site)/          public pages (home, services, portfolio, about, contact, book, manage, privacy, unsubscribe)
app/admin/           admin login and panel
app/api/             availability, media, ICS download, CSV export, cron jobs
actions/             server actions (public forms, admin)
components/          UI components
config/site.ts       Mohsen's public details
lib/db/              storage: local JSON file or Supabase (same interface)
lib/calendar.ts      Google Calendar
lib/slots.ts         availability rules
lib/email/           brand email templates and sending
lib/bookings.ts      booking lifecycle (confirm, reschedule, cancel, reminders, follow-ups)
supabase/migrations/ database schema
design-system/       ui-ux-pro-max design system, aligned to the brand guide
```

## Requirement checklist

| Requirement | Where |
|---|---|
| Brand guide has priority on design | `design-system/mohsen-luxury-auto/MASTER.md`, `app/globals.css` |
| ui-ux-pro-max skill used | Design system generated and persisted; UX, landing and Next.js searches applied; pre-delivery checklist passed |
| Goal: guide visitors to book | Sticky header CTA, CTA at the end of every page and section, 2-step booking |
| Services | `/services` |
| About Me | `/about` |
| Contact Me | `/contact` (form saved to the database, plus direct booking) |
| Portfolio | `/portfolio` (delivery gallery with filter and lightbox, stories, testimonials, stats) |
| Bookings stored in a backend | `lib/db` (Supabase or local file), `/admin` |
| Emails to clients | Confirmation, reminder, follow-up, reschedule, cancellation; newsletter-ready contact list with consent and unsubscribe |
| Google Calendar | `lib/calendar.ts`, `lib/slots.ts` |
| No double bookings | Re-check on submit + database exclusion constraint (Supabase) / serialized writes (local) |
