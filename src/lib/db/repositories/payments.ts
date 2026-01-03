import type { SupabaseClient } from "@supabase/supabase-js";

type PaymentConfirmationInput = {
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

type PaymentWebhookInput = {
  orderId?: string | null;
  paymentKey?: string | null;
  statusCode: string;
  amount?: number | null;
  currency?: string | null;
  method?: string | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  rawResponse: Record<string, unknown>;
  eventType?: string | null;
  providerCode?: string;
};

type PaymentEventInput = {
  paymentId: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
  providerCode?: string;
};

type PaymentConfirmationResult = {
  payment_id: string | null;
  status_code: string | null;
};

type PaymentWebhookResult = {
  payment_id: string | null;
  payment_status: string | null;
  user_id: string | null;
};

export type UserPayment = {
  id: string;
  provider_code: string | null;
  provider_label: string | null;
  status_code: string | null;
  status_label: string | null;
  amount: number | null;
  currency: string | null;
  method: string | null;
  order_id: string | null;
  requested_at: string | null;
  approved_at: string | null;
  created_at: string | null;
};

export async function applyPaymentConfirmation(
  supabase: SupabaseClient,
  input: PaymentConfirmationInput
) {
  return supabase
    .rpc("apply_payment_confirmation", {
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
    .returns<PaymentConfirmationResult>()
    .single();
}

export async function applyPaymentWebhook(
  supabase: SupabaseClient,
  input: PaymentWebhookInput
) {
  return supabase
    .rpc("apply_payment_webhook", {
      order_id_input: input.orderId ?? null,
      payment_key_input: input.paymentKey ?? null,
      status_code_input: input.statusCode,
      amount_input: input.amount ?? null,
      currency_input: input.currency ?? null,
      method_input: input.method ?? null,
      requested_at_input: input.requestedAt ?? null,
      approved_at_input: input.approvedAt ?? null,
      raw_response_input: input.rawResponse,
      event_type_input: input.eventType ?? null,
      provider_code_input: input.providerCode ?? "toss",
    })
    .returns<PaymentWebhookResult>()
    .single();
}

export async function createPaymentEvent(
  supabase: SupabaseClient,
  input: PaymentEventInput
) {
  return supabase.rpc("create_payment_event", {
    payment_id_input: input.paymentId,
    event_type_input: input.eventType,
    event_payload_input: input.eventPayload,
    provider_code_input: input.providerCode ?? "toss",
  });
}

export async function fetchUserPayments(supabase: SupabaseClient) {
  return supabase.rpc("get_user_payments").returns<UserPayment[]>();
}
