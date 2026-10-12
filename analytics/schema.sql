-- Applied with the Supabase migration API. No access for public clients.
create table public.vasilico_clicks (
 id uuid primary key,
 created_at timestamptz not null default now(),
 channel text not null check (channel in ('phone','whatsapp','telegram','max','avito')),
 page text not null check (length(page)<=180),
 source text not null check (source in ('direct','avito','whatsapp','telegram','max','google','yandex','other')),
 session_id uuid not null,
 bucket bigint not null,
 unique (session_id, channel, bucket)
);
create index vasilico_clicks_created on public.vasilico_clicks(created_at);
create index vasilico_clicks_session on public.vasilico_clicks(session_id,created_at);
alter table public.vasilico_clicks enable row level security;
revoke all on public.vasilico_clicks from public, anon, authenticated;
grant all on public.vasilico_clicks to service_role;
create table public.vasilico_stats_config (id boolean primary key default true check(id), token_hash text not null);
alter table public.vasilico_stats_config enable row level security;
revoke all on public.vasilico_stats_config from public, anon, authenticated;
grant all on public.vasilico_stats_config to service_role;
create function public.vasilico_record_click(p_id uuid,p_channel text,p_page text,p_source text,p_session uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_session::text,0));
 if (select count(*) from public.vasilico_clicks where session_id=p_session and created_at>now()-interval '1 day')>=40 then return false; end if;
 insert into public.vasilico_clicks(id,channel,page,source,session_id,bucket) values(p_id,p_channel,p_page,p_source,p_session,floor(extract(epoch from now())/30)) on conflict do nothing;
 return found;
end $$;
revoke all on function public.vasilico_record_click(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.vasilico_record_click(uuid,text,text,text,uuid) to service_role;
create function public.vasilico_click_report(p_days integer)
returns jsonb language sql stable security invoker set search_path='' as $$
 with filtered as (select * from public.vasilico_clicks where created_at >= ((now() at time zone 'Europe/Moscow')::date - (least(greatest(p_days,1),90)-1))::timestamp at time zone 'Europe/Moscow'),
 channels as(select channel,count(*) as count from filtered group by channel),
 pages as(select page,channel,count(*) as count from filtered group by page,channel order by count(*) desc limit 50),
 sources as(select source,count(*) as count from filtered group by source),
 days as(select (created_at at time zone 'Europe/Moscow')::date as day,count(*) as count from filtered group by day order by day)
 select jsonb_build_object('total',(select count(*) from filtered),'channels',coalesce((select jsonb_agg(channels) from channels),'[]'::jsonb),'pages',coalesce((select jsonb_agg(pages) from pages),'[]'::jsonb),'sources',coalesce((select jsonb_agg(sources) from sources),'[]'::jsonb),'days',coalesce((select jsonb_agg(days) from days),'[]'::jsonb),'updated_at',now());
$$;
revoke all on function public.vasilico_click_report(integer) from public,anon,authenticated;
grant execute on function public.vasilico_click_report(integer) to service_role;
