import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange } from "@/lib/dates";
import { loadBoardData } from "@/lib/board-data";
import { BuildBoard } from "./board";
import { PublishControls } from "./publish-controls";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const board = await loadBoardData(supabase, id);
  if (!board) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/weeks/${board.weekId}`}
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Week settings
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Build board — {formatWeekRange(board.startDate)}
          </h1>
          <p className="text-muted-foreground text-sm">
            Click a cell to assign a shift. {board.shiftCount} shift
            {board.shiftCount === 1 ? "" : "s"} assigned.
          </p>
          <Link
            href={`/board/${board.weekId}`}
            className="text-primary mt-1 inline-block text-sm font-medium hover:underline"
          >
            Preview shared board →
          </Link>
        </div>
        <PublishControls
          weekId={board.weekId}
          status={board.status}
          shiftCount={board.shiftCount}
        />
      </div>

      <BuildBoard
        weekId={board.weekId}
        days={board.days}
        users={board.users}
        cells={board.cells}
      />
    </div>
  );
}
