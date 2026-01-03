import type { SupabaseClient } from "@supabase/supabase-js";

type ActiveTemplate = {
  id: string;
  platform_code: string;
  base_prompt: string;
  title: string;
};

type ActiveTemplateListItem = {
  id: string;
  platform_code: string;
  title: string;
  description: string | null;
};

export async function fetchActiveTemplateById(
  supabase: SupabaseClient,
  templateId: string
) {
  return supabase
    .rpc("get_active_template", {
      template_id: templateId,
    })
    .returns<ActiveTemplate[]>()
    .single();
}

export async function fetchActiveTemplatesForPlatform(
  supabase: SupabaseClient,
  platformCode: string
) {
  return supabase.rpc("get_active_templates", {
    platform_code_input: platformCode,
  }).returns<ActiveTemplateListItem[]>();
}
