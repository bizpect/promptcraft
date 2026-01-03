# 릴리스 체크리스트

## 1. 환경변수
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SB_URL`
- [ ] `NEXT_PUBLIC_SB_ANON_KEY`
- [ ] `SB_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_MODEL` (예: `gpt-4o-mini`)
- [ ] `CRON_SECRET`
- [ ] `ADMIN_EMAILS` (콤마 구분)
- [ ] `TOSS_CLIENT_KEY` (결제 실연동 시)
- [ ] `TOSS_SECRET_KEY` (결제 실연동 시)
- [ ] `TOSS_WEBHOOK_SECRET` (웹훅 서명 가능 이벤트 시)

## 2. Supabase SQL 적용
- [ ] `supabase/sql/00_extensions.sql`
- [ ] `supabase/sql/01_tables.sql`
- [ ] `supabase/sql/02_functions.sql`
- [ ] `supabase/sql/03_triggers.sql`
- [ ] `supabase/sql/04_rls.sql`
- [ ] `supabase/sql/05_indexes.sql`
- [ ] `supabase/sql/06_codes.sql`

## 3. 데이터 시딩
- [ ] `templates` 테이블에 템플릿 데이터 삽입
- [ ] 테스트용 계정/프로필 확인

## 4. 크론/배치
- [ ] GitHub Actions `billing-cron` 정상 실행 확인
- [ ] `CRON_SECRET`, `CRON_URL` GitHub Secrets 등록

## 5. 기능 테스트 (수동)
- [ ] 로그인/세션 유지
- [ ] 템플릿 선택 → 프롬프트 생성
- [ ] 라이브러리 상세 확인
- [ ] 리라이팅 실행 및 히스토리 확인
- [ ] 리라이팅 결과 “현재 프롬프트로 적용”
- [ ] 라이브러리 검색/필터
- [ ] 결제/해지(운영 연동 시)

## 6. 운영 체크
- [ ] 관리자 대시보드(`/app/admin/billing`) 접근 확인
- [ ] 프롬프트/리라이팅 저장 정상 여부 확인
- [ ] 로그에서 오류 없는지 확인

