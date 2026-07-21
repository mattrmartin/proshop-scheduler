-- Server-authoritative "today" so date filters match the DB clock (and the
-- data), not whatever clock the Node/Vercel runtime happens to be on.
create or replace function public.app_today()
returns date
language sql
stable
as $$ select current_date $$;

grant execute on function public.app_today() to authenticated;
