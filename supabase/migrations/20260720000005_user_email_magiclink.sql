-- Email magic-link auth. Adds users.email (the magic-link identity) and an
-- RPC that links a public.users row to the current auth session by email on
-- first sign-in. Phone stays the roster key; email is the login key.

alter table public.users add column if not exists email text;

-- Case-insensitive uniqueness, but allow many NULLs (roster rows without an
-- email yet). Partial unique index on lower(email).
create unique index if not exists users_email_lower_unique
  on public.users (lower(email))
  where email is not null;

-- Link the current auth session to its public.users row by matching email.
-- Called from /auth/callback after the code exchange. Only links a row that
-- isn't already linked, so it never hijacks a row owned by another auth user.
-- Returns the linked users.id, or null (already linked / no matching row).
create or replace function public.link_current_auth_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_email text := lower(auth.jwt() ->> 'email');
  linked_id uuid;
begin
  if session_email is null then
    return null;
  end if;

  update public.users
     set auth_user_id = auth.uid()
   where lower(email) = session_email
     and auth_user_id is null
  returning id into linked_id;

  return linked_id;
end;
$$;

grant execute on function public.link_current_auth_user() to authenticated;

-- Seed the admin (Cole) with the owner's test email so magic link resolves to
-- the admin row. Real roster emails are collected separately.
update public.users set email = 'mattrobm@gmail.com' where role = 'admin';
