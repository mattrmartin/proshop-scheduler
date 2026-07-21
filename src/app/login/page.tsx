"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// DEMO one-click logins. Seeded throwaway accounts so Cole/Morgan can walk the
// whole app without a magic link. This exposes public admin + staff login on the
// live URL — REMOVE before real launch (see BACKLOG "Remove the dev/demo
// bypass"). Tracked with [[dev-admin-auth]].
const DEMO_ACCOUNTS = [
  {
    // NOTE: stays on +cole until the auth-user email swap runs (converges this
    // to mattrobm@gmail.com so the demo button and magic link share one auth
    // user). See BACKLOG apply steps.
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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendMagicLink(withEmail: string) {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: withEmail,
      options: {
        // First sign-in creates the auth user; link_current_auth_user() then
        // binds it to the pre-seeded roster row by email. An email with no
        // roster row just lands unprovisioned (no access) — the roster is the
        // gate, not OTP signup.
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  async function signInDemo(withEmail: string, withPassword: string) {
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
        {sent ? (
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-muted-foreground text-sm">
              We sent a sign-in link to{" "}
              <span className="text-foreground font-medium">{email}</span>. Open
              it on this device to sign in.
            </p>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground mt-2 text-xs underline"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMagicLink(email);
            }}
          >
            <label className="text-sm font-medium" htmlFor="email">
              Sign in with your email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring/40 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Sending…" : "Email me a sign-in link"}
            </Button>
            <p className="text-muted-foreground text-xs">
              No password. We email you a one-tap link.
            </p>
          </form>
        )}

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
              onClick={() => void signInDemo(acct.email, acct.password)}
            >
              {acct.label}
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}
