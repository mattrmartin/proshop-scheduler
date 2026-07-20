import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every request and rewrites the auth
 * cookies onto the response. Called from src/middleware.ts.
 *
 * Do not run logic between creating the client and calling `getUser()` — see
 * https://supabase.com/docs/guides/auth/server-side/nextjs — or you risk
 * random logouts from a stale session.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the session so expiring tokens get refreshed into the cookies above.
  await supabase.auth.getUser();

  return response;
}
