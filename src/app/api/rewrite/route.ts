import { z } from "zod";
import OpenAI from "openai";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import {
  fetchPromptOutputForUser,
  fetchSubscriptionWithLabels,
  insertRewrite,
  updateSubscriptionRewriteUsed,
} from "@/lib/db";
import { MAX_REWRITE_INPUT, MAX_REWRITE_OUTPUT } from "@/lib/limits";
import { createServerSupabase } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

const schema = z.object({
  prompt_id: z.string().optional(),
  original_prompt: z.string().optional(),
  platform: z.enum(["sora", "veo"]),
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

  const { prompt_id, original_prompt, platform } = parsed.data;

  if (!prompt_id && !original_prompt) {
    return errorResponse(
      "invalid_input",
      "prompt_id 또는 original_prompt가 필요합니다.",
      400
    );
  }

  const { data: subscription, error: subError } =
    await fetchSubscriptionWithLabels(supabase);

  if (subError || !subscription) {
    logSupabaseError("subscriptions.select", subError);
    return errorResponse("plan_required", "플랜 정보가 없습니다.", 403);
  }

  if (subscription.status_code !== "active") {
    return errorResponse("inactive_plan", "활성 플랜이 아닙니다.", 403);
  }

  if (subscription.cancel_at) {
    const cancelAt = new Date(subscription.cancel_at).getTime();
    if (!Number.isNaN(cancelAt) && cancelAt <= Date.now()) {
      return errorResponse("inactive_plan", "구독이 만료되었습니다.", 403);
    }
  }

  if (subscription.rewrite_used >= subscription.rewrite_limit) {
    return errorResponse("quota_exceeded", "리라이팅 한도를 초과했습니다.", 403);
  }

  let sourcePrompt = original_prompt ?? "";

  if (prompt_id) {
    const { data: promptRow, error: promptError } =
      await fetchPromptOutputForUser(supabase, prompt_id);

    if (promptError || !promptRow) {
      logSupabaseError("prompts.select", promptError);
      return errorResponse("prompt_not_found", "프롬프트를 찾을 수 없습니다.", 404);
    }

    sourcePrompt = promptRow.output_prompt;
  }

  if (!sourcePrompt) {
    return errorResponse("invalid_input", "리라이팅할 내용이 없습니다.", 400);
  }

  if (sourcePrompt.length > MAX_REWRITE_INPUT) {
    return errorResponse(
      "input_too_long",
      `입력 길이는 ${MAX_REWRITE_INPUT}자 이내여야 합니다.`,
      400
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return errorResponse("server_error", "OpenAI 설정이 누락되었습니다.", 500);
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a professional prompt editor. Rewrite the prompt to improve clarity and cinematic detail while preserving intent. Keep it concise.",
      },
      {
        role: "user",
        content: `Platform: ${platform}\nPrompt:\n${sourcePrompt}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.6,
  });

  const rewritten = completion.choices[0]?.message?.content?.trim() ?? "";

  if (!rewritten) {
    return errorResponse("rewrite_failed", "리라이팅에 실패했습니다.", 500);
  }

  if (rewritten.length > MAX_REWRITE_OUTPUT) {
    return errorResponse(
      "output_too_long",
      `출력 길이는 ${MAX_REWRITE_OUTPUT}자 이내여야 합니다.`,
      400
    );
  }

  const { error: rewriteError } = await insertRewrite(supabase, {
    userId: user.id,
    promptId: prompt_id ?? null,
    sourcePrompt: sourcePrompt,
    rewrittenPrompt: rewritten,
    providerCode: "openai",
    tokensIn: completion.usage?.prompt_tokens ?? null,
    tokensOut: completion.usage?.completion_tokens ?? null,
  });

  if (rewriteError) {
    logSupabaseError("rewrites.insert", rewriteError);
    return errorResponse("rewrite_failed", "리라이팅 저장에 실패했습니다.", 500);
  }

  const { error: updateError } = await updateSubscriptionRewriteUsed(
    supabase,
    subscription.rewrite_used + 1
  );

  if (updateError) {
    logSupabaseError("subscriptions.update", updateError);
    return errorResponse("quota_update_failed", "쿼터 갱신에 실패했습니다.", 500);
  }

  return NextResponse.json({ rewritten_prompt: rewritten });
}
