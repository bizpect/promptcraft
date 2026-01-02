insert into public.common_codes (code_group, code, label, sort_order)
values
  ('platform', 'sora', 'Sora', 1),
  ('platform', 'veo', 'Veo', 2),
  ('subscription_plan', 'free', 'Free', 1),
  ('subscription_plan', 'pro', 'Pro', 2),
  ('subscription_status', 'active', 'Active', 1),
  ('subscription_status', 'inactive', 'Inactive', 2),
  ('subscription_status', 'canceled', 'Canceled', 3),
  ('rewrite_provider', 'openai', 'OpenAI', 1)
on conflict (code_group, code) do nothing;
