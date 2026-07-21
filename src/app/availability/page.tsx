import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { assignmentLabel } from "@/lib/schedule-format";
import { AvailabilityWeekCard } from "./availability-week-card";
import { ScheduleWeekCard } from "./schedule-week-card";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function shiftDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type TodayRow = {
  user_id: string;
  start_time: string | null;
  end_time: string | null;
  is_close: boolean;
  users: { name: string } | null;
};
type MyShift = {
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

  // Everyone working today (published) — powers the hero count + coworker chips.
  const { data: todayData, error: todayErr } = await supabase
    .from("assignments")
    .select("user_id, start_time, end_time, is_close, users!inner(name), weeks!inner(status)")
    .eq("date", todayIso)
    .eq("status", "working")
    .eq("weeks.status", "published");
  if (todayErr) throw todayErr;
  const todayRows = (todayData ?? []) as unknown as TodayRow[];

  const myToday = user ? todayRows.find((r) => r.user_id === user.id) : undefined;
  const myShiftToday = myToday
    ? assignmentLabel({
        status: "working",
        start: myToday.start_time,
        end: myToday.end_time,
        isClose: myToday.is_close,
      })
    : null;
  const coworkers = todayRows
    .filter((r) => r.user_id !== user?.id)
    .map((r) => ({
      name: r.users?.name?.split(" ")[0] ?? "?",
      time: assignmentLabel({
        status: "working",
        start: r.start_time,
        end: r.end_time,
        isClose: r.is_close,
      }),
    }));

  // My upcoming shifts (future published days).
  let upcoming: MyShift[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("assignments")
      .select("date, start_time, end_time, is_close, weeks!inner(status)")
      .eq("user_id", user.id)
      .eq("status", "working")
      .gt("date", todayIso)
      .eq("weeks.status", "published")
      .order("date", { ascending: true });
    if (error) throw error; // surface, don't swallow
    upcoming = (data ?? []) as unknown as MyShift[];
  }

  // Weeks accepting availability + whether this user answered.
  const [{ data: openWeeks, error: openErr }, { data: pubWeeks, error: pubErr }] =
    await Promise.all([
      supabase
        .from("weeks")
        .select("id, start_date")
        .eq("status", "open")
        .order("start_date", { ascending: true }),
      supabase
        .from("weeks")
        .select("id, start_date")
        .eq("status", "published")
        .order("start_date", { ascending: false }),
    ]);
  if (openErr) throw openErr;
  if (pubErr) throw pubErr;

  const submitted = new Set<string>();
  if (user && openWeeks?.length) {
    const { data: mine, error: mineErr } = await supabase
      .from("availability")
      .select("week_id")
      .eq("user_id", user.id)
      .in("week_id", openWeeks.map((w) => w.id));
    if (mineErr) throw mineErr;
    for (const r of mine ?? []) submitted.add(r.week_id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[26px] font-bold tracking-tight">
        Hi{user ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>

      {/* Today hero */}
      <div className="bg-foreground text-background rounded-[20px] p-5">
        <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-white/70 uppercase">
          Today · {longDate(todayIso)}
        </div>
        <div className="time mb-1 text-[30px] font-semibold tracking-tight">
          {myShiftToday ?? "Not scheduled"}
        </div>
        <div className="mb-3.5 text-[13px] text-white/70">
          {todayRows.length} working today
        </div>
        {coworkers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {coworkers.map((c, i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl bg-white/10 px-2.5 py-2"
              >
                <div className="text-[11.5px] font-semibold whitespace-nowrap">
                  {c.name}
                </div>
                <div className="time text-[10.5px] whitespace-nowrap text-white/70">
                  {c.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming shifts */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-label px-0.5">Upcoming shifts</h2>
          <div className="panel overflow-hidden">
            {upcoming.map((s) => (
              <div
                key={s.date}
                className="border-border/60 flex items-center justify-between border-b px-4 py-3 last:border-b-0"
              >
                <span className="text-[14px] font-semibold">{shiftDate(s.date)}</span>
                <span className="time text-primary text-[14px] font-medium">
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
        </section>
      )}

      {/* Availability */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-0.5">
          <h2 className="section-label">Availability</h2>
          <span className="text-muted-foreground text-[11.5px]">Submit by Thu noon</span>
        </div>
        {!openWeeks?.length ? (
          <p className="text-muted-foreground text-sm">Nothing to submit right now.</p>
        ) : (
          openWeeks.map((w) => (
            <AvailabilityWeekCard
              key={w.id}
              weekId={w.id}
              startDate={w.start_date}
              submitted={submitted.has(w.id)}
            />
          ))
        )}
      </section>

      {/* Schedule */}
      {user && (pubWeeks?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-label px-0.5">Schedule</h2>
          {pubWeeks!.map((w) => (
            <ScheduleWeekCard
              key={w.id}
              weekId={w.id}
              startDate={w.start_date}
              currentUserId={user.id}
            />
          ))}
        </section>
      )}
    </div>
  );
}
