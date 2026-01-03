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

  const { plan_code } = parsed.data;
  const { data: plan, error } = await fetchSubscriptionPlanDetail(
    supabase,
    plan_code
  );

  if (error || !plan) {
    logSupabaseError("plans.get_subscription_plan_detail", error);
    return errorResponse("plan_not_found", "플랜 정보를 찾을 수 없습니다.", 404);
  }

  const { clientKey } = getTossConfig();
  const orderId = `billing_auth_${plan_code}_${randomUUID()}`;
  const orderName = `PromptCraft ${plan.plan_label ?? plan.plan_code}`;
  const amount = plan.price ?? 0;
  const { successUrl, failUrl } = getBillingRedirectUrls(plan_code, orderId);

  return NextResponse.json({
    client_key: clientKey,
    customer_key: user.id,
    success_url: successUrl,
    fail_url: failUrl,
    order_id: orderId,
    order_name: orderName,
    amount,
    plan,
  });
}
