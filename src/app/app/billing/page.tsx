import { Button } from "@/components/ui/button";
import { fetchSubscriptionWithLabels } from "@/lib/db";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createServerSupabase();
  const { data: subscription } = await fetchSubscriptionWithLabels(supabase);

  const planLabel =
    subscription?.plan_label ?? subscription?.plan_code ?? "알 수 없음";
  const statusLabel =
    subscription?.status_label ?? subscription?.status_code ?? "알 수 없음";
  const rewriteUsed = subscription?.rewrite_used ?? 0;
  const rewriteLimit = subscription?.rewrite_limit ?? 0;

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
          <Button>업그레이드 (TODO)</Button>
        </div>
        <p className="mt-3 text-xs text-black/50">
          토스페이먼츠 정기결제 흐름은 API placeholder로 연결됩니다.
        </p>
      </div>
    </div>
  );
}
