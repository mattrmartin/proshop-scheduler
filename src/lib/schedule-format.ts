/** Formatting helpers shared by the build board and the shared board view. */

/** "06:00" / "14:00:00" -> "6:00" (12-hour clock, no am/pm, like Cole's sheet). */
export function shortTime(t: string): string {
  const [hh, mm] = t.split(":");
  const h = Number(hh) % 12 || 12;
  return `${h}:${mm}`;
}

export type AssignmentLike = {
  status: string;
  start: string | null;
  end: string | null;
  isClose: boolean;
};

/** "6:00–2:00", "4:00–C", or "X" for an assigned-off day. */
export function assignmentLabel(a: AssignmentLike): string {
  if (a.status === "off") return "X";
  const start = a.start ? shortTime(a.start) : "?";
  const end = a.isClose ? "C" : a.end ? shortTime(a.end) : "?";
  return `${start}–${end}`;
}
