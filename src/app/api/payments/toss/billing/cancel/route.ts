import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import { fetchBillingProfile, scheduleSubscriptionCancel } from "@/lib/db";
import { revokeTossBillingKey } from "@/lib/payments/toss";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { data: billingProfile, error: billingError } =
    await fetchBillingProfile(supabase);

  if (billingError) {
    logSupabaseError("billing_profiles.get", billingError);
    return errorResponse("billing_profile_error", "결제 정보를 찾을 수 없습니다.", 404);
  }

  if (!billingProfile?.billing_key) {
    return errorResponse("billing_key_missing", "빌링키가 없습니다.", 404);
  }

  try {
    await revokeTossBillingKey({ billingKey: billingProfile.billing_key });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "빌링키 해지에 실패했습니다.";
    return errorResponse("billing_revoke_failed", message, 502);
  }

  const { error: cancelError } = await scheduleSubscriptionCancel(supabase);

  if (cancelError) {
    logSupabaseError("subscriptions.schedule_cancel", cancelError);
    return errorResponse("cancel_failed", "구독 해지에 실패했습니다.", 500);
  }

  return NextResponse.json({ ok: true });
}
