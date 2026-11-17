create table if not exists public.vasilico_schedule (id boolean primary key default true check (id), schedule jsonb not null, updated_at timestamptz not null default now());
alter table public.vasilico_schedule enable row level security;
revoke all on public.vasilico_schedule from public, anon, authenticated;
grant select, insert, update on public.vasilico_schedule to service_role;
insert into public.vasilico_schedule(id,schedule) values (true, '{"days":[true,true,true,true,true,true,true],"contactStart":"08:00","contactEnd":"20:00","workStart":"08:00","workEnd":"18:00","notice":"","until":""}'::jsonb) on conflict (id) do nothing;
