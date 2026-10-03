import { isCalendarDate } from "./progress.js";

export const GAME_TIME_ZONE = "America/Chicago";

export function getCurrentGameDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GAME_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function normalizeDailyGame(row) {
  if (!row || !isCalendarDate(row.date)) return null;

  const topic = typeof row.topic === "string" ? row.topic.trim() : "";
  const rawAnswers = row.answers;
  if (
    !topic ||
    !rawAnswers ||
    typeof rawAnswers !== "object" ||
    Array.isArray(rawAnswers)
  ) {
    return null;
  }

  const entries = Object.entries(rawAnswers).map(([label, chronology]) => [
    String(label).trim(),
    String(chronology).trim(),
  ]);
  const normalizedLabels = entries.map(([label]) => label.toLocaleLowerCase());

  if (
    entries.length !== 8 ||
    entries.some(
      ([label, chronology]) =>
        !label || !chronology || !Number.isFinite(Number.parseInt(chronology, 10))
    ) ||
    new Set(normalizedLabels).size !== entries.length
  ) {
    return null;
  }

  const itemDates = Object.fromEntries(entries);
  const items = entries
    .sort(
      ([, leftChronology], [, rightChronology]) =>
        Number.parseInt(leftChronology, 10) -
        Number.parseInt(rightChronology, 10)
    )
    .map(([label]) => label);

  return {
    date: row.date,
    topic,
    items,
    itemDates,
  };
}
