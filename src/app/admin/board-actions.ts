"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { assignmentLabel } from "@/lib/schedule-format";
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
