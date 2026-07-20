-- Auto-open model: a standing business-hours setting drives a rolling window of
-- upcoming "open" weeks. Cole no longer opens weeks by hand; "draft" is dropped.

-- Standing hours (single row).
create table public.settings (
  id           boolean primary key default true,
  default_open time not null default '06:00',
  default_close time not null default '19:00',
  updated_at   timestamptz not null default now(),
  constraint settings_singleton check (id)
);
insert into public.settings (id) values (true) on conflict do nothing;

alter table public.settings enable row level security;
create policy settings_read on public.settings
  for select to authenticated using (true);
create policy settings_admin_write on public.settings
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Drop the "draft" status: existing drafts become open; weeks default to open.
update public.weeks set status = 'open' where status = 'draft';
alter table public.weeks alter column status set default 'open';
alter table public.weeks drop constraint if exists weeks_status_check;
alter table public.weeks
  add constraint weeks_status_check check (status in ('open', 'published'));

-- Materialise the next 3 Mondays as open weeks (idempotent). SECURITY DEFINER so
-- any signed-in user's dashboard load can keep the window fresh; inserts bypass
-- the admin-only weeks RLS. Called via rpc('ensure_open_weeks').
create or replace function public.ensure_open_weeks()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open  time;
  v_close time;
  v_mon   date;
  i       int;
  v_hours jsonb;
begin
  select default_open, default_close into v_open, v_close
  from public.settings where id = true;

  -- next Monday on/after today (dow: 0=Sun..6=Sat)
  v_mon := current_date
    + ((1 - extract(dow from current_date)::int + 7) % 7);

  for i in 0..2 loop
    v_hours := (
      select jsonb_object_agg(
               gd::date::text,
               jsonb_build_object(
                 'open',  to_char(v_open,  'HH24:MI'),
                 'close', to_char(v_close, 'HH24:MI')
               ))
      from generate_series(v_mon + i * 7, v_mon + i * 7 + 6, interval '1 day') gd
    );
    insert into public.weeks (start_date, status, business_hours_by_day)
    values (v_mon + i * 7, 'open', v_hours)
    on conflict (start_date) do nothing;
  end loop;
end;
$$;

grant execute on function public.ensure_open_weeks() to authenticated;
