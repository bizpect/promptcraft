create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
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
