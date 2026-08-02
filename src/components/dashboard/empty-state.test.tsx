import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  it("명세서가 없다는 안내와 지원 포맷 캡션을 렌더한다", () => {
    render(<EmptyState />);

    expect(screen.getByText("아직 올린 명세서가 없어요")).toBeInTheDocument();
    expect(screen.getByText(/CP949\/UTF-8/)).toBeInTheDocument();
  });
});
