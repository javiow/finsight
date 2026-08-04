"use client";

import { useEffect, useState } from "react";

import { InsightItem } from "@/components/dashboard/insight-item";
import { LockVeil } from "@/components/dashboard/lock-veil";
import type { InsightsResponse } from "@/types/api";
import type { Plan } from "@/types/database";

export function InsightsSection({
  initialInsights,
  plan,
}: {
  initialInsights: InsightsResponse;
  plan: Plan;
}) {
  const [insights, setInsights] = useState<InsightsResponse>(initialInsights);

  useEffect(() => {
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: "claude-opus-5", messages: [] }),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/insights", { method: "POST" })
      .then((res) => (res.ok ? (res.json() as Promise<InsightsResponse>) : null))
      .then((data) => {
        if (!cancelled && data) setInsights(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (insights.length === 0) {
    return (
      <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">
        아직 인사이트를 만들 만한 데이터가 없어요.
      </p>
    );
  }

  const [first, ...rest] = insights;
  const showAll = plan === "pro";

  return (
    <div className="flex flex-col gap-1">
      <InsightItem index={0} message={first.message} />
      {rest.length > 0 &&
        (showAll ? (
          rest.map((insight, index) => (
            <InsightItem key={insight.category} index={index + 1} message={insight.message} />
          ))
        ) : (
          <div className="fs-lock relative overflow-hidden rounded-[var(--radius-lg)]">
            <div className="flex flex-col opacity-50 blur-[3px]" aria-hidden="true">
              {rest.map((insight, index) => (
                <InsightItem key={insight.category} index={index + 1} message={insight.message} />
              ))}
            </div>
            <LockVeil
              title={`인사이트 ${rest.length}개가 더 있어요`}
              note="Pro로 업그레이드하면 전체를 확인할 수 있어요"
            />
          </div>
        ))}
    </div>
  );
}
