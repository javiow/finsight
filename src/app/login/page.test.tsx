import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuthMock, createClientMock } = vi.hoisted(() => ({
  signInWithOAuthMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: createClientMock,
}));

import LoginPage from "./page";

const source = readFileSync(resolve(process.cwd(), "src/app/login/page.tsx"), "utf8");

afterEach(cleanup);

describe("로그인 페이지 소스", () => {
  it("Google 로그인만 지원한다 — 이메일/비밀번호 폼을 두지 않는다", () => {
    expect(source).not.toContain('type="password"');
    expect(source).not.toContain('type="email"');
  });

  it("워드마크를 재사용해 브랜드 표기를 일관되게 유지한다", () => {
    expect(source).toContain("Wordmark");
  });
});

describe("로그인 페이지 동작", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({
      auth: { signInWithOAuth: signInWithOAuthMock },
    });
  });

  it("버튼 클릭 시 /auth/callback으로 돌아오는 Google OAuth를 시작한다", async () => {
    signInWithOAuthMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Google로 로그인/ }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: expect.stringContaining("/auth/callback") },
    });
  });

  it("OAuth 시작에 실패하면 에러를 보여주고 버튼을 다시 누를 수 있게 한다", async () => {
    signInWithOAuthMock.mockResolvedValue({
      error: { message: "provider disabled" },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /Google로 로그인/ });
    await user.click(button);

    expect(
      await screen.findByText("로그인에 실패했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
