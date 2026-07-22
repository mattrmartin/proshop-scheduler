type Range = { start: string; end: string };

/**
 * Draft one shift window from a person's submitted availability for a single
 * day: earliest start → latest end across their free ranges, clamped to that
 * day's business hours. Times are zero-padded "HH:MM", so string comparison is
 * chronological.
 *
 * Returns null when there's nothing to place — no ranges, or the clamp collapses
 * (their availability falls entirely outside open hours).
 *
 * Note: earliest→latest spans any gap between disjoint ranges. That mirrors the
 * cell-editor prefill and keeps this a *draft* Cole reviews, not a final answer.
 * Want-off and no-response are handled by the caller (they never reach here).
 */
export function draftWindow(
  ranges: Range[],
  hours: { open: string; close: string },
): { start: string; end: string } | null {
  if (ranges.length === 0) return null;

  let start = ranges[0].start;
  let end = ranges[0].end;
  for (const r of ranges) {
    if (r.start < start) start = r.start;
    if (r.end > end) end = r.end;
  }

  if (hours.open > start) start = hours.open;
  if (hours.close < end) end = hours.close;

  if (start >= end) return null;
  return { start, end };
}
