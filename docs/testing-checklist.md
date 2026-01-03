# 테스트 체크리스트

## 인증 흐름
- Google OAuth 로그인 성공 후 `/app`으로 이동
- 미인증 상태에서 `/app` 접근 시 `/pricing`으로 리다이렉트
- 새로고침 후 세션 유지

## API 권한
- `POST /api/prompts/create` 미인증 시 401 반환
- `POST /api/rewrite` 미인증 시 401 반환
- 다른 사용자의 `prompt_id`로 rewrite 요청 시 404 반환

## RLS 시나리오
- `prompts`: 본인 행만 select/insert/update/delete 가능
- `rewrites`: 본인 행만 select/insert 가능
- `templates`: `is_active = true`만 조회 가능
- `subscriptions`: 본인 행만 select/update 가능

## 결제 (Toss 테스트)
- `POST /api/payments/toss/confirm` 테스트 결제 승인 성공
- `subscriptions`가 `pro` + `active`로 업데이트 및 리라이팅 한도 반영
- `payments`에 `paid` 상태와 금액 저장
- 웹훅은 결제 API 재조회로 검증됨
- 웹훅으로 `payments` 상태가 실패/취소로 갱신됨

## 구독 (자동결제)
- 빌링 인증 성공 시 `authKey/customerKey`가 `/app/billing`으로 리다이렉트
- `POST /api/payments/toss/billing/issue`가 빌링키 저장 및 플랜 활성화
- `billing_profiles`에 `active` 상태 저장
- Cron 호출 시 결제 생성 및 `current_period_end` 갱신
- 결제 실패 시 `subscriptions.status_code` 즉시 `inactive`
- `BILLING_DELETED` 수신 시 `billing_profiles.status_code=revoked` 및 구독 비활성화
