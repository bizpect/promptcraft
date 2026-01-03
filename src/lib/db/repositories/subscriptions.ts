import type { SupabaseClient } from "@supabase/supabase-js";

type SubscriptionCore = {
  plan_code: string;
  status_code: string;
  rewrite_used: number;
  rewrite_limit: number;
};

type SubscriptionWithLabels = SubscriptionCore & {
  plan_label: string | null;
  status_label: string | null;
};

export async function fetchSubscriptionForUser(supabase: SupabaseClient) {
  return supabase.rpc("get_subscription").returns<SubscriptionCore>().maybeSingle();
}

export async function fetchSubscriptionWithLabels(supabase: SupabaseClient) {
  return supabase
    .rpc("get_subscription_with_labels")
    .returns<SubscriptionWithLabels>()
    .maybeSingle();
}

export async function updateSubscriptionRewriteUsed(
  supabase: SupabaseClient,
  rewriteUsed: number
) {
  return supabase.rpc("update_subscription_rewrite_used", {
    new_value: rewriteUsed,
  });
}
