"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PreviewCategory {
  name: string;
  amount: number;
}

// 예시 데이터. design/finsight-data.js의 12개 카테고리를 상위 5개 + "기타"(나머지 7개 합산)로
// 접는다 — 색상만 있고 범례에 없는 조각을 만들지 않기 위해서다(dataviz 스킬의 "Other" 규칙).
const PREVIEW_CATEGORIES: readonly PreviewCategory[] = [
  { name: "식비", amount: 682_400 },
  { name: "생활·마트", amount: 431_900 },
  { name: "쇼핑", amount: 394_800 },
  { name: "주거·관리비", amount: 312_000 },
  { name: "카페·간식", amount: 218_600 },
  { name: "기타", amount: 707_600 },
];

const TOTAL = PREVIEW_CATEGORIES.reduce((sum, category) => sum + category.amount, 0);

// design/finsight-data.js의 FS_SLICE 산출식을 그대로 포팅한다(DESIGN.md: "색 램프는 FS_SLICE
// 산출식을 따른다"). 포인트 컬러 1개만 있는 브랜드라 카테고리 구분은 그 색의 명도 단계로 만든다 —
// 인접 단계의 색 대비가 좁은 대신, 모든 조각이 범례에 이름·퍼센트·금액으로 항상 라벨링되어
// 색이 유일한 식별 수단이 되지 않는다.
function sliceColor(index: number): string {
  return index < 6
    ? `color-mix(in oklch, var(--color-primary) ${100 - index * 14}%, var(--color-muted-soft))`
    : `color-mix(in oklch, var(--color-muted) ${78 - (index - 6) * 11}%, var(--color-canvas))`;
}

function formatWon(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function SpendingPreviewChart() {
  return (
    <div className="flex flex-col items-center gap-8 md:flex-row">
      <div className="relative size-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={PREVIEW_CATEGORIES}
              dataKey="amount"
              nameKey="name"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={false}
            >
              {PREVIEW_CATEGORIES.map((category, index) => (
                <Cell key={category.name} fill={sliceColor(index === 5 ? 6 : index)} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              separator=" · "
              contentStyle={{
                background: "var(--popover)",
                borderColor: "var(--color-hairline)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
              }}
              labelStyle={{ color: "var(--color-ink)", fontWeight: 600 }}
              itemStyle={{ color: "var(--color-body)" }}
              formatter={(value) => {
                const amount = Number(value);
                return `${formatWon(amount)} (${Math.round((amount / TOTAL) * 100)}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="[font:var(--text-caption)] text-[var(--color-muted)]">이번 달 총 지출</span>
          <span className="[font:var(--text-number-md)] tabular-nums text-[var(--color-ink)]">
            {formatWon(TOTAL)}
          </span>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-0.5">
        {PREVIEW_CATEGORIES.map((category, index) => (
          <div
            key={category.name}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-strong)]"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: sliceColor(index === 5 ? 6 : index) }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate [font:var(--text-body-md)] text-[var(--color-ink)]">
              {category.name}
            </span>
            <span className="w-10 shrink-0 text-right [font:var(--text-caption)] text-[var(--color-muted)]">
              {Math.round((category.amount / TOTAL) * 100)}%
            </span>
            <span className="w-24 shrink-0 text-right [font:var(--text-number-sm)] tabular-nums text-[var(--color-body)]">
              {formatWon(category.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
