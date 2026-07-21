import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatWeekRange } from "@/lib/dates";
import { assignmentLabel } from "@/lib/schedule-format";

function shiftDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Shift = {
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_close: boolean;
};

export default async function StaffHomePage() {
  const supabase = await createClient();
  const user = await getCurrentAppUser();

  await supabase.rpc("ensure_open_weeks");
  const { data: todayVal } = await supabase.rpc("app_today");
  const todayIso = todayVal as unknown as string;

  // Upcoming published shifts for this user.
  let shifts: Shift[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("assignments")
      .select("date, start_time, end_time, is_close, weeks!inner(status)")
      .eq("user_id", user.id)
      .eq("status", "working")
      .gte("date", todayIso)
      .eq("weeks.status", "published")
      .order("date", { ascending: true });
    if (error) throw error; // surface, don't swallow
    shifts = (data ?? []) as unknown as Shift[];
  }

  // Weeks still accepting availability + whether this user answered.
  const { data: weeks, error: weeksErr } = await supabase
    .from("weeks")
    .select("id, start_date")
    .eq("status", "open")
    .order("start_date", { ascending: true });
  if (weeksErr) throw weeksErr;

  const submitted = new Set<string>();
  if (user && weeks?.length) {
    const { data: mine, error: mineErr } = await supabase
      .from("availability")
      .select("week_id")
      .eq("user_id", user.id)
      .in(
        "week_id",
        weeks.map((w) => w.id),
      );
    if (mineErr) throw mineErr;
    for (const r of mine ?? []) submitted.add(r.week_id);
  }

  const [next, ...rest] = shifts;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Hi{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <div className="mt-1 flex gap-4 text-sm font-medium">
          <Link href="/today" className="text-primary hover:underline">
            Today →
          </Link>
          <Link href="/board" className="text-primary hover:underline">
            Full schedule →
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase">
          Your shifts
        </h2>
        {!next ? (
          <p className="text-muted-foreground text-sm">
            No upcoming shifts posted yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="panel border-primary/40 flex items-center justify-between p-4">
              <div>
                <div className="text-muted-foreground text-xs font-medium uppercase">
                  Next shift
                </div>
                <div className="font-medium">{shiftDate(next.date)}</div>
              </div>
              <span className="text-primary text-lg font-semibold">
                {assignmentLabel({
                  status: "working",
                  start: next.start_time,
                  end: next.end_time,
                  isClose: next.is_close,
                })}
              </span>
            </div>
            {rest.map((s) => (
              <div
                key={s.date}
                className="panel flex items-center justify-between px-4 py-3"
              >
                <span className="font-medium">{shiftDate(s.date)}</span>
                <span className="text-primary font-medium">
                  {assignmentLabel({
                    status: "working",
                    start: s.start_time,
                    end: s.end_time,
                    isClose: s.is_close,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase">
          Submit availability
        </h2>
        {!weeks?.length ? (
          <p className="text-muted-foreground text-sm">
            Nothing to submit right now.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {weeks.map((w) => {
              const done = submitted.has(w.id);
              return (
                <li key={w.id}>
                  <Link
                    href={`/availability/${w.id}`}
                    className="panel hover:border-primary/40 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <span className="font-medium">
                      {formatWeekRange(w.start_date)}
                    </span>
                    {done ? (
                      <span className="badge bg-primary/12 text-primary">
                        ✓ Submitted
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Tap to fill →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
