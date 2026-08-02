import { cn } from "@/lib/utils";

export function InsightItem({ index, message }: { index: number; message: string }) {
  return (
    <div
      className={cn(
        "flex gap-4 border-t border-[var(--color-hairline)] py-3",
        index === 0 && "border-t-0",
      )}
    >
      <span className="w-6 shrink-0 [font:var(--text-number-sm)] tabular-nums text-[var(--color-primary)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="[font:var(--text-body-md)] text-[var(--color-body)]">{message}</p>
    </div>
  );
}
