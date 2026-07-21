"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { formatWeekRange } from "@/lib/dates";
import { ProgressRing } from "@/components/progress-ring";
import { StatusBadge } from "@/components/status-badge";
import type { BoardData } from "@/lib/board-data";
import { loadWeekBoard } from "./board-actions";
import { setWeekStatus } from "./actions";
import { ManagerBoardGrid } from "./manager-board-grid";

export function WeekBoardCard({
  weekId,
  startDate,
  variant,
  submitted = 0,
  total = 0,
}: {
  weekId: string;
  startDate: string;
  variant: "building" | "published";
  submitted?: number;
  total?: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await loadWeekBoard(weekId);
    setBoard(data);
    setLoading(false);
  }, [weekId]);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !board) await load();
  }

  const range = formatWeekRange(startDate);

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        {variant === "building" && (
          <ProgressRing value={submitted} total={total} size={38} stroke={4} />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-bold tracking-tight">{range}</div>
          {variant === "building" && (
            <div className="text-muted-foreground text-[12.5px]">
              {submitted} of {total} submitted availability
            </div>
          )}
        </div>
        <StatusBadge status={variant === "building" ? "open" : "published"} />
        <span className="text-muted-foreground text-sm">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (
        <div className="border-border/70 border-t">
          {loading && (
            <div className="text-muted-foreground p-4 text-sm">Loading…</div>
          )}
          {board && (
            <>
              {variant === "building" && (
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-muted-foreground text-xs">
                    {board.shiftCount} shift{board.shiftCount === 1 ? "" : "s"} assigned
                  </span>
                  <PublishButton weekId={weekId} shiftCount={board.shiftCount} />
                </div>
              )}
              <ManagerBoardGrid
                board={board}
                interactive={variant === "building"}
                onChanged={load}
              />
              {variant === "published" && (
                <div className="flex justify-end px-4 py-3">
                  <UnpublishButton weekId={weekId} onDone={() => router.refresh()} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PublishButton({
  weekId,
  shiftCount,
}: {
  weekId: string;
  shiftCount: number;
}) {
  return (
    <form
      action={setWeekStatus}
      onSubmit={(e) => {
        if (
          shiftCount === 0 &&
          !confirm(
            "This week has no shifts assigned yet. Publish an empty schedule anyway?",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={weekId} />
      <input type="hidden" name="status" value="published" />
      <button
        type="submit"
        className="bg-primary text-primary-foreground cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] font-semibold"
      >
        Publish schedule
      </button>
    </form>
  );
}

function UnpublishButton({
  weekId,
  onDone,
}: {
  weekId: string;
  onDone: () => void;
}) {
  return (
    <form action={setWeekStatus} onSubmit={onDone}>
      <input type="hidden" name="id" value={weekId} />
      <input type="hidden" name="status" value="open" />
      <button
        type="submit"
        className="border-border text-muted-foreground cursor-pointer rounded-[10px] border px-3 py-1.5 text-xs font-semibold"
      >
        Unpublish to edit
      </button>
    </form>
  );
}
