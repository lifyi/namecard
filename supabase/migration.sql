-- CardStack contacts table migration
-- Run this in Supabase SQL Editor or via supabase CLI

create extension if not exists "uuid-ossp";

create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  date_met date,
  name text,
  alternate_name text,
  title text,
  company text,
  email text,
  phone text,
  alternate_messenger text,
  address text,
  where_met text,
  industry text check (industry in (
    'Shipping', 'Legal', 'Finance', 'Government', 'Port Authority',
    'Technology', 'Insurance', 'Trade Association', 'Academic', 'Other'
  )),
  relationship_type text check (relationship_type in (
    'Client', 'Counterparty', 'Regulator', 'Industry peer',
    'Vendor/supplier', 'Advisor/counsel', 'Internal colleague',
    'Investor', 'Media', 'Other'
  )),
  geography text check (geography in (
    'Singapore', 'China', 'Europe', 'Middle East', 'South Asia',
    'Southeast Asia', 'Americas', 'Africa', 'Global'
  )),
  how_met text check (how_met in (
    'Conference', 'Board/committee meeting', 'Intro by third party',
    'Cold outreach', 'Event', 'Social', 'Other'
  )),
  tags text[] default '{}',
  notes_structured jsonb,
  notes_raw text,
  follow_up_flag boolean not null default false,
  card_front_url text,
  card_back_url text
);

-- Enable Row Level Security
alter table public.contacts enable row level security;

-- Policy: allow all for now (single-user app, no auth)
-- Swap these for auth-based policies when adding multi-user support
create policy "Public access" on public.contacts
  for all using (true) with check (true);

-- Full-text search index
create index if not exists contacts_search_idx on public.contacts
  using gin(to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(company, '') || ' ' ||
    coalesce(notes_raw, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  ));

-- Index for filtered list views
create index if not exists contacts_industry_idx on public.contacts (industry);
create index if not exists contacts_rel_type_idx on public.contacts (relationship_type);
create index if not exists contacts_geography_idx on public.contacts (geography);
create index if not exists contacts_date_met_idx on public.contacts (date_met desc);
create index if not exists contacts_follow_up_idx on public.contacts (follow_up_flag) where follow_up_flag = true;

-- Storage bucket for card images
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

create policy "Public card images" on storage.objects
  for all using (bucket_id = 'card-images') with check (bucket_id = 'card-images');
