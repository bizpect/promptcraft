import { NextResponse } from "next/server";

export async function POST() {
  // TODO:
  // 1) Toss Payments 결제 승인 API 호출
  // 2) billing_key 발급 및 subscriptions 업데이트
  // 3) plan/status 활성화 처리
  return NextResponse.json({
    ok: false,
    message: "TODO: Toss Payments confirm flow not implemented.",
  });
}
