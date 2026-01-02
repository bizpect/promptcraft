"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type PromptActionsProps = {
  promptId: string;
  platformCode: "sora" | "veo";
};

export function PromptActions({ promptId, platformCode }: PromptActionsProps) {
  const router = useRouter();
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleRewrite = async () => {
    setRewriteLoading(true);
    setRewriteError(null);
    setRewriteResult(null);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_id: promptId,
          platform: platformCode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "리라이팅 실패");
      }

      setRewriteResult(data.rewritten_prompt);
    } catch (error) {
      setRewriteError(
        error instanceof Error ? error.message : "리라이팅 실패"
      );
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "삭제 실패");
      }

      router.push("/app/library");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "삭제 실패");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5 text-sm">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRewrite} disabled={rewriteLoading}>
          {rewriteLoading ? "리라이팅 중..." : "리라이팅 실행"}
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? "삭제 중..." : "삭제"}
        </Button>
      </div>

      {rewriteResult && (
        <div className="rounded-lg border border-black/10 bg-black/5 p-4 text-sm whitespace-pre-wrap">
          {rewriteResult}
        </div>
      )}

      {rewriteError && <p className="text-red-600">{rewriteError}</p>}
      {deleteError && <p className="text-red-600">{deleteError}</p>}
    </div>
  );
}
