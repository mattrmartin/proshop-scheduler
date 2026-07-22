import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("default_open, default_close")
    .eq("id", true)
    .single();
  if (error) throw error; // surface, don't swallow

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Schedules
        </Link>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Settings</h1>
      </div>
      <SettingsForm
        defaultOpen={settings.default_open.slice(0, 5)}
        defaultClose={settings.default_close.slice(0, 5)}
      />
    </div>
  );
}
