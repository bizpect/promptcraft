"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";

type RewriteItem = {
  id: string;
  rewritten_prompt: string;
  provider_code: string;
  created_at: string;
};

type RewriteHistoryProps = {
  promptId: string;
  rewrites: RewriteItem[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR");
}

export function RewriteHistory({ promptId, rewrites }: RewriteHistoryProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedItems = useMemo(() => {
    return selected
      .map((id) => rewrites.find((item) => item.id === id) ?? null)
      .filter(Boolean) as RewriteItem[];
  }, [selected, rewrites]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((value) => value !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleApply = async (rewrite: RewriteItem) => {
    setMessage(null);
    setApplyLoading(rewrite.id);

    try {
      const response = await fetch(`/api/prompts/${promptId}/output`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_prompt: rewrite.rewritten_prompt }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "적용 실패");
      }

      setMessage("선택한 리라이팅을 현재 프롬프트로 적용했습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "적용 실패");
    } finally {
      setApplyLoading(null);
    }
  };

  const handleCopy = async (rewrite: RewriteItem) => {
    try {
      await navigator.clipboard.writeText(rewrite.rewritten_prompt);
      setMessage("리라이팅 내용을 복사했습니다.");
    } catch {
      setMessage("복사에 실패했습니다.");
    }
  };

  if (rewrites.length === 0) {
    return (
      <p className="mt-2 text-black/60">아직 리라이팅 히스토리가 없습니다.</p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedItems.length === 2 && (
        <div className="grid gap-3 md:grid-cols-2">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-black/10 bg-black/5 p-3 text-xs"
            >
              <p className="font-medium">
                {item.provider_code.toUpperCase()} · {formatDate(item.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-black/70">
                {item.rewritten_prompt}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {rewrites.map((rewrite) => (
          <div
            key={rewrite.id}
            className="rounded-lg border border-black/10 bg-white p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-black/50">
                {rewrite.provider_code.toUpperCase()} ·{" "}
                {formatDate(rewrite.created_at)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSelect(rewrite.id)}
                >
                  {selected.includes(rewrite.id) ? "비교 해제" : "비교 선택"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(rewrite)}
                >
                  복사
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApply(rewrite)}
                  disabled={applyLoading === rewrite.id}
                >
                  {applyLoading === rewrite.id && <LoadingSpinner size={14} />}
                  현재 프롬프트로 적용
                </Button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-black/70">
              {rewrite.rewritten_prompt}
            </p>
          </div>
        ))}
      </div>

      {message && <p className="text-xs text-black/60">{message}</p>}
      <LoadingOverlay show={applyLoading !== null} />
    </div>
  );
}
