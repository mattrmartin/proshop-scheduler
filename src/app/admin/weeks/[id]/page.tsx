import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDayShort, formatWeekRange, weekDates } from "@/lib/dates";
import {
  BusinessHoursForm,
  type DayHours,
} from "./business-hours-form";
import { AddEventForm } from "./add-event-form";
import { deleteEvent } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open for availability",
  published: "Published",
};

type StoredHours = Record<string, { open: string; close: string }>;

export default async function WeekDetailPage({
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

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, date, label")
    .eq("week_id", id)
    .order("date", { ascending: true });
  if (eventsError) throw eventsError;

  const stored = (week.business_hours_by_day ?? {}) as StoredHours;
  const dates = weekDates(week.start_date);
  const days: DayHours[] = dates.map((date) => {
    const h = stored[date];
    return {
      date,
      label: formatDayShort(date),
      open: h?.open ?? "06:00",
      close: h?.close ?? "19:00",
      closed: !h,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← All weeks
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {formatWeekRange(week.start_date)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {STATUS_LABELS[week.status] ?? week.status}
        </p>
      </div>

      <BusinessHoursForm
        weekId={week.id}
        startDate={week.start_date}
        days={days}
      />

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Events</h2>
        <AddEventForm
          weekId={week.id}
          startDate={week.start_date}
          days={dates.map((date) => ({ date, label: formatDayShort(date) }))}
        />

        {!events?.length ? (
          <p className="text-muted-foreground text-sm">No events yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-muted-foreground mr-2">
                    {formatDayShort(ev.date)}
                  </span>
                  {ev.label}
                </span>
                <form action={deleteEvent}>
                  <input type="hidden" name="event_id" value={ev.id} />
                  <input type="hidden" name="week_id" value={week.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
