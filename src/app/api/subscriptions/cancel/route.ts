import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import { undoSubscriptionCancel } from "@/lib/db";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { error } = await undoSubscriptionCancel(supabase);

  if (error) {
    logSupabaseError("subscriptions.undo_cancel", error);
    return errorResponse(
      "cancel_undo_failed",
      "해지 예약 취소에 실패했습니다.",
      500
    );
  }

  return NextResponse.json({ ok: true });
}
