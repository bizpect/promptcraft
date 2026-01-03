import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import { upsertBillingProfile } from "@/lib/db";
import { extractCardSummary, issueTossBillingKey } from "@/lib/payments/toss";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  auth_key: z.string().min(1),
  customer_key: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("invalid_input", "입력값이 올바르지 않습니다.", 400);
  }

  const { auth_key, customer_key } = parsed.data;

  let billingResponse: Record<string, unknown>;

  try {
    billingResponse = await issueTossBillingKey({
      authKey: auth_key,
      customerKey: customer_key,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "빌링키 발급에 실패했습니다.";
    return errorResponse("billing_issue_failed", message, 502);
  }

  const billingKey =
    typeof billingResponse.billingKey === "string"
      ? billingResponse.billingKey
      : null;

  if (!billingKey) {
    return errorResponse(
      "billing_key_missing",
      "빌링키를 확인할 수 없습니다.",
      502
    );
  }

  const cardSummary = extractCardSummary(billingResponse);

  const { data: billingProfile, error } = await upsertBillingProfile(supabase, {
    providerCode: "toss",
    statusCode: "active",
    customerKey: customer_key,
    billingKey,
    cardSummary,
    rawResponse: billingResponse,
  });

  if (error || !billingProfile) {
    return errorResponse(
      "billing_profile_failed",
      "결제수단 변경에 실패했습니다.",
      500
    );
  }

  return NextResponse.json({
    ok: true,
    billing_profile: billingProfile,
  });
}
