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
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-black/70">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-semibold">로그인</h1>
        <p className="text-sm text-black/70">
          구글 계정으로 빠르게 시작하세요. 로그인 후 대시보드로 이동합니다.
        </p>
      </header>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className={buttonVariants({ variant: "default" })}
        disabled={loading}
      >
        {loading && <LoadingSpinner size={16} />}
        Google로 계속하기
      </button>
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
