# E2E 테스트 시나리오

## 사전 준비
- `.env.local`, Vercel, Supabase secrets 환경 변수 설정 완료
- Supabase SQL 00~06 순서대로 적용 완료
- Edge Function `billing-charge` 배포 완료
- `/api/cron/billing-charge` 호출 시 `CRON_SECRET` 설정 완료

## 인증
1. Google OAuth 로그인 성공 후 `/app` 이동
2. 미인증 상태에서 `/app` 접근 시 `/pricing`으로 리다이렉트
3. 새로고침 후 세션 유지

## 템플릿
1. `/api/templates?platform=sora` 활성 템플릿 반환
2. `/api/templates?platform=veo` 활성 템플릿 반환
3. 비활성 템플릿은 반환되지 않음

## 프롬프트 빌더
1. 유효한 입력으로 생성 시 `output_prompt` 반환
2. 잘못된 입력은 400 + `invalid_input`
3. `prompts` 테이블에 현재 사용자로 저장됨

## 프롬프트 라이브러리
1. `/app/library`에 사용자 프롬프트 목록 표시
2. `/app/library/[id]`에서 상세 확인
3. 삭제 시 라이브러리로 이동

## 리라이팅
1. 미인증 `POST /api/rewrite`는 401
2. `rewrite_limit` 초과 시 `quota_exceeded`
3. `rewrites` 저장 및 `subscriptions.rewrite_used` 증가

## 구독 (Pro)
1. `/app/billing`에서 Pro 시작 클릭
2. 토스 결제창에서 카드 등록/결제 진행
3. 성공 시 `/app/billing?result=success&plan=pro&orderId=...` 리다이렉트
4. `billing_profiles`에 `active` 저장
5. `subscriptions.plan_code = pro`, `status_code = active`, `rewrite_limit = 20`
6. `payments.status_code = paid` 및 금액 확인

## 구독 (Max)
1. Max 플로우 반복
2. `subscriptions.plan_code = max`, `rewrite_limit = 100`
3. `payments.amount = 9900`

## 결제 실패 처리
1. 빌링 결제 실패 상황 시뮬레이션
2. `subscriptions.status_code = inactive` 즉시 변경
3. `payments.status_code = failed`

## Cron 자동결제
1. `/api/cron/billing-charge` 호출 (헤더 `Authorization: Bearer <CRON_SECRET>` 또는 `x-cron-secret: <CRON_SECRET>`)
2. 응답 `ok: true` 확인
3. 대상 구독 결제 생성
4. `current_period_end` 30일 연장

## 웹훅: PAYMENT_STATUS_CHANGED
1. `/api/payments/toss/webhook` 수신
2. 10초 이내 200 응답
3. `payments.status_code` 갱신

## 웹훅: CANCEL_STATUS_CHANGED
1. 취소 이벤트 수신
2. `payments.status_code = canceled`
3. `subscriptions.status_code = canceled`

## 웹훅: BILLING_DELETED
1. `customerKey` 또는 `billingKey` 포함 이벤트 수신
2. `billing_profiles.status_code = revoked`
3. `subscriptions.status_code = inactive`

## 보안/RLS
1. `prompts`, `rewrites`, `subscriptions`, `billing_profiles`, `payments`는 본인 행만 접근
2. 다른 사용자의 `prompt_id`로 rewrite 요청 시 404

## 참고
- 웹훅 시그니처는 사용하지 않음
- 검증은 `paymentKey`로 결제 조회 API를 통해 수행
- 로컬 웹훅 테스트는 ngrok 사용
