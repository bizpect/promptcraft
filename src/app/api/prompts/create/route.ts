import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import { fetchActiveTemplateById, insertPrompt } from "@/lib/db";
import { createServerSupabase } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import { formatForPlatform, renderBasePrompt } from "@/lib/templates/render";

const schema = z.object({
  template_id: z.string().min(1),
  input_json: z.record(z.string()),
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

  const { template_id, input_json } = parsed.data;

  const { data: template, error: templateError } =
    await fetchActiveTemplateById(supabase, template_id);

  if (templateError || !template) {
    logSupabaseError("templates.select", templateError);
    return errorResponse("template_not_found", "템플릿을 찾을 수 없습니다.", 404);
  }

  const rendered = renderBasePrompt(template.base_prompt, input_json);
  const outputPrompt = formatForPlatform(
    template.platform_code,
    rendered,
    input_json
  );

  const titleSeed = input_json.scene || template.title || "Untitled";
  const title = titleSeed.slice(0, 40);

  const { data: createdPrompt, error: insertError } = await insertPrompt(
    supabase,
    {
      templateId: template.id,
      platformCode: template.platform_code,
      title,
      inputJson: input_json,
      outputPrompt,
    }
  );

  if (insertError || !createdPrompt) {
    logSupabaseError("prompts.insert", insertError);
    return errorResponse("insert_failed", "저장에 실패했습니다.", 500);
  }

  return NextResponse.json(createdPrompt);
}
