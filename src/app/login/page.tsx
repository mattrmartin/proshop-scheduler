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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
        >
          ⛳
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pro Shop Scheduler
          </h1>
          <p className="text-muted-foreground text-sm">
            Hayden Lake Country Club
          </p>
        </div>
      </div>

      <div className="panel flex flex-col gap-4 p-6">
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
            className="border-input bg-background focus-visible:ring-ring/40 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-input bg-background focus-visible:ring-ring/40 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or try the demo</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <div className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((acct) => (
            <Button
              key={acct.email}
              type="button"
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={() => void signIn(acct.email, acct.password)}
            >
              {acct.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Staff phone sign-in is coming later.
      </p>
    </main>
  );
}
