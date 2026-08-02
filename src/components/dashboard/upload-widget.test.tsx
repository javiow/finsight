import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { UploadWidget } from "./upload-widget";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function csvFile(): File {
  return new File(["날짜,가맹점,금액\n2026-01-01,스타벅스,4500"], "statement.csv", {
    type: "text/csv",
  });
}

async function selectFile() {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("CSV 파일 선택"), csvFile());
}

describe("UploadWidget", () => {
  it("파일을 선택하면 POST /api/statements를 FormData로 호출한다", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ statementId: "stmt-1", status: "classifying", pending: 0, total: 0 }),
    } as Response);

    render(<UploadWidget />);
    await selectFile();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/statements",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.body).toBeInstanceOf(FormData);
  });

  it("pending이 0이 될 때까지 classify를 반복 호출하고 완료되면 onComplete를 부른다", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ statementId: "stmt-1", status: "classifying", pending: 2, total: 2 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pending: 1, total: 2 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pending: 0, total: 2 }),
      } as Response);
    const onComplete = vi.fn();

    render(<UploadWidget onComplete={onComplete} />);
    await selectFile();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/statements/stmt-1/classify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      "/api/statements/stmt-1/classify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("업로드 요청이 실패하면 classify를 호출하지 않고 에러를 보여준다", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ code: "INVALID_FILE_TYPE", message: "CSV만 업로드할 수 있습니다." }),
    } as Response);

    render(<UploadWidget />);
    await selectFile();

    expect(await screen.findByRole("alert")).toHaveTextContent("CSV만 업로드할 수 있습니다.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("classify 도중 실패하면 그 시점에서 멈추고 에러를 보여준다", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ statementId: "stmt-1", status: "classifying", pending: 2, total: 2 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: "INTERNAL_SERVER_ERROR", message: "서버 오류가 발생했습니다." }),
      } as Response);

    render(<UploadWidget />);
    await selectFile();

    expect(await screen.findByRole("alert")).toHaveTextContent("서버 오류가 발생했습니다.");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
