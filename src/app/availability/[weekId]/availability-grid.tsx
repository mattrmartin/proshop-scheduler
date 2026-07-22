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
  onSaved,
}: {
  weekId: string;
  hours: number[];
  days: GridDay[];
  onSaved?: () => void;
}) {
  const [sel, setSel] = useState<Record<string, Set<number>>>(() =>
    Object.fromEntries(days.map((d) => [d.date, new Set(d.selected)])),
  );
  const [wantOff, setWantOff] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(days.map((d) => [d.date, d.wantOff])),
  );
  const drag = useRef<{ mode: "fill" | "erase" } | null>(null);
  // A mouse press toggles on pointerdown and paints on drag; the click that
  // follows must be ignored so it doesn't undo that toggle. Touch never sets
  // this, so a touch tap always toggles via click.
  const suppressClick = useRef(false);
  const [state, action, pending] = useActionState(saveAvailability, initialState);

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state.ok, onSaved]);

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

  const toggleCell = (date: string, hour: number) => {
    setSel((prev) => {
      const next = new Set(prev[date]);
      if (next.has(hour)) next.delete(hour);
      else next.add(hour);
      return { ...prev, [date]: next };
    });
  };

  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  const onPointerDown = (e: React.PointerEvent, date: string, hour: number) => {
    if (!isActive(date, hour)) return;
    // Drag-to-paint is a mouse-only nicety. On touch, do nothing here so the
    // gesture stays a native scroll — a deliberate tap toggles via onClick.
    if (e.pointerType !== "mouse") {
      suppressClick.current = false;
      return;
    }
    suppressClick.current = true;
    const has = sel[date]?.has(hour);
    drag.current = { mode: has ? "erase" : "fill" };
    applyCell(date, hour);
  };

  const onCellClick = (date: string, hour: number) => {
    // Swallow the click that trails a mouse press (already toggled on down).
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!isActive(date, hour)) return;
    toggleCell(date, hour);
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
                        onPointerDown={(e) => onPointerDown(e, d.date, h)}
                        onClick={() => onCellClick(d.date, h)}
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
