import { isCalendarDate } from "./calendarDate.js";

export function normalizeDailyGame(row) {
  if (
    !row ||
    typeof row.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id) ||
    !isCalendarDate(row.date)
  ) {
    return null;
  }

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
    id: row.id,
    date: row.date,
    topic,
    items,
    itemDates,
  };
}
