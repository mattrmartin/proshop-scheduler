"use client";

import { useActionState } from "react";

import { createWeek, type CreateWeekState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: CreateWeekState = {};

export function CreateWeekForm() {
  const [state, action, pending] = useActionState(createWeek, initial);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">Open a new week</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Monday start date</span>
          <input
            type="date"
            name="start_date"
            required
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Opens</span>
          <input
            type="time"
            name="open"
            required
            defaultValue="06:00"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Closes</span>
          <input
            type="time"
            name="close"
            required
            defaultValue="19:00"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create week"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-green-600">Week created (draft).</p>
      )}
      <p className="text-muted-foreground text-xs">
        Sets the same hours on all 7 days; you can fine-tune per day and add
        events later.
      </p>
    </form>
  );
}
