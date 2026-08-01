import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PrivacyList } from "@/components/marketing/privacy-list";
import { SectionHead } from "@/components/marketing/section-head";
import { SiteHeader } from "@/components/marketing/site-header";
import { SpendingPreviewChart } from "@/components/marketing/spending-preview-chart";
import { Wordmark } from "@/components/marketing/wordmark";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)]">
      <SiteHeader />

      <main>
        <section className="relative mx-auto flex max-w-[var(--content-max)] flex-col items-center gap-6 overflow-hidden px-6 pt-8 pb-4 text-center md:px-8 md:pt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/10 blur-3xl"
          />
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-strong)] px-3 py-1.5 [font:var(--text-caption)] text-[var(--color-body)]">
            카드 명세서 CSV → 카테고리별 지출
          </span>
          <h1 className="relative max-w-3xl text-balance [font:var(--text-display-md)] tracking-[var(--tracking-display-md)] text-[var(--color-ink)] md:[font:var(--text-display-lg)] md:tracking-[var(--tracking-display-lg)]">
            카드 명세서만 올리면 이번 달 지출이 정리돼요
          </h1>
          <p className="relative max-w-xl [font:var(--text-body-lg)] text-[var(--color-body)]">
            카드사에서 내려받은 CSV를 그대로 올리세요. 카드가 2장이어도 한 달로 합산해서
            카테고리별로 보여드려요. 직접 분류할 필요 없어요.
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 [font:var(--text-body-md)]")}
            >
              무료로 시작하기
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 px-6 [font:var(--text-body-md)]",
              )}
            >
              요금제 보기
            </Link>
          </div>
          <span className="relative [font:var(--text-caption)] text-[var(--color-muted)]">
            신용카드 등록 없이 시작 · 한 달에 한 번만 들르면 충분해요
          </span>
        </section>

        <section className="mx-auto max-w-[var(--content-max)] px-6 pt-14 md:px-8">
          <div className="rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-6 shadow-[var(--shadow-sm)] md:p-8">
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <span className="[font:var(--text-title-sm)] text-[var(--color-ink)]">
                이렇게 정리돼요
              </span>
              <span className="[font:var(--text-caption)] text-[var(--color-muted)]">
                예시 데이터입니다
              </span>
            </div>
            <SpendingPreviewChart />
          </div>
        </section>

        <section className="mx-auto max-w-[var(--content-max)] px-6 pt-20 pb-24 md:px-8">
          <SectionHead
            eyebrow="프라이버시"
            title="카드 내역 전체가 AI로 넘어가지 않아요"
            className="mb-8"
          />
          <PrivacyList />
        </section>
      </main>

      <footer className="mx-auto flex max-w-[var(--content-max)] flex-col items-center gap-3 border-t border-[var(--color-hairline)] px-6 py-10 text-center md:flex-row md:items-center md:justify-between md:px-8 md:text-left">
        <Wordmark className="text-base" />
        <div className="flex flex-col items-center gap-1 md:items-end">
          <span className="[font:var(--text-caption)] text-[var(--color-muted)]">
            원본 파일은 30일 후 자동 삭제됩니다
          </span>
          <span className="[font:var(--text-caption)] text-[var(--color-muted)]">
            Pro는 결제 없이 체험할 수 있어요 ·{" "}
            <Link href="/pricing" className="text-[var(--color-primary)] hover:underline">
              테스트 카드로 확인하기
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
