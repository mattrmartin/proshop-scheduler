"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";

export type SaveState = { error?: string; ok?: boolean };

type DayInput = { date: string; want_off: boolean; hours: number[] };

function hourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

/** Contiguous hour blocks -> [{start,end}] ranges (end is exclusive, "HH:00"). */
function toRanges(hours: number[]): { start: string; end: string }[] {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const out: { start: string; end: string }[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  for (const h of sorted) {
    if (start === null) {
      start = h;
      prev = h;
    } else if (h === prev! + 1) {
      prev = h;
    } else {
      out.push({ start: hourLabel(start), end: hourLabel(prev! + 1) });
      start = h;
      prev = h;
    }
  }
  if (start !== null) out.push({ start: hourLabel(start), end: hourLabel(prev! + 1) });
  return out;
}

export async function saveAvailability(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const weekId = String(formData.get("week_id") ?? "");
  const raw = String(formData.get("payload") ?? "");
  if (!weekId) return { error: "Missing week." };

  const user = await getCurrentAppUser();
  if (!user) return { error: "Not signed in." };

  let days: DayInput[];
  try {
    days = JSON.parse(raw) as DayInput[];
  } catch {
    return { error: "Could not read your selection." };
  }
  if (!Array.isArray(days)) return { error: "Could not read your selection." };

  const supabase = await createClient();

  for (const day of days) {
    const hours = (day.hours ?? []).filter(
      (h) => Number.isInteger(h) && h >= 0 && h < 24,
    );
    const wantOff = Boolean(day.want_off);

    // Nothing marked and not a day-off request -> clear any prior row.
    if (hours.length === 0 && !wantOff) {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("week_id", weekId)
        .eq("user_id", user.id)
        .eq("date", day.date);
      if (error) return { error: error.message };
      continue;
    }

    const { error } = await supabase.from("availability").upsert(
      {
        week_id: weekId,
        user_id: user.id,
        date: day.date,
        free_hour_ranges: toRanges(hours) as Json,
        want_off: wantOff,
      },
      { onConflict: "week_id,user_id,date" },
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/availability/${weekId}`);
  return { ok: true };
}
