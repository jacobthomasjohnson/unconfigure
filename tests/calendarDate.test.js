import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_TIME_ZONE,
  calendarDateToLocalDate,
  getCurrentGameDate,
  isCalendarDate,
  localDateToCalendarDate,
} from "../app/lib/calendarDate.js";

test("validates real calendar dates in canonical form", () => {
  assert.equal(isCalendarDate("2024-02-29"), true);
  assert.equal(isCalendarDate("2026-02-29"), false);
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.equal(isCalendarDate("2026-2-03"), false);
  assert.equal(isCalendarDate("not-a-date"), false);
});

test("uses the product timezone for the active calendar date", () => {
  assert.equal(GAME_TIME_ZONE, "America/Chicago");
  assert.equal(
    getCurrentGameDate(new Date("2026-10-04T02:00:00.000Z")),
    "2026-10-03"
  );
});

test("uses the correct date across daylight-saving boundaries", () => {
  assert.equal(
    getCurrentGameDate(new Date("2026-03-08T05:59:59.000Z")),
    "2026-03-07"
  );
  assert.equal(
    getCurrentGameDate(new Date("2026-03-08T06:00:00.000Z")),
    "2026-03-08"
  );
  assert.equal(
    getCurrentGameDate(new Date("2026-11-01T04:59:59.000Z")),
    "2026-10-31"
  );
  assert.equal(
    getCurrentGameDate(new Date("2026-11-01T05:00:00.000Z")),
    "2026-11-01"
  );
});

test("round trips calendar dates through date-picker values", () => {
  const pickerDate = calendarDateToLocalDate("2026-10-03");

  assert.ok(pickerDate instanceof Date);
  assert.equal(pickerDate.getHours(), 12);
  assert.equal(localDateToCalendarDate(pickerDate), "2026-10-03");
  assert.equal(calendarDateToLocalDate("2026-02-30"), null);
  assert.equal(localDateToCalendarDate(new Date(Number.NaN)), null);
});
