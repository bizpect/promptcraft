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

create or replace function public.get_current_user_profile()
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text
) language sql security invoker as $$
  select u.id, u.email, u.display_name, u.avatar_url
  from public.users as u
  where u.id = auth.uid();
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
  provider_code text,
  tokens_in integer,
  tokens_out integer
)
returns void language sql security invoker as $$
  insert into public.rewrites (
    user_id,
    prompt_id,
    rewritten_prompt,
    provider_code,
    tokens_in,
    tokens_out
  )
  values (
    auth.uid(),
    prompt_id,
    rewritten_prompt,
    provider_code,
    tokens_in,
    tokens_out
  );
$$;
