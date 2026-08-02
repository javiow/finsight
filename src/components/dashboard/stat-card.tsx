import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "success" | "danger" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] shadow-[var(--shadow-sm)]">
      <span className="[font:var(--text-caption)] text-[var(--color-muted)]">{label}</span>
      <span className="[font:var(--text-number-lg)] tabular-nums text-[var(--color-ink)]">
        {value}
      </span>
      {delta && (
        <span
          className={cn(
            "[font:var(--text-number-sm)] tabular-nums",
            tone === "success" && "text-[var(--color-success)]",
            tone === "danger" && "text-[var(--color-danger)]",
            tone === "neutral" && "text-[var(--color-muted)]",
          )}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
