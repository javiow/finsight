import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InsightItem } from "./insight-item";

afterEach(cleanup);

describe("InsightItem", () => {
  it("순번을 01, 02 형태로 표기하고 메시지를 렌더한다", () => {
    render(<InsightItem index={0} message="식비가 지난달보다 32% 늘었어요" />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("식비가 지난달보다 32% 늘었어요")).toBeInTheDocument();
  });

  it("두 번째 항목은 02로 표기한다", () => {
    render(<InsightItem index={1} message="교통비는 안정적이에요" />);

    expect(screen.getByText("02")).toBeInTheDocument();
  });
});
