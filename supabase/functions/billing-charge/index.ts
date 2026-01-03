import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

type TossChargeResponse = {
  paymentKey?: string;
  status?: string;
  totalAmount?: number;
  method?: string;
  requestedAt?: string;
  approvedAt?: string;
  currency?: string;
};

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function chargeBillingKey(input: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const secretKey = getEnv("TOSS_SECRET_KEY");
  const apiBaseUrl = Deno.env.get("TOSS_API_BASE_URL") ??
    "https://api.tosspayments.com/v1";
  const auth = btoa(`${secretKey}:`);

  const response = await fetch(`${apiBaseUrl}/billing/${input.billingKey}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey: input.customerKey,
      amount: input.amount,
      orderId: input.orderId,
      orderName: input.orderName,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw Object.assign(new Error("billing charge failed"), { payload: data });
  }

  return data as TossChargeResponse & Record<string, unknown>;
}

Deno.serve(async () => {
  const supabaseUrl = getEnv("SB_URL");
  const serviceRoleKey = getEnv("SB_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await supabase.rpc("finalize_subscription_cancellations");

  const cutoff = new Date().toISOString();
  const { data: dueSubscriptions, error } = await supabase
    .rpc("get_due_subscriptions_for_billing", {
      cutoff,
    })
    .returns<DueSubscription[]>();

  if (error) {
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown>[] = [];

  const dueList = Array.isArray(dueSubscriptions) ? dueSubscriptions : [];

  for (const subscription of dueList) {
    const orderId = `sub_${subscription.plan_code}_${crypto.randomUUID()}`;
    const orderName = `PromptCraft ${subscription.plan_code.toUpperCase()}`;

    try {
      const charged = await chargeBillingKey({
        billingKey: subscription.billing_key,
        customerKey: subscription.customer_key,
        amount: subscription.price,
        orderId,
        orderName,
      });

      const { error: applyError } = await supabase
        .rpc("apply_billing_charge_success", {
          user_id_input: subscription.user_id,
          order_id_input: orderId,
          payment_key_input:
            typeof charged.paymentKey === "string" ? charged.paymentKey : "",
          amount_input: subscription.price,
          currency_input:
            typeof charged.currency === "string"
              ? charged.currency
              : subscription.currency,
          method_input:
            typeof charged.method === "string" ? charged.method : null,
          requested_at_input:
            typeof charged.requestedAt === "string"
              ? charged.requestedAt
              : null,
          approved_at_input:
            typeof charged.approvedAt === "string"
              ? charged.approvedAt
              : null,
          raw_response_input: charged,
          plan_code_input: subscription.plan_code,
          provider_code_input: "toss",
        })
        .single();

      if (applyError) {
        results.push({
          user_id: subscription.user_id,
          status: "apply_failed",
          error: applyError,
        });
        continue;
      }

      results.push({
        user_id: subscription.user_id,
        status: "paid",
        order_id: orderId,
      });
    } catch (error) {
      const payload =
        error instanceof Error
          ? (error as Error & { payload?: Record<string, unknown> }).payload
          : null;

      const { error: failError } = await supabase
        .rpc("apply_billing_charge_failure", {
          user_id_input: subscription.user_id,
          order_id_input: orderId,
          payment_key_input: null,
          amount_input: subscription.price,
          currency_input: subscription.currency,
          raw_response_input: payload ?? {},
          plan_code_input: subscription.plan_code,
          provider_code_input: "toss",
        })
        .single();

      results.push({
        user_id: subscription.user_id,
        status: "failed",
        order_id: orderId,
        error: failError ?? payload ?? String(error),
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
