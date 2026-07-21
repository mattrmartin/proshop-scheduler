"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import {
  createUser,
  updateUser,
  loadRoster,
  type RosterState,
  type RosterPerson,
} from "./roster/actions";

const initial: RosterState = {};
const fieldCls =
  "border-input bg-card rounded-lg border px-2.5 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function RosterDrawer() {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<{
    inside: RosterPerson[];
    outside: RosterPerson[];
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [outsideExpanded, setOutsideExpanded] = useState(false);

  const load = useCallback(async () => {
    setRoster(await loadRoster());
  }, []);

  function openDrawer() {
    setOpen(true);
    if (!roster) void load();
  }

  const onSaved = () => {
    setAddOpen(false);
    setEditingId(null);
    void load();
  };

  const outside = roster?.outside ?? [];
  const visibleOutside =
    outsideExpanded || outside.length <= 6 ? outside : outside.slice(0, 6);
  const hiddenCount = Math.max(0, outside.length - 6);

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="text-primary text-sm font-semibold hover:underline"
      >
        Roster →
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <div className="bg-card fixed inset-y-0 right-0 z-50 w-[min(380px,92vw)] overflow-y-auto p-5 shadow-[-16px_0_40px_rgba(0,0,0,.14)]">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[19px] font-bold tracking-tight">Roster</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground cursor-pointer text-xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-4 text-[12.5px]">
              Rank order sets board position — senior staff first.
            </p>

            {addOpen ? (
              <AddForm onSaved={onSaved} onCancel={() => setAddOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="border-border text-primary mb-4 w-full cursor-pointer rounded-xl border border-dashed py-2.5 text-[13px] font-semibold"
              >
                + Add person
              </button>
            )}

            {!roster ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <>
                <Group
                  label="Inside"
                  people={roster.inside}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onCancel={() => setEditingId(null)}
                  onSaved={onSaved}
                />
                <Group
                  label="Outside"
                  people={visibleOutside}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onCancel={() => setEditingId(null)}
                  onSaved={onSaved}
                />
                {!outsideExpanded && hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setOutsideExpanded(true)}
                    className="text-primary cursor-pointer py-2.5 text-[12.5px] font-semibold"
                  >
                    Show {hiddenCount} more →
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Group({
  label,
  people,
  editingId,
  onEdit,
  onCancel,
  onSaved,
}: {
  label: string;
  people: RosterPerson[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  return (
    <>
      <div className="section-label mt-4 mb-2 first:mt-0">{label}</div>
      {people.map((p) =>
        editingId === p.id ? (
          <EditForm key={p.id} person={p} onSaved={onSaved} onCancel={onCancel} />
        ) : (
          <div
            key={p.id}
            className="border-border/70 flex items-center justify-between border-b py-2.5"
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">{p.name}</div>
              <div className="text-muted-foreground text-[11.5px]">
                {p.phone} · rank {p.rank}
                {p.role === "admin" && " · admin"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(p.id)}
              className="border-border text-muted-foreground cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold"
            >
              Edit
            </button>
          </div>
        ),
      )}
    </>
  );
}

function AddForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(createUser, initial);
  const [dept, setDept] = useState("inside");
  useEffect(() => {
    if (state.ok) onSaved();
  }, [state.ok, onSaved]);

  return (
    <form action={action} className="bg-muted mb-4 flex flex-col gap-2.5 rounded-2xl p-3.5">
      <input type="hidden" name="role" value="staff" />
      <input type="hidden" name="rank" value={0} />
      <input type="hidden" name="department" value={dept} />
      <input name="name" placeholder="Name" className={fieldCls} />
      <input name="phone" placeholder="Phone (+12085551234)" className={fieldCls} />
      <div className="flex gap-2">
        {["inside", "outside"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDept(d)}
            className={`flex-1 cursor-pointer rounded-lg border py-2 text-[12.5px] font-semibold capitalize ${
              dept === d
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground bg-card"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground flex-1 cursor-pointer rounded-lg py-2 text-[13px] font-semibold"
        >
          {pending ? "Adding…" : "Add to roster"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border-border text-muted-foreground cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-semibold"
        >
          Cancel
        </button>
      </div>
      {state.error && <p className="text-destructive text-[12px]">{state.error}</p>}
    </form>
  );
}

function EditForm({
  person,
  onSaved,
  onCancel,
}: {
  person: RosterPerson;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(updateUser, initial);
  useEffect(() => {
    if (state.ok) onSaved();
  }, [state.ok, onSaved]);

  return (
    <form action={action} className="bg-muted mb-2 flex flex-col gap-2 rounded-xl p-3">
      <input type="hidden" name="id" value={person.id} />
      <input name="name" defaultValue={person.name} placeholder="Name" className={fieldCls} />
      <input name="phone" defaultValue={person.phone} placeholder="Phone" className={fieldCls} />
      <div className="flex gap-2">
        <select name="role" defaultValue={person.role} className={`${fieldCls} flex-1`}>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
        <select name="department" defaultValue={person.department} className={`${fieldCls} flex-1`}>
          <option value="inside">inside</option>
          <option value="outside">outside</option>
        </select>
        <input
          type="number"
          name="rank"
          min={0}
          defaultValue={person.rank}
          className={`${fieldCls} w-16`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground flex-1 cursor-pointer rounded-lg py-2 text-[12.5px] font-semibold"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border-border text-muted-foreground cursor-pointer rounded-lg border px-3 py-2 text-[12.5px] font-semibold"
        >
          Cancel
        </button>
      </div>
      {state.error && <p className="text-destructive text-[12px]">{state.error}</p>}
    </form>
  );
}
