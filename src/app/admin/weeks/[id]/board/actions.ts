"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { addDays } from "@/lib/dates";

export type AssignState = { error?: string; ok?: boolean };

export type CopyResult = { error?: string; copied?: number };

/**
 * Copy one person's whole schedule from the immediately-preceding week into
 * this week, matched weekday-to-weekday (both weeks are Monday-start, so a +7
 * day shift lines them up). For staff who work the same hours every week.
 *
 * Overwrites that person's existing cells for the target week (upsert), so
 * Cole can copy then tweak. Skips any day this week is closed, so a shift never
 * lands on a day that isn't on the grid.
 */
export async function copyPersonFromLastWeek(
  weekId: string,
  userId: string,
): Promise<CopyResult> {
  if (!weekId || !userId) return { error: "Missing week or person." };

  const supabase = await createClient();

  const { data: week, error: weekError } = await supabase
    .from("weeks")
    .select("start_date, business_hours_by_day")
    .eq("id", weekId)
    .single();
  if (weekError) return { error: weekError.message };

  const priorStart = addDays(week.start_date, -7);
  const { data: prior, error: priorError } = await supabase
    .from("weeks")
    .select("id")
    .eq("start_date", priorStart)
    .maybeSingle();
  if (priorError) return { error: priorError.message };
  if (!prior) return { error: "No prior week to copy from." };

  const { data: rows, error: rowsError } = await supabase
    .from("assignments")
    .select("date, status, start_time, end_time, is_close")
    .eq("week_id", prior.id)
    .eq("user_id", userId);
  if (rowsError) return { error: rowsError.message };
  if (!rows || rows.length === 0) {
    return { error: "They had no shifts last week." };
  }

  // Days this week is open (business-hours keys). A copied shift on a day
  // that's closed this week is dropped rather than orphaned off the grid.
  const openDays = new Set(
    Object.keys((week.business_hours_by_day ?? {}) as Record<string, unknown>),
  );

  const toUpsert = rows
    .map((r) => ({
      week_id: weekId,
      user_id: userId,
      date: addDays(r.date, 7),
      status: r.status,
      start_time: r.start_time,
      end_time: r.end_time,
      is_close: r.is_close,
    }))
    .filter((r) => openDays.has(r.date));

  if (toUpsert.length === 0) {
    return { error: "Last week's shifts fall on days closed this week." };
  }

  const { error: upsertError } = await supabase
    .from("assignments")
    .upsert(toUpsert, { onConflict: "week_id,user_id,date" });
  if (upsertError) return { error: upsertError.message };

  revalidatePath(`/admin/weeks/${weekId}/board`);
  return { copied: toUpsert.length };
}

/**
 * Set or clear one person's slot for one day.
 *   mode "clear"   -> remove the assignment (blank)
 *   mode "off"     -> "X" (assigned off)
 *   mode "working" -> start_time + (end_time OR close)
 */
export async function saveAssignment(
  _prev: AssignState,
  formData: FormData,
): Promise<AssignState> {
  const weekId = String(formData.get("week_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (!weekId || !userId || !date) return { error: "Missing cell." };

  const supabase = await createClient();
  const base = { week_id: weekId, user_id: userId, date };
  const revalidate = () => revalidatePath(`/admin/weeks/${weekId}/board`);

  if (mode === "clear") {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .match(base);
    if (error) return { error: error.message };
    revalidate();
    return { ok: true };
  }

  if (mode === "off") {
    const { error } = await supabase.from("assignments").upsert(
      { ...base, status: "off", start_time: null, end_time: null, is_close: false },
      { onConflict: "week_id,user_id,date" },
    );
    if (error) return { error: error.message };
    revalidate();
    return { ok: true };
  }

  if (mode === "working") {
    const start = String(formData.get("start_time") ?? "");
    const close = Boolean(formData.get("is_close"));
    const end = String(formData.get("end_time") ?? "");
    if (!start) return { error: "Set a start time." };
    if (!close && !end) return { error: "Set an end time or mark Close." };
    if (!close && end <= start) return { error: "End must be after start." };

    const { error } = await supabase.from("assignments").upsert(
      {
        ...base,
        status: "working",
        start_time: start,
        end_time: close ? null : end,
        is_close: close,
      },
      { onConflict: "week_id,user_id,date" },
    );
    if (error) return { error: error.message };
    revalidate();
    return { ok: true };
  }

  return { error: "Unknown action." };
}
