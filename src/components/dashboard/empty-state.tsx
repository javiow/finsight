import { Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-2xl)] text-center shadow-[var(--shadow-sm)]">
      <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <Upload className="size-7 text-[var(--color-primary)]" aria-hidden="true" />
      </div>
      <p className="[font:var(--text-display-sm)] text-[var(--color-ink)]">
        아직 올린 명세서가 없어요
      </p>
      <p className="max-w-sm [font:var(--text-body-md)] text-[var(--color-muted)]">
        카드 명세서 CSV를 올리면 자동으로 분류하고 지출 인사이트를 보여드려요.
      </p>
      <p className="[font:var(--text-caption)] text-[var(--color-muted)]">
        지원: 국내 주요 카드사 CSV · CP949/UTF-8 자동 감지
      </p>
    </div>
  );
}
