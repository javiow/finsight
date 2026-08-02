import { NextResponse } from "next/server";

import { API_ERROR_MESSAGES, type ApiErrorCode } from "@/types/api";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number) {
    super(API_ERROR_MESSAGES[code]);
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(error: ApiError): NextResponse {
  return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
}
