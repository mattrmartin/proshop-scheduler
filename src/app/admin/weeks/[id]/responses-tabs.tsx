"use client";

import { useState } from "react";

/** Submitted / Waiting tabs for a week's availability responses. */
export function ResponsesTabs({
  submitted,
  waiting,
}: {
  submitted: string[];
  waiting: string[];
}) {
  const [tab, setTab] = useState<"submitted" | "waiting">("submitted");
  const active = tab === "submitted" ? submitted : waiting;

  const tabCls = (on: boolean) =>
    `flex-1 cursor-pointer rounded-lg border px-2 py-2 text-[12.5px] font-semibold ${
      on
        ? "bg-primary text-primary-foreground border-primary"
        : "border-border text-muted-foreground bg-card"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setTab("submitted")}
          className={tabCls(tab === "submitted")}
        >
          Submitted ({submitted.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("waiting")}
          className={tabCls(tab === "waiting")}
        >
          Waiting ({waiting.length})
        </button>
      </div>

      {active.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {tab === "submitted" ? "None yet." : "Everyone’s in."}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {active.map((name) => (
            <div
              key={name}
              className={
                tab === "submitted"
                  ? "text-accent-foreground text-[13.5px]"
                  : "text-muted-foreground text-[13.5px]"
              }
            >
              {tab === "submitted" ? `✓ ${name}` : name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
