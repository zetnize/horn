-- Additive migration. Run only against the intended Supabase project.
create schema if not exists northia;
create table if not exists northia.site (
  id boolean primary key default true check(id),
  revision integer not null check(revision >= 0),
  settings jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists northia.products (
  slug text primary key,
  position integer not null,
  data jsonb not null check(data->>'slug' = slug)
);
create table if not exists northia.content_history (
  revision integer primary key, data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists northia.admins (
  login text primary key, salt text not null, hash text not null
);
create table if not exists northia.sessions (
  token_hash text primary key, expires_at timestamptz not null
);
create table if not exists northia.orders (
  id uuid primary key, customer jsonb not null, items jsonb not null,
  total bigint not null check(total > 0), status text not null default 'new',
  consent_version text not null, consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists northia.waitlist (
  id uuid primary key, name text not null, contact text not null,
  consent_version text not null, consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists northia.media (
  name text primary key, mime text not null, bytes integer not null,
  created_at timestamptz not null default now()
);
create table if not exists northia.rate_limits (
  key text primary key, count integer not null, expires_at timestamptz not null
);
-- Private server-only schema: no browser/Data API access.
revoke all on schema northia from public, anon, authenticated;
revoke all on all tables in schema northia from public, anon, authenticated;
alter table northia.site enable row level security;
alter table northia.products enable row level security;
alter table northia.content_history enable row level security;
alter table northia.admins enable row level security;
alter table northia.sessions enable row level security;
alter table northia.orders enable row level security;
alter table northia.waitlist enable row level security;
alter table northia.media enable row level security;
alter table northia.rate_limits enable row level security;
-- Private image bucket. Downloads go through the existing server /media route.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('northia-media','northia-media',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
