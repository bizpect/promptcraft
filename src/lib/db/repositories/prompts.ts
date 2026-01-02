import type { SupabaseClient } from "@supabase/supabase-js";

type InsertPromptInput = {
  templateId: string;
  platformCode: string;
  title: string;
  inputJson: Record<string, string>;
  outputPrompt: string;
};

export async function fetchPromptOutputForUser(
  supabase: SupabaseClient,
  promptId: string
) {
  return supabase
    .rpc("get_prompt_output", {
      prompt_id: promptId,
    })
    .single();
}

export async function insertPrompt(
  supabase: SupabaseClient,
  input: InsertPromptInput
) {
  return supabase
    .rpc("create_prompt", {
      template_id: input.templateId,
      platform_code: input.platformCode,
      title: input.title,
      input_json: input.inputJson,
      output_prompt: input.outputPrompt,
    })
    .single();
}
