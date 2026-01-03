# PromptCraft

Sora/Veo 프롬프트 빌더 SaaS의 최소 MVP 뼈대입니다.

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase 프로젝트 (URL/키 준비)

### Install

```bash
npm install
```

### Environment

`.env.example`을 참고해 `.env.local`을 생성합니다.

```bash
cp .env.example .env.local
```

추가로 아래 환경 변수가 필요합니다.

- `NEXT_PUBLIC_APP_URL`: 앱 베이스 URL (예: `https://promptcraft-orcin.vercel.app`)
- `NEXT_PUBLIC_SB_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SB_ANON_KEY`: Supabase anon key
- `SB_SERVICE_ROLE_KEY`: Supabase service role key
- `TOSS_CLIENT_KEY`: 토스 결제 클라이언트 키
- `TOSS_SECRET_KEY`: 토스 결제 시크릿 키
- `TOSS_API_BASE_URL`: 기본 `https://api.tosspayments.com/v1` (선택)

## Supabase Billing Cron

정기 결제는 Supabase Edge Function + Cron을 사용합니다.

1) Edge Function 배포
```bash
supabase functions deploy billing-charge --no-verify-jwt
```

2) 함수용 환경 변수 설정
```bash
supabase secrets set \
  SB_URL=your_project_url \
  SB_SERVICE_ROLE_KEY=your_service_role_key \
  TOSS_SECRET_KEY=your_toss_secret_key \
  TOSS_API_BASE_URL=https://api.tosspayments.com/v1
```

3) Supabase Dashboard에서 Cron 등록
- Project → Edge Functions → Schedules
- Function: `billing-charge`
- Schedule: `0 0 * * *` (매일 00:00 UTC, 필요 시 변경)

### Run

```bash
npm run dev
```

Open `http://localhost:3000` to view the app.

## Routes

- `/` 랜딩
- `/pricing` 요금제
- `/app` 대시보드 (로그인 필요)
- `/app/builder` 프롬프트 빌더
- `/app/library` 저장된 프롬프트
- `/app/billing` 결제/플랜

## API

- `POST /api/prompts/create` 템플릿 기반 프롬프트 생성
- `POST /api/rewrite` Pro 전용 리라이팅
- `POST /api/payments/toss/confirm` 결제 승인 (TODO)
- `POST /api/payments/toss/webhook` 결제 웹훅 (TODO)

## Notes

- OpenAI 호출은 서버 Route Handler에서만 수행됩니다.
- Supabase RLS 정책은 별도 구성 필요.
- Toss Payments는 placeholder로만 구현되어 있습니다.

## Deploy

Vercel 배포를 기본 가정합니다. `.env.local` 값을 Vercel 환경 변수로 옮기세요.

## TODO

- Toss Payments 실연동
- Supabase RLS 정책/SQL
- 템플릿 관리자 기능
