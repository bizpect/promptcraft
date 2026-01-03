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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
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
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white font-[var(--font-playfair)]">
          결제 운영 대시보드
        </h1>
        <p className="text-sm text-white/60">
          구독 상태와 최근 결제 이력을 빠르게 확인합니다.
        </p>
      </div>

      {(subscriptionError || planError || paymentError) && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          데이터를 가져오지 못했습니다.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-medium text-white">구독 상태</p>
          <div className="mt-3 space-y-2">
            {statusRows.length > 0 ? (
              statusRows.map((row) => (
                <div
                  key={row.status_code}
                  className="flex items-center justify-between text-white/70"
                >
                  <span>{row.status_code}</span>
                  <span className="font-medium text-white">{row.total}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/50">데이터 없음</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-medium text-white">플랜 분포</p>
          <div className="mt-3 space-y-2">
            {planRows.length > 0 ? (
              planRows.map((row) => (
                <div
                  key={row.plan_code}
                  className="flex items-center justify-between text-white/70"
                >
                  <span>{row.plan_code}</span>
                  <span className="font-medium text-white">{row.total}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/50">데이터 없음</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
        <p className="font-medium text-white">최근 결제 (20건)</p>
        <div className="mt-3 space-y-2">
          {paymentRows.length > 0 ? (
            paymentRows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70"
              >
                <div>
                  <p className="font-medium text-white">
                    {row.provider_code ?? "provider"} · {row.status_code ?? "-"}
                  </p>
                  <p className="text-white/50">
                    {row.order_id ?? "-"} · {row.user_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    {row.amount ? row.amount.toLocaleString("ko-KR") : "-"}{" "}
                    {row.currency ?? ""}
                  </p>
                  <p className="text-white/50">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/50">데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
