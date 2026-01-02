import type { SupabaseClient } from "@supabase/supabase-js";

type InsertRewriteInput = {
  userId: string;
  promptId?: string | null;
  rewrittenPrompt: string;
  sourcePrompt?: string | null;
  providerCode: string;
  tokensIn?: number | null;
  tokensOut?: number | null;
};

export async function insertRewrite(
  supabase: SupabaseClient,
  input: InsertRewriteInput
) {
  void input.userId;
  return supabase.rpc("create_rewrite", {
    prompt_id: input.promptId ?? null,
    rewritten_prompt: input.rewrittenPrompt,
    source_prompt: input.sourcePrompt ?? null,
    provider_code: input.providerCode,
    tokens_in: input.tokensIn ?? null,
    tokens_out: input.tokensOut ?? null,
  });
}

export async function fetchRewritesForPrompt(
  supabase: SupabaseClient,
  promptId: string
) {
  return supabase.rpc("get_rewrites_for_prompt", {
    prompt_id: promptId,
  });
}
