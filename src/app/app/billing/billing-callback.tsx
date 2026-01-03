"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { recordPaymentAttempt } from "@/lib/db";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/ui/loading";

type BillingCallbackProps = {
  authKey?: string;
  customerKey?: string;
  planCode?: string;
  result?: string;
  orderId?: string;
  mode?: string;
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
  mode,
}: BillingCallbackProps) {
  const [status, setStatus] = useState<{
    message: string;
    tone: "success" | "error" | "info";
  } | null>(null);
  const lastRequestKeyRef = useRef<string | null>(null);
  const lastFailKeyRef = useRef<string | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolvedAuthKey =
    authKey ?? searchParams.get("authKey") ?? searchParams.get("auth_key");
  const resolvedCustomerKey =
    customerKey ??
    searchParams.get("customerKey") ??
    searchParams.get("customer_key");
  const resolvedResult = result ?? searchParams.get("result");
  const resolvedPlanCode = planCode ?? searchParams.get("plan");
  const resolvedOrderId = orderId ?? searchParams.get("orderId");
  const resolvedMode = mode ?? searchParams.get("mode");

  useEffect(() => {
    if (!resolvedAuthKey || !resolvedCustomerKey) {
      if (resolvedResult === "fail") {
        setStatus({
          message: "결제가 취소되었거나 실패했습니다.",
          tone: "error",
        });

        const normalizedPlanCode = normalizePlanCode(resolvedPlanCode);
        if (!normalizedPlanCode) {
          return;
        }

        const failKey = [normalizedPlanCode, resolvedOrderId ?? ""].join("|");
        if (lastFailKeyRef.current === failKey) {
          return;
        }

        lastFailKeyRef.current = failKey;
        const supabase = createBrowserSupabase();
        recordPaymentAttempt(supabase, {
          planCode: normalizedPlanCode,
          reasonCode: "redirect_fail",
          providerCode: "toss",
          metadata: {
            source: "redirect",
            order_id: resolvedOrderId ?? null,
          },
        }).catch((error) => {
          console.warn("Failed to record payment attempt:", error);
        });
      }
      return;
    }

    const normalizedPlanCode = normalizePlanCode(resolvedPlanCode);

    if (!normalizedPlanCode) {
      setStatus({
        message: "플랜 정보가 없어 결제를 진행할 수 없습니다.",
        tone: "error",
      });
      return;
    }

    const requestKey = [
      resolvedAuthKey,
      resolvedCustomerKey,
      normalizedPlanCode,
      resolvedOrderId ?? "",
    ].join("|");

    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;

    const sendUpdate = async () => {
      setStatus({
        message: "새 결제수단을 등록합니다.",
        tone: "info",
      });

      const response = await fetch("/api/payments/toss/billing/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key: resolvedAuthKey,
          customer_key: resolvedCustomerKey,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({
          message: data.message || "결제수단 변경에 실패했습니다.",
          tone: "error",
        });
        return;
      }

      setStatus({
        message: "결제수단이 변경되었습니다.",
        tone: "success",
      });
      router.refresh();
    };

    const sendIssue = async () => {
      setStatus({
        message: "빌링키를 발급하고 결제를 확인합니다.",
        tone: "info",
      });

      const response = await fetch("/api/payments/toss/billing/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key: resolvedAuthKey,
          customer_key: resolvedCustomerKey,
          plan_code: normalizedPlanCode,
          order_id: resolvedOrderId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({
          message: data.message || "결제 승인에 실패했습니다.",
          tone: "error",
        });
        return;
      }

      setStatus({
        message: "결제가 완료되었습니다. 구독이 활성화되었습니다.",
        tone: "success",
      });
      router.refresh();
    };

    if (resolvedMode === "update") {
      void sendUpdate();
    } else {
      void sendIssue();
    }
  }, [
    resolvedAuthKey,
    resolvedCustomerKey,
    resolvedResult,
    resolvedPlanCode,
    resolvedOrderId,
    resolvedMode,
    router,
  ]);

  useEffect(() => {
    bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [status]);

  useEffect(() => {
    if (!status || status.tone === "info") {
      return;
    }

    const hasQuery =
      resolvedAuthKey ||
      resolvedCustomerKey ||
      resolvedResult ||
      resolvedPlanCode ||
      resolvedOrderId ||
      resolvedMode;

    if (hasQuery) {
      window.history.replaceState(null, "", "/app/billing");
    }
  }, [
    status,
    resolvedAuthKey,
    resolvedCustomerKey,
    resolvedResult,
    resolvedPlanCode,
    resolvedOrderId,
    resolvedMode,
  ]);

  if (!status) {
    return null;
  }

  const isLoading = status.tone === "info";
  const toneStyles =
    status.tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : status.tone === "error"
        ? "border-red-400/30 bg-red-500/10 text-red-100"
        : "border-amber-400/30 bg-amber-500/10 text-amber-100";

  return (
    <>
      {!isLoading && (
        <div
          ref={bannerRef}
          role="alert"
          className={`rounded-2xl border p-4 text-sm font-medium ${toneStyles}`}
        >
          {status.message}
        </div>
      )}
      <LoadingOverlay show={isLoading} />
    </>
  );
}
