"use client";

import { useState } from "react";

import { shortTime, assignmentLabel } from "@/lib/schedule-format";

export type SharedDay = {
  date: string;
  label: string;
  hours: { open: string; close: string } | null;
  events: string[];
};
export type SharedUser = { id: string; name: string; department: string };
export type SharedAssignment = {
  status: string;
  start: string | null;
  end: string | null;
  isClose: boolean;
};

export function SharedBoard({
  days,
  users,
  cells,
  currentUserId,
}: {
  days: SharedDay[];
  users: SharedUser[];
  cells: Record<string, SharedAssignment>;
  currentUserId: string;
}) {
  const [justMe, setJustMe] = useState(false);
  const onBoard = users.some((u) => u.id === currentUserId);
  const rows = justMe ? users.filter((u) => u.id === currentUserId) : users;

  return (
    <div className="flex flex-col gap-3">
      {onBoard && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={justMe}
            onChange={(e) => setJustMe(e.target.checked)}
          />
          Just me
        </label>
      )}

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="bg-background sticky left-0 z-10 border-b px-2 py-1 text-left">
                Staff
              </th>
              {days.map((d) => (
                <th
                  key={d.date}
                  className="min-w-24 border-b border-l px-2 py-1 text-left align-top font-medium"
                >
                  <div>{d.label}</div>
                  <div className="text-muted-foreground text-[10px] font-normal">
                    {d.hours
                      ? `${shortTime(d.hours.open)}–${shortTime(d.hours.close)}`
                      : "closed"}
                  </div>
                  {d.events.map((ev) => (
                    <div key={ev} className="text-[10px] font-normal text-blue-600">
                      {ev}
                    </div>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isMe = u.id === currentUserId;
              return (
                <tr key={u.id} className={isMe ? "bg-yellow-50" : ""}>
                  <td
                    className={[
                      "sticky left-0 z-10 border-b px-2 py-1",
                      isMe ? "bg-yellow-50" : "bg-background",
                    ].join(" ")}
                  >
                    <div className="font-medium">
                      {u.name}
                      {isMe && (
                        <span className="text-muted-foreground ml-1 text-[10px]">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-[10px] capitalize">
                      {u.department}
                    </div>
                  </td>
                  {days.map((d) => {
                    const a = cells[`${u.id}|${d.date}`];
                    return (
                      <td
                        key={d.date}
                        className="border-b border-l px-2 py-1 align-top"
                      >
                        {a ? (
                          <span
                            className={
                              a.status === "off"
                                ? "text-muted-foreground"
                                : "font-medium"
                            }
                          >
                            {assignmentLabel(a)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
