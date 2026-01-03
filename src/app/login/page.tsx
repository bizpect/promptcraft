"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";
import { createBrowserSupabase } from "@/lib/supabase/client";

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const redirectedFrom = useMemo(() => {
    const value = searchParams.get("redirectedFrom");
    return value && value.startsWith("/") ? value : "/app";
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createBrowserSupabase();

    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("redirectedFrom", redirectedFrom);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    setLoading(false);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
      <div className="pointer-events-none absolute -left-16 top-20 h-56 w-56 rounded-full bg-[var(--accent)]/20 blur-[120px] orb" />
      <header className="flex flex-col gap-3">
        <Link href="/" className="text-xs uppercase tracking-[0.3em] text-white/60">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-semibold text-white md:text-4xl font-[var(--font-playfair)]">
          로그인
        </h1>
        <p className="text-sm text-white/65">
          구글 계정으로 빠르게 시작하세요. 로그인 후 대시보드로 이동합니다.
        </p>
      </header>

      <div className="grid gap-4 rounded-[26px] border border-white/10 bg-[var(--surface)]/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className={buttonVariants({ variant: "default" })}
          disabled={loading}
        >
          {loading && <LoadingSpinner size={16} />}
          Google로 계속하기
        </button>
        <p className="text-xs text-white/50">
          로그인 시 PromptCraft의 서비스 약관 및 개인정보 처리방침에 동의합니다.
        </p>
      </div>
      <LoadingOverlay show={loading} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-16">
          <LoadingSpinner size={36} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
