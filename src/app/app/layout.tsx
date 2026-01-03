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
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.3em]">
            PromptCraft
          </Link>
          <UserMenu email={userLabel} />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/50">
            Workspace
          </p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link
              href="/app/builder"
              className="rounded-lg border border-white/10 px-3 py-2 text-white/70 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
            >
              빌더
            </Link>
            <Link
              href="/app/library"
              className="rounded-lg border border-white/10 px-3 py-2 text-white/70 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
            >
              라이브러리
            </Link>
            <Link
              href="/app/billing"
              className="rounded-lg border border-white/10 px-3 py-2 text-white/70 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
            >
              결제/플랜
            </Link>
            <Link
              href="/app/profile"
              className="rounded-lg border border-white/10 px-3 py-2 text-white/70 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
            >
              프로필
            </Link>
          </nav>
        </aside>
        <main className="page rounded-3xl border border-white/10 bg-[var(--surface)]/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.5)]">
          {children}
        </main>
      </div>
    </div>
  );
}
