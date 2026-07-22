import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { assignmentLabel } from "@/lib/schedule-format";
import { weekDates } from "@/lib/dates";
import { WeekBoardCard } from "./week-board-card";
import { AdminMenu } from "./admin-menu";
import { ManagerTodayCard } from "./manager-today-card";

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

  const user = await getCurrentAppUser();
  const firstName = user?.name.split(" ")[0] ?? "there";

  // Day-pager upper bound: the last day of the most recent published week.
  const latestPublished = publishedWeeks[0]; // most recent first
  const maxDateIso = latestPublished
    ? weekDates(latestPublished.start_date)[6]
    : todayIso;

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
        <h1 className="text-[26px] font-bold tracking-tight">Hi, {firstName}</h1>
        <AdminMenu />
      </div>

      <ManagerTodayCard
        todayIso={todayIso}
        maxDateIso={maxDateIso}
        initialChips={todayChips}
      />

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
