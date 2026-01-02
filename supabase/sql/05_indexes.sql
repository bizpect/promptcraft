create index if not exists prompts_user_id_created_at_idx
  on public.prompts (user_id, created_at desc);

create index if not exists rewrites_user_id_created_at_idx
  on public.rewrites (user_id, created_at desc);

create index if not exists common_codes_group_sort_idx
  on public.common_codes (code_group, sort_order, code);
