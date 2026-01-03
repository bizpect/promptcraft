import type {
  PostgrestMaybeSingleResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export async function fetchCurrentUserProfile(
  supabase: SupabaseClient
): Promise<PostgrestMaybeSingleResponse<UserProfile>> {
  return supabase
    .rpc("get_current_user_profile")
    .returns<UserProfile>()
    .maybeSingle();
}

export async function updateCurrentUserProfile(
  supabase: SupabaseClient,
  input: {
    displayName: string | null;
    avatarUrl: string | null;
  }
): Promise<PostgrestSingleResponse<UserProfile>> {
  return supabase
    .rpc("update_current_user_profile", {
      display_name_input: input.displayName,
      avatar_url_input: input.avatarUrl,
    })
    .returns<UserProfile>()
    .single();
}

export async function insertLoginEvent(
  supabase: SupabaseClient,
  input: {
    loginType: string;
  }
): Promise<PostgrestSingleResponse<null>> {
  return supabase.rpc("record_login_event", {
    login_type_input: input.loginType,
  });
}
