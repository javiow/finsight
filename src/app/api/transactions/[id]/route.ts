import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ApiError, errorResponse } from "@/lib/api-error";
import { CATEGORIES } from "@/lib/categories";
import { normalizeMerchantName } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ApiErrorCode, type UpdateTransactionResponse } from "@/types/api";

const requestSchema = z.object({ category: z.enum(CATEGORIES) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: transactionId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new ApiError(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const parsedBody = requestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ message: "유효하지 않은 카테고리입니다." }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: transaction } = await service
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .single();
    if (!transaction) {
      throw new ApiError(ApiErrorCode.FORBIDDEN, 403);
    }

    const { category } = parsedBody.data;
    const { data: updated } = await service
      .from("transactions")
      .update({ category })
      .eq("id", transactionId)
      .select()
      .single();

    await service.from("user_merchant_categories").upsert(
      {
        user_id: user.id,
        merchant_name: normalizeMerchantName(transaction.merchant_name),
        category,
        source: "user",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,merchant_name" },
    );

    const body: UpdateTransactionResponse = updated;
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    return errorResponse(new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 500));
  }
}
