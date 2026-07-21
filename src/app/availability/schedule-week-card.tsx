"use client";

import { useCallback, useState } from "react";

import { formatWeekRange } from "@/lib/dates";
import type { BoardData } from "@/lib/board-data";
import { ManagerBoardGrid } from "@/app/admin/manager-board-grid";
import { loadStaffBoard } from "./staff-actions";

export function ScheduleWeekCard({
  weekId,
  startDate,
  currentUserId,
}: {
  weekId: string;
  startDate: string;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [justMe, setJustMe] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setBoard(await loadStaffBoard(weekId));
    setLoading(false);
  }, [weekId]);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !board) await load();
  }

  const onBoard = board?.users.some((u) => u.id === currentUserId) ?? false;
  const view =
    board && justMe
      ? { ...board, users: board.users.filter((u) => u.id === currentUserId) }
      : board;

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
        <span className="badge bg-accent text-accent-foreground">Published</span>
        <span className="text-muted-foreground text-sm">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="border-border/70 border-t">
          {loading && <div className="text-muted-foreground p-4 text-sm">Loading…</div>}
          {view && (
            <>
              {onBoard && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <button
                    type="button"
                    onClick={() => setJustMe((v) => !v)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      justMe
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground bg-card"
                    }`}
                  >
                    Just me
                  </button>
                </div>
              )}
              <ManagerBoardGrid
                board={view}
                interactive={false}
                highlightUserId={currentUserId}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
