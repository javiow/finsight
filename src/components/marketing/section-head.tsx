import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHead({
  eyebrow,
  title,
  note,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  note?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {eyebrow && (
        <span className="[font:var(--text-caption)] uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {eyebrow}
        </span>
      )}
      <h2 className="[font:var(--text-display-md)] tracking-[var(--tracking-display-md)] text-[var(--color-ink)]">
        {title}
      </h2>
      {note && (
        <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">{note}</p>
      )}
    </div>
  );
}
