"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/marketing/wordmark";
import { createClient } from "@/lib/supabase/browser";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.32-.17-1.94H10v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.32 3-7.48Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.06v2.59A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FBBC05"
        d="M4.41 11.92A6 6 0 0 1 4.09 10c0-.67.11-1.32.32-1.92V5.49H1.06A10 10 0 0 0 0 10c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0 6.09 0 2.71 2.24 1.06 5.49l3.35 2.59C5.2 5.71 7.4 3.96 10 3.96Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setHasError(new URLSearchParams(window.location.search).get("error") === "auth");
  }, []);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setHasError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setHasError(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-soft)] px-6">
      <div className="flex w-[360px] flex-col gap-5 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-8 shadow-[var(--shadow-md)]">
        <div className="flex flex-col items-center gap-1 text-center">
          <Wordmark className="text-2xl" />
          <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">
            내 돈 흐름을 한눈에
          </p>
        </div>

        {hasError && (
          <p className="[font:var(--text-body-sm)] text-center text-[var(--color-danger)]">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}

        <Button
          size="lg"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="h-11 w-full gap-2 [font:var(--text-button)]"
        >
          <GoogleIcon />
          Google로 로그인
        </Button>
      </div>
    </div>
  );
}
