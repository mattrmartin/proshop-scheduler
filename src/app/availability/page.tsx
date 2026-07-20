import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatWeekRange } from "@/lib/dates";

export default async function AvailabilityListPage() {
  const supabase = await createClient();
  const user = await getCurrentAppUser();

  // Keep the rolling window of open weeks fresh for staff too.
  await supabase.rpc("ensure_open_weeks");

  const { data: weeks, error } = await supabase
    .from("weeks")
    .select("id, start_date")
    .eq("status", "open")
    .order("start_date", { ascending: true });
  if (error) throw error; // surface, don't swallow

  // Which of these has this user already answered?
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Your availability
        </h1>
        <p className="text-muted-foreground text-sm">
          Tap a week and mark when you can work. Thursday noon is the soft
          deadline.
        </p>
        <Link
          href="/board"
          className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
        >
          View published schedules →
        </Link>
      </div>

      {!weeks?.length ? (
        <p className="text-muted-foreground text-sm">
          No weeks are open for availability right now.
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
    </div>
  );
}
