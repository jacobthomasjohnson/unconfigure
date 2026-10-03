# Supabase migrations

Apply migrations before deploying application code that depends on them.

`202610030001_secure_game_progress.sql` changes progress ownership from a
browser-supplied identifier to an authenticated Supabase user ID. It:

- copies rows that do not belong to `auth.users` into
  `game_progress_identity_quarantine`;
- removes those unsafe legacy rows from the live progress table;
- normalizes progress JSON columns and adds `guesses` and `updated_at`;
- adds the `(user_id, date)` uniqueness and `auth.users` foreign-key
  constraints; and
- replaces all existing `game_progress` policies with owner-only RLS policies.

Back up the database before applying the migration. Afterward, inspect the
quarantine table before deciding whether its legacy anonymous records should
be retained or permanently removed. The quarantine table is not accessible to
anonymous or authenticated application clients.

`202610030002_secure_daily_games.sql` makes daily-game dates unique, revokes
direct public reads of `daily_games`, and exposes a narrow `get_daily_game`
function. The function returns only games dated on or before the current date
in `America/Chicago`, preventing public clients from downloading future
answers. For a no-downtime rollout, deploy the application route first, then
apply this migration; the route has a temporary fallback for the pre-migration
schema.

`202610030003_add_daily_game_publication_states.sql` introduces explicit
`draft` and `published` states. Existing rows are backfilled to `published`,
while new rows default to `draft`. Drafts may be incomplete, but changing a
game to `published` succeeds only when it has a topic and exactly eight unique
integer chronology values. The public game function returns only published
games dated on or before the current date, so an unpublished game is
indistinguishable from a missing game to players.

The publication-content constraint is introduced as `NOT VALID` so legacy
scheduled games remain available even if they predate the stricter rules. The
constraint still applies to every newly inserted or updated row. After legacy
content has been audited and corrected, finish the rollout with:

```sql
alter table public.daily_games
  validate constraint daily_games_published_content_check;
```

Apply this migration before creating new games that rely on the `draft`
default. Publishing is currently an administrative database operation:

```sql
update public.daily_games
set status = 'published'
where date = 'YYYY-MM-DD';
```

`202610030004_normalize_game_progress_dates.sql` converts progress dates to
PostgreSQL's native `date` type. Application APIs continue to exchange these
calendar values as canonical `YYYY-MM-DD` strings. The migration fails on an
invalid legacy value so malformed progress is not silently reassigned.

`202610030005_create_admin_game_access.sql` creates the private
`admin_users` membership table and two authenticated functions used by the
read-only `/admin/games` foundation. The schedule function returns dates,
topics, publication states, and item counts, but never game answers.

Bootstrap the first administrator using their stable Supabase auth user ID:

```sql
insert into public.admin_users (user_id)
values ('AUTH-USER-UUID');
```

Do not use an email address as the authorization key. Additional administrators
must be added through a trusted database operation until a dedicated role
management workflow exists.

`202610030006_fix_admin_game_item_count.sql` keeps the same protected schedule
contract while using `jsonb_each` to calculate item counts for compatibility
with the linked PostgreSQL instance.

`202610030007_add_admin_draft_writes.sql` adds administrator-only functions to
create, update, and retrieve drafts. Direct writes to `daily_games` remain
revoked. Drafts may be incomplete, but their populated items must have unique
labels and integer chronology values. Published rows cannot be modified by the
draft update function.
