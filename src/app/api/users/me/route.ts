import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import { fetchCurrentUserProfile, updateCurrentUserProfile } from "@/lib/db";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const updateSchema = z.object({
  display_name: z.string().max(80).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { data: profile, error } = await fetchCurrentUserProfile(supabase);

  if (error) {
    logSupabaseError("users.get_current_user_profile", error);
    return errorResponse(
      "profile_fetch_failed",
      "사용자 정보를 불러오지 못했습니다.",
      500
    );
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("invalid_input", "입력값이 올바르지 않습니다.", 400);
  }

  const displayName = parsed.data.display_name?.trim() ?? null;
  const avatarUrl = parsed.data.avatar_url ?? null;

  const { data: profile, error } = await updateCurrentUserProfile(supabase, {
    displayName,
    avatarUrl,
  });

  if (error || !profile) {
    logSupabaseError("users.update_current_user_profile", error);
    return errorResponse("update_failed", "프로필 저장에 실패했습니다.", 500);
  }

  return NextResponse.json({ profile });
}
