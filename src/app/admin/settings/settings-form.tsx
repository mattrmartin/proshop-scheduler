"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  updateSettings,
  applyHoursToUpcoming,
  type SettingsState,
} from "./actions";

const initial: SettingsState = {};

export function SettingsForm({
  defaultOpen,
  defaultClose,
}: {
  defaultOpen: string;
  defaultClose: string;
}) {
  const [saveState, saveAction, saving] = useActionState(updateSettings, initial);
  const [applyState, applyAction, applying] = useActionState(
    applyHoursToUpcoming,
    initial,
  );

  const inputCls =
    "border-input bg-background rounded-md border px-2 py-1 text-sm";

  return (
    <div className="flex flex-col gap-4">
      <form action={saveAction} className="panel flex flex-col gap-3 p-4">
        <div>
          <h2 className="text-[15px] font-bold">Standing business hours</h2>
          <p className="text-muted-foreground text-sm">
            The default the shop runs. New weeks open with these — change them
            once when the season shifts.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Opens</span>
            <input
              type="time"
              name="default_open"
              defaultValue={defaultOpen}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Closes</span>
            <input
              type="time"
              name="default_close"
              defaultValue={defaultClose}
              className={inputCls}
            />
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save standing hours"}
          </Button>
        </div>
        {saveState.error && (
          <p className="text-destructive text-sm">{saveState.error}</p>
        )}
        {saveState.ok && <p className="text-sm text-green-600">{saveState.ok}</p>}
      </form>

      <form action={applyAction} className="panel flex flex-col gap-3 p-4">
        <div>
          <h2 className="text-[15px] font-bold">Apply to upcoming weeks</h2>
          <p className="text-muted-foreground text-sm">
            Push the standing hours onto every week that’s still accepting
            availability (not yet published). Use after a seasonal change.
          </p>
        </div>
        <div>
          <Button type="submit" variant="outline" disabled={applying}>
            {applying ? "Applying…" : "Apply to all upcoming weeks"}
          </Button>
        </div>
        {applyState.error && (
          <p className="text-destructive text-sm">{applyState.error}</p>
        )}
        {applyState.ok && (
          <p className="text-sm text-green-600">{applyState.ok}</p>
        )}
      </form>
    </div>
  );
}
