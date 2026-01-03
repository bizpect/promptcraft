import type { PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";

type InsertRewriteInput = {
  userId: string;
  promptId?: string | null;
  rewrittenPrompt: string;
  sourcePrompt?: string | null;
  providerCode: string;
  tokensIn?: number | null;
  tokensOut?: number | null;
};

type RewriteListItem = {
  id: string;
  rewritten_prompt: string;
  source_prompt: string | null;
  provider_code: string;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
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
): Promise<PostgrestResponse<RewriteListItem>> {
  return supabase.rpc("get_rewrites_for_prompt", {
    prompt_id: promptId,
  }).returns<RewriteListItem>();
}
