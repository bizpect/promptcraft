import { normalizeRpcArray } from "@/lib/db/repositories/types";
import {
  fetchAdminPlanTotals,
  fetchAdminRecentPayments,
  fetchAdminSubscriptionTotals,
} from "@/lib/db";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = parseAdminEmails();
  const isAdmin =
    !!user?.email && adminEmails.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6 text-sm">
        관리자 전용 페이지입니다.
      </div>
    );
  }

  const serviceSupabase = createServiceSupabase();
  const [
    { data: subscriptionTotals, error: subscriptionError },
    { data: planTotals, error: planError },
    { data: recentPayments, error: paymentError },
  ] = await Promise.all([
    fetchAdminSubscriptionTotals(serviceSupabase),
    fetchAdminPlanTotals(serviceSupabase),
    fetchAdminRecentPayments(serviceSupabase, 20),
  ]);

  const statusRows = normalizeRpcArray(subscriptionTotals);
  const planRows = normalizeRpcArray(planTotals);
  const paymentRows = normalizeRpcArray(recentPayments);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">결제 운영 대시보드</h1>
        <p className="text-sm text-black/60">
          구독 상태와 최근 결제 이력을 빠르게 확인합니다.
        </p>
      </div>

      {(subscriptionError || planError || paymentError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">구독 상태</p>
          <div className="mt-3 space-y-2">
            {statusRows.length > 0 ? (
              statusRows.map((row) => (
                <div
                  key={row.status_code}
                  className="flex items-center justify-between"
                >
                  <span className="text-black/70">{row.status_code}</span>
                  <span className="font-medium">{row.total}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-black/50">데이터 없음</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">플랜 분포</p>
          <div className="mt-3 space-y-2">
            {planRows.length > 0 ? (
              planRows.map((row) => (
                <div
                  key={row.plan_code}
                  className="flex items-center justify-between"
                >
                  <span className="text-black/70">{row.plan_code}</span>
                  <span className="font-medium">{row.total}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-black/50">데이터 없음</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
        <p className="font-medium">최근 결제 (20건)</p>
        <div className="mt-3 space-y-2">
          {paymentRows.length > 0 ? (
            paymentRows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/5 bg-black/5 p-3 text-xs"
              >
                <div>
                  <p className="font-medium">
                    {row.provider_code ?? "provider"} · {row.status_code ?? "-"}
                  </p>
                  <p className="text-black/50">
                    {row.order_id ?? "-"} · {row.user_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {row.amount ? row.amount.toLocaleString("ko-KR") : "-"}{" "}
                    {row.currency ?? ""}
                  </p>
                  <p className="text-black/50">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-black/50">데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
