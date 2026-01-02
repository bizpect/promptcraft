import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pricing");
  }

  return user;
}
