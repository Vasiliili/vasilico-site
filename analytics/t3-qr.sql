-- QR/T3 visits remain separate from contact clicks and private to service_role.
alter table public.vasilico_clicks drop constraint vasilico_clicks_source_check;
alter table public.vasilico_clicks add constraint vasilico_clicks_source_check check(source in ('direct','avito','whatsapp','telegram','max','google','yandex','other','car_qr'));
create table public.vasilico_t3_visits(id uuid primary key,created_at timestamptz not null default now(),session_id uuid not null,source text not null check(source in ('direct','avito','whatsapp','telegram','max','google','yandex','other','car_qr')),bucket bigint not null,unique(session_id,bucket));
create index vasilico_t3_visits_created on public.vasilico_t3_visits(created_at);
alter table public.vasilico_t3_visits enable row level security;
revoke all on public.vasilico_t3_visits from public,anon,authenticated;
grant all on public.vasilico_t3_visits to service_role;
create function public.vasilico_record_t3_visit(p_id uuid,p_session uuid,p_source text) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_session::text,0));
 if (select count(*) from public.vasilico_t3_visits where session_id=p_session and created_at>now()-interval '1 day')>=40 then return false;end if;
 insert into public.vasilico_t3_visits(id,session_id,source,bucket) values(p_id,p_session,p_source,floor(extract(epoch from now())/1800)) on conflict do nothing;
 return found;
end $$;
revoke all on function public.vasilico_record_t3_visit(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.vasilico_record_t3_visit(uuid,uuid,text) to service_role;
create function public.vasilico_t3_report(p_days integer) returns jsonb language sql stable security invoker set search_path='' as $$
 with period as(select (((now() at time zone 'Europe/Moscow')::date-(least(greatest(p_days,1),90)-1))::timestamp at time zone 'Europe/Moscow') as since),
 visits as(select * from public.vasilico_t3_visits where created_at>=(select since from period)),
 clicks as(select * from public.vasilico_clicks where source='car_qr' and created_at>=(select since from period)),
 channels as(select channel,count(*) as count from clicks group by channel),
 daily as(select (created_at at time zone 'Europe/Moscow')::date as day,count(*) as visits,count(*) filter(where source='car_qr') as qr_visits from visits group by day order by day)
 select jsonb_build_object('visits',(select count(*) from visits),'qr_visits',(select count(*) from visits where source='car_qr'),'sessions',(select count(distinct session_id) from visits where source='car_qr'),'contacts',(select count(*) from clicks),'channels',coalesce((select jsonb_agg(channels) from channels),'[]'::jsonb),'days',coalesce((select jsonb_agg(daily) from daily),'[]'::jsonb));
$$;
revoke all on function public.vasilico_t3_report(integer) from public,anon,authenticated;
grant execute on function public.vasilico_t3_report(integer) to service_role;
