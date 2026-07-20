import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange } from "@/lib/dates";

export default async function BoardListPage() {
  const supabase = await createClient();
  const { data: weeks, error } = await supabase
    .from("weeks")
    .select("id, start_date")
    .eq("status", "published")
    .order("start_date", { ascending: false });
  if (error) throw error; // surface, don't swallow

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Published schedules</h1>
      {!weeks?.length ? (
        <p className="text-muted-foreground text-sm">
          No published schedules yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {weeks.map((w) => (
            <li key={w.id}>
              <Link
                href={`/board/${w.id}`}
                className="panel hover:border-primary/40 block px-4 py-3 font-medium transition-colors"
              >
                {formatWeekRange(w.start_date)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
