import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { assignmentLabel } from "@/lib/schedule-format";
import { WeekBoardCard } from "./week-board-card";
import { RosterDrawer } from "./roster-drawer";

type TodayRow = {
  start_time: string | null;
  end_time: string | null;
  is_close: boolean;
  users: { name: string } | null;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Keep the rolling window of upcoming open weeks materialised.
  await supabase.rpc("ensure_open_weeks");

  const { data: todayVal } = await supabase.rpc("app_today");
  const todayIso = todayVal as unknown as string;
  const { data: todayData, error: todayErr } = await supabase
    .from("assignments")
    .select("start_time, end_time, is_close, users!inner(name), weeks!inner(status)")
    .eq("date", todayIso)
    .eq("status", "working")
    .eq("weeks.status", "published");
  if (todayErr) throw todayErr;
  const todayShifts = (todayData ?? []) as unknown as TodayRow[];

  const [
    { data: weeks, error },
    { count: staffCount, error: staffErr },
  ] = await Promise.all([
    supabase
      .from("weeks")
      .select("id, start_date, status")
      .order("start_date", { ascending: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "staff"),
  ]);
  if (error) throw error; // surface, don't swallow
  if (staffErr) throw staffErr;

  const openWeeks = (weeks ?? []).filter((w) => w.status === "open");
  const publishedWeeks = (weeks ?? [])
    .filter((w) => w.status === "published")
    .reverse(); // most recent first

  // Submission counts for the open weeks.
  const openIds = openWeeks.map((w) => w.id);
  const submittedByWeek = new Map<string, Set<string>>();
  if (openIds.length) {
    const { data: avail, error: availErr } = await supabase
      .from("availability")
      .select("week_id, user_id")
      .in("week_id", openIds);
    if (availErr) throw availErr;
    for (const a of avail ?? []) {
      const set = submittedByWeek.get(a.week_id) ?? new Set<string>();
      set.add(a.user_id);
      submittedByWeek.set(a.week_id, set);
    }
  }

  const total = staffCount ?? 0;

  const todayChips = todayShifts.map((r) => ({
    name: r.users?.name?.split(" ")[0] ?? "?",
    time: assignmentLabel({
      status: "working",
      start: r.start_time,
      end: r.end_time,
      isClose: r.is_close,
    }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground text-[13.5px] leading-relaxed">
            Weeks open automatically. Build the board as availability comes in,
            then publish.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
          <RosterDrawer />
          <Link
            href="/admin/settings"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Settings →
          </Link>
        </div>
      </div>

      {/* Today strip */}
      <div className="panel p-4">
        <div className="section-label mb-2">Today · {todayChips.length} working</div>
        {todayChips.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No one scheduled (current week not published).
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {todayChips.map((c, i) => (
              <div
                key={i}
                className="bg-muted flex min-w-[78px] shrink-0 flex-col gap-0.5 rounded-xl px-2.5 py-2"
              >
                <span className="text-foreground text-[11.5px] font-semibold whitespace-nowrap">
                  {c.name}
                </span>
                <span className="time text-primary text-[11px] whitespace-nowrap">
                  {c.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Building now */}
      <section className="flex flex-col gap-3">
        <h2 className="section-label px-0.5">Building now</h2>
        {openWeeks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open weeks.</p>
        ) : (
          openWeeks.map((w) => (
            <WeekBoardCard
              key={w.id}
              weekId={w.id}
              startDate={w.start_date}
              variant="building"
              submitted={submittedByWeek.get(w.id)?.size ?? 0}
              total={total}
            />
          ))
        )}
      </section>

      {/* Published */}
      {publishedWeeks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-label px-0.5">Published</h2>
          {publishedWeeks.map((w) => (
            <WeekBoardCard
              key={w.id}
              weekId={w.id}
              startDate={w.start_date}
              variant="published"
            />
          ))}
        </section>
      )}
    </div>
  );
}
