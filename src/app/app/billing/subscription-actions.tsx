"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type SubscriptionActionsProps = {
  currentStatusCode: string | null;
  cancelAt: string | null;
};

export function SubscriptionActions({
  currentStatusCode,
  cancelAt,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const formatDate = (value: string | null) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString("ko-KR");
  };

  const handleCancel = async () => {
    setMessage(null);
    const confirmCancel = window.confirm(
      "정말로 구독을 해지하시겠습니까? 만료일까지는 계속 이용할 수 있습니다."
    );

    if (!confirmCancel) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payments/toss/billing/cancel", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "구독 해지에 실패했습니다.");
      }

      setMessage("구독 해지가 완료되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      setMessage("구독 해지에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatusCode !== "active") {
    return null;
  }

  const resolvedCancelAt = formatDate(cancelAt);

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      {resolvedCancelAt ? (
        <div className="text-xs text-black/60">
          해지 예약됨 · 만료일 {resolvedCancelAt}
        </div>
      ) : (
        <Button variant="ghost" onClick={handleCancel} disabled={loading}>
          {loading ? "해지 처리 중..." : "구독 해지"}
        </Button>
      )}
      {message && <p className="text-xs text-black/50">{message}</p>}
    </div>
  );
}
