"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// DEMO one-click logins. Seeded throwaway accounts so Cole/Morgan can walk the
// whole app without a code. This exposes public admin + staff login on the live
// URL — REMOVE before real launch (see BACKLOG "Remove the dev/demo bypass").
// Tracked with [[dev-admin-auth]].
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

/**
 * Normalize a typed phone to E.164 (US default), matching the roster format
 * (+1XXXXXXXXXX). Accepts "208-555-1234", "(208) 555 1234", "12085551234",
 * "+12085551234". Returns null if it can't be made into a plausible number.
 */
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) {
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [e164, setE164] = useState<string | null>(null); // set once code is sent
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendCode() {
    const normalized = toE164(phone);
    if (!normalized) {
      setError("Enter a valid phone number, e.g. (208) 555-1234.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      // The roster is the gate: an unrostered number lands unprovisioned (no
      // access). link_current_auth_user_by_phone() binds a rostered number to
      // its row on first verify.
      options: { shouldCreateUser: true },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setE164(normalized);
  }

  async function verifyCode() {
    if (!e164) return;
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: code.trim(),
      type: "sms",
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    // Bind this auth session to its roster row by phone (first sign-in only).
    // Idempotent no-op if already linked; surface a real failure.
    const { error: linkError } = await supabase.rpc(
      "link_current_auth_user_by_phone",
    );
    if (linkError) {
      setError(linkError.message);
      setPending(false);
      return;
    }
    router.push("/"); // role-aware landing decides admin vs staff
    router.refresh();
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
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/hlcc_steel_logo.png"
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="size-16 object-contain"
          priority
        />
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
        {e164 ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            <label className="text-sm font-medium" htmlFor="code">
              Enter the code we texted {e164}
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring/40 rounded-lg border px-3 py-2 text-center text-lg tracking-widest outline-none focus-visible:ring-2"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Verifying…" : "Verify & sign in"}
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs underline"
              onClick={() => {
                setE164(null);
                setCode("");
                setError(null);
              }}
            >
              Use a different number
            </button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <label className="text-sm font-medium" htmlFor="phone">
              Sign in with your phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="(208) 555-1234"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring/40 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Sending…" : "Text me a sign-in code"}
            </Button>
            <p className="text-muted-foreground text-xs">
              No password. We text you a one-time code.
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
