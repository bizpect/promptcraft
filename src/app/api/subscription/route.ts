import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import { fetchSubscriptionWithLabels } from "@/lib/db";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { data: subscription, error } = await fetchSubscriptionWithLabels(
    supabase
  );

  if (error) {
    logSupabaseError("subscriptions.get_subscription_with_labels", error);
    return errorResponse(
      "subscription_fetch_failed",
      "구독 정보를 불러오지 못했습니다.",
      500
    );
  }

  return NextResponse.json({ subscription });
}
