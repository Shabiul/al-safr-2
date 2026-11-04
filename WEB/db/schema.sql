-- Al Safr CRM + website content. Lives in its own schema so it never touches other apps' tables
-- in the same Supabase project. Run with:  node scripts/db.mjs db/schema.sql   (safe to re-run)

create schema if not exists alsafr;

-- staff logins (replaces the single shared password)
create table if not exists alsafr.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null default 'STAFF' check (role in ('SUPER_ADMIN', 'STAFF')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- website enquiries and leads the team adds
create table if not exists alsafr.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null default '',
  source text not null,
  package_slug text,
  package_title text,
  departure text not null default 'Flexible',
  travellers int not null default 1 check (travellers between 1 and 50),
  value numeric(12, 2) not null default 0,
  notes text not null default '',
  stage text not null default 'new' check (stage in ('new', 'contacted', 'quoted', 'booked', 'lost'))
);
create index if not exists leads_email on alsafr.leads (lower(email));

create table if not exists alsafr.lead_activity (
  id bigint generated always as identity primary key,
  lead_id uuid not null references alsafr.leads (id) on delete cascade,
  at timestamptz not null default now(),
  text text not null,
  staff_name text
);
create index if not exists lead_activity_lead on alsafr.lead_activity (lead_id, at desc);

-- everything editable on the public site: one JSON value per section (packages, alerts, promos, ...)
create table if not exists alsafr.content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists alsafr.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid references alsafr.leads (id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  service_type text not null check (service_type in ('package', 'flights', 'hotels', 'cabs', 'visa', 'other')),
  package_slug text,
  details text,
  travel_date date,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  promo_code text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  assigned_to text
);

create table if not exists alsafr.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references alsafr.bookings (id) on delete cascade,
  created_at timestamptz not null default now(),
  type text not null check (type in ('payment', 'refund')),
  method text not null,
  amount numeric(12, 2) not null check (amount > 0),
  reference text,
  note text,
  recorded_by text
);
create index if not exists payments_booking on alsafr.payments (booking_id);

create table if not exists alsafr.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  booking_id uuid not null references alsafr.bookings (id) on delete cascade,
  type text not null,
  file_name text not null,
  storage_path text not null,
  uploaded_by text
);

create table if not exists alsafr.suppliers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  type text not null,
  contact_name text,
  phone text,
  email text,
  commission_percent numeric(5, 2),
  notes text,
  active boolean not null default true
);

-- percentage added on top of supplier cost, per service
create table if not exists alsafr.markup (
  service text primary key check (service in ('flights', 'hotels', 'cabs', 'packages')),
  percentage numeric(6, 2) not null default 0 check (percentage between 0 and 500),
  updated_at timestamptz not null default now()
);

-- not reachable through Supabase's public REST API (schema isn't exposed); RLS on as a second lock
alter table alsafr.staff enable row level security;
alter table alsafr.leads enable row level security;
alter table alsafr.lead_activity enable row level security;
alter table alsafr.content enable row level security;
alter table alsafr.bookings enable row level security;
alter table alsafr.payments enable row level security;
alter table alsafr.documents enable row level security;
alter table alsafr.suppliers enable row level security;
alter table alsafr.markup enable row level security;
