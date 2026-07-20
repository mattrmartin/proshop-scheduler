"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveAvailability, type SaveState } from "./actions";

export type GridDay = {
  date: string;
  label: string;
  openHour: number | null;
  closeHour: number | null;
  selected: number[];
  wantOff: boolean;
};

const initialState: SaveState = {};

function hourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

export function AvailabilityGrid({
  weekId,
  hours,
  days,
}: {
  weekId: string;
  hours: number[];
  days: GridDay[];
}) {
  const [sel, setSel] = useState<Record<string, Set<number>>>(() =>
    Object.fromEntries(days.map((d) => [d.date, new Set(d.selected)])),
  );
  const [wantOff, setWantOff] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(days.map((d) => [d.date, d.wantOff])),
  );
  const drag = useRef<{ mode: "fill" | "erase" } | null>(null);
  const [state, action, pending] = useActionState(saveAvailability, initialState);

  const isActive = (date: string, hour: number) => {
    const day = days.find((d) => d.date === date);
    return (
      day?.openHour != null &&
      day?.closeHour != null &&
      hour >= day.openHour &&
      hour < day.closeHour
    );
  };

  const applyCell = (date: string, hour: number) => {
    setSel((prev) => {
      const next = new Set(prev[date]);
      if (drag.current?.mode === "fill") next.add(hour);
      else next.delete(hour);
      return { ...prev, [date]: next };
    });
  };

  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  const onPointerDown = (date: string, hour: number) => {
    if (!isActive(date, hour)) return;
    const has = sel[date]?.has(hour);
    drag.current = { mode: has ? "erase" : "fill" };
    applyCell(date, hour);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const date = el?.getAttribute("data-date");
    const hour = el?.getAttribute("data-hour");
    if (date && hour && isActive(date, Number(hour)))
      applyCell(date, Number(hour));
  };

  const payload = JSON.stringify(
    days.map((d) => ({
      date: d.date,
      want_off: wantOff[d.date] ?? false,
      hours: [...(sel[d.date] ?? [])],
    })),
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="week_id" value={weekId} />
      <input type="hidden" name="payload" value={payload} />

      <div className="overflow-x-auto">
        {/* No touch-action:none here — it would trap page scroll on phones.
            On touch, tapping a cell toggles it; drag-paint stays a desktop nicety. */}
        <table
          className="border-separate border-spacing-0 select-none"
          onPointerMove={onPointerMove}
        >
          <thead>
            <tr>
              <th className="w-14" />
              {days.map((d) => (
                <th key={d.date} className="px-1 pb-2 text-center align-bottom">
                  <div className="text-xs font-medium">{d.label}</div>
                  <label className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={wantOff[d.date] ?? false}
                      onChange={(e) =>
                        setWantOff((p) => ({ ...p, [d.date]: e.target.checked }))
                      }
                    />
                    Day off
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h}>
                <td className="text-muted-foreground pr-2 text-right align-top text-[10px]">
                  {hourLabel(h)}
                </td>
                {days.map((d) => {
                  const active = isActive(d.date, h);
                  const on = sel[d.date]?.has(h);
                  return (
                    <td key={d.date} className="p-0">
                      <div
                        data-date={d.date}
                        data-hour={h}
                        onPointerDown={() => onPointerDown(d.date, h)}
                        className={[
                          "h-6 w-16 border-b border-r border-l first:border-l",
                          active
                            ? on
                              ? "bg-primary cursor-pointer"
                              : "bg-background hover:bg-primary/15 cursor-pointer"
                            : "bg-muted cursor-not-allowed",
                        ].join(" ")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save availability"}
        </Button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </form>
  );
}
