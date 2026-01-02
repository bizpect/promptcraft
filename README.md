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
