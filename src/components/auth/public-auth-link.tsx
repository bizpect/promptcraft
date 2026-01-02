import Link from "next/link";

import { createServerSupabase } from "@/lib/supabase/server";

type PublicAuthLinkProps = {
  className?: string;
};

export async function PublicAuthLink({ className }: PublicAuthLinkProps) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link href="/app" className={className}>
        대시보드
      </Link>
    );
  }

  return (
    <Link href="/login" className={className}>
      로그인
    </Link>
  );
}
