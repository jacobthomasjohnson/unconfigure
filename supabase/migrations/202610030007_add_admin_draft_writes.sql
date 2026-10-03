-- Draft writes remain behind verified administrator membership. Application
-- clients receive function access only; direct daily_games writes stay closed.
create or replace function public.is_valid_daily_game_draft_content(
  game_topic text,
  game_answers jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(length(game_topic) <= 160, false)
      and jsonb_typeof(game_answers) = 'object'
    then
      (
        select count(*)
        from jsonb_each_text(game_answers)
      ) <= 8
      and not exists (
        select 1
        from jsonb_each_text(game_answers) as answer(label, chronology)
        where length(btrim(answer.label)) = 0
          or length(answer.label) > 200
          or length(btrim(answer.chronology)) > 20
          or btrim(answer.chronology) !~ '^-?[0-9]+$'
      )
      and not exists (
        select 1
        from jsonb_each(game_answers) as answer(label, chronology)
        where jsonb_typeof(answer.chronology) <> 'string'
      )
      and (
        select count(distinct lower(btrim(answer.label)))
        from jsonb_each_text(game_answers) as answer(label, chronology)
      ) = (
        select count(*)
        from jsonb_each_text(game_answers)
      )
    else false
  end;
$$;

revoke all on function public.is_valid_daily_game_draft_content(text, jsonb)
  from public, anon, authenticated;

create or replace function public.create_admin_daily_game_draft(
  requested_date date,
  game_topic text,
  game_answers jsonb
)
returns void
language plpgsql
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

  if requested_date is null
    or not coalesce(
      public.is_valid_daily_game_draft_content(game_topic, game_answers),
      false
    )
  then
    raise exception 'Invalid daily-game draft.' using errcode = '22023';
  end if;

  insert into public.daily_games (date, topic, answers, status)
  values (requested_date, game_topic, game_answers, 'draft');
end;
$$;

revoke all on function public.create_admin_daily_game_draft(date, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_admin_daily_game_draft(date, text, jsonb)
  to authenticated;

create or replace function public.update_admin_daily_game_draft(
  requested_date date,
  game_topic text,
  game_answers jsonb
)
returns void
language plpgsql
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

  if requested_date is null
    or not coalesce(
      public.is_valid_daily_game_draft_content(game_topic, game_answers),
      false
    )
  then
    raise exception 'Invalid daily-game draft.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.daily_games as daily_game
    where daily_game.date = requested_date
      and daily_game.status = 'published'
  ) then
    raise exception 'Published games cannot be edited as drafts.'
      using errcode = '55000';
  end if;

  update public.daily_games as daily_game
  set topic = game_topic,
      answers = game_answers
  where daily_game.date = requested_date
    and daily_game.status = 'draft';

  if not found then
    raise exception 'Daily-game draft not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.update_admin_daily_game_draft(date, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_admin_daily_game_draft(date, text, jsonb)
  to authenticated;

create or replace function public.get_admin_daily_game(requested_date date)
returns table (
  date date,
  topic text,
  answers jsonb,
  status text
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
    daily_game.answers::jsonb,
    daily_game.status
  from public.daily_games as daily_game
  where daily_game.date = requested_date;
end;
$$;

revoke all on function public.get_admin_daily_game(date)
  from public, anon, authenticated;
grant execute on function public.get_admin_daily_game(date) to authenticated;
