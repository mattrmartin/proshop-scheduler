"use client";

import { useCallback, useState } from "react";

import { formatWeekRange } from "@/lib/dates";
import { AvailabilityGrid, type GridDay } from "./[weekId]/availability-grid";
import { loadAvailabilityGrid, type AvailabilityGridData } from "./staff-actions";

function hourLabel12(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const d = h % 12 === 0 ? 12 : h % 12;
  return `${d} ${period}`;
}

function daySummary(day: GridDay): string {
  if (day.wantOff) return "Day off";
  if (!day.selected.length) return "Not available";
  const min = Math.min(...day.selected);
  const max = Math.max(...day.selected);
  return `${hourLabel12(min)} – ${hourLabel12(max + 1)}`;
}

export function AvailabilityWeekCard({
  weekId,
  startDate,
  submitted: initialSubmitted,
}: {
  weekId: string;
  startDate: string;
  submitted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<AvailabilityGridData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await loadAvailabilityGrid(weekId);
    setData(d);
    if (d) setSubmitted(d.submitted);
    setLoading(false);
  }, [weekId]);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !data) await load();
  }

  const showSummary = submitted && !editing;

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1 text-[15.5px] font-bold tracking-tight">
          {formatWeekRange(startDate)}
        </div>
        {submitted ? (
          <span className="badge bg-accent text-accent-foreground">✓ Submitted</span>
        ) : (
          <span className="badge bg-warning-surface text-warning-foreground">
            Needs input
          </span>
        )}
        <span className="text-muted-foreground text-sm">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="border-border/70 border-t p-4">
          {loading && <div className="text-muted-foreground text-sm">Loading…</div>}
          {data && showSummary && (
            <div className="flex flex-col gap-2">
              {data.days.map((d) => (
                <div key={d.date} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[13px]">{d.label}</span>
                  <span className="time text-foreground text-[12.5px]">
                    {daySummary(d)}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-primary mt-1 self-start text-[13px] font-semibold"
              >
                Edit availability
              </button>
            </div>
          )}
          {data && !showSummary && data.hours.length > 0 && (
            <>
              <p className="text-muted-foreground mb-3 text-[12.5px]">
                Tap the hours you can work (drag to paint on a computer). Toggle
                “Day off” to request the day off.
              </p>
              <AvailabilityGrid
                key={`${weekId}-${submitted}-${editing}`}
                weekId={weekId}
                hours={data.hours}
                days={data.days}
                onSaved={() => {
                  setEditing(false);
                  void load();
                }}
              />
            </>
          )}
          {data && !showSummary && data.hours.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Business hours aren’t set for this week yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
