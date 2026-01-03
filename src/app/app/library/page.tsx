import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { fetchUserPrompts } from "@/lib/db";
import { ensureArray } from "@/lib/db/repositories/guards";
import { createServerSupabase } from "@/lib/supabase/server";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ko-KR");
}

export default async function LibraryPage() {
  const supabase = await createServerSupabase();
  const { data: prompts, error } = await fetchUserPrompts(supabase);
  const promptList = ensureArray(prompts);
  const hasPrompts = promptList.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">프롬프트 라이브러리</h1>
        <p className="text-sm text-black/60">
          저장된 프롬프트를 관리합니다.
        </p>
      </div>

      {error ? (
        <ErrorState
          title="라이브러리를 불러오지 못했습니다."
          body="잠시 후 다시 시도해주세요."
        />
      ) : hasPrompts ? (
        <div className="grid gap-4">
          {promptList.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-black/10 bg-white p-5 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{prompt.title}</p>
                  <p className="text-xs text-black/50">
                    {prompt.platform_code.toUpperCase()} ·{" "}
                    {formatDate(prompt.created_at)}
                  </p>
                </div>
                <Link
                  href={`/app/library/${prompt.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  보기
                </Link>
              </div>
              <p className="mt-3 text-black/70">{prompt.output_prompt}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="아직 저장된 프롬프트가 없습니다."
          body="빌더에서 프롬프트를 생성하고 저장해 보세요."
        />
      )}

      <Button variant="outline">템플릿 관리 (준비중)</Button>
    </div>
  );
}
