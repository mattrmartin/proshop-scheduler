"use client";

import { useState } from "react";

import { RosterRow, type RosterUser } from "./roster-row";

export function RosterList({
  inside,
  outside,
}: {
  inside: RosterUser[];
  outside: RosterUser[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const section = (title: string, list: RosterUser[]) => (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium capitalize">{title}</h2>
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">None yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((u) => (
            <RosterRow
              key={u.id}
              user={u}
              editing={editingId === u.id}
              onEdit={() => setEditingId(u.id)}
              onClose={() => setEditingId(null)}
            />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      {section("inside", inside)}
      {section("outside", outside)}
    </>
  );
}
