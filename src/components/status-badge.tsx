const TONES: Record<string, { label: string; cls: string }> = {
  open: {
    label: "Open",
    cls: "bg-warning-surface text-warning-foreground",
  },
  published: { label: "Published", cls: "bg-accent text-accent-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const t = TONES[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground",
  };
  return <span className={`badge ${t.cls}`}>{t.label}</span>;
}
