export function getSafePostAuthRedirect(origin, next) {
  const fallback = new URL("/", origin);

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  try {
    const redirect = new URL(next, origin);
    return redirect.origin === fallback.origin ? redirect : fallback;
  } catch {
    return fallback;
  }
}
