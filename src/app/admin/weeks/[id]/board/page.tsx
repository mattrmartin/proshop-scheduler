import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange, weekDates, formatDayShort } from "@/lib/dates";
import { BuildBoard, type BoardDay, type BoardUser, type CellData } from "./board";

type StoredHours = Record<string, { open: string; close: string }>;
type Range = { start: string; end: string };

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: week, error } = await supabase
    .from("weeks")
    .select("id, start_date, status, business_hours_by_day")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error; // surface, don't swallow
  if (!week) notFound();

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
    supabase.from("events").select("date, label").eq("week_id", id),
    supabase
      .from("availability")
      .select("user_id, date, free_hour_ranges, want_off")
      .eq("week_id", id),
    supabase
      .from("assignments")
      .select("user_id, date, status, start_time, end_time, is_close")
      .eq("week_id", id),
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/admin/weeks/${week.id}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Week settings
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          Build board — {formatWeekRange(week.start_date)}
        </h1>
        <p className="text-muted-foreground text-sm">
          Click a cell to assign a shift. Availability is a guide, not a limit.
        </p>
        <Link
          href={`/board/${week.id}`}
          className="mt-1 inline-block text-sm font-medium hover:underline"
        >
          Preview shared board →
        </Link>
      </div>

      <BuildBoard
        weekId={week.id}
        days={days}
        users={boardUsers}
        cells={cells}
      />
    </div>
  );
}
