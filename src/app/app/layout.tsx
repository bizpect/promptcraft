import Link from "next/link";

import { requireUser } from "@/lib/auth/guard";
import { UserMenu } from "@/components/auth/user-menu";
import { createServerSupabase } from "@/lib/supabase/server";
import { fetchCurrentUserProfile } from "@/lib/db/repositories/users";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/app");
  const supabase = await createServerSupabase();
  const { data: profile } = await fetchCurrentUserProfile(supabase);
  const userLabel = profile?.display_name ?? profile?.email ?? user.email;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            PromptCraft
          </Link>
          <UserMenu email={userLabel} />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-col gap-3 text-sm">
          <Link href="/app/builder" className="hover:text-orange-600">
            빌더
          </Link>
          <Link href="/app/library" className="hover:text-orange-600">
            라이브러리
          </Link>
          <Link href="/app/billing" className="hover:text-orange-600">
            결제/플랜
          </Link>
          <Link href="/app/profile" className="hover:text-orange-600">
            프로필
          </Link>
        </nav>
        <main className="rounded-2xl border border-black/10 bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
