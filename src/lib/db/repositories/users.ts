import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchCurrentUserProfile(supabase: SupabaseClient) {
  return supabase.rpc("get_current_user_profile").single();
}
