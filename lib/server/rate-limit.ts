import "server-only";
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;
const MAX_KEYS = 10_000;
const buckets = new Map<string, { count: number; expires: number }>();
// In-process protection. The hosting proxy MUST overwrite forwarded IP headers.
export function rateLimit(
  request: Request,
  route: string,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  for (const [key, bucket] of buckets)
    if (bucket.expires <= now) buckets.delete(key);
  const ip = (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "unknown"
  )
    .split(",")[0]
    .trim()
    .slice(0, 64);
  const key = `${route}:${ip}`;
  const current = buckets.get(key);
  if (current) {
    if (current.count >= LIMIT)
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((current.expires - now) / 1000)),
      };
    current.count++;
    return { allowed: true, retryAfter: 0 };
  }
  if (buckets.size >= MAX_KEYS) return { allowed: false, retryAfter: 60 };
  buckets.set(key, { count: 1, expires: now + WINDOW_MS });
  return { allowed: true, retryAfter: 0 };
}
