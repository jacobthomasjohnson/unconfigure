-- The linked Postgres instance does not provide jsonb_object_length(jsonb).
-- Count object entries using jsonb_each, which is already used by the daily
-- game validation functions and preserves the metadata-only admin contract.
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
        then (
          select count(*)
          from jsonb_each(daily_game.answers::jsonb)
        )
      else 0::bigint
    end
  from public.daily_games as daily_game
  order by daily_game.date asc;
end;
$$;

revoke all on function public.get_admin_daily_games()
  from public, anon, authenticated;
grant execute on function public.get_admin_daily_games() to authenticated;
