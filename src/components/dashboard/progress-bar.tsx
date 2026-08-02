export function ProgressBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="flex flex-col gap-2">
      <span className="[font:var(--text-body-sm)] text-[var(--color-muted)]">{label}</span>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-strong)]"
      >
        <div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--color-primary)] transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
