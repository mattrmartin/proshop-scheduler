import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  name: string;
  role: "admin" | "staff";
  department: "inside" | "outside";
  rank: number;
};

/**
 * The signed-in user's profile row (public.users) joined to their auth session,
 * or null if not signed in / no linked profile. Server-only.
 */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, department, rank")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error; // surface, don't swallow
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    role: data.role as AppUser["role"],
    department: data.department as AppUser["department"],
    rank: data.rank,
  };
}
