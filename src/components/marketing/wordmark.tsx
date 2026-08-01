import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-[-0.03em] text-[var(--color-ink)]",
        className,
      )}
    >
      finsight
    </span>
  );
}
