import type {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

type InsertPromptInput = {
  templateId: string;
  platformCode: string;
  title: string;
  inputJson: Record<string, string>;
  outputPrompt: string;
};

type PromptOutput = {
  output_prompt: string;
};

type PromptInsertResult = {
  id: string;
  output_prompt: string;
};

type PromptListItem = {
  id: string;
  title: string;
  platform_code: "sora" | "veo";
  output_prompt: string;
  created_at: string;
};

type PromptDetail = {
  id: string;
  title: string;
  template_id: string | null;
  platform_code: "sora" | "veo";
  input_json: Record<string, unknown>;
  output_prompt: string;
  created_at: string;
};

type PromptTitleResult = {
  id: string;
  title: string;
};

export async function fetchPromptOutputForUser(
  supabase: SupabaseClient,
  promptId: string
): Promise<PostgrestSingleResponse<PromptOutput>> {
  return supabase
    .rpc("get_prompt_output", {
      prompt_id: promptId,
    })
    .returns<PromptOutput>()
    .single();
}

export async function insertPrompt(
  supabase: SupabaseClient,
  input: InsertPromptInput
): Promise<PostgrestSingleResponse<PromptInsertResult>> {
  return supabase
    .rpc("create_prompt", {
      template_id: input.templateId,
      platform_code: input.platformCode,
      title: input.title,
      input_json: input.inputJson,
      output_prompt: input.outputPrompt,
    })
    .returns<PromptInsertResult>()
    .single();
}

export async function fetchUserPrompts(
  supabase: SupabaseClient
): Promise<PostgrestResponse<PromptListItem>> {
  return supabase.rpc("get_user_prompts").returns<PromptListItem>();
}

export async function fetchPromptDetailForUser(
  supabase: SupabaseClient,
  promptId: string
): Promise<PostgrestSingleResponse<PromptDetail>> {
  return supabase
    .rpc("get_prompt_detail", {
      prompt_id: promptId,
    })
    .returns<PromptDetail>()
    .single();
}

export async function deletePromptForUser(
  supabase: SupabaseClient,
  promptId: string
): Promise<PostgrestResponse<null>> {
  return supabase.rpc("delete_prompt", {
    prompt_id: promptId,
  });
}

export async function updatePromptTitleForUser(
  supabase: SupabaseClient,
  promptId: string,
  title: string
): Promise<PostgrestSingleResponse<PromptTitleResult>> {
  return supabase
    .rpc("update_prompt_title", {
      prompt_id: promptId,
      title_input: title,
    })
    .returns<PromptTitleResult>()
    .single();
}

export async function duplicatePromptForUser(
  supabase: SupabaseClient,
  promptId: string,
  title: string | null
): Promise<PostgrestSingleResponse<PromptTitleResult>> {
  return supabase
    .rpc("duplicate_prompt", {
      prompt_id: promptId,
      title_input: title,
    })
    .returns<PromptTitleResult>()
    .single();
}
