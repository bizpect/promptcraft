import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getServiceRoleKey, getSupabaseConfig } from "@/lib/supabase/config";

export async function createServerSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList) {
        try {
          cookieList.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        } catch {
          // Ignore when called from Server Components where cookies are read-only.
        }
      },
    },
  });
}

export function createServiceSupabase() {
  const { url } = getSupabaseConfig();
  const serviceKey = getServiceRoleKey();

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
