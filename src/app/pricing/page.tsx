import Link from "next/link";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PublicAuthLink } from "@/components/auth/public-auth-link";

const plans = [
  {
    name: "Free",
    price: "₩0",
    description: "아이디어 검증용",
    limit: "리라이팅 0회",
    cta: "무료 시작",
  },
  {
    name: "Lite",
    price: "₩19,000",
    description: "개인 제작자",
    limit: "리라이팅 20회",
    cta: "Lite 시작",
  },
  {
    name: "Pro",
    price: "₩59,000",
    description: "팀/스튜디오",
    limit: "리라이팅 100회",
    cta: "Pro 시작",
  },
];

export default function PricingPage() {
  return (
    <div className="page mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-14">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/60">
          <Link href="/" className="transition hover:text-white">
            ← 홈으로
          </Link>
          <PublicAuthLink className="transition hover:text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-white md:text-4xl font-[var(--font-playfair)]">
          요금제
        </h1>
        <p className="max-w-xl text-sm text-white/65">
          모든 플랜은 템플릿 빌더와 저장 기능을 제공합니다. Pro에서만
          리라이팅 기능이 활성화됩니다.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={`relative overflow-hidden rounded-[26px] border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/30 ${
              index === 1 ? "shadow-[0_20px_60px_rgba(242,180,92,0.2)]" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {plan.name}
                </h2>
                <p className="text-sm text-white/60">{plan.description}</p>
              </div>
              <span className="text-xl font-semibold text-white">
                {plan.price}
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--accent)]" /> 템플릿 빌더
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--accent)]" />
                프롬프트 저장
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--accent)]" /> {plan.limit}
              </li>
            </ul>
            <Link
              href="/app/billing"
              className={`mt-6 w-full ${buttonVariants({ variant: index === 1 ? "default" : "outline" })}`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
