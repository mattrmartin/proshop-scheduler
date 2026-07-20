import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatWeekRange, weekDates, formatDayShort } from "@/lib/dates";
import {
  SharedBoard,
  type SharedDay,
  type SharedUser,
  type SharedAssignment,
} from "./shared-board";

type StoredHours = Record<string, { open: string; close: string }>;

export default async function SharedBoardPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const user = await getCurrentAppUser();
  if (!user) notFound();

  const supabase = await createClient();

  const { data: week, error } = await supabase
    .from("weeks")
    .select("id, start_date, status, business_hours_by_day")
    .eq("id", weekId)
    .maybeSingle();
  if (error) throw error; // surface, don't swallow
  if (!week) notFound();

  // Staff only see published schedules; admins can preview anything.
  if (week.status !== "published" && user.role !== "admin") {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/board" className="text-muted-foreground text-sm hover:underline">
          ← Back
        </Link>
        <p className="text-muted-foreground text-sm">
          This schedule isn’t published yet.
        </p>
      </div>
    );
  }

  const [
    { data: users, error: usersErr },
    { data: events, error: eventsErr },
    { data: assignments, error: assignErr },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, department, rank")
      .order("department", { ascending: true })
      .order("rank", { ascending: true }),
    supabase.from("events").select("date, label").eq("week_id", weekId),
    supabase
      .from("assignments")
      .select("user_id, date, status, start_time, end_time, is_close")
      .eq("week_id", weekId),
  ]);
  for (const e of [usersErr, eventsErr, assignErr]) if (e) throw e;

  const stored = (week.business_hours_by_day ?? {}) as StoredHours;
  const dates = weekDates(week.start_date);

  const eventsByDate = new Map<string, string[]>();
  for (const ev of events ?? []) {
    const list = eventsByDate.get(ev.date) ?? [];
    list.push(ev.label);
    eventsByDate.set(ev.date, list);
  }

  const days: SharedDay[] = dates.map((date) => ({
    date,
    label: formatDayShort(date),
    hours: stored[date] ?? null,
    events: eventsByDate.get(date) ?? [],
  }));

  const cells: Record<string, SharedAssignment> = {};
  for (const a of assignments ?? []) {
    cells[`${a.user_id}|${a.date}`] = {
      status: a.status,
      start: a.start_time,
      end: a.end_time,
      isClose: a.is_close,
    };
  }

  // Only show people who have at least one assignment this week (the sheet
  // doesn't list everyone once it's built).
  const assignedUserIds = new Set((assignments ?? []).map((a) => a.user_id));
  const boardUsers: SharedUser[] = (users ?? [])
    .filter((u) => assignedUserIds.has(u.id) || u.id === user.id)
    .map((u) => ({ id: u.id, name: u.name, department: u.department }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/board" className="text-muted-foreground text-sm hover:underline">
          ← All schedules
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {formatWeekRange(week.start_date)}
          {week.status !== "published" && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              (preview — not published)
            </span>
          )}
        </h1>
      </div>

      <SharedBoard
        days={days}
        users={boardUsers}
        cells={cells}
        currentUserId={user.id}
      />
    </div>
  );
}
