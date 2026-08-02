import type { Category, Transaction } from "./database";

export type CreateStatementRequest = FormData;

export interface CreateStatementResponse {
  statementId: string;
  status: "classifying";
  pending: number;
  total: number;
}

export interface ClassifyStatementResponse {
  pending: number;
  total: number;
}

export interface UpdateTransactionRequest {
  category: Category;
}

export type UpdateTransactionResponse = Transaction;

export interface InsightItem {
  category: Category;
  period: string;
  message: string;
}

export type InsightsResponse = InsightItem[];

export interface CheckoutResponse {
  url: string;
}

export enum ApiErrorCode {
  COLUMN_MAPPING_FAILED = "COLUMN_MAPPING_FAILED",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  ROW_LIMIT_EXCEEDED = "ROW_LIMIT_EXCEEDED",
  UPLOAD_LIMIT_EXCEEDED = "UPLOAD_LIMIT_EXCEEDED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.COLUMN_MAPPING_FAILED]:
    "업로드한 파일에서 날짜, 가맹점, 금액 열을 찾지 못했습니다. 카드사에서 내려받은 CSV인지 확인하거나 다른 형식의 명세서를 업로드해 주세요.",
  [ApiErrorCode.INVALID_FILE_TYPE]:
    "CSV 형식의 카드 명세서 파일만 업로드할 수 있습니다.",
  [ApiErrorCode.FILE_TOO_LARGE]:
    "파일 크기가 업로드 제한을 초과했습니다. 더 작은 CSV 파일을 업로드해 주세요.",
  [ApiErrorCode.ROW_LIMIT_EXCEEDED]:
    "파일의 행 수가 업로드 제한을 초과했습니다. 기간을 나누어 CSV를 업로드해 주세요.",
  [ApiErrorCode.UPLOAD_LIMIT_EXCEEDED]:
    "24시간 업로드 한도에 도달했습니다. Free는 3건, Pro는 10건까지 업로드할 수 있습니다.",
  [ApiErrorCode.UNAUTHORIZED]: "로그인이 필요합니다. 다시 로그인해 주세요.",
  [ApiErrorCode.FORBIDDEN]: "이 기능은 Pro 전용입니다. Pro로 업그레이드해 주세요.",
  [ApiErrorCode.INTERNAL_SERVER_ERROR]:
    "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};
