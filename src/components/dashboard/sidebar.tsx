"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import { Wordmark } from "@/components/marketing/wordmark";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "대시보드", href: "/dashboard" },
  { label: "거래 내역", href: "/transactions" },
  { label: "월별 추이", href: "/trends" },
] as const;

type SidebarProps = {
  userId?: string;
  email?: string;
  plan?: "free" | "pro";
};

export function Sidebar({ userId, email, plan }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!userId || !plan) return;

    posthog.identify(userId, {
      ...(email ? { email } : {}),
      plan,
    });
  }, [email, plan, userId]);

  return (
    <nav className="flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-[var(--color-hairline)] bg-[var(--color-canvas)] px-5 py-6">
      <Wordmark className="text-xl" />
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-[var(--radius-md)] px-3 py-2 [font:var(--text-body-md)] transition-colors",
                  active
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-body)] hover:bg-[var(--color-surface-strong)]",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
