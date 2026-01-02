"use client";

import { useEffect, useState } from "react";
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

type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type TemplateOption = {
  id: string;
  title: string;
  description: string | null;
  platform_code: "sora" | "veo";
};

type Subscription = {
  plan_code: string;
  plan_label: string | null;
  status_code: string;
  status_label: string | null;
  rewrite_used: number;
  rewrite_limit: number;
};

export default function BuilderPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: "sora",
    },
  });

  const selectedPlatform = watch("platform");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "사용자 정보를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setProfile(data.profile);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(
            error instanceof Error ? error.message : "프로필 조회 실패"
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSubscription = async () => {
      try {
        const response = await fetch("/api/subscription", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "구독 정보를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setSubscription(data.subscription);
        }
      } catch (error) {
        if (!cancelled) {
          setSubscriptionError(
            error instanceof Error ? error.message : "구독 조회 실패"
          );
        }
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    };

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError(null);

    const loadTemplates = async () => {
      try {
        const response = await fetch(
          `/api/templates?platform=${selectedPlatform}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "템플릿 조회 실패");
        }

        if (!cancelled) {
          setTemplates(data.templates ?? []);
          setValue("templateId", "");
        }
      } catch (error) {
        if (!cancelled) {
          setTemplatesError(
            error instanceof Error ? error.message : "템플릿 조회 실패"
          );
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [selectedPlatform, setValue]);

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">내 프로필</p>
          {profileLoading ? (
            <p className="mt-1 text-black/60">불러오는 중...</p>
          ) : profile ? (
            <div className="mt-2 space-y-1 text-black/70">
              <p>이름: {profile.display_name ?? "미설정"}</p>
              <p>이메일: {profile.email ?? "미설정"}</p>
            </div>
          ) : (
            <p className="mt-1 text-red-600">{profileError ?? "조회 실패"}</p>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium">리라이팅 한도</p>
          {subscriptionLoading ? (
            <p className="mt-1 text-black/60">불러오는 중...</p>
          ) : subscription ? (
            <div className="mt-2 space-y-1 text-black/70">
              <p>
                플랜:{" "}
                {subscription.plan_label ??
                  subscription.plan_code.toUpperCase()}
              </p>
              <p>
                상태:{" "}
                {subscription.status_label ??
                  subscription.status_code.toUpperCase()}
              </p>
              <p>
                리라이팅 {subscription.rewrite_used}회 /{" "}
                {subscription.rewrite_limit}회
              </p>
            </div>
          ) : (
            <p className="mt-1 text-red-600">
              {subscriptionError ?? "조회 실패"}
            </p>
          )}
        </div>
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
            <option value="">
              {templatesLoading ? "불러오는 중..." : "선택하세요"}
            </option>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {templatesError && (
            <p className="text-xs text-red-600">{templatesError}</p>
          )}
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
