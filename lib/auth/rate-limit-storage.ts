import { prisma } from "@/lib/db";

/* Rate-limit storage for Better Auth backed by the RateLimit table
 * (audit response, founder-authorized auth change).
 *
 * Better Auth's built-in "database" storage does a read-then-write, which it
 * itself logs as best-effort under concurrency, and it hands Prisma BigInt
 * values straight back to arithmetic code. This custom storage instead
 * implements the atomic `consume` contract with a single INSERT .. ON
 * CONFLICT upsert: N simultaneous requests each get a distinct counter value,
 * so the limit cannot be raced past. Fixed window anchored at the first
 * request: `lastRequest` stores the window start (epoch ms).
 */

type ConsumeResult = { allowed: boolean; retryAfter: number | null };

type RateLimitValue = { key: string; count: number; lastRequest: number };

/* Stale buckets are only garbage, never wrong (an expired window resets on
 * the next hit), so cleanup is opportunistic: at most once per instance per
 * hour, fire-and-forget. */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
let lastCleanup = 0;

function cleanupOccasionally(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  // Cleanup is best-effort; never let it interfere with a request (the
  // try/catch also guards synchronous throws, not just rejections).
  try {
    void prisma.rateLimit
      .deleteMany({ where: { lastRequest: { lt: BigInt(now - STALE_AFTER_MS) } } })
      .catch(() => {});
  } catch {
    // ignore
  }
}

export const rateLimitStorage = {
  async get(key: string): Promise<RateLimitValue | null> {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row) return null;
    return { key: row.key, count: row.count, lastRequest: Number(row.lastRequest) };
  },

  async set(key: string, value: RateLimitValue): Promise<void> {
    const lastRequest = BigInt(Math.trunc(value.lastRequest));
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: value.count, lastRequest },
      update: { count: value.count, lastRequest },
    });
  },

  async consume(
    key: string,
    rule: { window: number; max: number }
  ): Promise<ConsumeResult> {
    const now = Date.now();
    const windowMs = rule.window * 1000;
    const windowStart = now - windowMs;

    // Atomic: insert a fresh bucket, or in one statement either reset an
    // expired window or bump the counter. RETURNING reports the row this
    // request observed, so concurrent requests each see distinct counts.
    const rows = await prisma.$queryRaw<
      Array<{ count: number; lastRequest: bigint }>
    >`
      INSERT INTO "RateLimit" ("key", "count", "lastRequest")
      VALUES (${key}, 1, ${BigInt(now)})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."lastRequest" <= ${BigInt(windowStart)} THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "lastRequest" = CASE
          WHEN "RateLimit"."lastRequest" <= ${BigInt(windowStart)} THEN ${BigInt(now)}
          ELSE "RateLimit"."lastRequest"
        END
      RETURNING "count", "lastRequest"
    `;

    cleanupOccasionally(now);

    const row = rows[0];
    if (!row) {
      // Should be unreachable (upsert always returns a row); fail open so a
      // storage hiccup can't lock every user out of signing in.
      return { allowed: true, retryAfter: null };
    }

    if (row.count <= rule.max) return { allowed: true, retryAfter: null };

    const windowEnds = Number(row.lastRequest) + windowMs;
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((windowEnds - now) / 1000)),
    };
  },
};
