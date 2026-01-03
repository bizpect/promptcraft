import type {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export type SubscriptionCore = {
  plan_code: string;
  status_code: string;
  rewrite_used: number;
  rewrite_limit: number;
};

export type SubscriptionWithLabels = SubscriptionCore & {
  plan_label: string | null;
  status_label: string | null;
  current_period_end: string | null;
  cancel_requested_at: string | null;
  cancel_at: string | null;
};

export async function fetchSubscriptionForUser(
  supabase: SupabaseClient
): Promise<PostgrestMaybeSingleResponse<SubscriptionCore>> {
  return supabase.rpc("get_subscription").returns<SubscriptionCore>().maybeSingle();
}

export async function fetchSubscriptionWithLabels(
  supabase: SupabaseClient
): Promise<PostgrestMaybeSingleResponse<SubscriptionWithLabels>> {
  return supabase
    .rpc("get_subscription_with_labels")
    .returns<SubscriptionWithLabels>()
    .maybeSingle();
}

export async function scheduleSubscriptionCancel(supabase: SupabaseClient) {
  return supabase.rpc("schedule_subscription_cancel");
}

export async function updateSubscriptionRewriteUsed(
  supabase: SupabaseClient,
  rewriteUsed: number
): Promise<PostgrestResponse<null>> {
  return supabase.rpc("update_subscription_rewrite_used", {
    new_value: rewriteUsed,
  });
}
