-- Existing games are already live, so preserve their current behavior while
-- making every future game an explicit draft until it is published.
alter table public.daily_games
  add column status text;

update public.daily_games
set status = 'published';

alter table public.daily_games
  alter column status set default 'draft',
  alter column status set not null,
  add constraint daily_games_status_check
    check (status in ('draft', 'published'));

-- Drafts may be incomplete while they are being prepared. Published games
-- must satisfy the core gameplay invariants at the database boundary.
create or replace function public.is_valid_daily_game_content(
  game_topic text,
  game_answers jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(length(btrim(game_topic)) > 0, false)
      and jsonb_typeof(game_answers) = 'object'
    then
      (
        select count(*)
        from jsonb_each_text(game_answers)
      ) = 8
      and not exists (
        select 1
        from jsonb_each_text(game_answers) as answer(label, chronology)
        where length(btrim(answer.label)) = 0
          or btrim(answer.chronology) !~ '^-?[0-9]+$'
      )
      and (
        select count(distinct lower(btrim(answer.label)))
        from jsonb_each_text(game_answers) as answer(label, chronology)
      ) = 8
      and (
        select count(distinct btrim(answer.chronology)::numeric)
        from jsonb_each_text(game_answers) as answer(label, chronology)
        where btrim(answer.chronology) ~ '^-?[0-9]+$'
      ) = 8
    else false
  end;
$$;

revoke all on function public.is_valid_daily_game_content(text, jsonb)
  from public, anon, authenticated;

alter table public.daily_games
  add constraint daily_games_published_content_check
    check (
      status = 'draft'
      or public.is_valid_daily_game_content(topic::text, answers::jsonb)
    ) not valid;

-- Keep draft existence and answers private. A draft date must look exactly
-- like a missing game to application clients.
create or replace function public.get_daily_game(requested_date date)
returns table (
  date date,
  topic text,
  answers jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    daily_game.date,
    daily_game.topic::text,
    daily_game.answers::jsonb
  from public.daily_games as daily_game
  where daily_game.date = requested_date
    and daily_game.status = 'published'
    and requested_date <= (now() at time zone 'America/Chicago')::date;
$$;

revoke all on function public.get_daily_game(date) from public;
grant execute on function public.get_daily_game(date) to anon, authenticated;
