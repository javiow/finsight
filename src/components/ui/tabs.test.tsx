import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

afterEach(cleanup);

function renderTabs() {
  return render(
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">요약</TabsTrigger>
        <TabsTrigger value="trends">트렌드</TabsTrigger>
      </TabsList>
      <TabsContent value="summary">이번 달 요약</TabsContent>
      <TabsContent value="trends">지출 트렌드</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default tab's panel and hides the other", () => {
    renderTabs();

    expect(screen.getByText("이번 달 요약")).toBeVisible();
    expect(screen.queryByText("지출 트렌드")).not.toBeInTheDocument();
  });

  it("switches panels when a different tab is clicked", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "트렌드" }));

    expect(screen.getByText("지출 트렌드")).toBeVisible();
    expect(screen.queryByText("이번 달 요약")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "트렌드" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
