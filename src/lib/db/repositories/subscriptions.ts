import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchSubscriptionForUser(supabase: SupabaseClient) {
  return supabase.rpc("get_subscription").maybeSingle();
}

export async function fetchSubscriptionWithLabels(supabase: SupabaseClient) {
  return supabase.rpc("get_subscription_with_labels").maybeSingle();
}

export async function updateSubscriptionRewriteUsed(
  supabase: SupabaseClient,
  rewriteUsed: number
) {
  return supabase.rpc("update_subscription_rewrite_used", {
    new_value: rewriteUsed,
  });
}
