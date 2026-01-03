import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import {
  deletePromptForUser,
  fetchPromptDetailForUser,
  updatePromptTitleForUser,
} from "@/lib/db";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(80),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return errorResponse("invalid_id", "요청 값이 올바르지 않습니다.", 400);
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { data: prompt, error } = await fetchPromptDetailForUser(
    supabase,
    parsed.data.id
  );

  if (error || !prompt) {
    logSupabaseError("prompts.get_prompt_detail", error);
    return errorResponse("prompt_not_found", "프롬프트를 찾을 수 없습니다.", 404);
  }

  return NextResponse.json({ prompt });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return errorResponse("invalid_id", "요청 값이 올바르지 않습니다.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updateSchema.safeParse(body);

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

  const { data: prompt, error } = await updatePromptTitleForUser(
    supabase,
    parsedParams.data.id,
    parsedBody.data.title.trim()
  );

  if (error || !prompt) {
    logSupabaseError("prompts.update_title", error);
    return errorResponse("update_failed", "수정에 실패했습니다.", 500);
  }

  return NextResponse.json({ prompt });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return errorResponse("invalid_id", "요청 값이 올바르지 않습니다.", 400);
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const { error } = await deletePromptForUser(supabase, parsed.data.id);

  if (error) {
    logSupabaseError("prompts.delete", error);
    return errorResponse("delete_failed", "삭제에 실패했습니다.", 500);
  }

  return NextResponse.json({ ok: true });
}
