import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { errorResponse } from "@/lib/api/response";
import { fetchSubscriptionPlanDetail } from "@/lib/db";
import { getTossConfig } from "@/lib/payments/toss";
import { getBillingRedirectUrls } from "@/lib/payments/urls";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  plan_code: z.enum(["pro", "max"]),
  mode: z.enum(["subscribe", "update"]).optional(),
});

const planSchema = z.object({
  plan_code: z.string().optional(),
  plan_label: z.string().nullable().optional(),
  price: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  rewrite_limit: z.number().int().optional(),
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

  const { plan_code, mode } = parsed.data;
  const { data: plan, error } = await fetchSubscriptionPlanDetail(
    supabase,
    plan_code
  );

  if (error || !plan) {
    logSupabaseError("plans.get_subscription_plan_detail", error);
    return errorResponse("plan_not_found", "플랜 정보를 찾을 수 없습니다.", 404);
  }

  const parsedPlan = planSchema.safeParse(plan);

  if (!parsedPlan.success) {
    return errorResponse("plan_invalid", "플랜 정보가 올바르지 않습니다.", 500);
  }

  const { clientKey } = getTossConfig();
  const resolvedMode = mode ?? "subscribe";
  const orderId =
    resolvedMode === "update"
      ? `billing_update_${plan_code}_${randomUUID()}`
      : `billing_auth_${plan_code}_${randomUUID()}`;
  const orderName =
    resolvedMode === "update"
      ? `PromptCraft ${parsedPlan.data.plan_label ?? plan_code} 결제수단 변경`
      : `PromptCraft ${
          parsedPlan.data.plan_label ?? parsedPlan.data.plan_code ?? plan_code
        }`;
  const amount = parsedPlan.data.price ?? 0;
  const { successUrl, failUrl } = getBillingRedirectUrls(
    plan_code,
    orderId,
    resolvedMode
  );

  return NextResponse.json({
    client_key: clientKey,
    customer_key: user.id,
    success_url: successUrl,
    fail_url: failUrl,
    order_id: orderId,
    order_name: orderName,
    amount,
    plan: parsedPlan.data,
  });
}
