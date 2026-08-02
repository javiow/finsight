"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { formatWon } from "@/lib/format";

interface MonthAmount {
  month: string;
  amount: number;
}

function monthLabel(month: string): string {
  const [, m] = month.split("-");
  return `${Number(m)}월`;
}

export function TrendChart({ months }: { months: MonthAmount[] }) {
  const currentMonth = months[months.length - 1]?.month;

  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={months} barCategoryGap="24%">
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-strong)" }}
            contentStyle={{
              background: "var(--popover)",
              borderColor: "var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
            }}
            labelFormatter={(label) => monthLabel(String(label))}
            formatter={(value) => formatWon(Number(value))}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {months.map((entry) => (
              <Cell
                key={entry.month}
                fill={
                  entry.month === currentMonth
                    ? "var(--color-primary)"
                    : "var(--color-surface-strong)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
