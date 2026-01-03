import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-[140px] orb" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-[var(--accent-2)]/20 blur-[160px] orb orb--slow" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-3 text-lg">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm uppercase tracking-[0.4em] text-white/70 font-[var(--font-playfair)]">
            PromptCraft
          </span>
        </div>
        <nav className="flex items-center gap-5 text-xs uppercase tracking-[0.32em] text-white/70">
          <Link href="/pricing" className="transition hover:text-white">
            요금제
          </Link>
          <PublicAuthLink className="transition hover:text-white" />
          <Link href="/app/builder" className="transition hover:text-white">
            빌더
          </Link>
        </nav>
      </header>

      <main className="page mx-auto grid w-full max-w-6xl gap-16 px-6 pb-20 pt-12">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid gap-6">
            <span className="w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
              Sora / Veo 프롬프트 스튜디오
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl lg:text-[3.8rem]">
              <span className="font-[var(--font-playfair)]">
                시네마틱
              </span>{" "}
              제작에 필요한{" "}
              <span className="text-[var(--accent)]">프롬프트 룸</span>
            </h1>
            <p className="max-w-xl text-base text-white/65 md:text-lg">
              템플릿을 고르고, 팀의 룰을 저장하고, 리라이팅으로 톤을
              끌어올리세요. 제작자 경험을 위해 필요한 흐름만 남겼습니다.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/pricing" className={buttonVariants({ variant: "default" })}>
                시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app/builder"
                className={cn(buttonVariants({ variant: "outline" }), "bg-transparent")}
              >
                데모 보기
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[var(--surface)]/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
            <div className="relative grid gap-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Live Builder Preview
              </p>
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm text-white/70">
                  Create a cinematic portrait of{" "}
                  <span className="text-[var(--accent)]">the subject</span> in{" "}
                  <span className="text-[var(--accent)]">the location</span>.
                </p>
                <p className="text-xs text-white/50">
                  Lighting · Mood · Camera · Movement
                </p>
              </div>
              <div className="grid gap-2 text-xs text-white/60">
                <span>템플릿 기반 입력</span>
                <span>라이브 출력 프리뷰</span>
                <span>리라이팅 버전 비교</span>
              </div>
            </div>
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
              className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/30"
            >
              <h3 className="text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-white/60">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-[28px] border border-white/10 bg-[var(--surface)]/80 p-8 md:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Workflow
            </p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              팀을 위한 최소 동선, 최대 집중
            </h2>
            <p className="text-sm text-white/65">
              템플릿 선택 → 입력 → 프리뷰 → 저장. 필요한 단계만 남겨
              제작 시간을 줄입니다.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span>01</span>
              <span>템플릿과 플랫폼 선택</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span>02</span>
              <span>핵심 입력만 작성</span>
            </div>
            <div className="flex items-center justify-between">
              <span>03</span>
              <span>리라이팅/저장</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
