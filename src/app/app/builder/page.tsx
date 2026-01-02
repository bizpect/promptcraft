"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

const formSchema = z.object({
  templateId: z.string().min(1, "템플릿을 선택하세요."),
  platform: z.enum(["sora", "veo"]),
  scene: z.string().min(1, "장면을 입력하세요."),
  characters: z.string().optional(),
  action: z.string().min(1, "액션을 입력하세요."),
  camera: z.string().optional(),
  constraints: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const templates = [
  {
    id: "starter-sora",
    label: "Sora 기본 템플릿",
    platform: "sora",
  },
  {
    id: "starter-veo",
    label: "Veo 기본 템플릿",
    platform: "veo",
  },
];

export default function BuilderPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: "sora",
    },
  });

  const selectedPlatform = watch("platform");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResult(null);

    const response = await fetch("/api/prompts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: values.templateId,
        input_json: {
          scene: values.scene,
          characters: values.characters ?? "",
          action: values.action,
          camera: values.camera ?? "",
          constraints: values.constraints ?? "",
          platform: values.platform,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setResult(data.output_prompt);
    } else {
      setResult(`${data.code}: ${data.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">프롬프트 빌더</h1>
        <p className="text-sm text-black/60">
          템플릿을 고르고 입력 값을 채우면 프롬프트가 생성됩니다.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <label className="text-sm font-medium">플랫폼</label>
          <select
            className="h-10 rounded-md border border-black/10 px-3"
            {...register("platform")}
          >
            <option value="sora">Sora</option>
            <option value="veo">Veo</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">템플릿</label>
          <select
            className="h-10 rounded-md border border-black/10 px-3"
            {...register("templateId")}
          >
            <option value="">선택하세요</option>
            {templates
              .filter((item) => item.platform === selectedPlatform)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
          </select>
          {errors.templateId && (
            <p className="text-xs text-red-600">
              {errors.templateId.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">장면</label>
          <textarea
            className="min-h-[80px] rounded-md border border-black/10 px-3 py-2"
            {...register("scene")}
          />
          {errors.scene && (
            <p className="text-xs text-red-600">{errors.scene.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">캐릭터</label>
          <input
            className="h-10 rounded-md border border-black/10 px-3"
            {...register("characters")}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">액션</label>
          <textarea
            className="min-h-[80px] rounded-md border border-black/10 px-3 py-2"
            {...register("action")}
          />
          {errors.action && (
            <p className="text-xs text-red-600">{errors.action.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">카메라</label>
          <input
            className="h-10 rounded-md border border-black/10 px-3"
            {...register("camera")}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">제약 조건</label>
          <textarea
            className="min-h-[60px] rounded-md border border-black/10 px-3 py-2"
            {...register("constraints")}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "생성 중..." : "프롬프트 생성"}
        </Button>
      </form>

      {result && (
        <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
