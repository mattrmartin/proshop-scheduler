"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { assignmentLabel } from "@/lib/schedule-format";
import { draftWindow } from "@/lib/auto-draft";
import { loadBoardData, type BoardData } from "@/lib/board-data";

/**
 * Fetch one week's board on demand — used by the manager dashboard when a week
 * card is expanded, so we don't load every week's grid up front. Admin-only.
 */
export async function loadWeekBoard(weekId: string): Promise<BoardData | null> {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") return null;
  const supabase = await createClient();
  return loadBoardData(supabase, weekId);
}

export type DayChip = { name: string; time: string };

type DayRosterRow = {
  start_time: string | null;
  end_time: string | null;
  is_close: boolean;
  users: { name: string; department: string; rank: number } | null;
};

/**
 * Everyone working on one date (published weeks only), in department/rank order.
 * Powers the manager Today card's day-pager. Admin-only.
 */
export async function loadDayRoster(dateIso: string): Promise<DayChip[]> {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "start_time, end_time, is_close, users!inner(name, department, rank), weeks!inner(status)",
    )
    .eq("date", dateIso)
    .eq("status", "working")
    .eq("weeks.status", "published");
  if (error) throw error; // surface, don't swallow

  return ((data ?? []) as unknown as DayRosterRow[])
    .filter((r) => r.users)
    .sort(
      (a, b) =>
        a.users!.department.localeCompare(b.users!.department) ||
        a.users!.rank - b.users!.rank,
    )
    .map((r) => ({
      name: r.users!.name.split(" ")[0],
      time: assignmentLabel({
        status: "working",
        start: r.start_time,
        end: r.end_time,
        isClose: r.is_close,
      }),
    }));
}

/**
 * Auto-draft: fill each empty cell where the person submitted availability with
 * a working shift = their availability window (clamped to business hours). Only
 * open weeks; only empty cells (never clobbers a manual assignment); skips
 * want-off and no-response. It's a draft — Cole reviews and trims. Admin-only.
 * Returns how many shifts were drafted.
 */
export async function autoDraftWeek(
  weekId: string,
): Promise<{ drafted: number }> {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") return { drafted: 0 };

  const supabase = await createClient();
  const board = await loadBoardData(supabase, weekId);
  if (!board || board.status !== "open") return { drafted: 0 };

  const rows = [] as {
    week_id: string;
    user_id: string;
    date: string;
    status: string;
    start_time: string;
    end_time: string;
    is_close: boolean;
  }[];

  for (const day of board.days) {
    if (!day.hours) continue; // closed day — nothing to staff
    for (const u of board.users) {
      const cell = board.cells[`${u.id}|${day.date}`];
      if (!cell || cell.assignment) continue; // fill empties only
      const av = cell.avail;
      if (!av || av.wantOff || av.ranges.length === 0) continue; // off / no response
      const win = draftWindow(av.ranges, day.hours);
      if (!win) continue;
      rows.push({
        week_id: weekId,
        user_id: u.id,
        date: day.date,
        status: "working",
        start_time: win.start,
        end_time: win.end,
        is_close: false,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("assignments")
      .upsert(rows, { onConflict: "week_id,user_id,date" });
    if (error) throw error; // surface, don't swallow
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/weeks/${weekId}/board`);
  return { drafted: rows.length };
}
