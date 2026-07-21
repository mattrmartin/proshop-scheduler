"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { weekDates } from "@/lib/dates";
import type { Json } from "@/lib/database.types";

export type SettingsState = { error?: string; ok?: string };

/** Save the standing business hours. New auto-opened weeks use these. */
export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const open = String(formData.get("default_open") ?? "");
  const close = String(formData.get("default_close") ?? "");
  if (!open || !close) return { error: "Set open and close times." };
  if (open >= close) return { error: "Open must be before close." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ default_open: open, default_close: close, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { ok: "Standing hours saved. New weeks will use them." };
}

/** Rewrite every not-yet-published week's hours to the standing hours. Lets a
 *  seasonal change propagate to weeks that are already open. */
export async function applyHoursToUpcoming(): Promise<SettingsState> {
  const supabase = await createClient();

  const { data: s, error: sErr } = await supabase
    .from("settings")
    .select("default_open, default_close")
    .eq("id", true)
    .single();
  if (sErr) return { error: sErr.message };

  const open = s.default_open.slice(0, 5);
  const close = s.default_close.slice(0, 5);

  const { data: weeks, error: wErr } = await supabase
    .from("weeks")
    .select("id, start_date")
    .eq("status", "open");
  if (wErr) return { error: wErr.message };

  for (const w of weeks ?? []) {
    const hours: Record<string, { open: string; close: string }> = {};
    for (const d of weekDates(w.start_date)) hours[d] = { open, close };
    const { error } = await supabase
      .from("weeks")
      .update({ business_hours_by_day: hours as Json })
      .eq("id", w.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: `Applied to ${weeks?.length ?? 0} upcoming week(s).` };
}
