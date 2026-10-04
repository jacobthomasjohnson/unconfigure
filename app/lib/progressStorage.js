import { normalizeProgress } from "./progress.js";

const ANONYMOUS_PREFIX = "progress:v2:anonymous:";
const ACCOUNT_PREFIX = "progress:v2:account:";
const LEGACY_ANONYMOUS_PREFIX = "progress:anonymous:";
const LEGACY_PREFIX = "progress-";

export function anonymousProgressKey(anonymousId, gameId) {
  return `${ANONYMOUS_PREFIX}${anonymousId}:${gameId}`;
}

export function accountProgressKey(userId, gameId) {
  return `${ACCOUNT_PREFIX}${userId}:${gameId}`;
}

export function readStoredProgress(storage, key, fallbackDate = null) {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    return normalizeProgress(JSON.parse(raw), fallbackDate);
  } catch {
    return null;
  }
}

export function writeStoredProgress(storage, key, progress) {
  storage.setItem(key, JSON.stringify(progress));
}

export function removeStoredProgress(storage, key) {
  storage.removeItem(key);
}

export function listAnonymousProgress(storage, anonymousId) {
  const entries = [];
  const scopedPrefix = `${ANONYMOUS_PREFIX}${anonymousId}:`;
  const legacyScopedPrefix = `${LEGACY_ANONYMOUS_PREFIX}${anonymousId}:`;

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;

    let fallbackDate = null;
    if (key.startsWith(scopedPrefix)) {
      // Current records contain both gameId and date in their value.
    } else if (key.startsWith(legacyScopedPrefix)) {
      fallbackDate = key.slice(legacyScopedPrefix.length);
    } else if (key.startsWith(LEGACY_PREFIX)) {
      fallbackDate = key.slice(LEGACY_PREFIX.length);
    } else {
      continue;
    }

    const progress = readStoredProgress(storage, key, fallbackDate);
    if (progress) entries.push({ key, progress });
  }

  return entries;
}

export async function migrateAnonymousProgress(
  storage,
  anonymousId,
  saveProgress = fetch
) {
  const entries = listAnonymousProgress(storage, anonymousId);
  const failedDates = [];

  for (const entry of entries) {
    try {
      const response = await saveProgress("/api/save-progress/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.progress),
      });

      if (response.ok) {
        removeStoredProgress(storage, entry.key);
      } else {
        failedDates.push(entry.progress.date);
      }
    } catch {
      failedDates.push(entry.progress.date);
    }
  }

  return { imported: entries.length - failedDates.length, failedDates };
}
