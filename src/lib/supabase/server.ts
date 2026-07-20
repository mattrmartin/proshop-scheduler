import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Bridges the auth session to Next's cookie store.
 *
 * The `setAll` try/catch is expected: Server Components cannot set cookies, so
 * writes there are a no-op. Session refresh happens in middleware instead (see
 * src/lib/supabase/middleware.ts), so dropping the write here is safe — it is a
 * documented no-op, not a swallowed error.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — cookie writes are not allowed here.
          // Middleware refreshes the session, so this no-op is intentional.
        }
      },
    },
  });
}
