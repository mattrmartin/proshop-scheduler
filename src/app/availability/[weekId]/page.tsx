import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatWeekRange, weekDates, formatDayShort } from "@/lib/dates";
import { AvailabilityGrid, type GridDay } from "./availability-grid";

type StoredHours = Record<string, { open: string; close: string }>;
type Range = { start: string; end: string };

const hourOf = (t: string) => parseInt(t.slice(0, 2), 10);

export default async function AvailabilityWeekPage({
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

  if (week.status !== "open") {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/availability" className="text-muted-foreground text-sm hover:underline">
          ← Back
        </Link>
        <p className="text-muted-foreground text-sm">
          This week isn’t open for availability.
        </p>
      </div>
    );
  }

  const stored = (week.business_hours_by_day ?? {}) as StoredHours;
  const dates = weekDates(week.start_date);

  // Grid vertical bounds: earliest open .. latest close across open days.
  const openDays = dates.filter((d) => stored[d]);
  let minHour = 24;
  let maxHour = 0;
  for (const d of openDays) {
    minHour = Math.min(minHour, hourOf(stored[d].open));
    maxHour = Math.max(maxHour, Math.ceil(hourOf(stored[d].close)));
  }
  const hasHours = openDays.length > 0 && minHour < maxHour;
  const hours = hasHours
    ? Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)
    : [];

  // This user's existing availability -> hours set + want_off per date.
  const { data: existing, error: exErr } = await supabase
    .from("availability")
    .select("date, free_hour_ranges, want_off")
    .eq("week_id", weekId)
    .eq("user_id", user.id);
  if (exErr) throw exErr;

  const byDate = new Map(existing?.map((r) => [r.date, r]) ?? []);

  const days: GridDay[] = dates.map((date) => {
    const h = stored[date];
    const row = byDate.get(date);
    const ranges = (row?.free_hour_ranges as Range[] | null) ?? [];
    const selected: number[] = [];
    for (const r of ranges) {
      for (let x = hourOf(r.start); x < hourOf(r.end); x++) selected.push(x);
    }
    return {
      date,
      label: formatDayShort(date),
      openHour: h ? hourOf(h.open) : null,
      closeHour: h ? Math.ceil(hourOf(h.close)) : null,
      selected,
      wantOff: Boolean(row?.want_off),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/availability" className="text-muted-foreground text-sm hover:underline">
          ← All weeks
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {formatWeekRange(week.start_date)}
        </h1>
        <p className="text-muted-foreground text-sm">
          Drag across the hours you can work. Toggle “Day off” to request a day
          off.
        </p>
      </div>

      {hasHours ? (
        <AvailabilityGrid weekId={week.id} hours={hours} days={days} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Business hours aren’t set for this week yet.
        </p>
      )}
    </div>
  );
}
