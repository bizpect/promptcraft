import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { PromptActions } from "@/components/library/prompt-actions";
import { PromptMetaActions } from "@/components/library/prompt-meta-actions";
import { RewriteHistory } from "@/components/library/rewrite-history";
import { ErrorState } from "@/components/ui/error-state";
import { fetchPromptDetailForUser, fetchRewritesForPrompt } from "@/lib/db";
import { ensureArray } from "@/lib/db/repositories/guards";
import { createServerSupabase } from "@/lib/supabase/server";
import { getFieldLabel } from "@/lib/templates/fields";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR");
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
  const inputEntries = Object.entries(prompt?.input_json ?? {})
    .filter(([key, value]) => key !== "platform" && formatValue(value))
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      value: formatValue(value),
    }));

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

      <PromptMetaActions promptId={prompt.id} initialTitle={prompt.title} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <p className="font-medium text-white">입력 요약</p>
        {inputEntries.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {inputEntries.map((entry) => (
              <div
                key={entry.key}
                className="rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">
                  {entry.label}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/60">
            저장된 입력 정보가 없습니다.
          </p>
        )}
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
