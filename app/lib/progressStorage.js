import { normalizeProgress } from "./progress.js";

const ANONYMOUS_PREFIX = "progress:anonymous:";
const ACCOUNT_PREFIX = "progress:account:";
const LEGACY_PREFIX = "progress-";

export function anonymousProgressKey(anonymousId, date) {
  return `${ANONYMOUS_PREFIX}${anonymousId}:${date}`;
}

export function accountProgressKey(userId, date) {
  return `${ACCOUNT_PREFIX}${userId}:${date}`;
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

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;

    let date = null;
    if (key.startsWith(scopedPrefix)) {
      date = key.slice(scopedPrefix.length);
    } else if (key.startsWith(LEGACY_PREFIX)) {
      date = key.slice(LEGACY_PREFIX.length);
    }

    if (!date) continue;
    const progress = readStoredProgress(storage, key, date);
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
