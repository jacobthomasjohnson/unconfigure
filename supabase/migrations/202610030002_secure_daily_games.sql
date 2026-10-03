-- A daily date must identify at most one game.
alter table public.daily_games
  alter column date set not null;

create unique index if not exists daily_games_date_key
  on public.daily_games (date);

-- Only expose games that are available in the product's authoritative timezone.
-- SECURITY DEFINER permits this narrow read after direct table access is revoked.
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
    daily_game.topic,
    daily_game.answers::jsonb
  from public.daily_games as daily_game
  where daily_game.date = requested_date
    and requested_date <= (now() at time zone 'America/Chicago')::date;
$$;

revoke all on function public.get_daily_game(date) from public;
grant execute on function public.get_daily_game(date) to anon, authenticated;

-- Policies alone do not prevent clients from selecting future answer rows when
-- a broad SELECT policy exists. Remove the table privilege entirely; dashboard,
-- postgres, and service-role administration remain unaffected.
revoke select on table public.daily_games from public, anon, authenticated;
