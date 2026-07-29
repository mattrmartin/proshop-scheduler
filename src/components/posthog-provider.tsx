"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import { createClient } from "@/lib/supabase/client";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== "undefined" && KEY) {
  posthog.init(KEY, {
    // Reverse-proxied through /ingest (see next.config.ts) so ad blockers
    // don't drop events; ui_host keeps in-app links pointing at PostHog.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
    defaults: "2025-05-24",
    // App Router does its own SPA navigation; we send $pageview manually below.
    capture_pageview: false,
    // Session replay is on. Inputs are masked by default; staff names still
    // appear as page text — an accepted trade-off for usage insight.
    autocapture: true,
  });
}

function AuthIdentity() {
  useEffect(() => {
    if (!KEY) return;
    const supabase = createClient();
    // Ties events + replays to the Supabase auth UUID only — never name/phone.
    // Fires on INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id;
      if (userId) {
        if (posthog.get_distinct_id() !== userId) posthog.identify(userId);
      } else {
        posthog.reset();
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY) return;
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // No key (e.g. local dev without PostHog configured) → render untouched.
  if (!KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <AuthIdentity />
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
