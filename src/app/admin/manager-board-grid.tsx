"use client";

import { useState } from "react";

import { assignmentLabel, shortTime } from "@/lib/schedule-format";
import type { BoardData, CellData } from "@/lib/board-data";
import { saveAssignment } from "./weeks/[id]/board/actions";

/** "2026-07-27" -> "Mon 27" (compact day header for the 60px columns). */
function dayHeader(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  return `${wd} ${d}`;
}

const PRESETS: { label: string; start: string; end: string; close: boolean }[] = [
  { label: "6–2", start: "06:00", end: "14:00", close: false },
  { label: "6–C", start: "06:00", end: "", close: true },
  { label: "9–5", start: "09:00", end: "17:00", close: false },
  { label: "12–C", start: "12:00", end: "", close: true },
];

export function ManagerBoardGrid({
  board,
  interactive,
  onChanged,
}: {
  board: BoardData;
  interactive: boolean;
  onChanged?: () => void;
}) {
  const [selected, setSelected] = useState<{
    userId: string;
    date: string;
  } | null>(null);

  const inside = board.users.filter((u) => u.department === "inside");
  const outside = board.users.filter((u) => u.department === "outside");
  const groups = [
    { label: "Inside", staff: inside },
    { label: "Outside", staff: outside },
  ].filter((g) => g.staff.length > 0);

  const selectedUser = board.users.find((u) => u.id === selected?.userId);
  const selectedDay = board.days.find((d) => d.date === selected?.date);
  const selectedCell = selected
    ? board.cells[`${selected.userId}|${selected.date}`]
    : null;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[524px] text-sm"
        style={{ gridTemplateColumns: "104px repeat(7, 60px)" }}
      >
        {/* header */}
        <div className="section-label bg-muted sticky left-0 z-10 px-2.5 py-2">
          Staff
        </div>
        {board.days.map((d) => (
          <div
            key={d.date}
            className="section-label bg-muted px-1 py-2 text-center"
          >
            {dayHeader(d.date)}
          </div>
        ))}

        {groups.map((group) => (
          <GroupBlock
            key={group.label}
            label={group.label}
            staff={group.staff}
            days={board.days}
            cells={board.cells}
            interactive={interactive}
            selected={selected}
            onSelect={(userId, date) => setSelected({ userId, date })}
          />
        ))}
      </div>

      {interactive && selected && selectedUser && selectedDay && (
        <CellSheet
          key={`${selected.userId}|${selected.date}`}
          weekId={board.weekId}
          userId={selected.userId}
          date={selected.date}
          userName={selectedUser.name}
          dayLabel={selectedDay.label}
          cell={selectedCell}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function GroupBlock({
  label,
  staff,
  days,
  cells,
  interactive,
  selected,
  onSelect,
}: {
  label: string;
  staff: BoardData["users"];
  days: BoardData["days"];
  cells: Record<string, CellData>;
  interactive: boolean;
  selected: { userId: string; date: string } | null;
  onSelect: (userId: string, date: string) => void;
}) {
  return (
    <>
      <div className="text-muted-foreground bg-card col-span-full px-2.5 pt-2 pb-1 text-[9.5px] font-bold tracking-[0.06em] uppercase">
        {label}
      </div>
      {staff.map((u) => (
        <div key={u.id} className="contents">
          <div className="bg-card text-foreground border-border/70 sticky left-0 z-10 truncate border-b px-2.5 py-2.5 text-[12.5px] font-semibold">
            {u.name}
          </div>
          {days.map((d) => {
            const cell = cells[`${u.id}|${d.date}`];
            const isSel = selected?.userId === u.id && selected?.date === d.date;
            return (
              <BoardCell
                key={d.date}
                cell={cell}
                interactive={interactive}
                selected={isSel}
                onClick={() => onSelect(u.id, d.date)}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

function BoardCell({
  cell,
  interactive,
  selected,
  onClick,
}: {
  cell: CellData | undefined;
  interactive: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const a = cell?.assignment;
  const wantOff = cell?.avail?.wantOff && !a;

  let content: React.ReactNode;
  if (a?.status === "working") {
    content = <span className="time text-foreground text-[11px]">{assignmentLabel(a)}</span>;
  } else if (a?.status === "off") {
    content = <span className="text-warning-foreground text-[10px] font-bold">X</span>;
  } else if (wantOff) {
    content = <span className="text-warning-foreground/80 text-[9px] font-semibold">off req</span>;
  } else if (interactive) {
    content = <span className="text-muted-foreground/50 text-[13px]">+</span>;
  } else {
    content = <span className="text-muted-foreground/50 text-xs">–</span>;
  }

  const base =
    "border-border/70 flex min-h-[42px] items-center justify-center border-b border-l px-0.5 py-1";
  const tint = wantOff ? "bg-warning-surface/50" : "";
  const sel = selected ? "ring-primary ring-2 ring-inset" : "";

  if (!interactive) {
    return <div className={`${base} ${tint}`}>{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${tint} ${sel} hover:bg-muted w-full cursor-pointer`}
    >
      {content}
    </button>
  );
}

function CellSheet({
  weekId,
  userId,
  date,
  userName,
  dayLabel,
  cell,
  onClose,
  onSaved,
}: {
  weekId: string;
  userId: string;
  date: string;
  userName: string;
  dayLabel: string;
  cell: CellData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const a = cell?.assignment;
  const av = cell?.avail;
  const availWindow =
    av && !av.wantOff && av.ranges.length > 0
      ? { start: av.ranges[0].start, end: av.ranges[av.ranges.length - 1].end }
      : null;

  const [start, setStart] = useState(a?.start ?? availWindow?.start ?? "");
  const [end, setEnd] = useState(a?.end ?? availWindow?.end ?? "");
  const [close, setClose] = useState(a?.isClose ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    mode: "working" | "off" | "clear",
    vals?: { start: string; end: string; close: boolean },
  ) {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("week_id", weekId);
    fd.set("user_id", userId);
    fd.set("date", date);
    fd.set("mode", mode);
    if (mode === "working") {
      const v = vals ?? { start, end, close };
      fd.set("start_time", v.start);
      if (v.close) fd.set("is_close", "on");
      else fd.set("end_time", v.end);
    }
    const res = await saveAssignment({}, fd);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3.5">
      <div className="pointer-events-auto flex w-full max-w-[460px] flex-col gap-2.5 rounded-2xl bg-[oklch(0.22_0.02_155)] p-3.5 text-[oklch(0.85_0.015_150)] shadow-[0_16px_40px_rgba(0,0,0,.28)]">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px]">
            {userName} · {dayLabel}
            {availWindow && (
              <span className="text-[oklch(0.75_0.06_152)]">
                {" "}
                · avail {shortTime(availWindow.start)}–{shortTime(availWindow.end)}
              </span>
            )}
            {av?.wantOff && (
              <span className="text-warning-surface"> · requested off</span>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="cursor-pointer text-[12px] text-[oklch(0.6_0.015_150)]"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={pending}
              onClick={() =>
                submit("working", { start: p.start, end: p.end, close: p.close })
              }
              className="time cursor-pointer rounded-[10px] border border-[oklch(0.4_0.03_155)] bg-[oklch(0.3_0.03_155)] px-3 py-2 text-[12px] font-medium text-[oklch(0.97_0.01_95)]"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("off")}
            className="cursor-pointer rounded-[10px] border border-[oklch(0.4_0.03_155)] bg-[oklch(0.3_0.03_155)] px-3 py-2 text-[12px] font-medium text-[oklch(0.97_0.01_95)]"
          >
            Day off
          </button>
          {a && (
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("clear")}
              className="cursor-pointer rounded-[10px] border border-[oklch(0.4_0.03_155)] bg-transparent px-3 py-2 text-[12px] font-medium text-[oklch(0.85_0.015_150)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Custom time — real shifts are wildly individual, so keep exact entry. */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[oklch(0.32_0.02_155)] pt-2.5">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="time rounded-lg border border-[oklch(0.4_0.03_155)] bg-[oklch(0.3_0.03_155)] px-2 py-1.5 text-[12px] text-[oklch(0.97_0.01_95)]"
          />
          <span className="text-[oklch(0.6_0.015_150)]">–</span>
          <input
            type="time"
            value={end}
            disabled={close}
            onChange={(e) => setEnd(e.target.value)}
            className="time rounded-lg border border-[oklch(0.4_0.03_155)] bg-[oklch(0.3_0.03_155)] px-2 py-1.5 text-[12px] text-[oklch(0.97_0.01_95)] disabled:opacity-40"
          />
          <label className="flex items-center gap-1 text-[12px]">
            <input
              type="checkbox"
              checked={close}
              onChange={(e) => setClose(e.target.checked)}
            />
            C
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit("working")}
            className="ml-auto cursor-pointer rounded-[10px] bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground"
          >
            Save
          </button>
        </div>

        {error && <span className="text-warning-surface text-[12px]">{error}</span>}
      </div>
    </div>
  );
}
