-- Run this migration in the Supabase SQL editor or with the Supabase CLI.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.interest_categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  label text not null check (char_length(label) between 1 and 80),
  icon text not null default '',
  color text not null default '#00D4FF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0
);

create table public.user_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest_id text not null references public.interest_categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null default 'Not provided',
  salary text not null default 'Not provided',
  employment_type text not null default 'Not provided',
  posted_label text not null default 'Recently posted',
  posted_at timestamptz not null default now(),
  description text not null default '',
  requirements text[] not null default '{}',
  interest_ids text[] not null default '{}',
  application_url text,
  trust_score smallint not null default 0 check (trust_score between 0 and 100),
  trust_breakdown jsonb not null default '[]'::jsonb,
  trust jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.scan_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint not null default 0,
  file_size_formatted text not null,
  declared_extension text,
  declared_mime text,
  detected_type text,
  magic_bytes text,
  verdict text not null,
  verdict_color text,
  verdict_icon text,
  details jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Create the corresponding public profile every time a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Atomically replaces a user's selected categories and rejects unknown category IDs.
create or replace function public.set_user_interests(selected_ids text[])
returns void language plpgsql security invoker set search_path = public as $$
declare
  clean_ids text[] := array(select distinct unnest(coalesce(selected_ids, '{}'::text[])));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from unnest(clean_ids) as candidate(category_id) where not exists (select 1 from public.interest_categories where interest_categories.id = candidate.category_id)) then
    raise exception 'One or more interest categories are invalid';
  end if;
  delete from public.user_interests where user_id = auth.uid();
  insert into public.user_interests (user_id, interest_id)
  select auth.uid(), candidate.category_id from unnest(clean_ids) as candidate(category_id);
end;
$$;

alter table public.profiles enable row level security;
alter table public.interest_categories enable row level security;
alter table public.user_interests enable row level security;
alter table public.jobs enable row level security;
alter table public.scan_results enable row level security;

create policy "Users can view their profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users can update their profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Authenticated users can read categories" on public.interest_categories for select to authenticated using (true);
create policy "Users manage their own interests" on public.user_interests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Authenticated users can read active jobs" on public.jobs for select to authenticated using (is_active = true);
create policy "Users manage their own scan history" on public.scan_results for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.set_user_interests(text[]) to authenticated;

create index jobs_active_posted_at_idx on public.jobs (is_active, posted_at desc);
create index jobs_interest_ids_idx on public.jobs using gin (interest_ids);
create index user_interests_interest_id_idx on public.user_interests (interest_id);
create index scan_results_user_created_at_idx on public.scan_results (user_id, created_at desc);
