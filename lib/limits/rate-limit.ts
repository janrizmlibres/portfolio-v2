import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "jrz:chat",
  analytics: false,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  degraded?: boolean;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const r = await ratelimiter.limit(identifier);
    return {
      allowed: r.success,
      remaining: r.remaining,
      retryAfterMs: Math.max(0, r.reset - Date.now()),
    };
  } catch (err) {
    console.error("[rate-limit] upstash failure — failing open:", err);
    return { allowed: true, remaining: -1, retryAfterMs: 0, degraded: true };
  }
}
