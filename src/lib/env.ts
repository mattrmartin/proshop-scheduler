/**
 * Typed, fail-loud access to the public Supabase env vars.
 *
 * These are `NEXT_PUBLIC_*` so they are inlined into the client bundle at build
 * time. Access is lazy (getters) so a missing var throws when a Supabase client
 * is actually created at runtime — not at module import, which would break
 * `next build` in environments without the vars set.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (see .env.example).`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
};
