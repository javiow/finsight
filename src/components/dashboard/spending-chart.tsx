"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatWon } from "@/lib/format";

interface CategoryAmount {
  name: string;
  amount: number;
}

const MAX_SLICES = 5;

// design/finsight-data.js의 FS_SLICE 산출식을 그대로 포팅한다(DESIGN.md: "색 램프는 FS_SLICE
// 산출식을 따른다"). 포인트 컬러 1개만 있는 브랜드라 카테고리 구분은 그 색의 명도 단계로 만든다.
function sliceColor(index: number): string {
  return index < 6
    ? `color-mix(in oklch, var(--color-primary) ${100 - index * 14}%, var(--color-muted-soft))`
    : `color-mix(in oklch, var(--color-muted) ${78 - (index - 6) * 11}%, var(--color-canvas))`;
}

function foldIntoOther(categories: CategoryAmount[]): CategoryAmount[] {
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  if (sorted.length <= MAX_SLICES + 1) return sorted;
  const top = sorted.slice(0, MAX_SLICES);
  const restAmount = sorted.slice(MAX_SLICES).reduce((sum, c) => sum + c.amount, 0);
  return [...top, { name: "기타", amount: restAmount }];
}

export function SpendingChart({ categories }: { categories: CategoryAmount[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const data = foldIntoOther(categories);
  const total = data.reduce((sum, c) => sum + c.amount, 0);
  const active = activeIndex !== null ? data[activeIndex] : null;

  if (data.length === 0 || total === 0) {
    return (
      <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">
        이번 달 지출 데이터가 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row">
      <div className="relative size-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
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
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((category, index) => (
                <Cell key={category.name} fill={sliceColor(index)} />
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
                return `${formatWon(amount)} (${Math.round((amount / total) * 100)}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="[font:var(--text-caption)] text-[var(--color-muted)]">
            {active ? active.name : "총 지출"}
          </span>
          <span className="[font:var(--text-number-md)] tabular-nums text-[var(--color-ink)]">
            {formatWon(active ? active.amount : total)}
          </span>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-0.5">
        {data.map((category, index) => (
          <div
            key={category.name}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-strong)]"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: sliceColor(index) }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate [font:var(--text-body-md)] text-[var(--color-ink)]">
              {category.name}
            </span>
            <span className="w-10 shrink-0 text-right [font:var(--text-caption)] text-[var(--color-muted)]">
              {Math.round((category.amount / total) * 100)}%
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
