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

export async function fetchUserPrompts(supabase: SupabaseClient) {
  return supabase.rpc("get_user_prompts");
}

export async function fetchPromptDetailForUser(
  supabase: SupabaseClient,
  promptId: string
) {
  return supabase
    .rpc("get_prompt_detail", {
      prompt_id: promptId,
    })
    .single();
}

export async function deletePromptForUser(
  supabase: SupabaseClient,
  promptId: string
) {
  return supabase.rpc("delete_prompt", {
    prompt_id: promptId,
  });
}

export async function updatePromptTitleForUser(
  supabase: SupabaseClient,
  promptId: string,
  title: string
) {
  return supabase
    .rpc("update_prompt_title", {
      prompt_id: promptId,
      title_input: title,
    })
    .single();
}

export async function duplicatePromptForUser(
  supabase: SupabaseClient,
  promptId: string,
  title: string | null
) {
  return supabase
    .rpc("duplicate_prompt", {
      prompt_id: promptId,
      title_input: title,
    })
    .single();
}
