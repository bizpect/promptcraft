import { fetchSubscriptionWithLabels, fetchUserPayments } from "@/lib/db";
import { normalizeRpcArray } from "@/lib/db/repositories/types";
import { createServerSupabase } from "@/lib/supabase/server";

import { BillingActions } from "@/app/app/billing/billing-actions";
import { BillingCallback } from "@/app/app/billing/billing-callback";
import { SubscriptionActions } from "@/app/app/billing/subscription-actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  result?: string;
  authKey?: string;
  auth_key?: string;
  customerKey?: string;
  customer_key?: string;
  plan?: string;
  orderId?: string;
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createServerSupabase();
  const { data: subscription } = await fetchSubscriptionWithLabels(supabase);
  const { data: paymentsData } = await fetchUserPayments(supabase);

  const planLabel =
    subscription?.plan_label ?? subscription?.plan_code ?? "알 수 없음";
  const statusLabel =
    subscription?.status_label ?? subscription?.status_code ?? "알 수 없음";
  const rewriteUsed = subscription?.rewrite_used ?? 0;
  const rewriteLimit = subscription?.rewrite_limit ?? 0;
  const currentPeriodEnd = subscription?.current_period_end ?? null;
  const cancelAt = subscription?.cancel_at ?? null;
  const authKey = searchParams?.authKey ?? searchParams?.auth_key;
  const customerKey = searchParams?.customerKey ?? searchParams?.customer_key;
  const planCode = searchParams?.plan;
  const result = searchParams?.result;
  const orderId = searchParams?.orderId;
  const payments = normalizeRpcArray(paymentsData);
  const latestPayment = payments[0] ?? null;
  const latestStatusCode = latestPayment?.status_code ?? null;
  const latestStatusLabel = latestPayment?.status_label ?? latestStatusCode;
  const hasLatestFailure =
    latestStatusCode === "failed" || latestStatusCode === "canceled";

  const formatDate = (value: string | null) => {
    if (!value) {
      return "알 수 없음";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "알 수 없음";
    }

    return date.toLocaleDateString("ko-KR");
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (amount === null || amount === undefined) {
      return "-";
    }

    const resolvedCurrency = currency ?? "KRW";
    if (resolvedCurrency === "KRW") {
      return `${amount.toLocaleString("ko-KR")}원`;
    }

    return `${amount.toLocaleString("ko-KR")} ${resolvedCurrency}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">결제/플랜</h1>
        <p className="text-sm text-black/60">
          현재 플랜과 결제 상태를 확인합니다.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">현재 플랜: {planLabel}</p>
            <div className="flex flex-wrap items-center gap-2 text-black/60">
              <span>상태: {statusLabel}</span>
              {cancelAt && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  해지 예약됨
                </span>
              )}
            </div>
            <p className="text-black/60">
              리라이팅 {rewriteUsed}회 / {rewriteLimit}회
            </p>
            <p className="text-black/60">
              만료일: {formatDate(currentPeriodEnd)}
            </p>
          </div>
          <SubscriptionActions
            currentStatusCode={subscription?.status_code ?? null}
            cancelAt={subscription?.cancel_at ?? null}
            currentPeriodEnd={subscription?.current_period_end ?? null}
            currentPlanCode={subscription?.plan_code ?? null}
          />
        </div>
        <p className="mt-3 text-xs text-black/50">
          토스페이먼츠 정기결제는 테스트 키로 먼저 검증할 수 있습니다.
        </p>
        {subscription?.plan_code && subscription.plan_code !== "free" && (
          <div className="mt-4 rounded-lg border border-black/5 bg-black/5 p-3 text-xs text-black/60">
            <p className="font-medium text-black/80">해지 안내</p>
            <p className="mt-1">
              해지는 다음 결제일부터 반영되며, 만료일까지 모든 기능을 그대로
              이용할 수 있습니다.
            </p>
            <p className="mt-1">
              해지 후에는 자동결제가 중단되며, 필요 시 언제든 다시 구독할 수
              있습니다.
            </p>
          </div>
        )}
      </div>

      <BillingCallback
        authKey={authKey}
        customerKey={customerKey}
        planCode={planCode}
        result={result}
        orderId={orderId}
      />

      <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
        <p className="font-medium">구독 시작</p>
        <p className="mt-1 text-xs text-black/60">
          테스트 결제는 토스 결제창에서 카드 등록 후 진행됩니다.
        </p>
        <div className="mt-4">
          <BillingActions
            currentPlanCode={subscription?.plan_code ?? null}
            currentStatusCode={subscription?.status_code ?? null}
          />
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium">결제 내역</p>
          {hasLatestFailure && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
              최근 결제 실패: {latestStatusLabel ?? "실패"}
            </span>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {payments.length > 0 ? (
            payments.slice(0, 5).map((payment) => {
              const paymentDate = payment.approved_at ?? payment.created_at;
              const statusTone =
                payment.status_code === "paid"
                  ? "text-emerald-700"
                  : payment.status_code === "failed" ||
                      payment.status_code === "canceled"
                    ? "text-red-700"
                    : "text-black/60";

              return (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/5 bg-black/5 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {payment.provider_label ?? payment.provider_code ?? "결제"}
                    </p>
                    <p className="text-xs text-black/50">
                      {payment.order_id ?? "-"} · {formatDate(paymentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                    <p className={`text-xs ${statusTone}`}>
                      {payment.status_label ?? payment.status_code ?? "-"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-black/50">
              아직 결제 내역이 없습니다.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-black/50">
          최근 5건만 표시됩니다.
        </p>
      </div>
    </div>
  );
}
