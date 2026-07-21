"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { weekDates, formatDayShort } from "@/lib/dates";
import { loadBoardData, type BoardData } from "@/lib/board-data";
import type { GridDay } from "./[weekId]/availability-grid";

type StoredHours = Record<string, { open: string; close: string }>;
type Range = { start: string; end: string };

const hourOf = (t: string) => parseInt(t.slice(0, 2), 10);

export type AvailabilityGridData = {
  weekId: string;
  hours: number[];
  days: GridDay[];
  submitted: boolean;
};

/**
 * The current user's availability grid for one open week: the hour bounds, the
 * per-day open window + their current selection + want-off. Used to expand a
 * week card inline. Returns null if the week isn't open for input.
 */
export async function loadAvailabilityGrid(
  weekId: string,
): Promise<AvailabilityGridData | null> {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: week, error } = await supabase
    .from("weeks")
    .select("id, start_date, status, business_hours_by_day")
    .eq("id", weekId)
    .maybeSingle();
  if (error) throw error; // surface, don't swallow
  if (!week || week.status !== "open") return null;

  const stored = (week.business_hours_by_day ?? {}) as StoredHours;
  const dates = weekDates(week.start_date);

  const openDays = dates.filter((d) => stored[d]);
  let minHour = 24;
  let maxHour = 0;
  for (const d of openDays) {
    minHour = Math.min(minHour, hourOf(stored[d].open));
    maxHour = Math.max(maxHour, Math.ceil(hourOf(stored[d].close)));
  }
  const hasHours = openDays.length > 0 && minHour < maxHour;
  const hours = hasHours
    ? Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)
    : [];

  const { data: existing, error: exErr } = await supabase
    .from("availability")
    .select("date, free_hour_ranges, want_off")
    .eq("week_id", weekId)
    .eq("user_id", user.id);
  if (exErr) throw exErr;

  const byDate = new Map(existing?.map((r) => [r.date, r]) ?? []);

  const days: GridDay[] = dates.map((date) => {
    const h = stored[date];
    const row = byDate.get(date);
    const ranges = (row?.free_hour_ranges as Range[] | null) ?? [];
    const selected: number[] = [];
    for (const r of ranges) {
      for (let x = hourOf(r.start); x < hourOf(r.end); x++) selected.push(x);
    }
    return {
      date,
      label: formatDayShort(date),
      openHour: h ? hourOf(h.open) : null,
      closeHour: h ? Math.ceil(hourOf(h.close)) : null,
      selected,
      wantOff: Boolean(row?.want_off),
    };
  });

  return { weekId: week.id, hours, days, submitted: (existing?.length ?? 0) > 0 };
}

/**
 * A published week's board for the staff schedule view (read-only). Availability
 * underlay is stripped — staff only ever see the posted shifts. Returns null if
 * the week isn't published.
 */
export async function loadStaffBoard(
  weekId: string,
): Promise<BoardData | null> {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const supabase = await createClient();
  const board = await loadBoardData(supabase, weekId);
  if (!board || board.status !== "published") return null;

  const cells: BoardData["cells"] = {};
  for (const [key, value] of Object.entries(board.cells)) {
    cells[key] = { avail: null, assignment: value.assignment };
  }
  return { ...board, cells };
}
