import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "jrz:chat",
  analytics: false,
  // its own timeout lets the request through (marked `reason: "timeout"`); 1 s keeps a slow Upstash off every reply
  timeout: 1000,
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
      degraded: r.reason === "timeout",
    };
  } catch (err) {
    console.error("[rate-limit] upstash failure — failing open:", err);
    return { allowed: true, remaining: -1, retryAfterMs: 0, degraded: true };
  }
}
