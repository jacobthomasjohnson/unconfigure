-- Administrator membership is keyed to a verified Supabase auth user. The
-- table remains private; application clients can only ask whether the current
-- authenticated session is an administrator.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as administrator
    where administrator.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- This initial admin surface exposes scheduling metadata only. Answers stay
-- private until a later write workflow has its own validation contract.
create or replace function public.get_admin_daily_games()
returns table (
  date date,
  topic text,
  status text,
  item_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.admin_users as administrator
    where administrator.user_id = (select auth.uid())
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  return query
  select
    daily_game.date,
    coalesce(daily_game.topic::text, ''),
    daily_game.status,
    case
      when jsonb_typeof(daily_game.answers::jsonb) = 'object'
        then jsonb_object_length(daily_game.answers::jsonb)::bigint
      else 0::bigint
    end
  from public.daily_games as daily_game
  order by daily_game.date asc;
end;
$$;

revoke all on function public.get_admin_daily_games()
  from public, anon, authenticated;
grant execute on function public.get_admin_daily_games() to authenticated;
