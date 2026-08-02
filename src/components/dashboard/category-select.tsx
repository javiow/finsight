"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/types/database";

export function CategorySelect({
  transactionId,
  category,
  onUpdated,
}: {
  transactionId: string;
  category: Category;
  onUpdated?: (category: Category) => void;
}) {
  const [value, setValue] = useState<Category>(category);
  const [pending, setPending] = useState(false);

  async function handleChange(next: Category | null) {
    if (!next) return;
    const nextCategory = next;
    const previous = value;
    setValue(nextCategory);
    setPending(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: nextCategory }),
      });
      if (!response.ok) throw new Error("카테고리 변경에 실패했습니다.");
      onUpdated?.(nextCategory);
    } catch {
      setValue(previous);
      toast.error("카테고리 변경에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" aria-label="카테고리">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
