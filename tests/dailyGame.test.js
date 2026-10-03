import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_TIME_ZONE,
  getCurrentGameDate,
  normalizeDailyGame,
} from "../app/lib/dailyGame.js";

function game(overrides = {}) {
  return {
    date: "2026-10-03",
    topic: "Example topic",
    answers: {
      Eight: "2008",
      Three: "2003",
      One: "2001",
      Six: "2006",
      Four: "2004",
      Seven: "2007",
      Two: "2002",
      Five: "2005",
    },
    ...overrides,
  };
}

test("uses the product timezone for the active calendar date", () => {
  assert.equal(GAME_TIME_ZONE, "America/Chicago");
  assert.equal(
    getCurrentGameDate(new Date("2026-10-04T02:00:00.000Z")),
    "2026-10-03"
  );
});

test("normalizes a daily game into the UI contract", () => {
  const normalized = normalizeDailyGame(game());

  assert.deepEqual(normalized.items, [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
  ]);
  assert.equal(normalized.itemDates.One, "2001");
});

test("rejects malformed daily games", () => {
  assert.equal(normalizeDailyGame(game({ topic: "" })), null);
  assert.equal(
    normalizeDailyGame(game({ answers: { One: "2001" } })),
    null
  );
  assert.equal(
    normalizeDailyGame(
      game({ answers: { ...game().answers, Eight: "not a year" } })
    ),
    null
  );
});
