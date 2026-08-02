import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LockVeil({ title, note }: { title: string; note: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] bg-[color-mix(in_oklch,var(--color-canvas)_72%,transparent)] px-6 text-center backdrop-blur-md">
      <p className="[font:var(--text-body-lg)] font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="max-w-xs [font:var(--text-body-sm)] text-[var(--color-muted)]">{note}</p>
      <Link href="/pricing" className={cn(buttonVariants({ size: "sm" }))}>
        Pro로 업그레이드
      </Link>
    </div>
  );
}
