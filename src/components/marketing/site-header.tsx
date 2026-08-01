import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/marketing/wordmark";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[var(--content-max)] items-center justify-between px-6 py-6 md:px-8">
      <Link href="/" aria-label="finsight 홈으로">
        <Wordmark />
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/pricing"
          className="[font:var(--text-body-sm)] text-[var(--color-body)] transition-colors hover:text-[var(--color-ink)]"
        >
          요금제
        </Link>
        <Link href="/login" className={buttonVariants({ size: "sm" })}>
          무료로 시작하기
        </Link>
      </nav>
    </header>
  );
}
