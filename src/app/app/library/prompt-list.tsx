"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

type PromptListItem = {
  id: string;
  title: string;
  platform_code: "sora" | "veo";
  output_prompt: string;
  created_at: string;
};

type PromptListProps = {
  prompts: PromptListItem[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ko-KR");
}

export function PromptList({ prompts }: PromptListProps) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"all" | "sora" | "veo">("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const matchesPlatform =
        platform === "all" || prompt.platform_code === platform;
      if (!matchesPlatform) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        prompt.title.toLowerCase().includes(normalized) ||
        prompt.output_prompt.toLowerCase().includes(normalized)
      );
    });
  }, [platform, prompts, query]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <input
          className="h-10 rounded-md border border-black/10 px-3 text-sm"
          placeholder="제목 또는 프롬프트로 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="h-10 rounded-md border border-black/10 px-3 text-sm"
          value={platform}
          onChange={(event) =>
            setPlatform(event.target.value as "all" | "sora" | "veo")
          }
        >
          <option value="all">전체 플랫폼</option>
          <option value="sora">Sora</option>
          <option value="veo">Veo</option>
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((prompt) => (
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
        <p className="text-sm text-black/60">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
