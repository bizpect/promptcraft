import { NextResponse } from "next/server";

export async function POST() {
  // TODO:
  // 1) Toss webhook 시그니처 검증
  // 2) 결제 갱신/실패/해지 이벤트 처리
  // 3) subscriptions 상태 업데이트 및 로그 적재
  return NextResponse.json({
    ok: false,
    message: "TODO: Toss Payments webhook flow not implemented.",
  });
}
