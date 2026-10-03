import { isCalendarDate } from "./calendarDate.js";

export const DRAFT_ITEM_LIMIT = 8;
export const DRAFT_TOPIC_LIMIT = 160;
export const DRAFT_LABEL_LIMIT = 200;
export const DRAFT_CHRONOLOGY_LIMIT = 20;

export function createEmptyDraftItems() {
  return Array.from({ length: DRAFT_ITEM_LIMIT }, () => ({
    label: "",
    chronology: "",
  }));
}

export function answersToDraftItems(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }

  const entries = Object.entries(answers);
  if (entries.length > DRAFT_ITEM_LIMIT) return null;

  const items = entries
    .map(([label, chronology]) => ({
      label: String(label),
      chronology: String(chronology),
    }))
    .sort(
      (left, right) =>
        Number.parseInt(left.chronology, 10) -
        Number.parseInt(right.chronology, 10)
    );

  return [
    ...items,
    ...createEmptyDraftItems().slice(items.length),
  ];
}

export function validateAdminGameDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "A valid draft is required." };
  }

  if (!isCalendarDate(value.date)) {
    return { error: "Choose a valid publication date." };
  }

  if (typeof value.topic !== "string") {
    return { error: "The topic must be text." };
  }

  const topic = value.topic.trim();
  if (topic.length > DRAFT_TOPIC_LIMIT) {
    return { error: `The topic must be ${DRAFT_TOPIC_LIMIT} characters or fewer.` };
  }

  if (!Array.isArray(value.items) || value.items.length > DRAFT_ITEM_LIMIT) {
    return { error: `A draft may contain at most ${DRAFT_ITEM_LIMIT} items.` };
  }

  const items = [];
  const answers = {};
  const normalizedLabels = new Set();

  for (const [index, item] of value.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { error: `Item ${index + 1} is invalid.` };
    }

    const label = typeof item.label === "string" ? item.label.trim() : "";
    const chronology =
      typeof item.chronology === "string" ? item.chronology.trim() : "";

    if (!label && !chronology) continue;
    if (!label || !chronology) {
      return { error: `Item ${index + 1} needs both a label and a year.` };
    }

    if (label.length > DRAFT_LABEL_LIMIT) {
      return {
        error: `Item ${index + 1} must be ${DRAFT_LABEL_LIMIT} characters or fewer.`,
      };
    }

    if (
      chronology.length > DRAFT_CHRONOLOGY_LIMIT ||
      !/^-?\d+$/.test(chronology)
    ) {
      return { error: `Item ${index + 1} needs a whole-number year.` };
    }

    const normalizedLabel = label.toLocaleLowerCase();
    if (normalizedLabels.has(normalizedLabel)) {
      return { error: `Item labels must be unique.` };
    }

    normalizedLabels.add(normalizedLabel);
    items.push({ label, chronology });
    answers[label] = chronology;
  }

  const warnings = [];
  if (!topic) warnings.push("Add a topic before publishing.");
  if (items.length !== DRAFT_ITEM_LIMIT) {
    warnings.push(`Add exactly ${DRAFT_ITEM_LIMIT} items before publishing.`);
  }

  const uniqueChronologies = new Set(items.map((item) => item.chronology));
  if (uniqueChronologies.size !== items.length) {
    warnings.push("Chronology values must be unique before publishing.");
  }

  return {
    draft: { date: value.date, topic, items, answers },
    warnings,
  };
}
