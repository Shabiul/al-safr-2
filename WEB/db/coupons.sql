-- Coupon usage: one row per enquiry that used a coupon, linked to its lead.
-- Safe to run more than once:  node scripts/db.mjs db/coupons.sql   (also included in schema.sql)

create table if not exists alsafr.coupon_uses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references alsafr.leads (id) on delete cascade,
  code text not null,
  discount text not null default '',
  -- where it was used: 'Trains' | 'Flights' | 'Hotels' | 'Buses' | 'Package'
  used_on text not null,
  package_slug text,
  package_title text
);
create index if not exists coupon_uses_code on alsafr.coupon_uses (upper(code), created_at desc);
create index if not exists coupon_uses_lead on alsafr.coupon_uses (lead_id);

alter table alsafr.coupon_uses enable row level security;

-- per code and place: how often, and how many of those enquiries became bookings
create or replace view alsafr.coupon_usage as
  select upper(c.code) as code, c.used_on, c.package_title,
    count(*)::int as uses,
    count(*) filter (where l.stage = 'booked')::int as booked,
    max(c.created_at) as last_used
  from alsafr.coupon_uses c join alsafr.leads l on l.id = c.lead_id
  group by 1, 2, 3;
