import test from "node:test";
import assert from "node:assert/strict";

import { resolveProgressGame } from "../app/lib/progressGame.js";

const game = {
  id: "11111111-1111-4111-8111-111111111111",
  date: "2026-10-03",
  topic: "Example topic",
  answers: {
    One: "2001",
    Two: "2002",
    Three: "2003",
    Four: "2004",
    Five: "2005",
    Six: "2006",
    Seven: "2007",
    Eight: "2008",
  },
};

function supabaseResult(result) {
  return {
    rpc: async (name, parameters) => {
      assert.equal(name, "get_daily_game");
      assert.deepEqual(parameters, { requested_date: "2026-10-03" });
      return result;
    },
  };
}

test("resolves legacy date-only progress to the stable game ID", async () => {
  const result = await resolveProgressGame(
    supabaseResult({ data: [game], error: null }),
    { date: game.date, gameId: null }
  );

  assert.equal(result.game.id, game.id);
});

test("rejects progress whose game ID and date identify different games", async () => {
  const result = await resolveProgressGame(
    supabaseResult({ data: [game], error: null }),
    {
      date: game.date,
      gameId: "22222222-2222-4222-8222-222222222222",
    }
  );

  assert.match(result.error.message, /available game/);
});

test("preserves database errors while resolving progress games", async () => {
  const databaseError = new Error("database unavailable");
  const result = await resolveProgressGame(
    supabaseResult({ data: null, error: databaseError }),
    { date: game.date, gameId: game.id }
  );

  assert.equal(result.error, databaseError);
});
