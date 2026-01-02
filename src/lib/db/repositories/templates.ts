import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchActiveTemplateById(
  supabase: SupabaseClient,
  templateId: string
) {
  return supabase
    .rpc("get_active_template", {
      template_id: templateId,
    })
    .single();
}

export async function fetchActiveTemplatesForPlatform(
  supabase: SupabaseClient,
  platformCode: string
) {
  return supabase.rpc("get_active_templates", {
    platform_code_input: platformCode,
  });
}
