alter table public.users enable row level security;
alter table public.common_codes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.templates enable row level security;
alter table public.prompts enable row level security;
alter table public.rewrites enable row level security;

create policy "users_select_own"
  on public.users
  for select
  using (id = auth.uid());

create policy "users_update_own"
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "common_codes_public_read"
  on public.common_codes
  for select
  using (is_active = true);

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (user_id = auth.uid());

create policy "subscriptions_update_own"
  on public.subscriptions
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "templates_public_read"
  on public.templates
  for select
  using (is_active = true);

create policy "prompts_select_own"
  on public.prompts
  for select
  using (user_id = auth.uid());

create policy "prompts_insert_own"
  on public.prompts
  for insert
  with check (user_id = auth.uid());

create policy "prompts_update_own"
  on public.prompts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "prompts_delete_own"
  on public.prompts
  for delete
  using (user_id = auth.uid());

create policy "rewrites_select_own"
  on public.rewrites
  for select
  using (user_id = auth.uid());

create policy "rewrites_insert_own"
  on public.rewrites
  for insert
  with check (user_id = auth.uid());
