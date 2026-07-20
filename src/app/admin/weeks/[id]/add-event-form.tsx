"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { addEvent, type FormState } from "./actions";

const initial: FormState = {};

export function AddEventForm({
  weekId,
  startDate,
  days,
}: {
  weekId: string;
  startDate: string;
  days: { date: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(addEvent, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="week_id" value={weekId} />
      <input type="hidden" name="start_date" value={startDate} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Day</span>
        <select
          name="date"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        >
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Event</span>
        <input
          type="text"
          name="label"
          placeholder="e.g. Ladies Mem. Guest, 18ers, FNF"
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add event"}
      </Button>
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
