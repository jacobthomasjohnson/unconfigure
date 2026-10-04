-- Give each daily game an identity that remains stable if its publication date
-- ever changes. The date stays unique because it is still the public schedule
-- coordinate, but progress ownership no longer depends on it.
alter table public.daily_games
  add column if not exists id uuid default gen_random_uuid();

update public.daily_games
set id = gen_random_uuid()
where id is null;

alter table public.daily_games
  alter column id set default gen_random_uuid(),
  alter column id set not null;

create unique index if not exists daily_games_id_key
  on public.daily_games (id);

alter table public.game_progress
  add column if not exists game_id uuid;

update public.game_progress as progress
set game_id = daily_game.id
from public.daily_games as daily_game
where progress.game_id is null
  and progress.date = daily_game.date;

-- Preserve any legacy progress whose game no longer exists instead of silently
-- assigning it to another date or failing the entire migration.
create table if not exists public.game_progress_game_quarantine as
select progress.*, now() as quarantined_at
from public.game_progress as progress
where false;

insert into public.game_progress_game_quarantine
select progress.*, now()
from public.game_progress as progress
where progress.game_id is null;

delete from public.game_progress
where game_id is null;

alter table public.game_progress
  alter column game_id set not null,
  drop constraint if exists game_progress_game_id_fkey,
  add constraint game_progress_game_id_fkey
    foreign key (game_id) references public.daily_games(id) on delete cascade;

create unique index if not exists game_progress_user_id_game_id_key
  on public.game_progress (user_id, game_id);

-- Keep date as validated display metadata during the compatibility window. The
-- trigger also lets an older deployed client populate game_id from its date,
-- while rejecting a payload whose two identifiers point at different games.
create or replace function public.sync_game_progress_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_game_id uuid;
  resolved_date date;
begin
  if new.game_id is null and new.date is not null then
    select daily_game.id
    into resolved_game_id
    from public.daily_games as daily_game
    where daily_game.date = new.date;

    new.game_id := resolved_game_id;
  elsif new.date is null and new.game_id is not null then
    select daily_game.date
    into resolved_date
    from public.daily_games as daily_game
    where daily_game.id = new.game_id;

    new.date := resolved_date;
  elsif new.game_id is not null and new.date is not null then
    if not exists (
      select 1
      from public.daily_games as daily_game
      where daily_game.id = new.game_id
        and daily_game.date = new.date
    ) then
      raise exception 'Progress game_id and date do not identify the same game.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_game_progress_identity()
  from public, anon, authenticated;

drop trigger if exists sync_game_progress_identity on public.game_progress;
create trigger sync_game_progress_identity
before insert or update of game_id, date on public.game_progress
for each row execute function public.sync_game_progress_identity();

-- If scheduling tools later move a game to another date, keep the redundant
-- display date aligned without changing the progress relationship.
create or replace function public.sync_game_progress_display_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_progress as progress
  set date = new.date
  where progress.game_id = new.id;

  return new;
end;
$$;

revoke all on function public.sync_game_progress_display_date()
  from public, anon, authenticated;

drop trigger if exists sync_game_progress_display_date on public.daily_games;
create trigger sync_game_progress_display_date
after update of date on public.daily_games
for each row
when (old.date is distinct from new.date)
execute function public.sync_game_progress_display_date();

alter table public.game_progress_game_quarantine enable row level security;
revoke all on table public.game_progress_game_quarantine
  from public, anon, authenticated;

-- Include the stable identifier in the public game contract. Published/future
-- answer protections remain unchanged.
drop function if exists public.get_daily_game(date);

create function public.get_daily_game(requested_date date)
returns table (
  id uuid,
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
    daily_game.id,
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
