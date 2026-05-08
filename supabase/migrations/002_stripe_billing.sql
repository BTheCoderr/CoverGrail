-- Stripe billing fields on profiles

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists monthly_scan_limit integer not null default 0,
  add column if not exists scans_used_this_period integer not null default 0,
  add column if not exists paid_scan_credits integer not null default 0,
  add column if not exists billing_period_start timestamptz,
  add column if not exists billing_period_end timestamptz;
