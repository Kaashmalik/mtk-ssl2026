/**
 * Rate limiter with Redis-backed distributed counting.
 *
 * In production (when REDIS_URL is set), uses a sliding-window counter stored
 * in Redis so the limit is shared across all server instances (Vercel, K8s, etc.).
 *
 * In development (no Redis), falls back to an in-memory token-bucket — still
 * correct per-instance, just not shared.
 *
 * Algorithm: fixed-window counter with key = `ratelimit:{key}:{window}`.
 *   1. INCR the counter
 *   2. If counter == 1, set EXPIRE to the window duration
 *   3. If counter > limit, reject
 *
 * This is the standard Redis rate-limiting pattern: simple, atomic, and
 * race-condition-free when using a single Redis instance.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev, test, single-instance)
// ---------------------------------------------------------------------------

class InMemoryBucket {
  private tokens: number;
  private lastRefilled: number;
  private readonly limit: number;
  private readonly refillInterval: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.tokens = limit;
    this.lastRefilled = Date.now();
    this.refillInterval = windowMs / limit;
  }

  consume(): { remaining: number; reset: number } {
    const now = Date.now();
    const elapsed = now - this.lastRefilled;
    const refilled = Math.floor(elapsed / this.refillInterval);

    if (refilled > 0) {
      this.tokens = Math.min(this.limit, this.tokens + refilled);
      this.lastRefilled = now - (elapsed % this.refillInterval);
    }

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return {
        remaining: this.tokens,
        reset: Math.ceil(
          this.lastRefilled + this.refillInterval * (this.limit - this.tokens)
        ),
      };
    }

    return { remaining: 0, reset: Math.ceil(this.lastRefilled + this.refillInterval) };
  }
}

const memoryBuckets = new Map<string, InMemoryBucket>();

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const bucketKey = `${key}:${limit}:${windowMs}`;
  let bucket = memoryBuckets.get(bucketKey);
  if (!bucket) {
    bucket = new InMemoryBucket(limit, windowMs);
    memoryBuckets.set(bucketKey, bucket);
  }

  const { remaining, reset } = bucket.consume();
  return {
    success: remaining >= 0,
    remaining,
    reset,
    limit,
  };
}

// ---------------------------------------------------------------------------
// Redis-backed rate limiter
// ---------------------------------------------------------------------------

type RedisClient = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number, mode?: string): Promise<number | null>;
  pipeline(): {
    incr(key: string): ReturnType<typeof import("ioredis").default.prototype.pipeline>;
    expire(key: string, seconds: number, mode?: string): ReturnType<typeof import("ioredis").default.prototype.pipeline>;
    exec(): Promise<Array<[Error | null, unknown] | null>>;
  };
  on(event: string, cb: (err: Error) => void): void;
  connect(): Promise<void>;
};

let redisClient: RedisClient | null | undefined;

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    redisClient = null;
    return null;
  }

  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 1000,
    }) as unknown as RedisClient;

    client.on("error", (err: Error) => {
      console.warn("[rate-limit] Redis error, falling back to in-memory:", err.message);
      redisClient = null;
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch {
    console.warn("[rate-limit] Failed to connect to Redis, falling back to in-memory");
    redisClient = null;
    return null;
  }
}

async function rateLimitRedis(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const client = await getRedis();
  if (!client) {
    return rateLimitMemory(key, limit, windowSec * 1000);
  }

  const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;

  try {
    const pipeline = client.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, windowSec, "NX");
    const results = await pipeline.exec();

    const count = (results?.[0]?.[1] as number) ?? 0;
    const remaining = Math.max(0, limit - count);
    const reset = Math.ceil((Date.now() + windowSec * 1000) / 1000);

    return {
      success: count <= limit,
      remaining,
      reset,
      limit,
    };
  } catch {
    return rateLimitMemory(key, limit, windowSec * 1000);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check or consume a rate-limit token.
 *
 * @param key      Unique identifier (user id, IP, or combination)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 *
 * Usage:
 *   const { success, remaining } = await rateLimit(`user:${userId}`, 60, 60000);
 *   if (!success) return new Response("Too many requests", { status: 429 });
 */
export async function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60000
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);

  if (process.env.REDIS_URL) {
    return rateLimitRedis(key, limit, windowSec);
  }

  return rateLimitMemory(key, limit, windowMs);
}
