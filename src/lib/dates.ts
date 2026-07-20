/** Date helpers for week grids. All math is UTC to avoid TZ drift on ISO dates. */

/** The 7 ISO dates (Mon–Sun) starting at `startISO`. */
export function weekDates(startISO: string): string[] {
  const [y, m, d] = startISO.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(base + i * 86_400_000).toISOString().slice(0, 10),
  );
}

export function isMonday(startISO: string): boolean {
  const [y, m, d] = startISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 1;
}

/**
 * The soonest Monday on/after today that isn't already in `existingStarts`
 * (all assumed to be Mondays). Used to prefill "open a new week".
 */
export function nextOpenMonday(existingStarts: string[]): string {
  const taken = new Set(existingStarts);
  const now = new Date();
  let ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dow = new Date(ms).getUTCDay(); // 0 Sun .. 6 Sat
  ms += ((1 - dow + 7) % 7) * 86_400_000; // advance to Monday (0 if already Mon)
  let iso = new Date(ms).toISOString().slice(0, 10);
  while (taken.has(iso)) {
    ms += 7 * 86_400_000;
    iso = new Date(ms).toISOString().slice(0, 10);
  }
  return iso;
}

/** e.g. "Mon Aug 3" */
export function formatDayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** e.g. "Aug 3 – Aug 9, 2026" */
export function formatWeekRange(startISO: string): string {
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
