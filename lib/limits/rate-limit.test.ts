import { describe, it, expect, vi, beforeEach } from "vitest";

const limitFn = vi.hoisted(() => vi.fn());

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    limit(...args: unknown[]) { return limitFn(...args); }
    static slidingWindow() { return {}; }
  },
}));
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));

import { checkRateLimit } from "./rate-limit";

beforeEach(() => { limitFn.mockReset(); });

describe("checkRateLimit", () => {
  it("returns allowed=true when under quota", async () => {
    limitFn.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 3600_000 });
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(19);
  });

  it("returns allowed=false with retryAfterMs when over quota", async () => {
    const reset = Date.now() + 60_000;
    limitFn.mockResolvedValue({ success: false, limit: 20, remaining: 0, reset });
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("falls back to allow on Upstash failure (open-fail)", async () => {
    limitFn.mockRejectedValue(new Error("upstash down"));
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(true);
    expect(r.degraded).toBe(true);
  });
});
