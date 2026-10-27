import "server-only";
import { createHash } from "node:crypto";
import { database, databaseEnabled } from "./database";
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;
const MAX_KEYS = 10_000;
const buckets = new Map<string, { count: number; expires: number }>();
// In-process protection. The hosting proxy MUST overwrite forwarded IP headers.
export async function rateLimit(
  request: Request,
  route: string,
  sql = databaseEnabled() ? database() : undefined,
): Promise<{ allowed: boolean; retryAfter: number }> {
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
  if (sql) {
    const hashed = createHash("sha256").update(key).digest("hex");
    const limit = route === "admin-login" ? 5 : LIMIT;
    const window = route === "admin-login" ? 60000 : WINDOW_MS;
    const [bucket] =
      await sql`insert into northia.rate_limits(key,count,expires_at)
      values(${hashed},1,now()+${window}*interval '1 millisecond')
      on conflict(key) do update set
        count=case when northia.rate_limits.expires_at<=now() then 1 else least(northia.rate_limits.count+1,${limit + 1}) end,
        expires_at=case when northia.rate_limits.expires_at<=now() then excluded.expires_at else northia.rate_limits.expires_at end
      returning count, greatest(1,ceil(extract(epoch from (expires_at-now()))))::int as retry`;
    await sql`delete from northia.rate_limits where expires_at < now()`;
    return {
      allowed: bucket.count <= limit,
      retryAfter: bucket.count <= limit ? 0 : bucket.retry,
    };
  }
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
