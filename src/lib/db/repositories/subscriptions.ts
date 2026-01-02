import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchSubscriptionForUser(supabase: SupabaseClient) {
  return supabase.rpc("get_subscription").single();
}

export async function updateSubscriptionRewriteUsed(
  supabase: SupabaseClient,
  rewriteUsed: number
) {
  return supabase.rpc("update_subscription_rewrite_used", {
    new_value: rewriteUsed,
  });
}
