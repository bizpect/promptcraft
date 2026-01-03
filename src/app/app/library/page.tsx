import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PromptList } from "@/app/app/library/prompt-list";
import { fetchUserPrompts } from "@/lib/db";
import { ensureArray } from "@/lib/db/repositories/guards";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function LibraryPage() {
  const supabase = await createServerSupabase();
  const { data: prompts, error } = await fetchUserPrompts(supabase);
  const promptList = ensureArray(prompts);
  const hasPrompts = promptList.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Library
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white font-[var(--font-playfair)]">
          프롬프트 라이브러리
        </h1>
        <p className="text-sm text-white/60">
          저장된 프롬프트를 관리합니다.
        </p>
      </div>

      {error ? (
        <ErrorState
          title="라이브러리를 불러오지 못했습니다."
          body="잠시 후 다시 시도해주세요."
        />
      ) : hasPrompts ? (
        <PromptList prompts={promptList} />
      ) : (
        <EmptyState
          title="아직 저장된 프롬프트가 없습니다."
          body="빌더에서 프롬프트를 생성하고 저장해 보세요."
        />
      )}

    </div>
  );
}
