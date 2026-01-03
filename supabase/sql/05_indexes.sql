create index if not exists prompts_user_id_created_at_idx
  on public.prompts (user_id, created_at desc);

create index if not exists rewrites_user_id_created_at_idx
  on public.rewrites (user_id, created_at desc);

create index if not exists billing_profiles_user_id_idx
  on public.billing_profiles (user_id);

create index if not exists payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

create index if not exists payment_events_payment_id_received_at_idx
  on public.payment_events (payment_id, received_at desc);

create index if not exists login_logs_user_id_created_at_idx
  on public.login_logs (user_id, created_at desc);

create index if not exists common_codes_group_sort_idx
  on public.common_codes (code_group, sort_order, code);
