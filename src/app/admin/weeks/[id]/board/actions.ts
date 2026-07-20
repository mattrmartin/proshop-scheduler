"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AssignState = { error?: string; ok?: boolean };

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
