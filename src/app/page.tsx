import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-orange-500" />
          PromptCraft
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="hover:text-orange-600">
            요금제
          </Link>
          <PublicAuthLink className="hover:text-orange-600" />
          <Link href="/app/builder" className="hover:text-orange-600">
            빌더
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-10">
        <section className="grid gap-6">
          <span className="w-fit rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium">
            Sora / Veo 전용 프롬프트 빌더
          </span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            국내 제작자를 위한 영상 프롬프트 제작실
          </h1>
          <p className="max-w-2xl text-base text-black/70 md:text-lg">
            템플릿 선택부터 출력 프롬프트까지. 팀에 맞는 규칙을
            저장하고, Pro 플랜에서만 가능한 리라이팅으로 품질을
            끌어올리세요.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/pricing" className={buttonVariants({ variant: "default" })}>
              시작하기 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app/builder"
              className={cn(buttonVariants({ variant: "outline" }), "bg-white")}
            >
              데모 보기
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "구조화된 템플릿",
              body: "Sora/Veo에 맞춘 기본 프롬프트 구조를 제공합니다.",
            },
            {
              title: "팀 라이브러리",
              body: "저장된 프롬프트를 분류하고 재사용할 수 있습니다.",
            },
            {
              title: "Pro 리라이팅",
              body: "AI 리라이팅으로 표현을 다듬고 톤을 통일합니다.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white/80 p-5"
            >
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-black/70">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
