import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SectionHead } from "@/components/marketing/section-head";
import { SiteHeader } from "@/components/marketing/site-header";
import { Wordmark } from "@/components/marketing/wordmark";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  price: string;
  cadence: string;
  included: string[];
  excluded: string[];
  cta: string;
  recommended: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "₩0",
    cadence: "가장 최근 달만",
    included: [
      "업로드·파싱·분류",
      "카테고리 요약·거래 테이블 (최근 1개월)",
      "AI 인사이트 미리보기 1개",
    ],
    excluded: ["월별 추이"],
    cta: "무료로 시작하기",
    recommended: false,
  },
  {
    name: "Pro",
    price: "₩4,900",
    cadence: "월 결제 · 언제든 해지",
    included: [
      "업로드·파싱·분류",
      "전체 히스토리 요약·거래 테이블",
      "AI 인사이트 전체",
      "월별 추이 비교",
    ],
    excluded: [],
    cta: "Pro 시작하기",
    recommended: true,
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-8 shadow-[var(--shadow-sm)]",
        plan.recommended && "ring-1 ring-[var(--color-primary)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="[font:var(--text-title-md)] text-[var(--color-ink)]">{plan.name}</span>
        {plan.recommended && <Badge>추천</Badge>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="[font:var(--text-number-lg)] tabular-nums text-[var(--color-ink)]">
          {plan.price}
        </span>
        <span className="[font:var(--text-body-sm)] text-[var(--color-muted)]">{plan.cadence}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {plan.included.map((line) => (
          <span key={line} className="[font:var(--text-body-md)] text-[var(--color-body)]">
            · {line}
          </span>
        ))}
        {plan.excluded.map((line) => (
          <span
            key={line}
            className="[font:var(--text-body-md)] text-[var(--color-muted-soft)] line-through"
          >
            · {line}
          </span>
        ))}
      </div>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ size: "lg", variant: plan.recommended ? "default" : "outline" }),
          "mt-auto h-11 [font:var(--text-body-md)]",
        )}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

function SandboxNotice({ children }: { children: ReactNode }) {
  return (
    <p className="[font:var(--text-body-sm)] text-center text-[var(--color-muted)]">{children}</p>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)]">
      <SiteHeader />

      <main className="mx-auto max-w-[var(--content-max)] px-6 pt-8 pb-24 md:px-8 md:pt-16">
        <SectionHead
          eyebrow="요금제"
          title="무료로도 이번 달은 다 볼 수 있어요"
          note="언제든 Pro로 올리거나 Free로 내릴 수 있어요."
          className="mb-10 items-center text-center md:items-start md:text-left"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-1">
          <SandboxNotice>
            이 프로젝트는 포트폴리오 데모라 실제 결제가 이뤄지지 않아요.
          </SandboxNotice>
          <SandboxNotice>
            테스트 카드 번호{" "}
            <span className="[font:var(--text-number-sm)] tabular-nums text-[var(--color-ink)]">
              4242 4242 4242 4242
            </span>
            로 Pro 결제 흐름을 그대로 체험해볼 수 있어요.
          </SandboxNotice>
          <SandboxNotice>
            Free로 돌아가도 과거 데이터는 지우지 않고 잠그기만 해요.
          </SandboxNotice>
        </div>
      </main>

      <footer className="mx-auto flex max-w-[var(--content-max)] items-center justify-center px-6 py-10 md:px-8">
        <Link href="/">
          <Wordmark className="text-base" />
        </Link>
      </footer>
    </div>
  );
}
