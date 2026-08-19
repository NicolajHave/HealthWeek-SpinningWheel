-- Health Week — Team Spin Wheel
-- Run once against the Supabase project (SQL editor or `supabase db push`).
--
-- Everything is prefixed `hw_` and the bucket is `hw-team-photos`, because this
-- project is shared with other apps that already own a `teams` table.

create extension if not exists "pgcrypto";

create table if not exists hw_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin         text not null unique,
  sort_order  int  not null default 0
);

create table if not exists hw_spins (
  id               uuid primary key default gen_random_uuid(),
  -- One row per team, enforced by Postgres. This is the real integrity control:
  -- reloading, incognito or a second device does not get you a second spin.
  team_id          uuid not null unique references hw_teams(id) on delete cascade,
  segment_key      text not null,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz,
  photo_path       text,
  photo_on_screen  boolean not null default false
);

alter table hw_teams enable row level security;
alter table hw_spins enable row level security;
-- No policies on purpose: anon has no access at all. Every read and write goes
-- through a server action using the service role key.

-- Private bucket for team photos. Signed URLs are issued server-side for the board.
insert into storage.buckets (id, name, public)
values ('hw-team-photos', 'hw-team-photos', false)
on conflict (id) do nothing;
