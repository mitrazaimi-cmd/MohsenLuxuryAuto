-- Mohsen Luxury Auto: an optional photo for each testimonial (e.g. the delivery day).
-- Run once in the Supabase SQL editor, after 0002_chatbot.sql.

alter table public.testimonials add column if not exists image_url text not null default '';
