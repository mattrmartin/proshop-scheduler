import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { AddUserForm } from "./add-user-form";
import { RosterList } from "./roster-list";

export default async function RosterPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, phone, role, department, rank")
    .order("department", { ascending: true })
    .order("rank", { ascending: true });
  if (error) throw error; // surface, don't swallow

  const inside = (users ?? []).filter((u) => u.department === "inside");
  const outside = (users ?? []).filter((u) => u.department === "outside");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Weeks
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Roster</h1>
        <p className="text-muted-foreground text-sm">
          Staff appear on the board in rank order (lower = more senior).
        </p>
      </div>

      <AddUserForm />
      <RosterList inside={inside} outside={outside} />
    </div>
  );
}
