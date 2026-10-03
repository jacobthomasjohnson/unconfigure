import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_ACCESS,
  getAdminGameSchedule,
  resolveAdminAccess,
} from "../app/lib/adminGames.js";

function supabaseClient({ user = null, authError = null, rpc = {} } = {}) {
  const calls = [];

  return {
    calls,
    auth: {
      getUser: async () => ({ data: { user }, error: authError }),
    },
    rpc: async (name) => {
      calls.push(name);
      return rpc[name] ?? { data: null, error: null };
    },
  };
}

test("treats a missing session as signed out without querying admin data", async () => {
  const client = supabaseClient({
    authError: { name: "AuthSessionMissingError" },
  });

  const result = await resolveAdminAccess(client);

  assert.equal(result.status, ADMIN_ACCESS.SIGNED_OUT);
  assert.deepEqual(client.calls, []);
});

test("distinguishes authentication failures from a missing session", async () => {
  const authError = new Error("Authentication service unavailable");
  const client = supabaseClient({ authError });

  const result = await resolveAdminAccess(client);

  assert.equal(result.status, ADMIN_ACCESS.ERROR);
  assert.equal(result.error, authError);
});

test("denies an authenticated account without administrator membership", async () => {
  const client = supabaseClient({
    user: { id: "player-id" },
    rpc: { is_admin: { data: false, error: null } },
  });

  const result = await resolveAdminAccess(client);

  assert.equal(result.status, ADMIN_ACCESS.UNAUTHORIZED);
  assert.deepEqual(client.calls, ["is_admin"]);
});

test("authorizes an administrator from the verified session", async () => {
  const client = supabaseClient({
    user: { id: "admin-id" },
    rpc: { is_admin: { data: true, error: null } },
  });

  const result = await resolveAdminAccess(client);

  assert.equal(result.status, ADMIN_ACCESS.AUTHORIZED);
  assert.equal(result.user.id, "admin-id");
});

test("reports an administrator lookup failure as an access error", async () => {
  const adminError = new Error("Database unavailable");
  const client = supabaseClient({
    user: { id: "player-id" },
    rpc: { is_admin: { data: null, error: adminError } },
  });

  const result = await resolveAdminAccess(client);

  assert.equal(result.status, ADMIN_ACCESS.ERROR);
  assert.equal(result.error, adminError);
});

test("normalizes the metadata-only administrator schedule", async () => {
  const client = supabaseClient({
    rpc: {
      get_admin_daily_games: {
        data: [
          {
            date: "2026-10-04",
            topic: " Tomorrow ",
            status: "draft",
            item_count: 4,
          },
          {
            date: "2026-10-03",
            topic: "Today",
            status: "published",
            item_count: 8,
          },
        ],
        error: null,
      },
    },
  });

  const result = await getAdminGameSchedule(client);

  assert.deepEqual(result.data, [
    {
      date: "2026-10-04",
      topic: "Tomorrow",
      status: "draft",
      itemCount: 4,
    },
    {
      date: "2026-10-03",
      topic: "Today",
      status: "published",
      itemCount: 8,
    },
  ]);
});

test("rejects malformed administrator schedule rows", async () => {
  const client = supabaseClient({
    rpc: {
      get_admin_daily_games: {
        data: [
          {
            date: "2026-02-30",
            topic: "Broken",
            status: "published",
            item_count: 8,
          },
        ],
        error: null,
      },
    },
  });

  const result = await getAdminGameSchedule(client);

  assert.equal(result.data, null);
  assert.match(result.error.message, /invalid data/);
});
