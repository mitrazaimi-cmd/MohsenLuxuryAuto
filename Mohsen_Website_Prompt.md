# Mohsen Luxury Auto — Website Prompt for Claude Code

**این فایل چیست؟** پرامپت آماده برای Claude Code که وب‌سایت Mohsen Luxury Auto را بر اساس برند گاید طراحی و پیاده‌سازی می‌کند. هدف سایت هدایت بازدیدکننده به رزرو وقت مشاوره‌ی خرید یا لیزینگ با محسن است.

**نحوه‌ی استفاده:**
1. Claude Code را در پوشه‌ی `Mohsen` باز کنید. فایل برند گاید، PDF و لوگو باید در همین پوشه باشند.
2. کل متن داخل کادر زیر را کپی کنید و برای Claude Code بفرستید.
3. Claude Code اول چند سؤال می‌پرسد و یک برنامه پیشنهاد می‌دهد. بعد از تایید شما، کار را مرحله‌به‌مرحله انجام می‌دهد.

**تصمیم‌های گرفته‌شده:**
- **رزرو:** فقط با خود محسن، برای مشاوره‌ی خرید یا لیزینگ، از طریق Google Calendar.
- **تکنولوژی:** Next.js و Supabase، با انتشار روی Vercel.
- **ایمیل:** با سرویس Resend؛ شامل تایید فوری، یادآوری، پیگیری و ذخیره‌ی اطلاعات برای خبرنامه.
- **نمونه کارها:** عکس تحویل خودرو، نظرات مشتریان، داستان مشتریان و آمار.
- **پنل مدیریت:** یک پنل ساده برای محسن.

پرامپت به انگلیسی نوشته شده، چون برای Claude Code دقیق‌تر است و طبق برند گاید محتوای سایت هم باید انگلیسی باشد.

```
# ROLE
You are a senior full-stack engineer and luxury web designer. Build a production-ready website for "Mohsen Luxury Auto", the personal brand of a Master Certified Mercedes-Benz sales specialist with 20 years of experience, based in West Chester, PA.

# THE ONE GOAL
Every visitor should be guided to BOOK A PURCHASE OR LEASING CONSULTATION WITH MOHSEN.
- Every page ends with a clear gold "Book a Consultation" call to action.
- The header keeps a "Book a Consultation" button visible while scrolling (sticky header).
- Each section answers a doubt the client has and then points to booking.
- Booking takes as few steps as possible.

# SOURCE OF TRUTH: THE BRAND GUIDE (read first)
Before anything else, read these files in this folder:
- Mohsen_Luxury_Auto_Brand_Guide.md      (the full brand guide; this is the primary source)
- Mohsen_Luxury_Auto_Brand_Guide.pdf     (the designed version of the same guide)
- Mohsen_Luxury_Auto_Logo.png   (the logo: gold wordmark on black, horizontal 2:1; also see brand-guide/assets/ for logo-full.png and monogram.png, the M alone)

PRIORITY RULE: The brand guide has the final say on every design and content decision: colors, fonts, imagery, voice, wording and logo use. If the ui-ux-pro-max skill, a framework default, a template or your own preference conflicts with the brand guide, the brand guide wins. Use the skill to fill gaps the guide does not cover, never to override it.

# MANDATORY: USE THE ui-ux-pro-max SKILL
You MUST use the ui-ux-pro-max skill for the design of this website. Do not write any UI code before invoking it.
1. Invoke the skill first.
2. Generate a design system and persist it in the project root:
   python "<skill-dir>/scripts/search.py" "luxury automotive personal brand dark gold consultation booking" --design-system --persist -p "Mohsen Luxury Auto" --output-dir "<project-root>"
3. Edit design-system/mohsen-luxury-auto/MASTER.md so it matches the brand guide exactly. Replace the skill's suggested colors and fonts with the brand colors and fonts below, and note in the file that the brand guide overrides it.
4. Use the skill's focused searches while building, for example:
   - "booking form validation" --domain ux
   - "hero social-proof" --domain landing
   - "calendar time slot picker" --domain ux
   - "image gallery lazy loading" --stack nextjs
5. Before you finish, run the skill's pre-delivery checklist and fix every item that fails.

# BRAND RULES DIGEST (from the brand guide)
- Colors: Black #000000 (primary background), Silver #C9C9C9 (main text), Gold #D9AE5F (accents only: buttons, highlights, thin lines). Gold is never used for large areas or long text. A near-black surface such as #0D0D0D or #141414 may be used for cards.
- Fonts (Google Fonts): Cinzel for headings (uppercase, generous letter spacing); Montserrat for body text (regular weight, silver or white on black).
- Imagery: dark and cinematic, with deep shadows, reflections on paintwork and warm highlights. Use delivery photos of Mohsen with clients, and professional portraits.
- Design elements: thin gold hairlines, the car-line swoosh from the logo, and open gold corner frames.
- Logo: a gold wordmark on black. An oversized M starts MOHSEN, a gold car-line swoosh runs through it, and LUXURY AUTO sits below. Place the full logo top and center (hero). Use the M alone for small spaces (favicon, nav, avatar). Never stretch it, recolor it, put it over busy photos, or place it next to the Mercedes-Benz star.
- Never use the Mercedes-Benz star or any official Mercedes-Benz logo anywhere.
- Voice: elegant, trustworthy, warm, like an experienced friend rather than a salesperson. All content is in English.
  - Use: experience, tailored, disclosed, transparent, value.
  - Avoid: cheap, hurry, "deal of the year", "last chance", and pushy urgency of any kind.
- Slogan: "Expect the Best". Descriptor: "Premium Mercedes-Benz Sales Specialist". Location: "West Chester, PA".
- Key messages:
  1. Always available.
  2. A relationship that continues after delivery.
  3. Integrity: everything disclosed, no hidden costs.
- Proof points: 20 years with Mercedes-Benz, Master Certified, top salesperson, 80 to 85 percent repeat clients, highest customer satisfaction and an outstanding CSI score, speaks English, Farsi and some Spanish.

# PAGES AND SECTIONS
1. Home
   - Hero: full logo, "Expect the Best", one-line value promise, gold "Book a Consultation" button.
   - Proof stats bar (20 years, 80–85% repeat clients, Master Certified).
   - The three key messages.
   - Services preview with a link to Services.
   - Featured testimonials and delivery photos with a link to Portfolio.
   - Final booking CTA.
2. Services
   - Purchase and leasing consultation: what the client gets, how it works in 3–4 steps, what to bring.
   - Specialties: GLC, GLE, AMG, EQ electric, Maybach, Certified Pre-Owned, business and fleet purchases.
   - The "one point of contact" promise: from the first test drive to all the paperwork to personal delivery.
   - Booking CTA after each block.
3. About Me
   - Brand story (loved cars since childhood, the first S-Class, 20 years later).
   - Professional portrait (placeholder until provided).
   - Proof points, languages spoken, and mission and values from the brand guide.
   - Booking CTA.
4. Portfolio
   - Delivery gallery: photos of clients with their new cars, filterable by model, opening in an accessible lightbox.
   - Client testimonials.
   - Client stories: what the client needed, what Mohsen recommended, and the result.
   - Stats and track record.
   - All items are managed from the admin panel. Booking CTA.
5. Contact Me
   - Short contact form (name, email, phone, message), stored in the database.
   - Phone, email and dealership address with an embedded map.
   - Prominent "Prefer to book directly?" CTA.
6. /book: the booking flow (see below).
7. Booking confirmation page: branded, with an "Add to calendar" option and what happens next.
8. Legal pages: privacy policy and email preferences/unsubscribe.
9. /admin: the management panel (see below).

# BOOKING FLOW (Google Calendar integration)
- Only Mohsen is booked. The only booking type is a purchase or leasing consultation.
- Show only truly free slots by reading Mohsen's Google Calendar free/busy through the Google Calendar API.
- Working hours, slot length (default 45 minutes), buffer time, the booking window (default the next 30 days) and blocked dates are configurable in the admin panel.
- Steps: pick a date and time, then fill in details, then confirm.
- Form fields:
  - required: full name, email, phone
  - model interest: GLC, GLE, AMG, EQ, Maybach, other or not sure
  - new or Certified Pre-Owned
  - purchase, lease or finance
  - trade-in: yes or no
  - preferred contact method
  - notes
  - meeting type: in person at the dealership, or a phone or video call
- Consent:
  - Booking emails (confirmation, reminder, follow-up) are part of the service.
  - A separate, unchecked opt-in checkbox for future news and offers.
- On submit (server side):
  1. Validate the input.
  2. Re-check the slot is still free to prevent double-booking.
  3. Create the Google Calendar event with the client's details.
  4. Save the booking and the contact in Supabase.
  5. Send the confirmation emails.
  6. Show the confirmation page.
- Clients can cancel or reschedule through a secure link in their emails; this updates the calendar event and the database.
- Store all times in UTC and display them in America/New_York.

# BACKEND (Supabase)
Use Next.js (App Router, TypeScript) with Supabase (Postgres, Auth, Storage), deployed on Vercel.
- Tables (with created_at and updated_at columns):
  - contacts: name, email, phone, marketing_opt_in, consent_timestamp, unsubscribe_token, source
  - bookings: contact_id, start_at, end_at, status (upcoming, completed, cancelled, no_show), model_interest, condition, purchase_type, trade_in, meeting_type, notes, google_event_id, manage_token
  - contact_messages: messages from the contact form
  - portfolio_items: photo, client first name, model, caption, published, sort order
  - testimonials: quote, client name, model, published
  - client_stories: title, need, recommendation, result, photo, published
  - email_log: contact_id, booking_id, type, status, resend_id, sent_at
  - settings: working hours, slot length, buffer, booking window, blocked dates, notification email
- Turn on Row Level Security for every table. Public visitors can only read published portfolio content. All writes go through server-side code using the service role. Only the admin user can read bookings and contacts.
- Supabase Storage bucket for portfolio and story photos (public read, admin write).
- Use Next.js server actions or route handlers for all writes, validated with zod.
- Protect forms against spam with a honeypot field and rate limiting.
- If the Supabase MCP server is connected, use it to create the project schema. Otherwise write SQL migration files under supabase/migrations.

# EMAILS (Resend + React Email)
Build every email in the brand style: black background, silver text, gold accents, the logo (or the gold M alone), warm and elegant wording, and a signature from Mohsen.
1. Booking confirmation to the client, with date, time, location or call details, an .ics attachment, and manage/cancel links.
2. A new-booking notification to Mohsen with all of the client's details.
3. A reminder 24 hours before the meeting, sent by a Vercel Cron job that checks upcoming bookings every hour.
4. A follow-up the day after the meeting, for bookings marked "completed", thanking the client and inviting them to reply or rebook. This fits the brand value of following up on every sale.
5. Cancellation and reschedule confirmations.
- Log every email in email_log, and never send the same email twice for the same booking.
- Store every contact with their consent so newsletters can be sent later. Include an unsubscribe link and the business address in marketing emails (CAN-SPAM).
- Admins can export the opted-in contacts to CSV.

# ADMIN PANEL (/admin, Mohsen only)
- Login with Supabase Auth (email and password, or a magic link), restricted to an allowlist of admin emails.
- Bookings:
  - views: today, upcoming, past
  - filters: status, date and model
  - change status; add a private note
- Contacts: search, view booking history, export CSV (all, or opted-in only).
- Contact messages: inbox view.
- Portfolio, testimonials and client stories: add, edit, reorder and publish/unpublish, with photo upload to Supabase Storage.
- Settings: working hours, slot length, buffer, booking window, blocked dates, notification email.
- The admin panel uses the same brand style, but keeps a simple and practical layout.

# QUALITY BAR
- Responsive and mobile-first: test at 375, 768, 1024 and 1440 px. No horizontal scroll.
- Accessibility (WCAG 2.2 AA):
  - 4.5:1 text contrast
  - full keyboard navigation and visible focus states
  - labeled form fields, with errors shown next to the field
  - alt text on every image
  - prefers-reduced-motion respected
- Motion: subtle and refined (fades, gentle reveals). Nothing fast or flashy.
- Performance: next/image with AVIF/WebP, lazy loading, font display swap, no layout shift. Aim for 90+ on Lighthouse.
- SEO: page titles and descriptions, Open Graph images, sitemap, robots.txt, and LocalBusiness/AutoDealer structured data.
- Security: secrets only in environment variables; signed and expiring manage tokens; server-side checks on every admin action.

# MISSING INFORMATION: DO NOT INVENT IT
The brand guide lists open items. Do not make up any of these details:
- Mohsen's last name, phone, email and dealership address
- the domain (for example mohsenluxuryauto.com)
- real client photos, testimonials and stories
- the logo's light and one-color versions and its vector source file (not produced yet)

Keep all of them in one config file (for example src/config/site.ts) with clearly marked TODO placeholders, and use tasteful placeholder images that match the dark cinematic style. List every placeholder in the README.

# HOW TO WORK
1. First, read the brand guide files and ask me any clarifying questions you need.
2. Then propose a short plan and wait for my approval.
3. Build in phases, testing each phase before moving on:
   - Phase 1: design system (ui-ux-pro-max plus the brand guide), then layout, header, footer and the Home page
   - Phase 2: the Services, About Me, Portfolio and Contact Me pages
   - Phase 3: the Supabase schema and the booking flow with Google Calendar
   - Phase 4: emails with Resend, plus the cron jobs
   - Phase 5: the admin panel
   - Phase 6: the quality pass (accessibility, performance, SEO) and the ui-ux-pro-max pre-delivery checklist
4. Run the app and check each page in the browser at mobile and desktop widths before calling a phase done.

# DELIVERABLES
- The complete, working Next.js project.
- .env.example listing every variable:
  - Supabase URL and keys
  - Google service account or OAuth credentials and the calendar ID
  - Resend API key and sender address
  - admin emails
  - the cron secret
- A README with step-by-step setup, written for a non-developer:
  - create the Supabase project and run the migrations
  - create Google Cloud credentials and share Mohsen's calendar
  - verify the sending domain in Resend
  - deploy to Vercel and set the environment variables and the cron
  - create the admin login
- A final checklist that maps each requirement in this prompt to the file or page where it is done, plus the list of TODO placeholders.
```
