# Testing Checklist

## Auth Flow
- Google OAuth login succeeds and redirects to `/app`
- Unauthenticated access to `/app` redirects to `/pricing`
- Session persists on refresh (no unexpected logout)

## API Authorization
- `POST /api/prompts/create` returns 401 when unauthenticated
- `POST /api/rewrite` returns 401 when unauthenticated
- Using another user's `prompt_id` in rewrite returns 404

## RLS Scenarios
- `prompts`: user can select/insert/update/delete only their own rows
- `rewrites`: user can select/insert only their own rows
- `templates`: only `is_active = true` rows are readable
- `subscriptions`: user can select/update only their own row
