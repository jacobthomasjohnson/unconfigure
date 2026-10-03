-- Progress belongs to a daily game, so its date is a calendar value rather
-- than a timestamp or free-form string. Invalid legacy values intentionally
-- fail this migration instead of being silently changed.
alter table public.game_progress
  alter column date type date using date::date,
  alter column date set not null;
