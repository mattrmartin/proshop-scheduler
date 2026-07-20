"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Dev-only convenience: when these are set (see .env.local) a "Sign in as Cole"
// button appears that fills the real credentials. Never set in production.
const DEV_ADMIN_EMAIL = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL;
const DEV_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD;
const DEV_STAFF_EMAIL = process.env.NEXT_PUBLIC_DEV_STAFF_EMAIL;
const DEV_STAFF_PASSWORD = process.env.NEXT_PUBLIC_DEV_STAFF_PASSWORD;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(withEmail: string, withPassword: string) {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: withEmail,
      password: withPassword,
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.push("/"); // role-aware landing decides admin vs staff
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pro Shop Scheduler</h1>
        <p className="text-muted-foreground text-sm">Admin sign in</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <input
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {(DEV_ADMIN_EMAIL || DEV_STAFF_EMAIL) && (
        <div className="flex flex-col gap-2">
          {DEV_ADMIN_EMAIL && DEV_ADMIN_PASSWORD && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void signIn(DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD)}
            >
              Sign in as Cole — admin (dev)
            </Button>
          )}
          {DEV_STAFF_EMAIL && DEV_STAFF_PASSWORD && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void signIn(DEV_STAFF_EMAIL, DEV_STAFF_PASSWORD)}
            >
              Sign in as Morgan — staff (dev)
            </Button>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Staff phone sign-in is coming later — admin only for now.
      </p>
    </main>
  );
}
