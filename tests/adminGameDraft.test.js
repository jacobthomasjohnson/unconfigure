import test from "node:test";
import assert from "node:assert/strict";

import {
  DRAFT_ITEM_LIMIT,
  answersToDraftItems,
  createEmptyDraftItems,
  validateAdminGameDraft,
} from "../app/lib/adminGameDraft.js";

function validItems() {
  return Array.from({ length: DRAFT_ITEM_LIMIT }, (_, index) => ({
    label: `Item ${index + 1}`,
    chronology: String(1900 + index),
  }));
}

test("normalizes a complete admin draft into database answers", () => {
  const result = validateAdminGameDraft({
    date: "2026-10-04",
    topic: " Tomorrow's inventions ",
    items: validItems(),
  });

  assert.equal(result.error, undefined);
  assert.equal(result.draft.topic, "Tomorrow's inventions");
  assert.equal(result.draft.answers["Item 1"], "1900");
  assert.deepEqual(result.warnings, []);
});

test("permits incomplete but structurally valid drafts with warnings", () => {
  const result = validateAdminGameDraft({
    date: "2026-10-04",
    topic: "",
    items: [
      { label: "One", chronology: "1900" },
      { label: "", chronology: "" },
    ],
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.draft.answers, { One: "1900" });
  assert.equal(result.warnings.length, 2);
});

test("rejects partial rows and malformed chronology values", () => {
  assert.match(
    validateAdminGameDraft({
      date: "2026-10-04",
      topic: "Topic",
      items: [{ label: "Only a label", chronology: "" }],
    }).error,
    /both a label and a year/
  );

  assert.match(
    validateAdminGameDraft({
      date: "2026-10-04",
      topic: "Topic",
      items: [{ label: "Event", chronology: "19th century" }],
    }).error,
    /whole-number year/
  );
});

test("rejects duplicate labels without changing case sensitivity", () => {
  const result = validateAdminGameDraft({
    date: "2026-10-04",
    topic: "Topic",
    items: [
      { label: "Same Event", chronology: "1900" },
      { label: "same event", chronology: "1901" },
    ],
  });

  assert.match(result.error, /labels must be unique/);
});

test("rejects invalid dates and more than eight items", () => {
  assert.match(
    validateAdminGameDraft({
      date: "2026-02-30",
      topic: "Topic",
      items: [],
    }).error,
    /valid publication date/
  );

  assert.match(
    validateAdminGameDraft({
      date: "2026-10-04",
      topic: "Topic",
      items: [...validItems(), { label: "Nine", chronology: "1909" }],
    }).error,
    /at most 8 items/
  );
});

test("converts stored answers into eight editable rows", () => {
  const items = answersToDraftItems({ Later: "2000", Earlier: "1900" });

  assert.equal(items.length, DRAFT_ITEM_LIMIT);
  assert.deepEqual(items.slice(0, 2), [
    { label: "Earlier", chronology: "1900" },
    { label: "Later", chronology: "2000" },
  ]);
  assert.deepEqual(createEmptyDraftItems()[0], { label: "", chronology: "" });
});
