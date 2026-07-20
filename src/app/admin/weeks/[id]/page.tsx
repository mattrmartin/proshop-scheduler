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
import { StatusBadge } from "@/components/status-badge";

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

  // Availability responses: which staff have submitted for this week.
  const [
    { data: staff, error: staffErr },
    { data: availRows, error: availErr },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, department, rank")
      .eq("role", "staff")
      .order("department", { ascending: true })
      .order("rank", { ascending: true }),
    supabase.from("availability").select("user_id").eq("week_id", id),
  ]);
  if (staffErr) throw staffErr;
  if (availErr) throw availErr;

  const submittedIds = new Set((availRows ?? []).map((r) => r.user_id));
  const staffList = staff ?? [];
  const submitted = staffList.filter((u) => submittedIds.has(u.id));
  const waiting = staffList.filter((u) => !submittedIds.has(u.id));

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
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {formatWeekRange(week.start_date)}
          </h1>
          <StatusBadge status={week.status} />
        </div>
        <Link
          href={`/admin/weeks/${week.id}/board`}
          className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
        >
          Build schedule →
        </Link>
      </div>

      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Availability responses</h2>
          <span className="text-muted-foreground text-sm">
            {submitted.length} of {staffList.length} submitted
          </span>
        </div>
        {staffList.length === 0 ? (
          <p className="text-muted-foreground text-sm">No staff on the roster yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Submitted ({submitted.length})
              </p>
              {submitted.length === 0 ? (
                <p className="text-muted-foreground text-sm">None yet.</p>
              ) : (
                <ul className="flex flex-col gap-0.5 text-sm">
                  {submitted.map((u) => (
                    <li key={u.id} className="text-green-700">
                      ✓ {u.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Waiting ({waiting.length})
              </p>
              {waiting.length === 0 ? (
                <p className="text-muted-foreground text-sm">Everyone’s in.</p>
              ) : (
                <ul className="text-muted-foreground flex flex-col gap-0.5 text-sm">
                  {waiting.map((u) => (
                    <li key={u.id}>{u.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {week.status === "draft" && (
          <p className="text-muted-foreground text-xs">
            Open the week (from the weeks list) so staff can submit.
          </p>
        )}
      </section>

      <BusinessHoursForm
        weekId={week.id}
        startDate={week.start_date}
        days={days}
      />

      <section className="panel flex flex-col gap-3 p-4">
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
