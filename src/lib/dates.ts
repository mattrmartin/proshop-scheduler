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
