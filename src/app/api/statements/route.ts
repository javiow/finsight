import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-error";
import { decodeCsvBuffer } from "@/lib/csv/encoding";
import { parseCsv } from "@/lib/csv/parse";
import { buildMaskedPreview } from "@/lib/csv/preview";
import { parseTransactionRows } from "@/lib/csv/rows";
import { getPlan } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ColumnMappingError, createClaudeClient, mapColumns } from "@/services/claude";
import { ApiErrorCode, type CreateStatementResponse } from "@/types/api";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const UPLOAD_LIMIT = { free: 3, pro: 10 } as const;
const INSERT_BATCH_SIZE = 500;

type ServiceClient = ReturnType<typeof createServiceClient>;

async function failStatement(service: ServiceClient, statementId: string): Promise<void> {
  await service.from("statements").update({ status: "failed" }).eq("id", statementId);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new ApiError(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      throw new ApiError(ApiErrorCode.INVALID_FILE_TYPE, 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ApiError(ApiErrorCode.FILE_TOO_LARGE, 400);
    }

    const service = createServiceClient();

    const plan = await getPlan(supabase, user.id);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await service
      .from("statements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if ((count ?? 0) >= UPLOAD_LIMIT[plan]) {
      throw new ApiError(ApiErrorCode.UPLOAD_LIMIT_EXCEEDED, 429);
    }

    const statementId = randomUUID();
    const storagePath = `${user.id}/${statementId}.csv`;
    const buffer = await file.arrayBuffer();

    await service.storage.from("statements").upload(storagePath, buffer, {
      contentType: "text/csv",
      upsert: false,
    });

    await service.from("statements").insert({
      id: statementId,
      user_id: user.id,
      filename: file.name,
      storage_path: storagePath,
      status: "parsing",
    });

    let parsed;
    try {
      const { text } = decodeCsvBuffer(buffer);
      parsed = parseCsv(text);
    } catch {
      await failStatement(service, statementId);
      throw new ApiError(ApiErrorCode.COLUMN_MAPPING_FAILED, 422);
    }

    if (parsed.rows.length > MAX_ROWS) {
      await failStatement(service, statementId);
      throw new ApiError(ApiErrorCode.ROW_LIMIT_EXCEEDED, 400);
    }

    const preview = buildMaskedPreview(parsed);
    let mapping;
    try {
      mapping = await mapColumns(createClaudeClient(), preview);
    } catch (error) {
      if (error instanceof ColumnMappingError) {
        await failStatement(service, statementId);
        throw new ApiError(ApiErrorCode.COLUMN_MAPPING_FAILED, 422);
      }
      throw error;
    }

    const { transactions } = parseTransactionRows(parsed.rows, mapping);
    if (transactions.length === 0) {
      await failStatement(service, statementId);
      throw new ApiError(ApiErrorCode.COLUMN_MAPPING_FAILED, 422);
    }

    for (let i = 0; i < transactions.length; i += INSERT_BATCH_SIZE) {
      const batch = transactions.slice(i, i + INSERT_BATCH_SIZE).map((transaction) => ({
        statement_id: statementId,
        user_id: user.id,
        transaction_date: transaction.transaction_date,
        merchant_name: transaction.merchant_name,
        amount: transaction.amount,
      }));
      await service.from("transactions").insert(batch);
    }

    await service
      .from("statements")
      .update({ status: "classifying", row_count: transactions.length })
      .eq("id", statementId);

    const body: CreateStatementResponse = {
      statementId,
      status: "classifying",
      pending: transactions.length,
      total: transactions.length,
    };
    return NextResponse.json(body, { status: 202 });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    return errorResponse(new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 500));
  }
}
