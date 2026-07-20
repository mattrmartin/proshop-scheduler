import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatWeekRange } from "@/lib/dates";

export default async function AvailabilityListPage() {
  const supabase = await createClient();
  // Staff submit availability for weeks Cole has opened.
  const { data: weeks, error } = await supabase
    .from("weeks")
    .select("id, start_date")
    .eq("status", "open")
    .order("start_date", { ascending: true });
  if (error) throw error; // surface, don't swallow

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Your availability</h1>
        <p className="text-muted-foreground text-sm">
          Mark the hours you can work. Submitting by Thursday noon is appreciated
          but late is fine.
        </p>
        <Link
          href="/board"
          className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
        >
          View published schedules →
        </Link>
      </div>

      {!weeks?.length ? (
        <p className="text-muted-foreground text-sm">
          No weeks are open for availability right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {weeks.map((w) => (
            <li key={w.id}>
              <Link
                href={`/availability/${w.id}`}
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
