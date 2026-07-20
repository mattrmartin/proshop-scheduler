import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { ProgressRing } from "@/components/progress-ring";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Keep the rolling window of upcoming open weeks materialised.
  await supabase.rpc("ensure_open_weeks");

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
        <Link
          href="/admin/roster"
          className="text-primary text-sm font-medium hover:underline"
        >
          Manage roster →
        </Link>
      </div>

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
