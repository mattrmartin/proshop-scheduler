"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { updateUser, type RosterState } from "./actions";
import { UserFields } from "./user-fields";

export type RosterUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  department: string;
  rank: number;
};

const initial: RosterState = {};

export function RosterRow({
  user,
  editing,
  onEdit,
  onClose,
}: {
  user: RosterUser;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(updateUser, initial);

  // Close on a successful save. onClose is a parent callback, so no local
  // setState happens inside this effect.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  if (!editing) {
    return (
      <li className="panel flex items-center justify-between px-4 py-2">
        <div>
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground ml-2 text-sm">
            {user.phone} · rank {user.rank}
            {user.role === "admin" && " · admin"}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </li>
    );
  }

  return (
    <li className="panel p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={user.id} />
        <UserFields defaults={user} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        {state.error && (
          <p className="w-full text-sm text-red-600">{state.error}</p>
        )}
      </form>
    </li>
  );
}
