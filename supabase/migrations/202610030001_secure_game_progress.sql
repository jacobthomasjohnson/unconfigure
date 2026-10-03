-- Quarantine legacy anonymous rows before tying progress ownership to auth.users.
-- These rows used browser-generated IDs as bearer credentials and cannot be
-- safely associated with an authenticated account.
create table public.game_progress_identity_quarantine as
select *, now() as quarantined_at
from public.game_progress
where false;

insert into public.game_progress_identity_quarantine
select progress.*, now()
from public.game_progress as progress
left join auth.users as account
  on account.id::text = progress.user_id::text
where account.id is null or progress.date is null;

delete from public.game_progress as progress
where not exists (
  select 1
  from auth.users as account
  where account.id::text = progress.user_id::text
) or progress.date is null;

alter table public.game_progress_identity_quarantine enable row level security;
revoke all on table public.game_progress_identity_quarantine from anon, authenticated;

-- Existing policies may reference columns whose types are normalized below.
-- PostgreSQL requires those policies to be removed before altering the columns.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'game_progress'
  loop
    execute format(
      'drop policy if exists %I on public.game_progress',
      policy_record.policyname
    );
  end loop;
end
$$;

alter table public.game_progress
  add column if not exists guesses jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  target_column text;
  column_type text;
begin
  foreach target_column in array array['emoji_results', 'final_guess']
  loop
    select c.data_type
      into column_type
    from information_schema.columns as c
    where c.table_schema = 'public'
      and c.table_name = 'game_progress'
      and c.column_name = target_column;

    if column_type in ('text', 'character varying') then
      execute format(
        'alter table public.game_progress alter column %I type jsonb using coalesce(nullif(%I, '''')::jsonb, ''[]''::jsonb)',
        target_column,
        target_column
      );
    elsif column_type <> 'jsonb' then
      execute format(
        'alter table public.game_progress alter column %I type jsonb using to_jsonb(%I)',
        target_column,
        target_column
      );
    end if;
  end loop;
end
$$;

update public.game_progress
set emoji_results = coalesce(emoji_results, '[]'::jsonb),
    final_guess = coalesce(final_guess, '[]'::jsonb),
    guesses = coalesce(guesses, '[]'::jsonb),
    attempts = coalesce(attempts, 0);

update public.game_progress
set result = 'in_progress'
where result is null or result not in ('in_progress', 'win', 'lose');

alter table public.game_progress
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set not null,
  alter column date set not null,
  alter column result set not null,
  alter column attempts set default 0,
  alter column attempts set not null,
  alter column guesses set default '[]'::jsonb,
  alter column emoji_results set default '[]'::jsonb,
  alter column final_guess set default '[]'::jsonb,
  alter column guesses set not null,
  alter column emoji_results set not null,
  alter column final_guess set not null;

alter table public.game_progress
  drop constraint if exists game_progress_result_check,
  add constraint game_progress_result_check
    check (result in ('in_progress', 'win', 'lose')),
  drop constraint if exists game_progress_user_id_fkey,
  add constraint game_progress_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

create unique index if not exists game_progress_user_id_date_key
  on public.game_progress (user_id, date);

alter table public.game_progress enable row level security;

create policy "Players can read their progress"
  on public.game_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players can insert their progress"
  on public.game_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players can update their progress"
  on public.game_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players can delete their progress"
  on public.game_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.game_progress from anon;
grant select, insert, update, delete on table public.game_progress to authenticated;
