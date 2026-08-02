// @vitest-environment node
import { describe, expect, it } from "vitest";

import { API_ERROR_MESSAGES, ApiErrorCode } from "@/types/api";

import { ApiError, errorResponse } from "./api-error";

describe("ApiError", () => {
  it("에러 코드에 해당하는 한국어 메시지를 message로 갖는다", () => {
    const error = new ApiError(ApiErrorCode.UNAUTHORIZED, 401);

    expect(error.code).toBe(ApiErrorCode.UNAUTHORIZED);
    expect(error.status).toBe(401);
    expect(error.message).toBe(API_ERROR_MESSAGES.UNAUTHORIZED);
  });
});

describe("errorResponse", () => {
  it("code·message와 지정된 status를 담은 JSON 응답을 만든다", async () => {
    const error = new ApiError(ApiErrorCode.FORBIDDEN, 403);

    const response = errorResponse(error);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.FORBIDDEN,
      message: API_ERROR_MESSAGES.FORBIDDEN,
    });
  });
});
