import { describe, it, expect, vi, beforeEach } from "vitest";

const { incrby, get, expire } = vi.hoisted(() => ({
  incrby: vi.fn(),
  get: vi.fn(),
  expire: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({ get, incrby, expire }) },
}));

import { hasBudget, recordUsage } from "./cost-cap";

beforeEach(() => {
  incrby.mockReset();
  get.mockReset();
  expire.mockReset();
  process.env.MONTHLY_COST_CAP_USD = "50";
  return undefined;
});

describe("cost cap", () => {
  it("hasBudget returns true when under cap", async () => {
    get.mockResolvedValue(1234);
    const r = await hasBudget();
    expect(r.ok).toBe(true);
  });

  it("hasBudget returns false when over cap", async () => {
    get.mockResolvedValue(6_000_000);
    const r = await hasBudget();
    expect(r.ok).toBe(false);
  });

  it("recordUsage increments and sets monthly TTL", async () => {
    await recordUsage({ totalTokens: 1000, model: "gpt-4o" });
    expect(incrby).toHaveBeenCalled();
    expect(expire).toHaveBeenCalled();
  });

  it("hasBudget fails open on Upstash error", async () => {
    get.mockRejectedValue(new Error("down"));
    const r = await hasBudget();
    expect(r.ok).toBe(true);
    expect(r.degraded).toBe(true);
  });
});
