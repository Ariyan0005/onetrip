-- Run this once in the Supabase SQL Editor.
-- The service-role key is used only by the OneTrip API server, never in the browser.

create table if not exists public.travel_widgets (
  id text primary key,
  title text not null check (char_length(title) between 1 and 160),
  provider text not null check (char_length(provider) between 1 and 120),
  category text not null check (category in ('flights', 'hotels', 'cars', 'bikes', 'tours', 'transfers', 'other')),
  placement text not null check (placement in ('hero', 'after-destinations', 'before-faq', 'footer')),
  code text not null check (char_length(code) between 1 and 300000),
  script_url text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists travel_widgets_active_updated_idx
  on public.travel_widgets (active, updated_at desc);

insert into public.travel_widgets (
  id, title, provider, category, placement, code, script_url, active
)
values (
  'travelpayouts-flight-default',
  'Travelpayouts Flight Search',
  'Travelpayouts',
  'flights',
  'hero',
  '<div id="tpwl-search" aria-label="Flight search form"></div><div id="tpwl-tickets" aria-label="Flight search results"></div>',
  'https://tpscr.com/wl_web/main.js?wl_id=21725',
  true
)
on conflict (id) do nothing;

alter table public.travel_widgets enable row level security;

-- The API uses the service-role key and bypasses RLS. No public client policy is needed.