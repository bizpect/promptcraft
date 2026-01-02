import type { SupabaseClient } from "@supabase/supabase-js";

type InsertRewriteInput = {
  userId: string;
  promptId?: string | null;
  rewrittenPrompt: string;
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
    provider_code: input.providerCode,
    tokens_in: input.tokensIn ?? null,
    tokens_out: input.tokensOut ?? null,
  });
}
