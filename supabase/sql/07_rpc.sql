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
  title text,
  description text
) language sql security invoker as $$
  select t.id, t.platform_code, t.title, t.description
  from public.templates as t
  where t.platform_code = platform_code_input
    and t.is_active = true
  order by t.created_at asc;
$$;

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
  rewrite_limit integer
) language sql security invoker as $$
  select
    s.plan_code,
    plan.label as plan_label,
    s.status_code,
    status.label as status_label,
    s.rewrite_used,
    s.rewrite_limit
  from public.subscriptions as s
  left join public.common_codes as plan
    on plan.code_group = s.plan_group
   and plan.code = s.plan_code
  left join public.common_codes as status
    on status.code_group = s.status_group
   and status.code = s.status_code
  where s.user_id = auth.uid();
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
