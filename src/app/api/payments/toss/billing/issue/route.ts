import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { errorResponse } from "@/lib/api/response";
import {
  applyBillingChargeFailure,
  applyBillingChargeSuccess,
  fetchSubscriptionPlanDetail,
  upsertBillingProfile,
} from "@/lib/db";
import {
  chargeTossBillingKey,
  issueTossBillingKey,
} from "@/lib/payments/toss";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  auth_key: z.string().min(1),
  customer_key: z.string().min(1),
  plan_code: z.enum(["pro", "max"]),
  order_id: z.string().min(1).optional(),
});

function extractCardSummary(response: Record<string, unknown>) {
  const card = response.card as Record<string, unknown> | undefined;
  const number = card?.number;

  if (typeof number === "string" && number.trim().length > 0) {
    return number;
  }

  return null;
}

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

  const { auth_key, customer_key, plan_code, order_id } = parsed.data;

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

  const { data: plan, error: planError } = await fetchSubscriptionPlanDetail(
    supabase,
    plan_code
  );

  if (planError || !plan) {
    logSupabaseError("plans.get_subscription_plan_detail", planError);
    return errorResponse("plan_not_found", "플랜 정보를 찾을 수 없습니다.", 404);
  }

  const { data: billingProfile, error: billingError } =
    await upsertBillingProfile(supabase, {
      providerCode: "toss",
      statusCode: "active",
      customerKey: customer_key,
      billingKey,
      cardSummary: extractCardSummary(billingResponse),
      rawResponse: billingResponse,
    });

  if (billingError || !billingProfile) {
    logSupabaseError("billing_profiles.upsert", billingError);
    return errorResponse(
      "billing_profile_failed",
      "빌링키 저장에 실패했습니다.",
      500
    );
  }

  const amount = plan.price ?? 0;
  const orderId = order_id ?? `sub_${plan_code}_${randomUUID()}`;
  const orderName = `PromptCraft ${plan.plan_label ?? plan_code}`;

  try {
    const charged = await chargeTossBillingKey({
      billingKey,
      customerKey: customer_key,
      amount,
      orderId,
      orderName,
    });

    const { error: applyError } = await applyBillingChargeSuccess(supabase, {
      userId: user.id,
      orderId,
      paymentKey:
        typeof charged.paymentKey === "string" ? charged.paymentKey : "",
      amount,
      currency: typeof charged.currency === "string" ? charged.currency : null,
      method: typeof charged.method === "string" ? charged.method : null,
      requestedAt:
        typeof charged.requestedAt === "string" ? charged.requestedAt : null,
      approvedAt:
        typeof charged.approvedAt === "string" ? charged.approvedAt : null,
      rawResponse: charged,
      planCode: plan_code,
    });

    if (applyError) {
      logSupabaseError("billing.apply_charge_success", applyError);
      return errorResponse(
        "payment_apply_failed",
        "결제 반영에 실패했습니다.",
        500
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "결제 승인에 실패했습니다.";

    const { error: failError } = await applyBillingChargeFailure(supabase, {
      userId: user.id,
      orderId,
      paymentKey: null,
      amount,
      currency: plan.currency ?? "KRW",
      rawResponse:
        error instanceof Error
          ? { message: error.message }
          : { message: "billing charge failed" },
      planCode: plan_code,
    });

    if (failError) {
      logSupabaseError("billing.apply_charge_failure", failError);
    }

    return errorResponse("billing_charge_failed", message, 502);
  }

  return NextResponse.json({
    ok: true,
    billing_profile: billingProfile,
  });
}
