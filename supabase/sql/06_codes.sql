insert into public.common_codes (code_group, code, label, sort_order, metadata)
values
  ('platform', 'sora', 'Sora', 1, '{}'::jsonb),
  ('platform', 'veo', 'Veo', 2, '{}'::jsonb),
  ('subscription_plan', 'free', 'Free', 1, '{"rewrite_limit": 0, "price": 0, "currency": "KRW"}'::jsonb),
  ('subscription_plan', 'pro', 'Pro', 2, '{"rewrite_limit": 20, "price": 4900, "currency": "KRW"}'::jsonb),
  ('subscription_plan', 'max', 'Max', 3, '{"rewrite_limit": 100, "price": 9900, "currency": "KRW"}'::jsonb),
  ('subscription_status', 'active', 'Active', 1, '{}'::jsonb),
  ('subscription_status', 'inactive', 'Inactive', 2, '{}'::jsonb),
  ('subscription_status', 'canceled', 'Canceled', 3, '{}'::jsonb),
  ('rewrite_provider', 'openai', 'OpenAI', 1, '{}'::jsonb),
  ('login_provider', 'G', 'Google', 1, '{}'::jsonb),
  ('login_provider', 'T', 'TikTok', 2, '{}'::jsonb),
  ('login_provider', 'K', 'Kakao', 3, '{}'::jsonb),
  ('login_provider', 'F', 'Facebook', 4, '{}'::jsonb),
  ('payment_provider', 'toss', 'Toss Payments', 1, '{}'::jsonb),
  ('payment_status', 'pending', 'Pending', 1, '{}'::jsonb),
  ('payment_status', 'paid', 'Paid', 2, '{}'::jsonb),
  ('payment_status', 'failed', 'Failed', 3, '{}'::jsonb),
  ('payment_status', 'canceled', 'Canceled', 4, '{}'::jsonb),
  ('billing_status', 'active', 'Active', 1, '{}'::jsonb),
  ('billing_status', 'inactive', 'Inactive', 2, '{}'::jsonb),
  ('billing_status', 'revoked', 'Revoked', 3, '{}'::jsonb)
;
