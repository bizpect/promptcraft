import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import { duplicatePromptForUser } from "@/lib/db";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  title: z.string().min(1).max(80).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return errorResponse("invalid_id", "요청 값이 올바르지 않습니다.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body ?? {});

  if (!parsedBody.success) {
    return errorResponse("invalid_input", "입력값이 올바르지 않습니다.", 400);
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { data: prompt, error } = await duplicatePromptForUser(
    supabase,
    parsedParams.data.id,
    parsedBody.data.title?.trim() ?? null
  );

  if (error || !prompt) {
    logSupabaseError("prompts.duplicate", error);
    return errorResponse("duplicate_failed", "복제에 실패했습니다.", 500);
  }

  return NextResponse.json({ prompt });
}
