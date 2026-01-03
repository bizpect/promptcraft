"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string | null;
};

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-black/60">{email ?? "로그인됨"}</span>
      <button
        type="button"
        onClick={handleSignOut}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        disabled={loading}
      >
        {loading && <LoadingSpinner size={14} />}
        로그아웃
      </button>
    </div>
  );
}
