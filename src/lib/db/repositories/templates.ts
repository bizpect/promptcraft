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
