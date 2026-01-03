"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, LoadingSpinner } from "@/components/ui/loading";
import { getFieldLabel, getFieldPlaceholder } from "@/lib/templates/fields";

const formSchema = z.object({
  templateId: z.string().min(1, "템플릿을 선택하세요."),
  platform: z.enum(["sora", "veo"]),
  inputs: z.record(z.string()).optional(),
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
  base_prompt: string;
};

type Subscription = {
  plan_code: string;
  plan_label: string | null;
  status_code: string;
  status_label: string | null;
  rewrite_used: number;
  rewrite_limit: number;
};

const TEXTAREA_KEYS = new Set([
  "story",
  "dialogue",
  "scene",
  "action",
  "constraints",
  "timeline",
  "detail",
]);

function extractTokens(basePrompt: string) {
  const tokens = new Set<string>();
  const regex = /{{\s*([\w-]+)\s*}}/g;
  let match = regex.exec(basePrompt);

  while (match) {
    tokens.add(match[1]);
    match = regex.exec(basePrompt);
  }

  return Array.from(tokens);
}

function renderInputFields(input: {
  platform: "sora" | "veo";
  tokens: string[];
  register: ReturnType<typeof useForm<FormValues>>["register"];
}) {
  const extras =
    input.platform === "veo" ? ["timeline", "constraints"] : [];
  const keys = Array.from(new Set([...input.tokens, ...extras]));

  if (keys.length === 0) {
    return (
      <p className="text-xs text-white/50">
        템플릿에 입력 키가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {keys.map((key) => {
        const label = getFieldLabel(key);
        const placeholder = getFieldPlaceholder(key);
        const isTextarea = TEXTAREA_KEYS.has(key);

        return (
          <label key={key} className="grid gap-2 text-xs text-white/60">
            <span className="text-sm font-medium text-white/80">{label}</span>
            {isTextarea ? (
              <textarea
                className="min-h-[70px] rounded-xl border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm text-white/80"
                placeholder={placeholder}
                {...input.register(`inputs.${key}`)}
              />
            ) : (
              <input
                className="h-10 rounded-xl border border-white/10 bg-[var(--surface)] px-3 text-sm text-white/80"
                placeholder={placeholder}
                {...input.register(`inputs.${key}`)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function BuilderPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      inputs: {},
    },
  });

  const selectedPlatform = watch("platform");
  const selectedTemplateId = watch("templateId");
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;

  useEffect(() => {
    if (selectedTemplateId) {
      setValue("inputs", {});
    }
  }, [selectedTemplateId, setValue]);

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
          setValue("inputs", {});
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
    setSubmitError(null);

    const response = await fetch("/api/prompts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: values.templateId,
        input_json: {
          platform: values.platform,
          ...(values.inputs ?? {}),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setSubmitError(data.message ?? "프롬프트 생성에 실패했습니다.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white font-[var(--font-playfair)]">
          프롬프트 빌더
        </h1>
        <p className="text-sm text-white/60">
          템플릿을 고르고 입력 값을 채우면 프롬프트가 생성됩니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
          <p className="font-medium text-white">내 프로필</p>
          {profileLoading ? (
            <div className="mt-2">
              <LoadingSpinner size={18} />
            </div>
          ) : profile ? (
            <div className="mt-2 space-y-1 text-white/70">
              <p>이름: {profile.display_name ?? "미설정"}</p>
              <p>이메일: {profile.email ?? "미설정"}</p>
            </div>
          ) : (
            <p className="mt-1 text-red-300">{profileError ?? "조회 실패"}</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
          <p className="font-medium text-white">리라이팅 한도</p>
          {subscriptionLoading ? (
            <div className="mt-2">
              <LoadingSpinner size={18} />
            </div>
          ) : subscription ? (
            <div className="mt-2 space-y-1 text-white/70">
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
            <p className="mt-1 text-red-300">
              {subscriptionError ?? "조회 실패"}
            </p>
          )}
        </div>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-white">플랫폼</label>
          <select
            className="h-11 rounded-xl border border-white/10 bg-[var(--surface)] px-3 text-white/80"
            {...register("platform")}
          >
            <option value="sora">Sora</option>
            <option value="veo">Veo</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-white">템플릿</label>
          <select
            className="h-11 rounded-xl border border-white/10 bg-[var(--surface)] px-3 text-white/80"
            {...register("templateId")}
          >
            <option value="">
              선택하세요
            </option>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {templatesLoading && (
            <div className="mt-2">
              <LoadingSpinner size={16} />
            </div>
          )}
          {templatesError && (
            <p className="text-xs text-red-300">{templatesError}</p>
          )}
          {errors.templateId && (
            <p className="text-xs text-red-300">
              {errors.templateId.message}
            </p>
          )}
        </div>

        {selectedTemplate ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="font-medium text-white">입력 필드</p>
            <p className="text-xs text-white/60">
              템플릿에 포함된 키가 자동으로 표시됩니다.
            </p>
            {renderInputFields({
              platform: selectedPlatform,
              tokens: extractTokens(selectedTemplate.base_prompt),
              register,
            })}
          </div>
        ) : (
          <p className="text-xs text-white/60">
            템플릿을 선택하면 입력 필드가 표시됩니다.
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <LoadingSpinner size={16} />}
          프롬프트 생성
        </Button>
      </form>

      {submitError && (
        <p className="text-sm text-red-300">{submitError}</p>
      )}
      <LoadingOverlay
        show={loading || profileLoading || subscriptionLoading || templatesLoading}
      />
    </div>
  );
}
