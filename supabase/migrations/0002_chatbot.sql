-- Mohsen Luxury Auto: chatbot (conversations, knowledge base, settings).
-- Run once in the Supabase SQL editor, after 0001_init.sql.
--
-- Same access model as 0001: only the server talks to these tables, with the
-- service-role key. RLS is on with no policies, so the public keys see nothing.

create extension if not exists vector with schema extensions;


-- contacts can now come from the chatbot and Telegram -----------------------
alter table public.contacts drop constraint if exists contacts_source_check;
alter table public.contacts add constraint contacts_source_check
  check (source in ('booking', 'contact_form', 'chatbot', 'telegram'));


-- chat_conversations ---------------------------------------------------------
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('web', 'page', 'telegram', 'playground')),
  external_id text not null,                 -- browser token or Telegram chat id
  status text not null default 'open' check (status in ('open', 'lead', 'booked', 'handoff')),
  contact_id uuid references public.contacts (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  visitor_name text not null default '',
  visitor_email text not null default '',
  visitor_phone text not null default '',
  page_url text not null default '',
  message_count integer not null default 0,
  cost_usd numeric(10, 5) not null default 0,
  reviewed boolean not null default false,
  note text not null default '',
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists chat_conversations_external_idx on public.chat_conversations (channel, external_id);
create index if not exists chat_conversations_last_message_idx on public.chat_conversations (last_message_at desc);
create index if not exists chat_conversations_contact_id_idx on public.chat_conversations (contact_id);
create index if not exists chat_conversations_booking_id_idx on public.chat_conversations (booking_id);

-- chat_messages --------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null default '',
  steps jsonb not null default '[]',         -- raw model steps, replayed as history
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_conversation_idx on public.chat_messages (conversation_id, created_at);
create index if not exists chat_messages_user_recent_idx on public.chat_messages (created_at desc) where role = 'user';

-- kb_sources -----------------------------------------------------------------
create table if not exists public.kb_sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('site', 'pdf', 'text', 'qa')),
  title text not null default '',
  url text not null default '',
  body text not null default '',
  status text not null default 'processing' check (status in ('ready', 'processing', 'error')),
  error text not null default '',
  version text not null default '',
  enabled boolean not null default true,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists kb_sources_set_updated_at on public.kb_sources;
create trigger kb_sources_set_updated_at before update on public.kb_sources
  for each row execute function public.set_updated_at();

-- kb_chunks ------------------------------------------------------------------
-- 1024 dimensions: Voyage voyage-3.5 embeddings.
create table if not exists public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.kb_sources (id) on delete cascade,
  heading text not null default '',
  content text not null,
  content_hash text not null,
  embedding extensions.vector(1024),
  fts tsvector generated always as (to_tsvector('english', coalesce(heading, '') || ' ' || content)) stored,
  created_at timestamptz not null default now()
);
create index if not exists kb_chunks_source_id_idx on public.kb_chunks (source_id);
create index if not exists kb_chunks_fts_idx on public.kb_chunks using gin (fts);
create index if not exists kb_chunks_embedding_idx on public.kb_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- chatbot_settings (single row) ---------------------------------------------
create table if not exists public.chatbot_settings (
  id smallint primary key default 1 check (id = 1),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Hybrid search ---------------------------------------------------------------
-- Semantic (cosine) and keyword (full-text) rankings merged with reciprocal rank
-- fusion. query_terms is an OR query such as 'lease | finance | gle', built and
-- sanitized by the app. Either input may be empty.
create or replace function public.match_kb_chunks(
  query_embedding extensions.vector(1024),
  query_terms text,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  source_id uuid,
  source_title text,
  source_url text,
  heading text,
  content text,
  score double precision
)
language sql stable
set search_path = ''
as $$
  with active as (
    select c.id, c.embedding, c.fts
    from public.kb_chunks c
    join public.kb_sources s on s.id = c.source_id
    where s.enabled
  ),
  semantic as (
    select a.id, row_number() over (order by a.embedding operator(extensions.<=>) query_embedding) as rank
    from active a
    where query_embedding is not null and a.embedding is not null
    order by a.embedding operator(extensions.<=>) query_embedding
    limit match_count * 3
  ),
  keyword as (
    select a.id, row_number() over (order by ts_rank_cd(a.fts, to_tsquery('english', query_terms)) desc) as rank
    from active a
    where coalesce(query_terms, '') <> '' and a.fts @@ to_tsquery('english', query_terms)
    order by ts_rank_cd(a.fts, to_tsquery('english', query_terms)) desc
    limit match_count * 3
  ),
  fused as (
    select coalesce(se.id, kw.id) as id,
           coalesce(1.0 / (60 + se.rank), 0) + coalesce(1.0 / (60 + kw.rank), 0) as score
    from semantic se
    full outer join keyword kw on kw.id = se.id
  )
  select c.id, c.source_id, s.title, s.url, c.heading, c.content, f.score::double precision
  from fused f
  join public.kb_chunks c on c.id = f.id
  join public.kb_sources s on s.id = c.source_id
  order by f.score desc
  limit match_count;
$$;

revoke execute on function public.match_kb_chunks(extensions.vector, text, integer) from public, anon, authenticated;

-- Row Level Security ---------------------------------------------------------
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.kb_sources enable row level security;
alter table public.kb_chunks enable row level security;
alter table public.chatbot_settings enable row level security;

revoke all on public.chat_conversations, public.chat_messages, public.kb_sources, public.kb_chunks,
  public.chatbot_settings from anon, authenticated;
