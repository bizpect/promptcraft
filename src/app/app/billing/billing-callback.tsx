"use client";

import { useEffect, useState } from "react";

type BillingCallbackProps = {
  authKey?: string;
  customerKey?: string;
  planCode?: string;
  result?: string;
  orderId?: string;
};

export function BillingCallback({
  authKey,
  customerKey,
  planCode,
  result,
  orderId,
}: BillingCallbackProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!authKey || !customerKey) {
      if (result === "fail") {
        setStatus("결제가 취소되었거나 실패했습니다.");
      }
      return;
    }

    const sendIssue = async () => {
      setStatus("빌링키를 발급하고 결제를 확인하는 중...");

      const response = await fetch("/api/payments/toss/billing/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key: authKey,
          customer_key: customerKey,
          plan_code: planCode ?? "pro",
          order_id: orderId,
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
  }, [authKey, customerKey, planCode, result]);

  if (!status) {
    return null;
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/70">
      {status}
    </div>
  );
}
