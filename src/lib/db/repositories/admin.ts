import type {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

import type { RpcArrayResult } from "@/lib/db/repositories/types";

export type AdminSubscriptionTotal = {
  status_code: string;
  total: number;
};

export type AdminPlanTotal = {
  plan_code: string;
  total: number;
};

export type AdminPaymentRow = {
  id: string;
  user_id: string;
  provider_code: string | null;
  status_code: string | null;
  amount: number | null;
  currency: string | null;
  order_id: string | null;
  created_at: string | null;
};

export async function fetchAdminSubscriptionTotals(
  supabase: SupabaseClient
): Promise<PostgrestSingleResponse<RpcArrayResult<AdminSubscriptionTotal>>> {
  return supabase
    .rpc("get_admin_subscription_totals")
    .returns<AdminSubscriptionTotal[]>();
}

export async function fetchAdminPlanTotals(
  supabase: SupabaseClient
): Promise<PostgrestSingleResponse<RpcArrayResult<AdminPlanTotal>>> {
  return supabase
    .rpc("get_admin_plan_totals")
    .returns<AdminPlanTotal[]>();
}

export async function fetchAdminRecentPayments(
  supabase: SupabaseClient,
  limit = 20
): Promise<PostgrestSingleResponse<RpcArrayResult<AdminPaymentRow>>> {
  return supabase
    .rpc("get_admin_recent_payments", {
      limit_input: limit,
    })
    .returns<AdminPaymentRow[]>();
}
