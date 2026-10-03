import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePreferredProgress,
  normalizeProgress,
  validateProgressInput,
} from "../app/lib/progress.js";
import {
  accountProgressKey,
  anonymousProgressKey,
  listAnonymousProgress,
  migrateAnonymousProgress,
  readStoredProgress,
  writeStoredProgress,
} from "../app/lib/progressStorage.js";

function progress(overrides = {}) {
  return {
    date: "2026-10-03",
    result: "in_progress",
    attempts: 1,
    guesses: [{ guess: ["A", "B"], isCorrect: false }],
    emojiResults: ["🟥🟥"],
    finalGuess: ["A", "B"],
    updatedAt: "2026-10-03T12:00:00.000Z",
    ...overrides,
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("normalizes JSON arrays without double parsing native arrays", () => {
  const fromJson = normalizeProgress({
    ...progress(),
    final_guess: JSON.stringify(["A", "B"]),
    emoji_results: JSON.stringify(["🟥🟥"]),
    finalGuess: undefined,
    emojiResults: undefined,
  });
  const fromJsonb = normalizeProgress(progress());

  assert.deepEqual(fromJson.finalGuess, ["A", "B"]);
  assert.deepEqual(fromJsonb.finalGuess, ["A", "B"]);
});

test("completed progress cannot be overwritten by in-progress migration", () => {
  const completed = progress({ result: "win" });
  const incoming = progress({
    attempts: 2,
    updatedAt: "2026-10-03T13:00:00.000Z",
  });

  assert.equal(choosePreferredProgress(completed, incoming), completed);
  assert.equal(choosePreferredProgress(incoming, completed), completed);
});

test("an existing completed account result wins over a completed import", () => {
  const accountResult = progress({ result: "lose", attempts: 3 });
  const localResult = progress({
    result: "win",
    updatedAt: "2026-10-03T13:00:00.000Z",
  });

  assert.equal(
    choosePreferredProgress(accountResult, localResult),
    accountResult
  );
});

test("newer progress wins when completion and attempt counts match", () => {
  const older = progress();
  const newer = progress({ updatedAt: "2026-10-03T13:00:00.000Z" });

  assert.equal(choosePreferredProgress(older, newer), newer);
});

test("rejects malformed progress fields at the contract edge", () => {
  assert.equal(validateProgressInput(progress()).error, undefined);
  assert.match(
    validateProgressInput({ ...progress(), guesses: "not-an-array" }).error,
    /arrays/
  );
  assert.match(
    validateProgressInput({ ...progress(), attempts: 9 }).error,
    /attempts/
  );
  assert.match(
    validateProgressInput({
      ...progress(),
      attempts: 4,
      guesses: Array.from({ length: 4 }, () => ({
        guess: ["A", "B"],
        isCorrect: false,
      })),
      emojiResults: [],
    }).error,
    /too many attempts/
  );
});

test("storage keys isolate anonymous and authenticated identities", () => {
  assert.notEqual(
    anonymousProgressKey("anon-a", "2026-10-03"),
    anonymousProgressKey("anon-b", "2026-10-03")
  );
  assert.notEqual(
    anonymousProgressKey("same-id", "2026-10-03"),
    accountProgressKey("same-id", "2026-10-03")
  );
});

test("anonymous progress listing includes scoped and legacy records", () => {
  const storage = memoryStorage();
  const scopedKey = anonymousProgressKey("anon-a", "2026-10-03");
  writeStoredProgress(storage, scopedKey, progress());
  storage.setItem(
    "progress-2026-10-02",
    JSON.stringify({
      items: ["B", "A"],
      guesses: [{ guess: ["B", "A"], isCorrect: true }],
    })
  );
  writeStoredProgress(
    storage,
    anonymousProgressKey("anon-b", "2026-10-01"),
    progress({ date: "2026-10-01" })
  );

  const entries = listAnonymousProgress(storage, "anon-a");
  assert.deepEqual(
    entries.map((entry) => entry.progress.date).sort(),
    ["2026-10-02", "2026-10-03"]
  );
  assert.equal(readStoredProgress(storage, scopedKey).result, "in_progress");
});

test("migration removes local progress only after the server accepts it", async () => {
  const storage = memoryStorage();
  const acceptedKey = anonymousProgressKey("anon-a", "2026-10-03");
  const rejectedKey = anonymousProgressKey("anon-a", "2026-10-02");
  writeStoredProgress(storage, acceptedKey, progress());
  writeStoredProgress(
    storage,
    rejectedKey,
    progress({ date: "2026-10-02" })
  );

  const result = await migrateAnonymousProgress(
    storage,
    "anon-a",
    async (_url, options) => ({
      ok: JSON.parse(options.body).date === "2026-10-03",
    })
  );

  assert.equal(storage.getItem(acceptedKey), null);
  assert.notEqual(storage.getItem(rejectedKey), null);
  assert.deepEqual(result.failedDates, ["2026-10-02"]);
});
