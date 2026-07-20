"use client";

export type UserDefaults = {
  name?: string;
  phone?: string;
  role?: string;
  department?: string;
  rank?: number;
};

const inputCls =
  "border-input bg-background rounded-md border px-2 py-1 text-sm";

/** The name/phone/role/department/rank inputs, shared by add + edit forms. */
export function UserFields({ defaults }: { defaults?: UserDefaults }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Name</span>
        <input name="name" defaultValue={defaults?.name ?? ""} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Phone</span>
        <input
          name="phone"
          placeholder="+12085551234"
          defaultValue={defaults?.phone ?? ""}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Role</span>
        <select name="role" defaultValue={defaults?.role ?? "staff"} className={inputCls}>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Dept</span>
        <select
          name="department"
          defaultValue={defaults?.department ?? "inside"}
          className={inputCls}
        >
          <option value="inside">inside</option>
          <option value="outside">outside</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Rank</span>
        <input
          type="number"
          name="rank"
          min={0}
          defaultValue={defaults?.rank ?? 0}
          className={`${inputCls} w-20`}
        />
      </label>
    </>
  );
}
