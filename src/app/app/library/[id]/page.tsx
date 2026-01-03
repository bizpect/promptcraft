import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { PromptActions } from "@/components/library/prompt-actions";
import { PromptMetaActions } from "@/components/library/prompt-meta-actions";
import { RewriteHistory } from "@/components/library/rewrite-history";
import { ErrorState } from "@/components/ui/error-state";
import { fetchPromptDetailForUser, fetchRewritesForPrompt } from "@/lib/db";
import { ensureArray } from "@/lib/db/repositories/guards";
import { createServerSupabase } from "@/lib/supabase/server";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR");
}

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: prompt } = await fetchPromptDetailForUser(supabase, id);
  const { data: rewrites } = await fetchRewritesForPrompt(supabase, id);
  const rewriteList = ensureArray(rewrites);

  if (!prompt) {
    return (
      <div className="space-y-4">
        <Link href="/app/library" className="text-xs uppercase tracking-[0.3em] text-white/60">
          ← 라이브러리로
        </Link>
        <ErrorState
          title="프롬프트를 찾을 수 없습니다."
          body="삭제되었거나 접근 권한이 없을 수 있습니다."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/app/library" className="text-xs uppercase tracking-[0.3em] text-white/60">
            ← 라이브러리로
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white font-[var(--font-playfair)]">
            {prompt.title}
          </h1>
          <p className="text-xs text-white/50">
            {prompt.platform_code.toUpperCase()} · {formatDate(prompt.created_at)}
          </p>
        </div>
        <Link
          href="/app/builder"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          새 프롬프트
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <p className="font-medium text-white">입력 값</p>
        <pre className="mt-3 whitespace-pre-wrap text-white/70">
          {JSON.stringify(prompt.input_json, null, 2)}
        </pre>
      </div>

      <PromptMetaActions promptId={prompt.id} initialTitle={prompt.title} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <p className="font-medium text-white">출력 프롬프트</p>
        <p className="mt-3 whitespace-pre-wrap text-white/70">
          {prompt.output_prompt}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <p className="font-medium text-white">리라이팅 히스토리</p>
        <RewriteHistory promptId={prompt.id} rewrites={rewriteList} />
      </div>

      <PromptActions
        promptId={prompt.id}
        platformCode={prompt.platform_code}
      />
    </div>
  );
}
