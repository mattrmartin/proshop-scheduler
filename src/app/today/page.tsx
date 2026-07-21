import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { assignmentLabel } from "@/lib/schedule-format";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Row = {
  user_id: string;
  start_time: string | null;
  end_time: string | null;
  is_close: boolean;
  users: { name: string; department: string; rank: number } | null;
};

export default async function TodayPage() {
  const supabase = await createClient();
  const me = await getCurrentAppUser();

  const { data: today, error: todayErr } = await supabase.rpc("app_today");
  if (todayErr) throw todayErr;
  const todayIso = today as unknown as string;

  const { data, error } = await supabase
    .from("assignments")
    .select(
      "user_id, start_time, end_time, is_close, users!inner(name, department, rank), weeks!inner(status)",
    )
    .eq("date", todayIso)
    .eq("status", "working")
    .eq("weeks.status", "published");
  if (error) throw error; // surface, don't swallow

  const rows = ((data ?? []) as unknown as Row[])
    .filter((r) => r.users)
    .sort(
      (a, b) =>
        a.users!.department.localeCompare(b.users!.department) ||
        a.users!.rank - b.users!.rank,
    );

  const inside = rows.filter((r) => r.users!.department === "inside");
  const outside = rows.filter((r) => r.users!.department === "outside");

  const group = (title: string, list: Row[]) =>
    list.length === 0 ? null : (
      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs font-medium uppercase">
          {title}
        </h2>
        <ul className="flex flex-col gap-2">
          {list.map((r) => {
            const isMe = r.user_id === me?.id;
            return (
              <li
                key={r.user_id}
                className={`panel flex items-center justify-between px-4 py-3 ${
                  isMe ? "border-primary/50" : ""
                }`}
              >
                <span className="font-medium">
                  {r.users!.name}
                  {isMe && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      (you)
                    </span>
                  )}
                </span>
                <span className="text-primary font-medium">
                  {assignmentLabel({
                    status: "working",
                    start: r.start_time,
                    end: r.end_time,
                    isClose: r.is_close,
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground text-sm">{longDate(todayIso)}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No one’s scheduled today, or this week isn’t published yet.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground text-sm">
            {rows.length} working today
          </p>
          {group("Inside", inside)}
          {group("Outside", outside)}
        </div>
      )}
    </div>
  );
}
