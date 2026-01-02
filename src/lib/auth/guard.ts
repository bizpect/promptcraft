import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";

export async function requireUser(redirectedFrom = "/app") {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", "http://localhost");
    redirectUrl.searchParams.set("redirectedFrom", redirectedFrom);
    redirect(redirectUrl.pathname + redirectUrl.search);
  }

  return user;
}
