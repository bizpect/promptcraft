import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">결제/플랜</h1>
        <p className="text-sm text-black/60">
          현재 플랜과 결제 상태를 확인합니다.
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">현재 플랜: Free</p>
            <p className="text-black/60">리라이팅 0회 / 0회</p>
          </div>
          <Button>업그레이드 (TODO)</Button>
        </div>
        <p className="mt-3 text-xs text-black/50">
          토스페이먼츠 정기결제 흐름은 API placeholder로 연결됩니다.
        </p>
      </div>
    </div>
  );
}
