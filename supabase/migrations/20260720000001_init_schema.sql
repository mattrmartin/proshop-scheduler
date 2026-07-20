-- proshop-scheduler — initial schema
-- Tables: users, weeks, events, availability, assignments (+ RLS).
-- See PROJECT_CONTEXT.md for the product model.

-- ---------------------------------------------------------------------------
-- users — staff roster. Exists independent of auth (roster is seeded before
-- anyone logs in; non-submitters must still appear on the board).
-- ---------------------------------------------------------------------------
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name         text not null,
  phone        text not null unique,
  role         text not null default 'staff'  check (role in ('admin', 'staff')),
  department   text not null default 'inside' check (department in ('inside', 'outside')),
  rank         integer not null default 0,
  created_at   timestamptz not null default now()
);

comment on column public.users.rank is 'Display order: lower = more senior (top of board). Soft guide only.';

-- ---------------------------------------------------------------------------
-- weeks — a schedulable Mon–Sun week Cole opens.
-- ---------------------------------------------------------------------------
create table public.weeks (
  id                    uuid primary key default gen_random_uuid(),
  start_date            date not null unique,           -- Monday of the week
  business_hours_by_day jsonb not null default '{}'::jsonb,  -- { "2026-07-13": {"open":"06:00","close":"19:00"}, ... }
  status                text not null default 'draft' check (status in ('draft', 'open', 'published')),
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events — per-day demand signal (Ladies Mem. Guest, 18ers, FNF, ...).
-- Multiple per day allowed.
-- ---------------------------------------------------------------------------
create table public.events (
  id      uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  date    date not null,
  label   text not null
);

create index events_week_id_idx on public.events (week_id);

-- ---------------------------------------------------------------------------
-- availability — a staffer's submitted free hours for one day of a week.
-- ---------------------------------------------------------------------------
create table public.availability (
  id               uuid primary key default gen_random_uuid(),
  week_id          uuid not null references public.weeks (id) on delete cascade,
  user_id          uuid not null references public.users (id) on delete cascade,
  date             date not null,
  free_hour_ranges jsonb not null default '[]'::jsonb,  -- [ {"start":"06:00","end":"14:00"}, ... ]
  want_off         boolean not null default false,      -- stronger "requested day off" signal (yellow on the sheet)
  note             text,
  created_at       timestamptz not null default now(),
  unique (week_id, user_id, date)
);

create index availability_week_id_idx on public.availability (week_id);

-- ---------------------------------------------------------------------------
-- assignments — one placed slot per person per day.
--   status 'working' -> start_time set, and (end_time set OR is_close)
--   status 'off'     -> the "X" (assigned off): no times.
--   no row           -> blank (no assignment).
-- ---------------------------------------------------------------------------
create table public.assignments (
  id         uuid primary key default gen_random_uuid(),
  week_id    uuid not null references public.weeks (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  date       date not null,
  status     text not null default 'working' check (status in ('working', 'off')),
  start_time time,
  end_time   time,
  is_close   boolean not null default false,  -- open-ended close ("C")
  created_at timestamptz not null default now(),
  unique (week_id, user_id, date),
  constraint assignment_times_valid check (
    (status = 'off'
      and start_time is null and end_time is null and is_close = false)
    or
    (status = 'working'
      and start_time is not null and (end_time is not null or is_close = true))
  )
);

create index assignments_week_id_idx on public.assignments (week_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can query public.users
-- without recursing into that table's own policies). Defined after the tables
-- they reference, since SQL functions resolve relations at creation time.
-- ---------------------------------------------------------------------------

-- id of the public.users row linked to the current auth session, or null.
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1;
$$;

-- true if the current auth session maps to an admin (Cole).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users        enable row level security;
alter table public.weeks        enable row level security;
alter table public.events       enable row level security;
alter table public.availability enable row level security;
alter table public.assignments  enable row level security;

-- users: everyone authenticated reads the roster; only admin writes.
create policy users_select_all on public.users
  for select to authenticated using (true);
create policy users_admin_write on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- weeks: everyone authenticated reads; only admin writes.
create policy weeks_select_all on public.weeks
  for select to authenticated using (true);
create policy weeks_admin_write on public.weeks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- events: everyone authenticated reads; only admin writes.
create policy events_select_all on public.events
  for select to authenticated using (true);
create policy events_admin_write on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- availability: a staffer sees/edits only their own; admin sees/edits all.
create policy availability_select_own_or_admin on public.availability
  for select to authenticated
  using (public.is_admin() or user_id = public.current_app_user_id());
create policy availability_write_own_or_admin on public.availability
  for all to authenticated
  using (public.is_admin() or user_id = public.current_app_user_id())
  with check (public.is_admin() or user_id = public.current_app_user_id());

-- assignments: admin all; a staffer sees their own rows and any published
-- week's board. Writes are admin-only.
create policy assignments_select on public.assignments
  for select to authenticated
  using (
    public.is_admin()
    or user_id = public.current_app_user_id()
    or exists (
      select 1 from public.weeks w
      where w.id = assignments.week_id and w.status = 'published'
    )
  );
create policy assignments_admin_write on public.assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
