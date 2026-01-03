# Repository Guidelines

## 프로젝트 구조 & 모듈 구성
- `src/app`: Next.js App Router 페이지, 레이아웃, API 라우트 핸들러.
- `src/components`: 공용 UI 컴포넌트(버튼, 레이아웃 프리미티브).
- `src/lib`: 핵심 로직(Supabase 클라이언트, DB repository, 템플릿, auth guard).
- `public`: 정적 에셋.
- `supabase/sql`: DB 초기화용 SQL 및 RLS 정책.
- `docs`: 프로젝트 노트/체크리스트(예: `docs/testing-checklist.md`).

## 빌드/테스트/로컬 실행 명령
- `npm run dev`: `http://localhost:3000`에서 개발 서버 실행.
- `npm run build`: 프로덕션 번들 빌드.
- `npm run start`: `.next` 결과로 프로덕션 서버 실행.
- `npm run lint`: ESLint로 기본 코드 검사.

## 코딩 스타일 & 네이밍 규칙
- TypeScript + React(App Router). 기존 포맷 유지(2칸 들여쓰기).
- named export 우선, 기능별 헬퍼는 `src/lib`에 모으기.
- API 라우트는 얇게 유지하고 DB 접근은 `src/lib/db/*` repository로 분리.
- 재사용 가능한 로직은 반드시 공통 유틸/헬퍼로 승격(중복 금지).
- 테이블별 코드값(상태, 타입, 분류 등)은 개별 테이블에 흩뿌리지 않고 공통 코드 테이블로 정의해 참조하기.
- 모든 DB 접근은 RPC로만 처리하고, 모든 RPC는 RLS 정책을 준수해야 한다.
- 네이밍: 팩토리는 `createServerSupabase`, `createBrowserSupabase` 형태, repo는 `fetch*`/`insert*`.
- 문제 해결은 임시방편보다 근본 원인부터 확인하고 구조적으로 해결한다.

## 테스트 가이드
- 현재 자동화 테스트 러너는 미구성.
- 수동 검증은 `docs/testing-checklist.md`를 기준으로 진행.
- 향후 테스트 추가 시 기능 근처에 배치(예: `src/lib/__tests__`)하고 이 문서에 실행 명령을 기록.

## 커밋 & PR 가이드
- Git 히스토리는 “Initial MVP scaffold”만 있어 컨벤션이 정립되지 않음.
- 짧고 명확한 메시지 사용(예: `feat: add google oauth flow`, `fix: handle null prompt`).
- PR에는 요약, 테스트 결과, UI 변경 시 스크린샷 포함.

## 보안 & 설정 노트
- 실행 전 `.env.example`을 `.env.local`로 복사하고 Supabase 키 설정.
- `supabase/sql`의 SQL은 순서대로 적용해야 앱 기대치와 일치.
- DB 관련 작업 전 아래 파일을 반드시 참고:
  - `supabase/sql/00_extensions.sql`
  - `supabase/sql/01_tables.sql`
  - `supabase/sql/02_functions.sql`
  - `supabase/sql/03_triggers.sql`
  - `supabase/sql/04_rls.sql`
  - `supabase/sql/05_indexes.sql`
  - `supabase/sql/06_codes.sql`
