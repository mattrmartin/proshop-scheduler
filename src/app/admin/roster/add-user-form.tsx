"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { createUser, type RosterState } from "./actions";
import { UserFields } from "./user-fields";

const initial: RosterState = {};

export function AddUserForm() {
  const [state, action, pending] = useActionState(createUser, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="panel flex flex-wrap items-end gap-3 p-4"
    >
      <h2 className="w-full font-medium">Add a person</h2>
      <UserFields />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
      {state.ok && <p className="w-full text-sm text-green-600">Added.</p>}
    </form>
  );
}
