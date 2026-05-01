import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/**
 * GPT-4o pricing per 1M tokens (April 2026 reference; bump if it changes).
 * Stored in micro-cents (1 cent = 1000 micro-cents) so we don't need floats.
 */
const PRICE_USD_PER_1M = { input: 2.5, output: 10 };

function monthKey(d = new Date()) {
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `jrz:cost:${ym}`;
}

function capMicroCents(): number {
  const usd = Number(process.env.MONTHLY_COST_CAP_USD ?? "10");
  return usd * 100 * 1000;
}

export async function hasBudget(): Promise<{ ok: boolean; degraded?: boolean }> {
  try {
    const used = (await redis.get<number>(monthKey())) ?? 0;
    return { ok: used < capMicroCents() };
  } catch (err) {
    console.error("[cost-cap] redis read failed — failing open:", err);
    return { ok: true, degraded: true };
  }
}

export interface UsageRecord {
  totalTokens: number;
  promptTokens?: number;
  completionTokens?: number;
  model?: string;
}

export async function recordUsage(usage: UsageRecord): Promise<void> {
  try {
    const prompt = usage.promptTokens ?? Math.floor(usage.totalTokens * 0.6);
    const completion = usage.completionTokens ?? usage.totalTokens - prompt;
    const usdCost =
      (prompt / 1_000_000) * PRICE_USD_PER_1M.input +
      (completion / 1_000_000) * PRICE_USD_PER_1M.output;
    const microCents = Math.round(usdCost * 100 * 1000);
    if (microCents <= 0) return;
    const key = monthKey();
    await redis.incrby(key, microCents);
    // 40 days TTL ensures rollover into the next month before the key expires.
    await redis.expire(key, 60 * 60 * 24 * 40);
  } catch (err) {
    console.error("[cost-cap] failed to record usage:", err);
  }
}
