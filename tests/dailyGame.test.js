import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeDailyGame,
} from "../app/lib/dailyGame.js";

function game(overrides = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
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
  assert.equal(normalized.id, "11111111-1111-4111-8111-111111111111");
});

test("rejects malformed daily games", () => {
  assert.equal(normalizeDailyGame(game({ id: "not-a-uuid" })), null);
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
