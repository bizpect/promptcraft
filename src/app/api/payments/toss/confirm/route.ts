import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api/response";
import {
  applyPaymentConfirmation,
  createPaymentEvent,
} from "@/lib/db";
import { confirmTossPayment } from "@/lib/payments/toss";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  payment_key: z.string().min(1),
  order_id: z.string().min(1),
  amount: z.number().int().positive(),
  plan_code: z.string().min(1),
});

function isPaidStatus(status: string | undefined) {
  if (!status) {
    return false;
  }

  return ["DONE", "PAID", "APPROVED", "COMPLETED"].includes(
    status.toUpperCase()
  );
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("unauthorized", "로그인이 필요합니다.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("invalid_input", "입력값이 올바르지 않습니다.", 400);
  }

  const { payment_key, order_id, amount, plan_code } = parsed.data;

  let confirmation: Record<string, unknown>;

  try {
    confirmation = await confirmTossPayment({
      paymentKey: payment_key,
      orderId: order_id,
      amount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "결제 승인에 실패했습니다.";
    return errorResponse("toss_confirm_failed", message, 502);
  }

  const responseOrderId =
    typeof confirmation.orderId === "string" ? confirmation.orderId : null;
  const responsePaymentKey =
    typeof confirmation.paymentKey === "string" ? confirmation.paymentKey : null;
  const responseAmount =
    typeof confirmation.totalAmount === "number"
      ? confirmation.totalAmount
      : null;
  const responseStatus =
    typeof confirmation.status === "string" ? confirmation.status : null;

  if (responseOrderId && responseOrderId !== order_id) {
    return errorResponse("order_mismatch", "주문 정보가 일치하지 않습니다.", 400);
  }

  if (responsePaymentKey && responsePaymentKey !== payment_key) {
    return errorResponse("payment_mismatch", "결제 정보가 일치하지 않습니다.", 400);
  }

  if (responseAmount !== null && responseAmount !== amount) {
    return errorResponse("amount_mismatch", "결제 금액이 일치하지 않습니다.", 400);
  }

  if (responseStatus && !isPaidStatus(responseStatus)) {
    return errorResponse(
      "payment_not_approved",
      "결제 상태가 승인되지 않았습니다.",
      400
    );
  }

  const { data: appliedPayment, error } = await applyPaymentConfirmation(
    supabase,
    {
      orderId: order_id,
      paymentKey: payment_key,
      amount,
      currency:
        typeof confirmation.currency === "string" ? confirmation.currency : null,
      method: typeof confirmation.method === "string" ? confirmation.method : null,
      requestedAt:
        typeof confirmation.requestedAt === "string"
          ? confirmation.requestedAt
          : null,
      approvedAt:
        typeof confirmation.approvedAt === "string"
          ? confirmation.approvedAt
          : null,
      rawResponse: confirmation,
      planCode: plan_code,
    }
  );

  if (error || !appliedPayment) {
    logSupabaseError("payments.apply_confirmation", error);
    return errorResponse(
      "payment_apply_failed",
      "결제 반영에 실패했습니다.",
      500
    );
  }

  const paymentId =
    typeof appliedPayment.payment_id === "string"
      ? appliedPayment.payment_id
      : null;

  if (paymentId) {
    const { error: eventError } = await createPaymentEvent(supabase, {
      paymentId,
      eventType: "confirm",
      eventPayload: confirmation,
    });

    if (eventError) {
      logSupabaseError("payments.create_event", eventError);
    }
  }

  return NextResponse.json({
    ok: true,
    payment_id: paymentId,
    status: appliedPayment.status_code ?? "paid",
  });
}
