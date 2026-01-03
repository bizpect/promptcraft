import { fetchSubscriptionWithLabels } from "@/lib/db";
import { createServerSupabase } from "@/lib/supabase/server";

import { BillingActions } from "@/app/app/billing/billing-actions";
import { BillingCallback } from "@/app/app/billing/billing-callback";

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

  const planLabel =
    subscription?.plan_label ?? subscription?.plan_code ?? "알 수 없음";
  const statusLabel =
    subscription?.status_label ?? subscription?.status_code ?? "알 수 없음";
  const rewriteUsed = subscription?.rewrite_used ?? 0;
  const rewriteLimit = subscription?.rewrite_limit ?? 0;
  const authKey = searchParams?.authKey ?? searchParams?.auth_key;
  const customerKey = searchParams?.customerKey ?? searchParams?.customer_key;
  const planCode = searchParams?.plan;
  const result = searchParams?.result;
  const orderId = searchParams?.orderId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">결제/플랜</h1>
        <p className="text-sm text-black/60">
          현재 플랜과 결제 상태를 확인합니다.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">현재 플랜: {planLabel}</p>
            <p className="text-black/60">상태: {statusLabel}</p>
            <p className="text-black/60">
              리라이팅 {rewriteUsed}회 / {rewriteLimit}회
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-black/50">
          토스페이먼츠 정기결제는 테스트 키로 먼저 검증할 수 있습니다.
        </p>
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
    </div>
  );
}
