"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";

type SubscriptionActionsProps = {
  currentStatusCode: string | null;
  cancelAt: string | null;
  currentPeriodEnd: string | null;
  currentPlanCode: string | null;
};

export function SubscriptionActions({
  currentStatusCode,
  cancelAt,
  currentPeriodEnd,
  currentPlanCode,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    setConfirmOpen(false);
    setLoading(true);

    try {
      const response = await fetch("/api/payments/toss/billing/cancel", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "구독 해지에 실패했습니다.");
      }

      setMessage("구독 해지가 예약되었습니다. 만료일까지 이용 가능합니다.");
      router.refresh();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      setMessage("구독 해지에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleUndoCancel = async () => {
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "해지 예약을 취소할 수 없습니다.");
      }

      setMessage("해지 예약이 취소되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("Failed to undo cancellation:", error);
      setMessage("해지 예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatusCode !== "active") {
    return null;
  }

  if (!currentPlanCode || currentPlanCode === "free") {
    return null;
  }

  const resolvedCancelAt = formatDate(cancelAt);
  const resolvedPeriodEnd = formatDate(currentPeriodEnd) ?? "알 수 없음";

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      {resolvedCancelAt ? (
        <>
          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200">
            해지 예약됨
          </span>
          <div className="text-xs text-white/60">
            만료일 {resolvedCancelAt}까지 이용 가능
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoCancel}
            disabled={loading}
          >
            {loading && <LoadingSpinner size={14} />}
            해지 예약 취소
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
        >
          {loading && <LoadingSpinner size={14} />}
          구독 해지 예약
        </Button>
      )}
      {message && <p className="text-xs text-white/50">{message}</p>}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-subscription-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmOpen(false);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--surface)] p-5 text-left shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <h2
              id="cancel-subscription-title"
              className="text-base font-semibold text-white"
            >
              구독 해지를 예약할까요?
            </h2>
            <p className="mt-2 text-sm text-white/70">
              해지는 다음 결제일부터 반영됩니다. 만료일까지는 모든 기능을 그대로
              이용할 수 있어요.
            </p>
            <p className="mt-2 text-xs text-white/60">
              만료일 {resolvedPeriodEnd}
            </p>
            {resolvedCancelAt && (
              <p className="mt-2 text-xs text-white/60">
                만료일 {resolvedCancelAt}
              </p>
            )}
            <p className="mt-2 text-xs text-white/50">
              해지 후 자동결제는 중단되며, 언제든 다시 구독할 수 있습니다.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                닫기
              </Button>
              <Button size="sm" onClick={handleCancel} disabled={loading}>
                {loading && <LoadingSpinner size={14} />}
                해지 예약
              </Button>
            </div>
          </div>
        </div>
      )}
      <LoadingOverlay show={loading} />
    </div>
  );
}
