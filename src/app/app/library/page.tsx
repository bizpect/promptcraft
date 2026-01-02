import { Button } from "@/components/ui/button";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">프롬프트 라이브러리</h1>
        <p className="text-sm text-black/60">
          저장된 프롬프트를 관리합니다.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-black/20 bg-white p-6 text-sm text-black/60">
        아직 저장된 프롬프트가 없습니다. 빌더에서 프롬프트를 생성하고
        저장해 보세요.
      </div>

      <Button variant="outline">템플릿 관리 (준비중)</Button>
    </div>
  );
}
