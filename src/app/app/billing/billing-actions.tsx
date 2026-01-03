"use client";

import { useState } from "react";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";
import { recordPaymentAttempt } from "@/lib/db";
import { createBrowserSupabase } from "@/lib/supabase/client";

type PlanCode = "pro" | "max";

const scriptSrc = "https://js.tosspayments.com/v1/payment";
const billingLabel = "카드";

type PlanDetail = {
  plan_code: PlanCode;
  plan_label: string | null;
  price: number;
  currency: string;
  rewrite_limit: number;
};

type PrepareResponse = {
  client_key: string;
  customer_key: string;
  success_url: string;
  fail_url: string;
  order_id: string;
  order_name: string;
  amount: number;
  plan: PlanDetail;
};

type BillingActionsProps = {
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

function formatPrice(price: number, currency: string) {
  if (currency === "KRW") {
    return `${price.toLocaleString("ko-KR")}원`;
  }

  return `${price.toLocaleString("ko-KR")} ${currency}`;
}

function normalizePlanCode(value: string | null | undefined): PlanCode | null {
  if (value === "pro" || value === "max") {
    return value;
  }

  return null;
}

export function BillingActions({
  currentPlanCode,
  currentStatusCode,
}: BillingActionsProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizedPlan = normalizePlanCode(currentPlanCode);
  const isActive = currentStatusCode === "active";
  const isMaxActive = isActive && normalizedPlan === "max";
  const isProActive = isActive && normalizedPlan === "pro";

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
        metadata: { source: "billing_auth" },
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

  const startBilling = async (planCode: PlanCode) => {
    setError(null);
    setLoadingPlan(planCode);

    try {
      const response = await fetch("/api/payments/toss/billing/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_code: planCode }),
      });
      const data = (await response.json()) as PrepareResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "결제 준비 실패");
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
      await recordAttempt(planCode, resolveReasonCode(err));
      setError(err instanceof Error ? err.message : "결제 요청 실패");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      <Script src={scriptSrc} strategy="afterInteractive" />

      {isMaxActive ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Max 플랜을 이용 중입니다.</p>
          <p className="mt-1 text-emerald-900/70">
            현재 플랜이 최고 등급이라 추가 결제 옵션이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Pro</p>
              {isProActive && (
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/70">
                  현재 이용 중
                </span>
              )}
            </div>
            <p className="mt-1 text-black/60">리라이팅 20회/월</p>
            <p className="mt-2 text-lg font-semibold">
              {formatPrice(4900, "KRW")} / 월
            </p>
            <Button
              className="mt-3"
              onClick={() => startBilling("pro")}
              disabled={loadingPlan !== null || isProActive}
            >
              {loadingPlan === "pro" && <LoadingSpinner size={16} />}
              {isProActive ? "이용 중" : `${billingLabel}로 Pro 시작`}
            </Button>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Max</p>
              {isActive && (
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/70">
                  업그레이드
                </span>
              )}
            </div>
            <p className="mt-1 text-black/60">리라이팅 100회/월</p>
            <p className="mt-2 text-lg font-semibold">
              {formatPrice(9900, "KRW")} / 월
            </p>
            <Button
              className="mt-3"
              onClick={() => startBilling("max")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "max" && <LoadingSpinner size={16} />}
              {isProActive
                ? `${billingLabel}로 Max 업그레이드`
                : `${billingLabel}로 Max 시작`}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <LoadingOverlay show={loadingPlan !== null} />
    </div>
  );
}
