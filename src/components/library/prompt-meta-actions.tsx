"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";

type PromptMetaActionsProps = {
  promptId: string;
  initialTitle: string;
};

export function PromptMetaActions({
  promptId,
  initialTitle,
}: PromptMetaActionsProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "저장 실패");
      }

      setSuccess("제목이 저장되었습니다.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/prompts/${promptId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title} (복제)`,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "복제 실패");
      }

      router.push(`/app/library/${data.prompt.id}`);
      router.refresh();
    } catch (dupError) {
      setError(dupError instanceof Error ? dupError.message : "복제 실패");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
      <p className="font-medium">프롬프트 제목</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="h-10 flex-1 rounded-md border border-black/10 px-3"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목을 입력하세요"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving && <LoadingSpinner size={14} />}
          저장
        </Button>
        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={duplicating}
        >
          {duplicating && <LoadingSpinner size={14} />}
          복제
        </Button>
      </div>
      {success && <p className="mt-2 text-green-600">{success}</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
