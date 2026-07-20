"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateBusinessHours, type FormState } from "./actions";

export type DayHours = {
  date: string;
  label: string;
  open: string;
  close: string;
  closed: boolean;
};

const initial: FormState = {};

export function BusinessHoursForm({
  weekId,
  startDate,
  days,
}: {
  weekId: string;
  startDate: string;
  days: DayHours[];
}) {
  const [state, action, pending] = useActionState(updateBusinessHours, initial);

  return (
    <form action={action} className="panel flex flex-col gap-3 p-4">
      <h2 className="font-medium">Business hours</h2>
      <input type="hidden" name="week_id" value={weekId} />
      <input type="hidden" name="start_date" value={startDate} />

      <div className="flex flex-col gap-2">
        {days.map((d) => (
          <div key={d.date} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm">{d.label}</span>
            <input
              type="time"
              name={`open_${d.date}`}
              defaultValue={d.open}
              className="border-input bg-background w-28 shrink-0 rounded-md border px-2 py-1 text-sm"
            />
            <span className="text-muted-foreground shrink-0 text-sm">–</span>
            <input
              type="time"
              name={`close_${d.date}`}
              defaultValue={d.close}
              className="border-input bg-background w-28 shrink-0 rounded-md border px-2 py-1 text-sm"
            />
            <label className="text-muted-foreground ml-1 flex shrink-0 items-center gap-1 text-sm">
              <input
                type="checkbox"
                name={`closed_${d.date}`}
                defaultChecked={d.closed}
              />
              Closed
            </label>
          </div>
        ))}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-600">Hours saved.</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save hours"}
        </Button>
      </div>
    </form>
  );
}
