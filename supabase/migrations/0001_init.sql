-- Mohsen Luxury Auto: initial schema.
-- Run once in the Supabase SQL editor (or with `supabase db push`).
--
-- Access model: the website talks to the database only from the server, with the
-- service-role key (which bypasses RLS). RLS is enabled on every table so the
-- public anon key can never read private data; the only public read is published
-- portfolio content.
--
-- IDs are uuid (gen_random_uuid). These tables stay small (hundreds of rows), so the
-- index-locality cost of random UUIDs is negligible, and uuids avoid exposing counts.


-- contacts ---------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  marketing_opt_in boolean not null default false,
  consent_at timestamptz,
  unsubscribed boolean not null default false,
  unsubscribe_token text not null,
  source text not null check (source in ('booking', 'contact_form')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_lower check (email = lower(email))
);
create unique index if not exists contacts_email_key on public.contacts (email);
create unique index if not exists contacts_unsubscribe_token_key on public.contacts (unsubscribe_token);

-- bookings ---------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'completed', 'cancelled', 'no_show')),
  model_interest text not null default '',
  condition text not null default 'not_sure' check (condition in ('new', 'cpo', 'not_sure')),
  purchase_type text not null default 'not_sure'
    check (purchase_type in ('purchase', 'lease', 'finance', 'not_sure')),
  trade_in boolean not null default false,
  meeting_type text not null default 'in_person' check (meeting_type in ('in_person', 'phone', 'video')),
  contact_method text not null default 'phone' check (contact_method in ('phone', 'email', 'text')),
  notes text not null default '',
  admin_note text not null default '',
  google_event_id text,
  manage_token text not null,
  reminder_sent_at timestamptz,
  followup_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_order check (end_at > start_at),
  -- No two active bookings may overlap. This is the real double-booking guard.
  constraint bookings_no_overlap exclude using gist (
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('upcoming', 'completed'))
);
create index if not exists bookings_contact_id_idx on public.bookings (contact_id);
create index if not exists bookings_start_at_idx on public.bookings (start_at);
create unique index if not exists bookings_manage_token_key on public.bookings (manage_token);

-- contact_messages -------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- portfolio content ------------------------------------------------------
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  client_first_name text not null default '',
  model text not null default '',
  caption text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  client_name text not null default '',
  model text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.client_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_first_name text not null default '',
  model text not null default '',
  need text not null default '',
  recommendation text not null default '',
  result text not null default '',
  image_url text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- email_log --------------------------------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  type text not null,
  "to" text not null,
  subject text not null,
  status text not null check (status in ('sent', 'preview', 'failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_contact_id_idx on public.email_log (contact_id);
create index if not exists email_log_booking_id_idx on public.email_log (booking_id);

-- settings (single row) -------------------------------------------------
create table if not exists public.settings (
  id smallint primary key default 1 check (id = 1),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- updated_at trigger -----------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- Row Level Security -----------------------------------------------------
alter table public.contacts enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.client_stories enable row level security;
alter table public.email_log enable row level security;
alter table public.settings enable row level security;

-- Private tables: no policies, and no grants for the public roles.
revoke all on public.contacts, public.bookings, public.contact_messages, public.email_log, public.settings
  from anon, authenticated;

-- Public content: read published rows only.
revoke insert, update, delete on public.portfolio_items, public.testimonials, public.client_stories
  from anon, authenticated;
drop policy if exists portfolio_items_public_read on public.portfolio_items;
create policy portfolio_items_public_read on public.portfolio_items
  for select to anon, authenticated using (published);
drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated using (published);
drop policy if exists client_stories_public_read on public.client_stories;
create policy client_stories_public_read on public.client_stories
  for select to anon, authenticated using (published);

-- Seed: the one real client quote from the brand guide.
insert into public.testimonials (quote, client_name, published)
select 'Mohsen always takes good care of us. He is always available, and everybody can easily get in touch with him.',
       'A returning client', true
where not exists (select 1 from public.testimonials);

-- Storage bucket for portfolio and story photos (public read; uploads use the service role).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
