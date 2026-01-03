
create table if not exists public.common_codes (
  id uuid primary key default gen_random_uuid(),
  code_group text not null,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code_group, code)
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  login_type_group text not null default 'login_provider'
    check (login_type_group = 'login_provider'),
  login_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_login_type_fk
    foreign key (login_type_group, login_type)
    references public.common_codes (code_group, code)
);

create table if not exists public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  login_type_group text not null default 'login_provider'
    check (login_type_group = 'login_provider'),
  login_type text not null,
  created_at timestamptz not null default now(),
  constraint login_logs_login_type_fk
    foreign key (login_type_group, login_type)
    references public.common_codes (code_group, code)
);


create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_group text not null default 'subscription_plan'
    check (plan_group = 'subscription_plan'),
  plan_code text not null,
  status_group text not null default 'subscription_status'
    check (status_group = 'subscription_status'),
  status_code text not null,
  rewrite_used integer not null default 0,
  rewrite_limit integer not null default 0,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_fk
    foreign key (plan_group, plan_code)
    references public.common_codes (code_group, code),
  constraint subscriptions_status_fk
    foreign key (status_group, status_code)
    references public.common_codes (code_group, code)
);

create table if not exists public.billing_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider_group text not null default 'payment_provider'
    check (provider_group = 'payment_provider'),
  provider_code text not null,
  status_group text not null default 'billing_status'
    check (status_group = 'billing_status'),
  status_code text not null,
  customer_key text not null,
  billing_key text not null,
  card_summary text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_profiles_provider_fk
    foreign key (provider_group, provider_code)
    references public.common_codes (code_group, code),
  constraint billing_profiles_status_fk
    foreign key (status_group, status_code)
    references public.common_codes (code_group, code),
  unique (provider_group, provider_code, billing_key)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_group text not null default 'payment_provider'
    check (provider_group = 'payment_provider'),
  provider_code text not null,
  status_group text not null default 'payment_status'
    check (status_group = 'payment_status'),
  status_code text not null,
  order_id text not null,
  payment_key text,
  amount integer not null,
  currency text not null default 'KRW',
  method text,
  requested_at timestamptz,
  approved_at timestamptz,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_fk
    foreign key (provider_group, provider_code)
    references public.common_codes (code_group, code),
  constraint payments_status_fk
    foreign key (status_group, status_code)
    references public.common_codes (code_group, code),
  unique (provider_group, provider_code, order_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments (id) on delete cascade,
  provider_group text not null default 'payment_provider'
    check (provider_group = 'payment_provider'),
  provider_code text not null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  constraint payment_events_provider_fk
    foreign key (provider_group, provider_code)
    references public.common_codes (code_group, code)
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  platform_group text not null default 'platform'
    check (platform_group = 'platform'),
  platform_code text not null,
  base_prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_platform_fk
    foreign key (platform_group, platform_code)
    references public.common_codes (code_group, code)
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  platform_group text not null default 'platform'
    check (platform_group = 'platform'),
  platform_code text not null,
  title text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompts_platform_fk
    foreign key (platform_group, platform_code)
    references public.common_codes (code_group, code)
);

create table if not exists public.rewrites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid references public.prompts (id) on delete set null,
  rewritten_prompt text not null,
  source_prompt text,
  provider_group text not null default 'rewrite_provider'
    check (provider_group = 'rewrite_provider'),
  provider_code text not null,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now(),
  constraint rewrites_provider_fk
    foreign key (provider_group, provider_code)
    references public.common_codes (code_group, code)
);
