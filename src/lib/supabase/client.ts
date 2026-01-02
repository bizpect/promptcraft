import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

export function createBrowserSupabase() {
  const { url, anonKey } = getSupabaseConfig();

  return createBrowserClient(url, anonKey);
}
