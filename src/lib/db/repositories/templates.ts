import type { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

import type { RpcArrayResult } from "@/lib/db/repositories/types";
type ActiveTemplate = {
  id: string;
  platform_code: "sora" | "veo";
  base_prompt: string;
  title: string;
};

type ActiveTemplateListItem = {
  id: string;
  platform_code: "sora" | "veo";
  base_prompt: string;
  title: string;
  description: string | null;
};

export async function fetchActiveTemplateById(
  supabase: SupabaseClient,
  templateId: string
): Promise<PostgrestSingleResponse<ActiveTemplate>> {
  return supabase
    .rpc("get_active_template", {
      template_id: templateId,
    })
    .returns<ActiveTemplate>()
    .single();
}

export async function fetchActiveTemplatesForPlatform(
  supabase: SupabaseClient,
  platformCode: string
): Promise<PostgrestSingleResponse<RpcArrayResult<ActiveTemplateListItem>>> {
  return supabase.rpc("get_active_templates", {
    platform_code_input: platformCode,
  }).returns<ActiveTemplateListItem[]>();
}
