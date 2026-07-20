-- Move the RLS helper functions out of the API-exposed `public` schema into a
-- `private` schema so they are not callable as PostgREST RPC endpoints.
-- Existing RLS policies track the functions by OID, so they keep working after
-- the schema move. Clears advisor lints 0028/0029.

create schema if not exists private;

alter function public.current_app_user_id() set schema private;
alter function public.is_admin() set schema private;

-- Policies are evaluated as the querying role, so `authenticated` still needs
-- to reach these — but only via RLS, never via the (unexposed) API.
grant usage on schema private to authenticated;
grant execute on function private.current_app_user_id() to authenticated;
grant execute on function private.is_admin() to authenticated;

revoke execute on function private.current_app_user_id() from anon, public;
revoke execute on function private.is_admin() from anon, public;
