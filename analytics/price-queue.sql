create table public.vasilico_price_requests (
 id uuid primary key,
 patch jsonb not null,
 state text not null default 'pending' check (state in ('pending','submitted','failed')),
 created_at timestamptz not null default now()
);
create unique index vasilico_price_one_pending on public.vasilico_price_requests (state) where state='pending';
alter table public.vasilico_price_requests enable row level security;
revoke all on public.vasilico_price_requests from public, anon, authenticated;
grant select, insert, update on public.vasilico_price_requests to service_role;
