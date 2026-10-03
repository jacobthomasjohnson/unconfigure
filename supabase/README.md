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
