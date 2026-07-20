/** Small donut showing value/total. Server-safe (pure SVG). */
export function ProgressRing({
  value,
  total,
  size = 44,
  stroke = 5,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`${value} of ${total} submitted`}
    >
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${center} ${center})`}
        className="stroke-primary transition-[stroke-dashoffset]"
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[11px] font-semibold"
      >
        {value}
      </text>
    </svg>
  );
}
