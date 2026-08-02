"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { ProgressBar } from "@/components/dashboard/progress-bar";
import { Button } from "@/components/ui/button";
import type { ClassifyStatementResponse, CreateStatementResponse } from "@/types/api";

type Phase = "idle" | "uploading" | "classifying" | "done" | "error";

function errorMessageFrom(body: unknown): string {
  const message = (body as { message?: string } | null)?.message;
  return message ?? "업로드에 실패했습니다.";
}

export function UploadWidget({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<{ pending: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File): Promise<void> {
    setPhase("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const createResponse = await fetch("/api/statements", { method: "POST", body: formData });
      const createBody = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(errorMessageFrom(createBody));
      }

      const { statementId, pending, total } = createBody as CreateStatementResponse;
      setPhase("classifying");
      setProgress({ pending, total });

      let remaining = pending;
      while (remaining > 0) {
        const classifyResponse = await fetch(`/api/statements/${statementId}/classify`, {
          method: "POST",
        });
        const classifyBody = await classifyResponse.json();
        if (!classifyResponse.ok) {
          throw new Error(errorMessageFrom(classifyBody));
        }

        const data = classifyBody as ClassifyStatementResponse;
        remaining = data.pending;
        setProgress(data);
      }

      setPhase("done");
      router.refresh();
      onComplete?.();
    } catch (error) {
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  if (phase === "uploading" || phase === "classifying") {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] shadow-[var(--shadow-sm)]">
        <ProgressBar
          label={phase === "uploading" ? "파일을 읽고 컬럼을 찾는 중..." : "가맹점을 분류하는 중..."}
          value={progress ? progress.total - progress.pending : 0}
          max={progress?.total ?? 1}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-hairline)] bg-[var(--color-canvas)] p-[var(--space-xl)] text-center">
      {phase === "error" && errorMessage && (
        <p role="alert" className="[font:var(--text-body-sm)] text-[var(--color-danger)]">
          {errorMessage}
        </p>
      )}
      <Upload className="size-6 text-[var(--color-muted)]" aria-hidden="true" />
      <p className="[font:var(--text-body-md)] text-[var(--color-body)]">CSV 명세서를 올려 주세요</p>
      <Button size="sm" onClick={() => inputRef.current?.click()}>
        {phase === "error" ? "다시 시도" : "CSV 올리기"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        aria-label="CSV 파일 선택"
        onChange={handleChange}
      />
    </div>
  );
}
