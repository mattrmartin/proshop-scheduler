"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// DEMO one-click logins. These are seeded throwaway accounts so Morgan/Cole can
// walk the whole app before phone/SMS auth is wired. This exposes public admin +
// staff login on the live URL — REMOVE before real launch (see BACKLOG "Remove the
// dev/demo bypass"). Tracked with [[dev-admin-auth]].
const DEMO_ACCOUNTS = [
  {
    label: "View as Cole — manager (demo)",
    email: "mattrobm+cole@gmail.com",
    password: "ProShopDev!2026",
  },
  {
    label: "View as Morgan — staff (demo)",
    email: "mattrobm+morgan@gmail.com",
    password: "ProShopDev!2026",
  },
];

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
        <p className="text-muted-foreground text-sm">Sign in</p>
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

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">Quick demo access</p>
        {DEMO_ACCOUNTS.map((acct) => (
          <Button
            key={acct.email}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void signIn(acct.email, acct.password)}
          >
            {acct.label}
          </Button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Staff phone sign-in is coming later.
      </p>
    </main>
  );
}
