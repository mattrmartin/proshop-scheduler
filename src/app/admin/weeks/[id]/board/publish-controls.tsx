"use client";

import { Button } from "@/components/ui/button";
import { setWeekStatus } from "@/app/admin/actions";

export function PublishControls({
  weekId,
  status,
  shiftCount,
}: {
  weekId: string;
  status: string;
  shiftCount: number;
}) {
  if (status === "published") {
    return (
      <form action={setWeekStatus} className="flex items-center gap-2">
        <input type="hidden" name="id" value={weekId} />
        <input type="hidden" name="status" value="open" />
        <span className="text-muted-foreground text-sm">Published.</span>
        <Button type="submit" size="sm" variant="outline">
          Unpublish to edit
        </Button>
      </form>
    );
  }

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
      <Button type="submit" size="sm">
        Publish schedule
      </Button>
    </form>
  );
}
