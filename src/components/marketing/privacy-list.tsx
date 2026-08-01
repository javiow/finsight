import { Check } from "lucide-react";

import { PRIVACY_NOTICE } from "@/lib/privacy-notice";
import { cn } from "@/lib/utils";

export function PrivacyList({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8", className)}>
      {PRIVACY_NOTICE.map((item) => (
        <div key={item.title} className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)]">
              <Check className="size-3.5 text-[var(--color-primary)]" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="[font:var(--text-title-sm)] text-[var(--color-ink)]">{item.title}</span>
          </div>
          <p className="[font:var(--text-body-sm)] pl-9 text-[var(--color-body)] text-wrap-pretty">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
