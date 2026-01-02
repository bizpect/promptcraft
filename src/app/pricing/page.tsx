import Link from "next/link";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-black/70">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-semibold">요금제</h1>
        <p className="text-sm text-black/70">
          모든 플랜은 템플릿 빌더와 저장 기능을 제공합니다. Pro에서만
          리라이팅 기능이 활성화됩니다.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-2xl border border-black/10 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="text-sm text-black/60">{plan.description}</p>
              </div>
              <span className="text-xl font-semibold">{plan.price}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-500" /> 템플릿 빌더
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-500" />
                프롬프트 저장
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-500" /> {plan.limit}
              </li>
            </ul>
            <Link
              href="/app/billing"
              className={`mt-6 w-full ${buttonVariants({ variant: "default" })}`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
