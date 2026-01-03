import type {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

import type { RpcArrayResult } from "@/lib/db/repositories/types";

type BillingProfileInput = {
  providerCode: string;
  statusCode: string;
  customerKey: string;
  billingKey: string;
  cardSummary?: string | null;
  rawResponse: Record<string, unknown>;
};

type BillingChargeSuccessInput = {
  userId: string;
  orderId: string;
  paymentKey: string;
  amount: number;
  currency?: string | null;
  method?: string | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  rawResponse: Record<string, unknown>;
  planCode: string;
  providerCode?: string;
};

type BillingChargeFailureInput = {
  userId: string;
  orderId: string;
  paymentKey?: string | null;
  amount: number;
  currency?: string | null;
  rawResponse: Record<string, unknown>;
  planCode: string;
  providerCode?: string;
};

type BillingProfile = {
  user_id: string;
  provider_code: string;
  status_code: string;
  customer_key: string;
  billing_key: string;
  card_summary: string | null;
  updated_at: string;
};

type PlanDetail = {
  plan_code: string;
  plan_label: string | null;
  price: number;
  currency: string;
  rewrite_limit: number;
};

type DueSubscription = {
  user_id: string;
  plan_code: string;
  price: number;
  currency: string;
  rewrite_limit: number;
  current_period_end: string;
  billing_key: string;
  customer_key: string;
};

type PaymentResult = {
  payment_id: string | null;
  status_code: string | null;
};

type BillingRevokeResult = {
  user_id: string | null;
  status_code: string | null;
};

export async function fetchBillingProfile(supabase: SupabaseClient) {
  return supabase.rpc("get_billing_profile").returns<BillingProfile>().maybeSingle();
}

export async function upsertBillingProfile(
  supabase: SupabaseClient,
  input: BillingProfileInput
) {
  return supabase
    .rpc("upsert_billing_profile", {
      provider_code_input: input.providerCode,
      status_code_input: input.statusCode,
      customer_key_input: input.customerKey,
      billing_key_input: input.billingKey,
      card_summary_input: input.cardSummary ?? null,
      raw_response_input: input.rawResponse,
    })
    .returns<BillingProfile>()
    .single();
}

export async function fetchSubscriptionPlanDetail(
  supabase: SupabaseClient,
  planCode: string
) {
  return supabase
    .rpc("get_subscription_plan_detail", {
      plan_code_input: planCode,
    })
    .returns<PlanDetail>()
    .single();
}

export async function fetchDueSubscriptionsForBilling(
  supabase: SupabaseClient,
  cutoff: string
): Promise<PostgrestSingleResponse<RpcArrayResult<DueSubscription>>> {
  return supabase.rpc("get_due_subscriptions_for_billing", {
    cutoff,
  }).returns<DueSubscription[]>();
}

export async function applyBillingChargeSuccess(
  supabase: SupabaseClient,
  input: BillingChargeSuccessInput
) {
  return supabase
    .rpc("apply_billing_charge_success", {
      user_id_input: input.userId,
      order_id_input: input.orderId,
      payment_key_input: input.paymentKey,
      amount_input: input.amount,
      currency_input: input.currency ?? null,
      method_input: input.method ?? null,
      requested_at_input: input.requestedAt ?? null,
      approved_at_input: input.approvedAt ?? null,
      raw_response_input: input.rawResponse,
      plan_code_input: input.planCode,
      provider_code_input: input.providerCode ?? "toss",
    })
    .returns<PaymentResult>()
    .single();
}

export async function applyBillingChargeFailure(
  supabase: SupabaseClient,
  input: BillingChargeFailureInput
) {
  return supabase
    .rpc("apply_billing_charge_failure", {
      user_id_input: input.userId,
      order_id_input: input.orderId,
      payment_key_input: input.paymentKey ?? null,
      amount_input: input.amount,
      currency_input: input.currency ?? null,
      raw_response_input: input.rawResponse,
      plan_code_input: input.planCode,
      provider_code_input: input.providerCode ?? "toss",
    })
    .returns<PaymentResult>()
    .single();
}

export async function applyBillingKeyRevoked(
  supabase: SupabaseClient,
  input: { customerKey?: string | null; billingKey?: string | null }
) {
  return supabase
    .rpc("apply_billing_key_revoked", {
      customer_key_input: input.customerKey ?? null,
      billing_key_input: input.billingKey ?? null,
    })
    .returns<BillingRevokeResult>()
    .single();
}
