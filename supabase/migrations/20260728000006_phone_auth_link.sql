-- Phone/SMS auth. Staff sign in with a phone OTP (Supabase phone provider via
-- Twilio). On first sign-in we bind the auth session to its pre-seeded
-- public.users row by matching phone. Phone is already the roster key, so no
-- new column is needed — just the link RPC, mirroring link_current_auth_user()
-- (email). Roster stores E.164 with '+'; Supabase's JWT `phone` claim is digits
-- only, so we compare digit-normalized on both sides.

create or replace function public.link_current_auth_user_by_phone()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_phone text := regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g');
  linked_id uuid;
begin
  if session_phone = '' then
    return null;
  end if;

  -- Only link a row that isn't already claimed, so this never hijacks a row
  -- owned by another auth user. Returns the linked users.id, or null
  -- (already linked / no matching roster row).
  update public.users
     set auth_user_id = auth.uid()
   where regexp_replace(phone, '\D', '', 'g') = session_phone
     and auth_user_id is null
  returning id into linked_id;

  return linked_id;
end;
$$;

grant execute on function public.link_current_auth_user_by_phone() to authenticated;
