-- Auth/User bootstrap
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url, login_type_group, login_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    'login_provider',
    case lower(new.raw_app_meta_data->>'provider')
      when 'google' then 'G'
      when 'tiktok' then 'T'
      when 'kakao' then 'K'
      when 'facebook' then 'F'
      else null
    end
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (
    user_id,
    plan_group,
    plan_code,
    status_group,
    status_code,
    rewrite_used,
    rewrite_limit
  )
  values (new.id, 'subscription_plan', 'free', 'subscription_status', 'active', 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Templates
create or replace function public.get_active_template(template_id uuid)
returns table (
  id uuid,
  platform_code text,
  base_prompt text,
  title text
) language sql security invoker as $$
  select t.id, t.platform_code, t.base_prompt, t.title
  from public.templates as t
  where t.id = template_id
    and t.is_active = true;
$$;

create or replace function public.get_active_templates(platform_code_input text)
returns table (
  id uuid,
  platform_code text,
  base_prompt text,
  title text,
  description text
) language sql security invoker as $$
  select t.id, t.platform_code, t.base_prompt, t.title, t.description
  from public.templates as t
  where t.platform_code = platform_code_input
    and t.is_active = true
  order by t.created_at asc;
$$;


-- Prompts
create or replace function public.create_prompt(
  template_id uuid,
  platform_code text,
  title text,
  input_json jsonb,
  output_prompt text
)
returns table (
  id uuid,
  output_prompt text
) language sql security invoker as $$
  insert into public.prompts (
    user_id,
    template_id,
    platform_code,
    title,
    input_json,
    output_prompt
  )
  values (
    auth.uid(),
    template_id,
    platform_code,
    title,
    input_json,
    output_prompt
  )
  returning id, output_prompt;
$$;

create or replace function public.get_prompt_output(prompt_id uuid)
returns table (output_prompt text)
language sql security invoker as $$
  select p.output_prompt
  from public.prompts as p
  where p.id = prompt_id
    and p.user_id = auth.uid();
$$;

create or replace function public.get_user_prompts()
returns table (
  id uuid,
  title text,
  platform_code text,
  output_prompt text,
  created_at timestamptz
) language sql security invoker as $$
  select p.id, p.title, p.platform_code, p.output_prompt, p.created_at
  from public.prompts as p
  where p.user_id = auth.uid()
  order by p.created_at desc;
$$;

create or replace function public.get_prompt_detail(prompt_id uuid)
returns table (
  id uuid,
  title text,
  template_id uuid,
  platform_code text,
  input_json jsonb,
  output_prompt text,
  created_at timestamptz
) language sql security invoker as $$
  select p.id, p.title, p.template_id, p.platform_code, p.input_json, p.output_prompt, p.created_at
  from public.prompts as p
  where p.id = prompt_id
    and p.user_id = auth.uid();
$$;

create or replace function public.delete_prompt(prompt_id uuid)
returns void language sql security invoker as $$
  delete from public.prompts
  where id = prompt_id
    and user_id = auth.uid();
$$;

create or replace function public.update_prompt_title(prompt_id uuid, title_input text)
returns table (
  id uuid,
  title text
) language sql security invoker as $$
  update public.prompts
  set title = title_input,
      updated_at = now()
  where id = prompt_id
    and user_id = auth.uid()
  returning id, title;
$$;

create or replace function public.update_prompt_output(prompt_id uuid, output_prompt_input text)
returns table (
  id uuid,
  output_prompt text
) language sql security invoker as $$
  update public.prompts
  set output_prompt = output_prompt_input,
      updated_at = now()
  where id = prompt_id
    and user_id = auth.uid()
  returning id, output_prompt;
$$;

create or replace function public.duplicate_prompt(prompt_id uuid, title_input text)
returns table (
  id uuid,
  title text
) language sql security invoker as $$
  insert into public.prompts (
    user_id,
    template_id,
    platform_code,
    title,
    input_json,
    output_prompt
  )
  select
    p.user_id,
    p.template_id,
    p.platform_code,
    coalesce(title_input, p.title),
    p.input_json,
    p.output_prompt
  from public.prompts as p
  where p.id = prompt_id
    and p.user_id = auth.uid()
  returning id, title;
$$;


-- Rewrites
create or replace function public.get_rewrites_for_prompt(prompt_id uuid)
returns table (
  id uuid,
  rewritten_prompt text,
  source_prompt text,
  provider_code text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz
) language sql security invoker as $$
  select r.id, r.rewritten_prompt, r.source_prompt, r.provider_code, r.tokens_in, r.tokens_out, r.created_at
  from public.rewrites as r
  where r.prompt_id = prompt_id
    and r.user_id = auth.uid()
  order by r.created_at desc;
$$;


-- Subscriptions
create or replace function public.get_subscription()
returns table (
  plan_code text,
  status_code text,
  rewrite_used integer,
  rewrite_limit integer
) language sql security invoker as $$
  select s.plan_code, s.status_code, s.rewrite_used, s.rewrite_limit
  from public.subscriptions as s
  where s.user_id = auth.uid();
$$;

create or replace function public.get_subscription_with_labels()
returns table (
  plan_code text,
  plan_label text,
  status_code text,
  status_label text,
  rewrite_used integer,
  rewrite_limit integer,
  current_period_end timestamptz,
  cancel_requested_at timestamptz,
  cancel_at timestamptz
) language sql security invoker as $$
  select
    s.plan_code,
    plan.label as plan_label,
    s.status_code,
    status.label as status_label,
    s.rewrite_used,
    s.rewrite_limit,
    s.current_period_end,
    s.cancel_requested_at,
    s.cancel_at
  from public.subscriptions as s
  left join public.common_codes as plan
    on plan.code_group = s.plan_group
   and plan.code = s.plan_code
  left join public.common_codes as status
    on status.code_group = s.status_group
   and status.code = s.status_code
  where s.user_id = auth.uid();
$$;

create or replace function public.schedule_subscription_cancel()
returns void language plpgsql security invoker as $$
begin
  update public.subscriptions
  set
    cancel_requested_at = now(),
    cancel_at = coalesce(current_period_end, now()),
    updated_at = now()
  where user_id = auth.uid();

  update public.billing_profiles
  set
    status_code = 'revoked',
    updated_at = now()
  where user_id = auth.uid();
end;
$$;

create or replace function public.undo_subscription_cancel()
returns void language plpgsql security invoker as $$
begin
  update public.subscriptions
  set
    cancel_requested_at = null,
    cancel_at = null,
    updated_at = now()
  where user_id = auth.uid();

  update public.billing_profiles
  set
    status_code = 'active',
    updated_at = now()
  where user_id = auth.uid()
    and status_code = 'revoked';
end;
$$;

create or replace function public.finalize_subscription_cancellations()
returns integer language plpgsql security invoker as $$
declare
  affected_count integer := 0;
begin
  update public.subscriptions
  set
    status_code = 'canceled',
    updated_at = now()
  where status_code = 'active'
    and cancel_at is not null
    and cancel_at <= now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

create or replace function public.get_user_payments()
returns table (
  id uuid,
  provider_code text,
  provider_label text,
  status_code text,
  status_label text,
  amount integer,
  currency text,
  method text,
  order_id text,
  requested_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz
) language sql security invoker as $$
  select
    p.id,
    p.provider_code,
    provider.label as provider_label,
    p.status_code,
    status.label as status_label,
    p.amount,
    p.currency,
    p.method,
    p.order_id,
    p.requested_at,
    p.approved_at,
    p.created_at
  from public.payments as p
  left join public.common_codes as provider
    on provider.code_group = p.provider_group
   and provider.code = p.provider_code
  left join public.common_codes as status
    on status.code_group = p.status_group
   and status.code = p.status_code
  where p.user_id = auth.uid()
  order by coalesce(p.approved_at, p.created_at) desc;
$$;


-- Payments
create or replace function public.apply_payment_confirmation(
  order_id_input text,
  payment_key_input text,
  amount_input integer,
  currency_input text,
  method_input text,
  requested_at_input timestamptz,
  approved_at_input timestamptz,
  raw_response_input jsonb,
  plan_code_input text,
  provider_code_input text default 'toss'
)
returns table (
  payment_id uuid,
  status_code text
) language plpgsql security invoker as $$
declare
  resolved_limit integer := 0;
  inserted_payment_id uuid;
begin
  select coalesce((metadata->>'rewrite_limit')::int, 0)
    into resolved_limit
  from public.common_codes
  where code_group = 'subscription_plan'
    and code = plan_code_input;

  insert into public.payments (
    user_id,
    provider_code,
    status_code,
    order_id,
    payment_key,
    amount,
    currency,
    method,
    requested_at,
    approved_at,
    raw_response,
    updated_at
  )
  values (
    auth.uid(),
    provider_code_input,
    'paid',
    order_id_input,
    payment_key_input,
    amount_input,
    coalesce(currency_input, 'KRW'),
    method_input,
    requested_at_input,
    approved_at_input,
    coalesce(raw_response_input, '{}'::jsonb),
    now()
  )
  on conflict (provider_group, provider_code, order_id) do update
    set payment_key = excluded.payment_key,
        status_code = 'paid',
        amount = excluded.amount,
        currency = excluded.currency,
        method = excluded.method,
        requested_at = excluded.requested_at,
        approved_at = excluded.approved_at,
        raw_response = excluded.raw_response,
        updated_at = now()
  returning id into inserted_payment_id;

  update public.subscriptions
  set
    plan_code = plan_code_input,
    status_code = 'active',
    rewrite_used = 0,
    rewrite_limit = resolved_limit,
    current_period_end = coalesce(approved_at_input, now()) + interval '30 days',
    updated_at = now()
  where user_id = auth.uid();

  return query
  select inserted_payment_id, 'paid';
end;
$$;

create or replace function public.apply_payment_webhook(
  order_id_input text,
  payment_key_input text,
  status_code_input text,
  amount_input integer,
  currency_input text,
  method_input text,
  requested_at_input timestamptz,
  approved_at_input timestamptz,
  raw_response_input jsonb,
  event_type_input text,
  event_key_input text,
  provider_code_input text default 'toss'
)
returns table (
  payment_id uuid,
  payment_status text,
  user_id uuid
) language plpgsql security invoker as $$
declare
  resolved_payment_id uuid;
  resolved_user_id uuid;
  existing_event_id uuid;
begin
  select p.id, p.user_id
    into resolved_payment_id, resolved_user_id
  from public.payments as p
  where (order_id_input is not null and p.order_id = order_id_input)
     or (payment_key_input is not null and p.payment_key = payment_key_input)
  order by p.created_at desc
  limit 1;

  if event_key_input is not null then
    select e.id
      into existing_event_id
    from public.payment_events as e
    where e.provider_code = provider_code_input
      and e.event_key = event_key_input
    limit 1;

    if existing_event_id is not null then
      return query
      select resolved_payment_id, status_code_input, resolved_user_id;
      return;
    end if;
  end if;

  if resolved_payment_id is not null then
    update public.payments
    set
      payment_key = coalesce(payment_key_input, payment_key),
      status_code = status_code_input,
      amount = coalesce(amount_input, amount),
      currency = coalesce(currency_input, currency),
      method = coalesce(method_input, method),
      requested_at = coalesce(requested_at_input, requested_at),
      approved_at = coalesce(approved_at_input, approved_at),
      raw_response = coalesce(raw_response_input, raw_response),
      updated_at = now()
    where id = resolved_payment_id;

    insert into public.payment_events (
      payment_id,
      provider_code,
      event_type,
      event_key,
      event_payload
    )
    values (
      resolved_payment_id,
      provider_code_input,
      coalesce(event_type_input, 'unknown'),
      event_key_input,
      coalesce(raw_response_input, '{}'::jsonb)
    )
    on conflict (provider_code, event_key)
      where event_key is not null
      do nothing;

    if status_code_input = 'paid' then
      update public.subscriptions
      set
        status_code = 'active',
        updated_at = now()
      where user_id = resolved_user_id;
    elsif status_code_input = 'failed' then
      update public.subscriptions
      set
        status_code = 'inactive',
        updated_at = now()
      where user_id = resolved_user_id;
    elsif status_code_input = 'canceled' then
      update public.subscriptions
      set
        status_code = 'canceled',
        updated_at = now()
      where user_id = resolved_user_id;
    end if;
  else
    insert into public.payment_events (
      payment_id,
      provider_code,
      event_type,
      event_key,
      event_payload
    )
    values (
      null,
      provider_code_input,
      coalesce(event_type_input, 'unknown'),
      event_key_input,
      coalesce(raw_response_input, '{}'::jsonb)
    )
    on conflict (provider_code, event_key)
      where event_key is not null
      do nothing;
  end if;

  return query
  select resolved_payment_id, status_code_input, resolved_user_id;
end;
$$;

create or replace function public.create_payment_event(
  payment_id_input uuid,
  event_type_input text,
  event_payload_input jsonb,
  provider_code_input text default 'toss'
)
returns void language sql security invoker as $$
  insert into public.payment_events (
    payment_id,
    provider_code,
    event_type,
    event_payload
  )
  values (
    payment_id_input,
    provider_code_input,
    coalesce(event_type_input, 'unknown'),
    coalesce(event_payload_input, '{}'::jsonb)
  );
$$;


-- Billing
create or replace function public.get_billing_profile()
returns table (
  user_id uuid,
  provider_code text,
  status_code text,
  customer_key text,
  billing_key text,
  card_summary text,
  updated_at timestamptz
) language sql security invoker as $$
  select
    b.user_id,
    b.provider_code,
    b.status_code,
    b.customer_key,
    b.billing_key,
    b.card_summary,
    b.updated_at
  from public.billing_profiles as b
  where b.user_id = auth.uid();
$$;

create or replace function public.upsert_billing_profile(
  provider_code_input text,
  status_code_input text,
  customer_key_input text,
  billing_key_input text,
  card_summary_input text,
  raw_response_input jsonb
)
returns table (
  user_id uuid,
  provider_code text,
  status_code text,
  customer_key text,
  billing_key text,
  card_summary text,
  updated_at timestamptz
) language sql security invoker as $$
  insert into public.billing_profiles (
    user_id,
    provider_code,
    status_code,
    customer_key,
    billing_key,
    card_summary,
    raw_response,
    updated_at
  )
  values (
    auth.uid(),
    provider_code_input,
    status_code_input,
    customer_key_input,
    billing_key_input,
    card_summary_input,
    coalesce(raw_response_input, '{}'::jsonb),
    now()
  )
  on conflict (user_id) do update
    set provider_code = excluded.provider_code,
        status_code = excluded.status_code,
        customer_key = excluded.customer_key,
        billing_key = excluded.billing_key,
        card_summary = excluded.card_summary,
        raw_response = excluded.raw_response,
        updated_at = now()
  returning
    user_id,
    provider_code,
    status_code,
    customer_key,
    billing_key,
    card_summary,
    updated_at;
$$;

create or replace function public.get_subscription_plan_detail(plan_code_input text)
returns table (
  plan_code text,
  plan_label text,
  price integer,
  currency text,
  rewrite_limit integer
) language sql security invoker as $$
  select
    c.code as plan_code,
    c.label as plan_label,
    coalesce((c.metadata->>'price')::int, 0) as price,
    coalesce(c.metadata->>'currency', 'KRW') as currency,
    coalesce((c.metadata->>'rewrite_limit')::int, 0) as rewrite_limit
  from public.common_codes as c
  where c.code_group = 'subscription_plan'
    and c.code = plan_code_input
    and c.is_active = true;
$$;

create or replace function public.get_due_subscriptions_for_billing(cutoff timestamptz)
returns table (
  user_id uuid,
  plan_code text,
  price integer,
  currency text,
  rewrite_limit integer,
  current_period_end timestamptz,
  billing_key text,
  customer_key text
) language sql security invoker as $$
  select
    s.user_id,
    s.plan_code,
    coalesce((plan.metadata->>'price')::int, 0) as price,
    coalesce(plan.metadata->>'currency', 'KRW') as currency,
    coalesce((plan.metadata->>'rewrite_limit')::int, 0) as rewrite_limit,
    s.current_period_end,
    b.billing_key,
    b.customer_key
  from public.subscriptions as s
  join public.billing_profiles as b
    on b.user_id = s.user_id
  left join public.common_codes as plan
    on plan.code_group = s.plan_group
   and plan.code = s.plan_code
  where s.status_code = 'active'
    and b.status_code = 'active'
    and s.current_period_end is not null
    and s.current_period_end <= cutoff;
$$;

create or replace function public.apply_billing_charge_success(
  user_id_input uuid,
  order_id_input text,
  payment_key_input text,
  amount_input integer,
  currency_input text,
  method_input text,
  requested_at_input timestamptz,
  approved_at_input timestamptz,
  raw_response_input jsonb,
  plan_code_input text,
  provider_code_input text default 'toss'
)
returns table (
  payment_id uuid,
  status_code text
) language plpgsql security invoker as $$
declare
  resolved_limit integer := 0;
  inserted_payment_id uuid;
begin
  if auth.uid() is null and auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  select coalesce((metadata->>'rewrite_limit')::int, 0)
    into resolved_limit
  from public.common_codes
  where code_group = 'subscription_plan'
    and code = plan_code_input;

  insert into public.payments (
    user_id,
    provider_code,
    status_code,
    order_id,
    payment_key,
    amount,
    currency,
    method,
    requested_at,
    approved_at,
    raw_response,
    updated_at
  )
  values (
    user_id_input,
    provider_code_input,
    'paid',
    order_id_input,
    payment_key_input,
    amount_input,
    coalesce(currency_input, 'KRW'),
    method_input,
    requested_at_input,
    approved_at_input,
    coalesce(raw_response_input, '{}'::jsonb),
    now()
  )
  on conflict (provider_group, provider_code, order_id) do update
    set payment_key = excluded.payment_key,
        status_code = 'paid',
        amount = excluded.amount,
        currency = excluded.currency,
        method = excluded.method,
        requested_at = excluded.requested_at,
        approved_at = excluded.approved_at,
        raw_response = excluded.raw_response,
        updated_at = now()
  returning id into inserted_payment_id;

  update public.subscriptions
  set
    plan_code = plan_code_input,
    status_code = 'active',
    rewrite_used = 0,
    rewrite_limit = resolved_limit,
    current_period_end = coalesce(approved_at_input, now()) + interval '30 days',
    updated_at = now()
  where user_id = user_id_input;

  return query
  select inserted_payment_id, 'paid';
end;
$$;

create or replace function public.apply_billing_charge_failure(
  user_id_input uuid,
  order_id_input text,
  payment_key_input text,
  amount_input integer,
  currency_input text,
  raw_response_input jsonb,
  plan_code_input text,
  provider_code_input text default 'toss'
)
returns table (
  payment_id uuid,
  status_code text
) language plpgsql security invoker as $$
declare
  inserted_payment_id uuid;
begin
  if auth.uid() is null and auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  insert into public.payments (
    user_id,
    provider_code,
    status_code,
    order_id,
    payment_key,
    amount,
    currency,
    raw_response,
    updated_at
  )
  values (
    user_id_input,
    provider_code_input,
    'failed',
    order_id_input,
    payment_key_input,
    amount_input,
    coalesce(currency_input, 'KRW'),
    coalesce(raw_response_input, '{}'::jsonb),
    now()
  )
  on conflict (provider_group, provider_code, order_id) do update
    set payment_key = excluded.payment_key,
        status_code = 'failed',
        amount = excluded.amount,
        currency = excluded.currency,
        raw_response = excluded.raw_response,
        updated_at = now()
  returning id into inserted_payment_id;

  update public.subscriptions
  set
    status_code = 'inactive',
    updated_at = now()
  where user_id = user_id_input;

  return query
  select inserted_payment_id, 'failed';
end;
$$;

create or replace function public.apply_billing_charge_failure_retry(
  user_id_input uuid,
  order_id_input text,
  payment_key_input text,
  amount_input integer,
  currency_input text,
  raw_response_input jsonb,
  plan_code_input text,
  provider_code_input text default 'toss'
)
returns table (
  payment_id uuid,
  status_code text
) language plpgsql security invoker as $$
declare
  inserted_payment_id uuid;
begin
  if auth.uid() is null and auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  insert into public.payments (
    user_id,
    provider_code,
    status_code,
    order_id,
    payment_key,
    amount,
    currency,
    raw_response,
    updated_at
  )
  values (
    user_id_input,
    provider_code_input,
    'failed',
    order_id_input,
    payment_key_input,
    amount_input,
    coalesce(currency_input, 'KRW'),
    coalesce(raw_response_input, '{}'::jsonb),
    now()
  )
  on conflict (provider_group, provider_code, order_id) do update
    set payment_key = excluded.payment_key,
        status_code = 'failed',
        amount = excluded.amount,
        currency = excluded.currency,
        raw_response = excluded.raw_response,
        updated_at = now()
  returning id into inserted_payment_id;

  return query
  select inserted_payment_id, 'failed';
end;
$$;

create or replace function public.get_billing_failure_count(
  user_id_input uuid,
  since_input timestamptz,
  provider_code_input text default 'toss'
)
returns integer language sql security invoker as $$
  select count(*)
  from public.payments as p
  where p.user_id = user_id_input
    and p.provider_code = provider_code_input
    and p.status_code = 'failed'
    and (since_input is null or p.created_at >= since_input);
$$;

create or replace function public.get_admin_subscription_totals()
returns table (
  status_code text,
  total bigint
) language plpgsql security invoker as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  return query
  select s.status_code, count(*)
  from public.subscriptions as s
  group by s.status_code
  order by s.status_code;
end;
$$;

create or replace function public.get_admin_plan_totals()
returns table (
  plan_code text,
  total bigint
) language plpgsql security invoker as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  return query
  select s.plan_code, count(*)
  from public.subscriptions as s
  group by s.plan_code
  order by s.plan_code;
end;
$$;

create or replace function public.get_admin_recent_payments(limit_input integer default 20)
returns table (
  id uuid,
  user_id uuid,
  provider_code text,
  status_code text,
  amount integer,
  currency text,
  order_id text,
  created_at timestamptz
) language plpgsql security invoker as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  return query
  select p.id,
    p.user_id,
    p.provider_code,
    p.status_code,
    p.amount,
    p.currency,
    p.order_id,
    p.created_at
  from public.payments as p
  order by p.created_at desc
  limit coalesce(limit_input, 20);
end;
$$;

create or replace function public.apply_billing_key_revoked(
  customer_key_input text,
  billing_key_input text
)
returns table (
  user_id uuid,
  status_code text
) language plpgsql security invoker as $$
declare
  resolved_user_id uuid;
begin
  if auth.uid() is null and auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  select b.user_id
    into resolved_user_id
  from public.billing_profiles as b
  where (billing_key_input is not null and b.billing_key = billing_key_input)
     or (customer_key_input is not null and b.customer_key = customer_key_input)
  limit 1;

  if resolved_user_id is null then
    return query
    select null::uuid, 'not_found';
    return;
  end if;

  update public.billing_profiles
  set
    status_code = 'revoked',
    updated_at = now()
  where user_id = resolved_user_id;

  update public.subscriptions
  set
    status_code = 'inactive',
    updated_at = now()
  where user_id = resolved_user_id;

  return query
  select resolved_user_id, 'revoked';
end;
$$;

create or replace function public.record_payment_attempt(
  plan_code_input text,
  reason_code_input text,
  provider_code_input text default 'toss',
  metadata_input jsonb default '{}'::jsonb
)
returns void language plpgsql security invoker as $$
begin
  if plan_code_input is null or reason_code_input is null then
    return;
  end if;

  if not exists (
    select 1
    from public.common_codes as c
    where c.code_group = 'subscription_plan'
      and c.code = plan_code_input
  ) then
    return;
  end if;

  if not exists (
    select 1
    from public.common_codes as c
    where c.code_group = 'payment_attempt_reason'
      and c.code = reason_code_input
  ) then
    return;
  end if;

  if not exists (
    select 1
    from public.common_codes as c
    where c.code_group = 'payment_provider'
      and c.code = provider_code_input
  ) then
    return;
  end if;

  insert into public.payment_attempts (
    user_id,
    provider_group,
    provider_code,
    plan_group,
    plan_code,
    reason_group,
    reason_code,
    metadata
  )
  values (
    auth.uid(),
    'payment_provider',
    provider_code_input,
    'subscription_plan',
    plan_code_input,
    'payment_attempt_reason',
    reason_code_input,
    metadata_input
  );
end;
$$;


-- Users
create or replace function public.record_login_event(login_type_input text)
returns void language plpgsql security invoker as $$
declare
  resolved_login_type text := login_type_input;
begin
  if resolved_login_type is null then
    return;
  end if;

  if not exists (
    select 1
    from public.common_codes as c
    where c.code_group = 'login_provider'
      and c.code = resolved_login_type
  ) then
    return;
  end if;

  insert into public.login_logs (user_id, login_type_group, login_type)
  values (auth.uid(), 'login_provider', resolved_login_type);

  update public.users
  set
    login_type_group = 'login_provider',
    login_type = resolved_login_type,
    updated_at = now()
  where id = auth.uid();
end;
$$;

create or replace function public.get_current_user_profile()
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  updated_at timestamptz
) language sql security invoker as $$
  select u.id, u.email, u.display_name, u.avatar_url, u.updated_at
  from public.users as u
  where u.id = auth.uid();
$$;

create or replace function public.update_current_user_profile(
  display_name_input text,
  avatar_url_input text
)
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  updated_at timestamptz
) language sql security invoker as $$
  update public.users
  set
    display_name = coalesce(display_name_input, display_name),
    avatar_url = coalesce(avatar_url_input, avatar_url),
    updated_at = now()
  where id = auth.uid()
  returning id, email, display_name, avatar_url, updated_at;
$$;

create or replace function public.update_subscription_rewrite_used(new_value integer)
returns void language sql security invoker as $$
  update public.subscriptions
  set rewrite_used = new_value
  where user_id = auth.uid();
$$;

create or replace function public.create_rewrite(
  prompt_id uuid,
  rewritten_prompt text,
  source_prompt text,
  provider_code text,
  tokens_in integer,
  tokens_out integer
)
returns void language sql security invoker as $$
  insert into public.rewrites (
    user_id,
    prompt_id,
    rewritten_prompt,
    source_prompt,
    provider_code,
    tokens_in,
    tokens_out
  )
  values (
    auth.uid(),
    prompt_id,
    rewritten_prompt,
    source_prompt,
    provider_code,
    tokens_in,
    tokens_out
  );
$$;
