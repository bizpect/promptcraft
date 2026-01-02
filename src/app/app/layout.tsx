import Link from "next/link";

import { requireUser } from "@/lib/auth/guard";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            PromptCraft
          </Link>
          <div className="text-sm text-black/60">{user.email}</div>
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
        </nav>
        <main className="rounded-2xl border border-black/10 bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
