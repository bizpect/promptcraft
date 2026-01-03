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
  const userLabel =
    profile?.display_name ?? profile?.email ?? user.email ?? null;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.35em] text-white/70 font-[var(--font-playfair)]"
            >
              PromptCraft
            </Link>
            <span className="hidden text-[11px] uppercase tracking-[0.35em] text-white/40 md:inline">
              Workspace
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.32em] text-white/60 md:flex">
            <Link href="/app/builder" className="nav-link transition hover:text-white">
              빌더
            </Link>
            <Link href="/app/library" className="nav-link transition hover:text-white">
              라이브러리
            </Link>
            <Link href="/app/billing" className="nav-link transition hover:text-white">
              결제/플랜
            </Link>
            <Link href="/app/profile" className="nav-link transition hover:text-white">
              프로필
            </Link>
          </nav>
          <UserMenu email={userLabel} />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 md:hidden">
          <Link
            href="/app/builder"
            className="rounded-full border border-white/10 px-3 py-2 transition hover:border-white/30 hover:text-white"
          >
            빌더
          </Link>
          <Link
            href="/app/library"
            className="rounded-full border border-white/10 px-3 py-2 transition hover:border-white/30 hover:text-white"
          >
            라이브러리
          </Link>
          <Link
            href="/app/billing"
            className="rounded-full border border-white/10 px-3 py-2 transition hover:border-white/30 hover:text-white"
          >
            결제/플랜
          </Link>
          <Link
            href="/app/profile"
            className="rounded-full border border-white/10 px-3 py-2 transition hover:border-white/30 hover:text-white"
          >
            프로필
          </Link>
        </nav>
        <main className="page rounded-[28px] border border-white/10 bg-[var(--surface)]/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur">
          {children}
        </main>
      </div>
    </div>
  );
}
