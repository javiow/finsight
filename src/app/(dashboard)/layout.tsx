import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { getPlan } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const plan = await getPlan(supabase, user.id);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-soft)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-[var(--color-hairline)] bg-[var(--color-canvas)] px-8 py-4">
          <Badge variant={plan === "pro" ? "default" : "secondary"}>
            {plan === "pro" ? "Pro 플랜" : "Free 플랜"}
          </Badge>
        </header>
        <main className="flex-1 px-8 py-8">
          <div className="mx-auto flex max-w-[var(--content-max)] flex-col gap-8">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
