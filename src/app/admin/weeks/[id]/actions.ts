"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { weekDates } from "@/lib/dates";

export type FormState = { error?: string; ok?: boolean };

type DayHours = { open: string; close: string };

/** Rebuild business_hours_by_day from the per-day inputs. A day marked closed
 *  is omitted entirely (greyed on the grid). */
export async function updateBusinessHours(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const weekId = String(formData.get("week_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  if (!weekId || !startDate) return { error: "Missing week." };

  const hours: Record<string, DayHours> = {};
  for (const date of weekDates(startDate)) {
    if (formData.get(`closed_${date}`)) continue; // day closed → omit
    const open = String(formData.get(`open_${date}`) ?? "");
    const close = String(formData.get(`close_${date}`) ?? "");
    if (!open || !close) return { error: `Set hours for ${date} or mark it closed.` };
    if (open >= close) return { error: `${date}: open must be before close.` };
    hours[date] = { open, close };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("weeks")
    .update({ business_hours_by_day: hours as Json })
    .eq("id", weekId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { ok: true };
}

export async function addEvent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const weekId = String(formData.get("week_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const date = String(formData.get("date") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (!weekId || !startDate) return { error: "Missing week." };
  if (!weekDates(startDate).includes(date))
    return { error: "Pick a day within this week." };
  if (!label) return { error: "Enter an event name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .insert({ week_id: weekId, date, label });
  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { ok: true };
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "");
  const weekId = String(formData.get("week_id") ?? "");
  if (!eventId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error; // surface, don't swallow

  revalidatePath(`/admin/weeks/${weekId}`);
}
