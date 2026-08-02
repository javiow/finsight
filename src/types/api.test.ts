import { describe, expect, expectTypeOf, it } from "vitest";

import {
  API_ERROR_MESSAGES,
  ApiErrorCode,
  type ClassifyStatementResponse,
  type CreateStatementResponse,
  type InsightItem,
  type InsightsResponse,
  type UpdateTransactionRequest,
  type UpdateTransactionResponse,
} from "./api";
import type { Category, Transaction } from "./database";

describe("API contract types", () => {
  it("uses the twelve categories defined by the database schema", () => {
    const categories: Category[] = [
      "식비",
      "생활·마트",
      "쇼핑",
      "주거·관리비",
      "카페·간식",
      "교통",
      "문화·여가",
      "교육",
      "통신",
      "여행·숙박",
      "의료·건강",
      "기타",
    ];

    expect(new Set(categories)).toHaveLength(12);
  });

  it("matches the documented statement upload and classification responses", () => {
    expectTypeOf<CreateStatementResponse>().toEqualTypeOf<{
      statementId: string;
      status: "classifying";
      pending: number;
      total: number;
    }>();
    expectTypeOf<ClassifyStatementResponse>().toEqualTypeOf<{
      pending: number;
      total: number;
    }>();
  });

  it("requires a category when updating a transaction", () => {
    expectTypeOf<UpdateTransactionRequest>().toEqualTypeOf<{
      category: Category;
    }>();
  });

  it("returns the updated transaction row from PATCH /api/transactions/:id", () => {
    expectTypeOf<UpdateTransactionResponse>().toEqualTypeOf<Transaction>();
  });

  it("keeps a category and period reference on every insight response item", () => {
    expectTypeOf<InsightsResponse>().toEqualTypeOf<InsightItem[]>();
    expectTypeOf<InsightItem>().toMatchTypeOf<{
      category: Category;
      period: string;
    }>();
  });

  it("maps every API error code to a Korean user-facing message", () => {
    const errorCodes = Object.values(ApiErrorCode);

    expect(errorCodes).not.toHaveLength(0);
    expect(Object.keys(API_ERROR_MESSAGES)).toEqual(
      expect.arrayContaining(errorCodes),
    );
    expect(API_ERROR_MESSAGES.COLUMN_MAPPING_FAILED).toContain("카드사");
    expect(API_ERROR_MESSAGES.UPLOAD_LIMIT_EXCEEDED).toContain("24시간");
  });
});
