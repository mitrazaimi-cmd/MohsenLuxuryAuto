# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The personal-brand website for **Mohsen Luxury Auto** (a Mercedes-Benz sales specialist). The site has one goal: get visitors to **book a purchase/leasing consultation**. The repo also holds the brand guide (`Mohsen_Luxury_Auto_Brand_Guide.md` + `.pdf`), logos, and the original build prompt (`Mohsen_Website_Prompt.md`).

## Commands

```bash
npm run dev         # http://localhost:3000, admin at /admin (login in .env.local)
npm run build       # production build (Turbopack); also type-checks
npm run typecheck   # tsc --noEmit
```

There is no test suite and no linter (`next lint` was removed in Next 16). Verify changes with `typecheck`/`build`, then run the app and exercise the affected pages.

Regenerate the brand-guide PDF from its HTML source (headless Edge):

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --virtual-time-budget=15000 --print-to-pdf="<abs path>/Mohsen_Luxury_Auto_Brand_Guide.pdf" "file:///<abs path>/brand-guide/brand-guide.html"
```

## Next.js 16

This is Next.js 16, which differs from older training data. Read the bundled docs in `node_modules/next/dist/docs/` before using an unfamiliar API (see `AGENTS.md`). Rules that matter here:

- `params`, `searchParams`, `cookies()` and `headers()` are async and must be awaited.
- `middleware` is now called `proxy`. This project uses neither; auth checks live in pages, actions and routes.
- `revalidateTag` requires a second argument.

## Design authority

`Mohsen_Luxury_Auto_Brand_Guide.md` overrides everything else, including the ui-ux-pro-max skill. `design-system/mohsen-luxury-auto/MASTER.md` is the skill's output, corrected to the brand guide, with a table of what was overridden. Read it before UI work.

The brand in short:
- **Colors:** black background, silver text, gold #D9AE5F for accents only.
- **Fonts:** Cinzel for headings (uppercase, wide letter spacing), Montserrat for body text.
- **Imagery:** dark and cinematic.
- **Never:** the Mercedes-Benz star, or urgency or "cheap" wording.

All site copy is English.

Styling is plain CSS in `app/globals.css` (tokens on `:root`, no Tailwind). CSS patterns to know before editing it:
- **Reveal animations:** `.reveal` elements are hidden only under `html.js`, a class set by an inline script in `app/layout.tsx`. `components/reveal.tsx` adds `.in` when they scroll into view.
- **`[hidden]` rule:** `[hidden] { display: none !important }` is required. Without it, classes like `.form { display: grid }` override `hidden` (the booking steps rely on this).
- **Logo blending:** the logo PNG has a black background. Logo images get `mix-blend-mode: lighten` (`.hero-logo`, `.footer-logo`, `.brand-link img`, `.blend`) so the black square melts into glows and panels.

## Architecture

**Integrations switch on by environment variable** (`lib/env.ts` → `integrations`). With no keys the whole site still works in "local mode":
- **Supabase:** missing → data goes to `.data/db.json` and photo uploads to `.data/uploads/`, served by `app/api/media/[name]`.
- **Google Calendar:** missing → only bookings made on the site block times.
- **Resend:** missing → emails are written to `.data/outbox/` and viewed in Admin → Emails.

**Storage abstraction.** `lib/db/types.ts` defines the `Store` interface. `lib/db/local.ts` (JSON file, writes serialized through a promise chain) and `lib/db/supabase.ts` (service-role client) both implement it; `lib/db/index.ts` picks one.
- **Keeping them in sync:** any data change must update both implementations and `supabase/migrations/`.
- **Naming:** the Supabase layer maps camelCase ↔ snake_case automatically.
- **Double-booking guard:** in Supabase, the `bookings_no_overlap` exclusion constraint. Error `23P01` is turned into `SlotTakenError`. The local store checks for overlaps inside its write lock.

**Booking flow:**
1. **Available times:** `lib/slots.ts` builds the open slots. It starts from working hours and settings (stored in the DB, edited in Admin → Settings), then removes Google free/busy times, existing bookings plus buffer, minimum notice and blocked dates.
2. **Time zones:** all instants are stored in UTC and shown in `America/New_York`, using the dependency-free helpers in `lib/time.ts`. Don't use naive `Date` math on wall-clock times.
3. **Submission:** the server action `actions/public.ts#createBookingAction` re-checks the slot, then upserts the contact and creates the booking.
4. **Calendar and emails:** these run in `after()`, via `lib/bookings.ts#afterBookingCreated`.
5. **Rest of the lifecycle:** reschedule, cancel, reminders and follow-ups are all in `lib/bookings.ts`.
6. **Client self-service:** clients manage a booking through `/manage/[token]`, using the booking's random `manageToken`.

**Emails.**
- **Templates:** `lib/email/templates.ts` holds table-based, inline-styled HTML; user input must go through `esc()`.
- **Sending:** `lib/email/send.ts` sends through Resend or writes to the outbox, and logs every email to `email_log`.
- **Scheduled jobs:** reminders and follow-ups are cron routes (`app/api/cron/*`, bearer `CRON_SECRET`), scheduled once a day in `vercel.json` (the Vercel Hobby limit).
- **No duplicates:** `reminderSentAt` and `followupSentAt` on each booking stop repeat sends.

**Admin auth.** A single admin, using `ADMIN_EMAIL` + `ADMIN_PASSWORD` from the environment, and a jose-signed http-only cookie (`lib/auth.ts`). There is no Supabase Auth. Call `requireAdmin()` / `getAdmin()` in every admin page, server action and API route; the `(panel)` layout check alone is not enough.

**Routes.**
- **`app/(site)/`:** public pages with header and footer, plus JSON-LD in its layout.
- **`app/admin/`:** has its own layout. `login` sits outside the `(panel)` group.
- **`app/not-found.tsx`:** sits at the root and renders its own header and footer.
- **Server actions:** in `actions/`.

**Public business details** live only in `config/site.ts`. Fields that are still unknown (the Facebook URL) are empty strings and the UI hides or softly marks them; don't invent values. Brand images are in `public/brand/` and come from `Mohsen_Luxury_Auto_Logo.png`. `monogram.png` is the "M" cropped from that logo.

## Setup and deployment

`README.md` covers going live in four stages:
1. Supabase: run `supabase/migrations/0001_init.sql`.
2. Google Calendar: through a service account that Mohsen's calendar is shared with.
3. Resend: needs a verified domain.
4. Vercel: set the environment variables listed in `.env.example`.

`.env.local` and `.data/` are gitignored. The live site needs Supabase, because Vercel's file system is temporary.
