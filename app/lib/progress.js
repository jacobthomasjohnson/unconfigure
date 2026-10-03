import { MAX_GUESSES } from "../utils/constants.js";
import { isCalendarDate } from "./calendarDate.js";

export const PROGRESS_RESULTS = ["in_progress", "win", "lose"];

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeGuess(value) {
  if (!value || !Array.isArray(value.guess)) return null;

  return {
    guess: value.guess.map(String),
    isCorrect: Boolean(value.isCorrect),
  };
}

export function normalizeProgress(value, fallbackDate = null) {
  if (!value || typeof value !== "object") return null;

  const date = value.date ?? fallbackDate;
  if (!isCalendarDate(date)) return null;

  const guesses = parseJsonArray(value.guesses)
    .map(normalizeGuess)
    .filter(Boolean);
  const finalGuess = parseJsonArray(value.finalGuess ?? value.final_guess).map(
    String
  );
  const emojiResults = parseJsonArray(
    value.emojiResults ?? value.emoji_results
  ).map(String);
  const rawAttempts = Number(value.attempts ?? guesses.length);
  const attempts = Number.isInteger(rawAttempts) && rawAttempts >= 0
    ? rawAttempts
    : guesses.length;
  const inferredResult = guesses.at(-1)?.isCorrect
    ? "win"
    : value.gameOver || guesses.length >= MAX_GUESSES
      ? "lose"
      : "in_progress";
  const result = PROGRESS_RESULTS.includes(value.result)
    ? value.result
    : inferredResult;

  return {
    date,
    result,
    attempts,
    guesses,
    emojiResults,
    finalGuess:
      finalGuess.length > 0
        ? finalGuess
        : parseJsonArray(value.items).map(String),
    updatedAt: value.updatedAt ?? value.updated_at ?? new Date(0).toISOString(),
  };
}

export function createProgress({
  date,
  items,
  guesses,
  emojiResults,
  result,
}) {
  return normalizeProgress({
    date,
    result,
    attempts: guesses.length,
    guesses,
    emojiResults,
    finalGuess: items,
    updatedAt: new Date().toISOString(),
  });
}

export function isCompletedProgress(progress) {
  return progress?.result === "win" || progress?.result === "lose";
}

export function choosePreferredProgress(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingCompleted = isCompletedProgress(existing);
  const incomingCompleted = isCompletedProgress(incoming);

  if (existingCompleted) return existing;
  if (incomingCompleted) return incoming;

  if (existing.attempts !== incoming.attempts) {
    return existing.attempts > incoming.attempts ? existing : incoming;
  }

  const existingUpdatedAt = Date.parse(existing.updatedAt) || 0;
  const incomingUpdatedAt = Date.parse(incoming.updatedAt) || 0;
  return existingUpdatedAt >= incomingUpdatedAt ? existing : incoming;
}

export function validateProgressInput(value) {
  const progress = normalizeProgress(value);

  if (!progress) {
    return { error: "Progress must include a valid date." };
  }

  if (!PROGRESS_RESULTS.includes(value.result)) {
    return { error: "Progress has an invalid result." };
  }

  if (!Array.isArray(value.guesses) || !Array.isArray(value.finalGuess)) {
    return { error: "Progress guesses and finalGuess must be arrays." };
  }

  if (!Array.isArray(value.emojiResults)) {
    return { error: "Progress emojiResults must be an array." };
  }

  if (progress.attempts !== progress.guesses.length) {
    return { error: "Progress attempts must match the number of guesses." };
  }

  if (progress.attempts > MAX_GUESSES) {
    return { error: "Progress contains too many attempts." };
  }

  if (progress.finalGuess.length > 100) {
    return { error: "Progress contains too many items." };
  }

  if (
    progress.guesses.some(
      (guess) =>
        guess.guess.length > 100 ||
        guess.guess.some((item) => item.length > 500)
    )
  ) {
    return { error: "Progress contains invalid guess items." };
  }

  if (
    progress.emojiResults.length !== 0 &&
    progress.emojiResults.length !== progress.attempts
  ) {
    return { error: "Progress emoji results must match its attempts." };
  }

  if (isCompletedProgress(progress) && progress.attempts === 0) {
    return { error: "Completed progress must include an attempt." };
  }

  return { progress };
}

export function toProgressRow(userId, progress) {
  return {
    user_id: userId,
    date: progress.date,
    result: progress.result,
    attempts: progress.attempts,
    guesses: progress.guesses,
    emoji_results: progress.emojiResults,
    final_guess: progress.finalGuess,
    updated_at: progress.updatedAt,
  };
}
