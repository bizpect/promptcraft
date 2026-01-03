"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type BillingCallbackProps = {
  authKey?: string;
  customerKey?: string;
  planCode?: string;
  result?: string;
  orderId?: string;
};

function normalizePlanCode(value: string | null | undefined) {
  if (value === "pro" || value === "max") {
    return value;
  }

  return null;
}

export function BillingCallback({
  authKey,
  customerKey,
  planCode,
  result,
  orderId,
}: BillingCallbackProps) {
  const [status, setStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const resolvedParams = useMemo(() => {
    if (authKey || customerKey || result || planCode || orderId) {
      return {
        authKey,
        customerKey,
        result,
        planCode,
        orderId,
      };
    }

    return {
      authKey: searchParams.get("authKey") ?? searchParams.get("auth_key"),
      customerKey:
        searchParams.get("customerKey") ?? searchParams.get("customer_key"),
      result: searchParams.get("result"),
      planCode: searchParams.get("plan"),
      orderId: searchParams.get("orderId"),
    };
  }, [authKey, customerKey, orderId, planCode, result, searchParams]);

  useEffect(() => {
    if (!resolvedParams.authKey || !resolvedParams.customerKey) {
      if (resolvedParams.result === "fail") {
        setStatus("결제가 취소되었거나 실패했습니다.");
      }
      return;
    }

    const normalizedPlanCode = normalizePlanCode(resolvedParams.planCode);

    if (!normalizedPlanCode) {
      setStatus("플랜 정보가 없어 결제를 진행할 수 없습니다.");
      return;
    }

    const sendIssue = async () => {
      setStatus("빌링키를 발급하고 결제를 확인하는 중...");

      const response = await fetch("/api/payments/toss/billing/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key: resolvedParams.authKey,
          customer_key: resolvedParams.customerKey,
          plan_code: normalizedPlanCode,
          order_id: resolvedParams.orderId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.message || "결제 승인에 실패했습니다.");
        return;
      }

      setStatus("결제가 완료되었습니다. 구독이 활성화되었습니다.");
    };

    void sendIssue();
  }, [resolvedParams]);

  if (!status) {
    return null;
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/70">
      {status}
    </div>
  );
}
