import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CreateWeekForm } from "@/app/admin/create-week-form";
import { setWeekStatus } from "@/app/admin/actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open for availability",
  published: "Published",
};

function formatRange(startISO: string): string {
  const [y, m, d] = startISO.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end)}, ${y}`;
}

export default async function AdminWeeksPage() {
  const supabase = await createClient();
  const { data: weeks, error } = await supabase
    .from("weeks")
    .select("id, start_date, status")
    .order("start_date", { ascending: false });

  if (error) throw error; // surface, don't swallow

  return (
    <div className="flex flex-col gap-6">
      <CreateWeekForm />

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Weeks</h2>
        {!weeks?.length ? (
          <p className="text-muted-foreground text-sm">No weeks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {weeks.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <div className="font-medium">{formatRange(w.start_date)}</div>
                  <div className="text-muted-foreground text-sm">
                    {STATUS_LABELS[w.status] ?? w.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  {w.status === "draft" && (
                    <form action={setWeekStatus}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="status" value="open" />
                      <Button type="submit" size="sm">
                        Open for availability
                      </Button>
                    </form>
                  )}
                  {w.status === "open" && (
                    <>
                      <form action={setWeekStatus}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value="draft" />
                        <Button type="submit" size="sm" variant="outline">
                          Back to draft
                        </Button>
                      </form>
                      <form action={setWeekStatus}>
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value="published" />
                        <Button type="submit" size="sm">
                          Publish
                        </Button>
                      </form>
                    </>
                  )}
                  {w.status === "published" && (
                    <span className="text-muted-foreground self-center text-sm">
                      Live
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
