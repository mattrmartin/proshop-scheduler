import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange } from "@/lib/dates";
import { assignmentLabel } from "@/lib/schedule-format";
import { StatusBadge } from "@/components/status-badge";
import { ProgressRing } from "@/components/progress-ring";

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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground text-sm">
            Upcoming weeks open automatically. Build and publish when you’re ready.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Link
            href="/admin/roster"
            className="text-primary text-sm font-medium hover:underline"
          >
            Manage roster →
          </Link>
          <Link
            href="/admin/settings"
            className="text-primary text-sm font-medium hover:underline"
          >
            Settings →
          </Link>
        </div>
      </div>

      <Link
        href="/today"
        className="panel hover:border-primary/40 flex items-center justify-between gap-4 p-4 transition-colors"
      >
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            Today
          </div>
          {todayShifts.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No one scheduled (current week not published).
            </div>
          ) : (
            <div className="text-sm">
              <span className="font-medium">{todayShifts.length} working</span>
              <span className="text-muted-foreground">
                {" — "}
                {todayShifts
                  .slice(0, 4)
                  .map(
                    (r) =>
                      `${r.users?.name?.split(" ")[0]} ${assignmentLabel({
                        status: "working",
                        start: r.start_time,
                        end: r.end_time,
                        isClose: r.is_close,
                      })}`,
                  )
                  .join(", ")}
                {todayShifts.length > 4 ? "…" : ""}
              </span>
            </div>
          )}
        </div>
        <span className="text-primary text-sm font-medium">See who’s on →</span>
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase">
          Building now
        </h2>
        {openWeeks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open weeks.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {openWeeks.map((w) => {
              const submitted = submittedByWeek.get(w.id)?.size ?? 0;
              return (
                <li key={w.id}>
                  <Link
                    href={`/admin/weeks/${w.id}/board`}
                    className="panel hover:border-primary/40 flex items-center gap-4 p-4 transition-colors"
                  >
                    <ProgressRing value={submitted} total={total} />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="font-medium">
                        {formatWeekRange(w.start_date)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {submitted} of {total} submitted availability
                      </span>
                    </div>
                    <StatusBadge status={w.status} />
                    <span className="text-primary text-sm font-medium">
                      Build →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {publishedWeeks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-medium uppercase">
            Published
          </h2>
          <ul className="flex flex-col gap-2">
            {publishedWeeks.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/admin/weeks/${w.id}/board`}
                  className="panel hover:border-primary/40 flex items-center justify-between px-4 py-3 transition-colors"
                >
                  <span className="font-medium">
                    {formatWeekRange(w.start_date)}
                  </span>
                  <StatusBadge status={w.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
