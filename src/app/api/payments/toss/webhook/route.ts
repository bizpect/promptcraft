import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/response";
import { applyBillingKeyRevoked, applyPaymentWebhook } from "@/lib/db";
import { fetchTossPaymentByKey } from "@/lib/payments/toss";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServiceSupabase } from "@/lib/supabase/server";

function normalizeStatus(
  status: string | null | undefined,
  eventType: string | null | undefined
) {
  const candidates = [
    status?.toUpperCase(),
    eventType?.toUpperCase(),
  ].filter(Boolean) as string[];

  if (candidates.some((value) => value.includes("CANCEL"))) {
    return "canceled";
  }

  if (candidates.some((value) => value.includes("FAIL"))) {
    return "failed";
  }

  if (
    candidates.some((value) =>
      ["DONE", "PAID", "APPROVED", "COMPLETED", "SUCCESS"].some((key) =>
        value.includes(key)
      )
    )
  ) {
    return "paid";
  }

  return "pending";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  console.warn("[payments] webhook signature not supported; verifying by API");

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return errorResponse("invalid_payload", "요청 본문이 올바르지 않습니다.", 400);
  }
  const eventType =
    typeof payload.eventType === "string"
      ? payload.eventType
      : typeof payload.type === "string"
        ? payload.type
        : null;
  const data =
    (payload.data as Record<string, unknown> | undefined) ??
    (payload.payment as Record<string, unknown> | undefined) ??
    payload;

  const orderId =
    typeof data.orderId === "string" ? data.orderId : null;
  const paymentKey =
    typeof data.paymentKey === "string" ? data.paymentKey : null;

  if (eventType?.toUpperCase() === "BILLING_DELETED") {
    const customerKey =
      typeof data.customerKey === "string" ? data.customerKey : null;
    const billingKey =
      typeof data.billingKey === "string" ? data.billingKey : null;

    if (!customerKey && !billingKey) {
      return errorResponse(
        "missing_billing_key",
        "billingKey 또는 customerKey가 필요합니다.",
        400
      );
    }

    const supabase = createServiceSupabase();
    const { error: revokeError } = await applyBillingKeyRevoked(supabase, {
      customerKey,
      billingKey,
    });

    if (revokeError) {
      logSupabaseError("billing.apply_billing_key_revoked", revokeError);
      return errorResponse(
        "billing_revoke_failed",
        "빌링키 해지 처리 실패",
        500
      );
    }

    return NextResponse.json({ ok: true });
  }
  let status = typeof data.status === "string" ? data.status : null;
  let amount =
    typeof data.totalAmount === "number"
      ? data.totalAmount
      : typeof data.amount === "number"
        ? data.amount
        : null;
  let currency = typeof data.currency === "string" ? data.currency : null;
  let method = typeof data.method === "string" ? data.method : null;
  let requestedAt =
    typeof data.requestedAt === "string" ? data.requestedAt : null;
  let approvedAt =
    typeof data.approvedAt === "string" ? data.approvedAt : null;

  if (!paymentKey) {
    return errorResponse(
      "missing_payment_key",
      "paymentKey가 없어 검증할 수 없습니다.",
      400
    );
  }

  try {
    const verified = await fetchTossPaymentByKey(paymentKey);
    status = typeof verified.status === "string" ? verified.status : status;
    amount =
      typeof verified.totalAmount === "number"
        ? verified.totalAmount
        : amount;
    currency =
      typeof verified.currency === "string" ? verified.currency : currency;
    method = typeof verified.method === "string" ? verified.method : method;
    requestedAt =
      typeof verified.requestedAt === "string"
        ? verified.requestedAt
        : requestedAt;
    approvedAt =
      typeof verified.approvedAt === "string"
        ? verified.approvedAt
        : approvedAt;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "결제 조회에 실패했습니다.";
    return errorResponse("payment_fetch_failed", message, 502);
  }

  const normalizedStatus = normalizeStatus(status, eventType);

  const supabase = createServiceSupabase();
  const { error } = await applyPaymentWebhook(supabase, {
    orderId,
    paymentKey,
    statusCode: normalizedStatus,
    amount,
    currency,
    method,
    requestedAt,
    approvedAt,
    rawResponse: payload,
    eventType,
  });

  if (error) {
    logSupabaseError("payments.apply_webhook", error);
    return errorResponse(
      "webhook_apply_failed",
      "웹훅 처리 실패",
      500
    );
  }

  return NextResponse.json({ ok: true });
}
