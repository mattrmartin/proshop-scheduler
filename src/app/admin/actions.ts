"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

const WEEK_STATUSES = ["draft", "open", "published"] as const;
type WeekStatus = (typeof WEEK_STATUSES)[number];

export type CreateWeekState = { error?: string; ok?: boolean };

/** The 7 ISO dates (Mon–Sun) starting at `startISO`. TZ-safe (UTC math). */
function weekDates(startISO: string): string[] {
  const [y, m, d] = startISO.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(base + i * 86_400_000).toISOString().slice(0, 10),
  );
}

function isMonday(startISO: string): boolean {
  const [y, m, d] = startISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 1;
}

export async function createWeek(
  _prev: CreateWeekState,
  formData: FormData,
): Promise<CreateWeekState> {
  const startDate = String(formData.get("start_date") ?? "");
  const open = String(formData.get("open") ?? "");
  const close = String(formData.get("close") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
    return { error: "Pick a start date." };
  if (!isMonday(startDate))
    return { error: "Week must start on a Monday." };
  if (!open || !close) return { error: "Set open and close times." };
  if (open >= close) return { error: "Open time must be before close." };

  // Same default hours on all 7 days to start; Cole tunes per-day later.
  const businessHours: Record<string, { open: string; close: string }> = {};
  for (const date of weekDates(startDate)) businessHours[date] = { open, close };

  const supabase = await createClient();
  const { error } = await supabase.from("weeks").insert({
    start_date: startDate,
    business_hours_by_day: businessHours as Json,
    status: "draft",
  });

  if (error) {
    if (error.code === "23505")
      return { error: "A week with that start date already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function setWeekStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !WEEK_STATUSES.includes(status as WeekStatus)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("weeks")
    .update({ status: status as WeekStatus })
    .eq("id", id);
  if (error) throw error; // surface, don't swallow

  revalidatePath("/admin");
}
