import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing. Supabase redirects here with a PKCE `code` after the user
 * clicks the emailed link. We exchange it for a session, then link the auth
 * user to their public.users row by email (first sign-in only).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Link this auth session to its roster row by email. Idempotent: a no-op if
  // already linked. Surface a failure rather than swallowing it.
  const { error: linkError } = await supabase.rpc("link_current_auth_user");
  if (linkError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(linkError.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
