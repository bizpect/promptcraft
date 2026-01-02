import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchCurrentUserProfile(supabase: SupabaseClient) {
  return supabase.rpc("get_current_user_profile").maybeSingle();
}

export async function updateCurrentUserProfile(
  supabase: SupabaseClient,
  input: {
    displayName: string | null;
    avatarUrl: string | null;
  }
) {
  return supabase
    .rpc("update_current_user_profile", {
      display_name_input: input.displayName,
      avatar_url_input: input.avatarUrl,
    })
    .single();
}
