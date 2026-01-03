"use client";

import { useState } from "react";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";
import { recordPaymentAttempt } from "@/lib/db";
import { createBrowserSupabase } from "@/lib/supabase/client";

type PlanCode = "pro" | "max";

const scriptSrc = "https://js.tosspayments.com/v1/payment";

type PrepareResponse = {
  client_key: string;
  customer_key: string;
  success_url: string;
  fail_url: string;
  order_id: string;
  order_name: string;
  amount: number;
};

type PaymentMethodActionsProps = {
  currentPlanCode?: string | null;
  currentStatusCode?: string | null;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestBillingAuth: (
        method: "카드" | "CARD",
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          customerKey: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}

function normalizePlanCode(value: string | null | undefined): PlanCode | null {
  if (value === "pro" || value === "max") {
    return value;
  }

  return null;
}

export function PaymentMethodActions({
  currentPlanCode,
  currentStatusCode,
}: PaymentMethodActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedPlanCode = normalizePlanCode(currentPlanCode);
  const isActive = currentStatusCode === "active";

  const recordAttempt = async (
    planCode: PlanCode,
    reasonCode: "user_cancel" | "validation_fail" | "client_error"
  ) => {
    try {
      const supabase = createBrowserSupabase();
      await recordPaymentAttempt(supabase, {
        planCode,
        reasonCode,
        providerCode: "toss",
        metadata: { source: "billing_update" },
      });
    } catch (error) {
      console.warn("Failed to record payment attempt:", error);
    }
  };

  const resolveReasonCode = (error: unknown) => {
    const code = (error as { code?: string } | null)?.code;

    if (code === "USER_CANCEL") {
      return "user_cancel" as const;
    }

    if (code && code.toLowerCase().includes("invalid")) {
      return "validation_fail" as const;
    }

    return "client_error" as const;
  };

  const startUpdate = async () => {
    if (!normalizedPlanCode) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/payments/toss/billing/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_code: normalizedPlanCode, mode: "update" }),
      });
      const data = (await response.json()) as PrepareResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "결제수단 변경 준비 실패");
      }

      if (!window.TossPayments) {
        throw new Error("토스 결제 스크립트를 불러오지 못했습니다.");
      }

      const tossPayments = window.TossPayments(data.client_key);

      await tossPayments.requestBillingAuth("카드", {
        amount: data.amount,
        orderId: data.order_id,
        orderName: data.order_name,
        customerKey: data.customer_key,
        successUrl: data.success_url,
        failUrl: data.fail_url,
      });
    } catch (err) {
      await recordAttempt(normalizedPlanCode, resolveReasonCode(err));
      setError(err instanceof Error ? err.message : "결제수단 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!isActive || !normalizedPlanCode) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <Script src={scriptSrc} strategy="afterInteractive" />
      <p className="font-medium text-white">결제수단 변경</p>
      <p className="mt-1 text-xs text-white/60">
        다음 결제부터 새 카드로 결제됩니다.
      </p>
      <Button className="mt-3" onClick={startUpdate} disabled={loading}>
        {loading && <LoadingSpinner size={16} />}
        결제수단 변경
      </Button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      <LoadingOverlay show={loading} />
    </div>
  );
}
