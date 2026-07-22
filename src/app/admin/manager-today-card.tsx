"use client";

import { useState } from "react";

import { loadDayRoster, type DayChip } from "./board-actions";

/** Shift an ISO date by whole days (UTC-safe). */
function shiftIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + delta * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The manager's dark Today hero — who's working, with ‹ › arrows to page
 * through future days. Bounded to the published horizon (today → last
 * published day); beyond that there's nothing scheduled to show.
 */
export function ManagerTodayCard({
  todayIso,
  maxDateIso,
  initialChips,
}: {
  todayIso: string;
  maxDateIso: string;
  initialChips: DayChip[];
}) {
  const [date, setDate] = useState(todayIso);
  const [chips, setChips] = useState<DayChip[]>(initialChips);
  const [loading, setLoading] = useState(false);

  const canPrev = date > todayIso;
  const canNext = date < maxDateIso;
  const isToday = date === todayIso;

  async function go(delta: number) {
    const next = shiftIso(date, delta);
    if (next < todayIso || next > maxDateIso) return;
    setDate(next);
    setLoading(true);
    setChips(await loadDayRoster(next));
    setLoading(false);
  }

  const arrowCls = (enabled: boolean) =>
    `flex size-7 items-center justify-center rounded-full border border-white/20 text-[13px] ${
      enabled ? "cursor-pointer text-white/80 hover:bg-white/10" : "text-white/25"
    }`;

  return (
    <div className="bg-foreground text-background rounded-[20px] p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold tracking-[0.08em] text-white/70 uppercase">
          {isToday ? "Today · " : ""}
          {longDate(date)}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous day"
            disabled={!canPrev || loading}
            onClick={() => go(-1)}
            className={arrowCls(canPrev && !loading)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next day"
            disabled={!canNext || loading}
            onClick={() => go(1)}
            className={arrowCls(canNext && !loading)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 text-[30px] font-semibold tracking-tight">
        {chips.length}{" "}
        <span className="text-lg font-normal text-white/60">working</span>
      </div>

      {chips.length === 0 ? (
        <div className="text-[13px] text-white/60">
          No one scheduled{isToday ? " (current week not published)" : ""}.
        </div>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {chips.map((c, i) => (
            <div key={i} className="shrink-0 rounded-xl bg-white/10 px-2.5 py-2">
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
  );
}
