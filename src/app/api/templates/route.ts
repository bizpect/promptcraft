import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import { fetchActiveTemplatesForPlatform } from "@/lib/db";
import { ensureArray } from "@/lib/db/repositories/guards";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const querySchema = z.object({
  platform: z.enum(["sora", "veo"]),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    platform: url.searchParams.get("platform"),
  });

  if (!parsed.success) {
    return errorResponse("invalid_platform", "플랫폼 값이 올바르지 않습니다.", 400);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await fetchActiveTemplatesForPlatform(
    supabase,
    parsed.data.platform
  );

  if (error) {
    logSupabaseError("templates.get_active_templates", error);
    return errorResponse("template_fetch_failed", "템플릿 조회 실패", 500);
  }

  return NextResponse.json({ templates: ensureArray(data) });
}
