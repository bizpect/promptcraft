"use client";

import { useState } from "react";
import Script from "next/script";

import { Button } from "@/components/ui/button";

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

export function BillingActions() {
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "결제 요청 실패");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      <Script src={scriptSrc} strategy="afterInteractive" />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">Pro</p>
          <p className="mt-1 text-black/60">리라이팅 20회/월</p>
          <p className="mt-2 text-lg font-semibold">
            {formatPrice(4900, "KRW")} / 월
          </p>
          <Button
            className="mt-3"
            onClick={() => startBilling("pro")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "pro"
              ? "결제 진행 중..."
              : `${billingLabel}로 Pro 시작`}
          </Button>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">Max</p>
          <p className="mt-1 text-black/60">리라이팅 100회/월</p>
          <p className="mt-2 text-lg font-semibold">
            {formatPrice(9900, "KRW")} / 월
          </p>
          <Button
            className="mt-3"
            onClick={() => startBilling("max")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "max"
              ? "결제 진행 중..."
              : `${billingLabel}로 Max 시작`}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
