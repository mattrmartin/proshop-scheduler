"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { shortTime, assignmentLabel } from "@/lib/schedule-format";
import { saveAssignment, type AssignState } from "./actions";

type Range = { start: string; end: string };

export type BoardDay = {
  date: string;
  label: string;
  hours: { open: string; close: string } | null;
  events: string[];
};
export type BoardUser = {
  id: string;
  name: string;
  department: string;
  rank: number;
};
export type CellData = {
  avail: { ranges: Range[]; wantOff: boolean } | null;
  assignment: {
    status: string;
    start: string | null;
    end: string | null;
    isClose: boolean;
  } | null;
};

function availHint(avail: CellData["avail"]): {
  text: string;
  tone: "off" | "free" | "none";
} {
  if (!avail) return { text: "—", tone: "none" };
  if (avail.wantOff) return { text: "OFF req", tone: "off" };
  if (avail.ranges.length === 0) return { text: "—", tone: "none" };
  return {
    text: avail.ranges
      .map((r) => `${shortTime(r.start)}–${shortTime(r.end)}`)
      .join(", "),
    tone: "free",
  };
}

export function BuildBoard({
  weekId,
  days,
  users,
  cells,
}: {
  weekId: string;
  days: BoardDay[];
  users: BoardUser[];
  cells: Record<string, CellData>;
}) {
  const [selected, setSelected] = useState<{
    userId: string;
    date: string;
  } | null>(null);

  const selectedUser = users.find((u) => u.id === selected?.userId);
  const selectedDay = days.find((d) => d.date === selected?.date);
  const selectedCell = selected
    ? cells[`${selected.userId}|${selected.date}`]
    : null;

  return (
    <div className="flex flex-col gap-4">
      {selected && selectedUser && selectedDay && (
        <CellEditor
          key={`${selected.userId}|${selected.date}`}
          weekId={weekId}
          userId={selected.userId}
          date={selected.date}
          userName={selectedUser.name}
          dayLabel={selectedDay.label}
          cell={selectedCell}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="bg-background sticky left-0 z-10 border-b px-2 py-1 text-left">
                Staff
              </th>
              {days.map((d) => (
                <th
                  key={d.date}
                  className="min-w-28 border-b border-l px-2 py-1 text-left align-top font-medium"
                >
                  <div>{d.label}</div>
                  <div className="text-muted-foreground text-[10px] font-normal">
                    {d.hours ? `${shortTime(d.hours.open)}–${shortTime(d.hours.close)}` : "closed"}
                  </div>
                  {d.events.map((ev) => (
                    <div
                      key={ev}
                      className="text-[10px] font-normal text-blue-600"
                    >
                      {ev}
                    </div>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="bg-background sticky left-0 z-10 border-b px-2 py-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-muted-foreground text-[10px] capitalize">
                    {u.department}
                  </div>
                </td>
                {days.map((d) => {
                  const cell = cells[`${u.id}|${d.date}`];
                  const isSel =
                    selected?.userId === u.id && selected?.date === d.date;
                  const hint = availHint(cell?.avail ?? null);
                  const a = cell?.assignment;
                  return (
                    <td key={d.date} className="border-b border-l p-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelected({ userId: u.id, date: d.date })
                        }
                        className={[
                          "h-12 w-full px-2 py-1 text-left align-top",
                          isSel ? "ring-2 ring-inset ring-black" : "",
                          hint.tone === "off" && !a ? "bg-yellow-100" : "",
                        ].join(" ")}
                      >
                        {a ? (
                          <span
                            className={
                              a.status === "off"
                                ? "text-muted-foreground font-medium"
                                : "font-medium text-green-700"
                            }
                          >
                            {assignmentLabel(a)}
                          </span>
                        ) : (
                          <span
                            className={
                              hint.tone === "off"
                                ? "text-[10px] font-medium text-yellow-700"
                                : hint.tone === "free"
                                  ? "text-muted-foreground text-[10px]"
                                  : "text-muted-foreground/50 text-[10px]"
                            }
                          >
                            {hint.text}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="bg-background sticky left-0 z-10 border-t px-2 py-1 text-xs font-medium">
                Working
              </td>
              {days.map((d) => {
                const count = users.reduce(
                  (n, u) =>
                    cells[`${u.id}|${d.date}`]?.assignment?.status === "working"
                      ? n + 1
                      : n,
                  0,
                );
                return (
                  <td
                    key={d.date}
                    className="text-muted-foreground border-l border-t px-2 py-1 text-xs"
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const initial: AssignState = {};

function CellEditor({
  weekId,
  userId,
  date,
  userName,
  dayLabel,
  cell,
  onClose,
}: {
  weekId: string;
  userId: string;
  date: string;
  userName: string;
  dayLabel: string;
  cell: CellData | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveAssignment, initial);
  const a = cell?.assignment;

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4"
    >
      <input type="hidden" name="week_id" value={weekId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="date" value={date} />

      <div className="mr-2">
        <div className="font-medium">{userName}</div>
        <div className="text-muted-foreground text-xs">{dayLabel}</div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Start</span>
        <input
          type="time"
          name="start_time"
          defaultValue={a?.start ?? ""}
          className="border-input bg-background rounded-md border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">End</span>
        <input
          type="time"
          name="end_time"
          defaultValue={a?.end ?? ""}
          className="border-input bg-background rounded-md border px-2 py-1 text-sm"
        />
      </label>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" name="is_close" defaultChecked={a?.isClose} />
        Close (C)
      </label>

      <Button type="submit" name="mode" value="working" disabled={pending}>
        Save shift
      </Button>
      <Button type="submit" name="mode" value="off" variant="outline" disabled={pending}>
        Off (X)
      </Button>
      <Button type="submit" name="mode" value="clear" variant="outline" disabled={pending}>
        Clear
      </Button>
      <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
        Cancel
      </Button>

      {state.error && (
        <span className="w-full text-sm text-red-600">{state.error}</span>
      )}
    </form>
  );
}
