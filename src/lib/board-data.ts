import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { weekDates, formatDayShort } from "@/lib/dates";

type StoredHours = Record<string, { open: string; close: string }>;
type Range = { start: string; end: string };

export type BoardDay = {
  date: string;
  label: string;
  hours: { open: string; close: string } | null;
  events: string[];
};
export type BoardUser = {
  id: string;
  name: string;
  department: string;
  rank: number;
};
export type CellData = {
  avail: { ranges: Range[]; wantOff: boolean } | null;
  assignment: {
    status: string;
    start: string | null;
    end: string | null;
    isClose: boolean;
  } | null;
};
export type BoardData = {
  weekId: string;
  startDate: string;
  status: string;
  days: BoardDay[];
  users: BoardUser[];
  cells: Record<string, CellData>;
  shiftCount: number;
};

/**
 * Assemble one week's build board: business-hours days (+ events), the roster
 * in department/rank order, and every person×day cell (availability underlay +
 * assignment). Shared by the standalone board route and the manager dashboard's
 * inline expansion. Returns null if the week doesn't exist.
 */
export async function loadBoardData(
  supabase: SupabaseClient<Database>,
  weekId: string,
): Promise<BoardData | null> {
  const { data: week, error } = await supabase
    .from("weeks")
    .select("id, start_date, status, business_hours_by_day")
    .eq("id", weekId)
    .maybeSingle();
  if (error) throw error; // surface, don't swallow
  if (!week) return null;

  const [
    { data: users, error: usersErr },
    { data: events, error: eventsErr },
    { data: availability, error: availErr },
    { data: assignments, error: assignErr },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, department, rank")
      .order("department", { ascending: true })
      .order("rank", { ascending: true }),
    supabase.from("events").select("date, label").eq("week_id", weekId),
    supabase
      .from("availability")
      .select("user_id, date, free_hour_ranges, want_off")
      .eq("week_id", weekId),
    supabase
      .from("assignments")
      .select("user_id, date, status, start_time, end_time, is_close")
      .eq("week_id", weekId),
  ]);
  for (const e of [usersErr, eventsErr, availErr, assignErr]) if (e) throw e;

  const stored = (week.business_hours_by_day ?? {}) as StoredHours;
  const dates = weekDates(week.start_date);

  const eventsByDate = new Map<string, string[]>();
  for (const ev of events ?? []) {
    const list = eventsByDate.get(ev.date) ?? [];
    list.push(ev.label);
    eventsByDate.set(ev.date, list);
  }

  const days: BoardDay[] = dates.map((date) => ({
    date,
    label: formatDayShort(date),
    hours: stored[date] ?? null,
    events: eventsByDate.get(date) ?? [],
  }));

  const availByKey = new Map(
    (availability ?? []).map((a) => [`${a.user_id}|${a.date}`, a]),
  );
  const assignByKey = new Map(
    (assignments ?? []).map((a) => [`${a.user_id}|${a.date}`, a]),
  );

  const boardUsers: BoardUser[] = (users ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    department: u.department,
    rank: u.rank,
  }));

  const cells: Record<string, CellData> = {};
  for (const u of users ?? []) {
    for (const date of dates) {
      const key = `${u.id}|${date}`;
      const av = availByKey.get(key);
      const as = assignByKey.get(key);
      cells[key] = {
        avail: av
          ? {
              ranges: (av.free_hour_ranges as Range[] | null) ?? [],
              wantOff: av.want_off,
            }
          : null, // null = no response
        assignment: as
          ? {
              status: as.status,
              start: as.start_time,
              end: as.end_time,
              isClose: as.is_close,
            }
          : null,
      };
    }
  }

  const shiftCount = (assignments ?? []).filter(
    (a) => a.status === "working",
  ).length;

  return {
    weekId: week.id,
    startDate: week.start_date,
    status: week.status,
    days,
    users: boardUsers,
    cells,
    shiftCount,
  };
}
