const TONES: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  open: {
    label: "Accepting availability",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  },
  published: { label: "Published", cls: "bg-primary/12 text-primary" },
};

export function StatusBadge({ status }: { status: string }) {
  const t = TONES[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`badge ${t.cls}`}>{t.label}</span>;
}
