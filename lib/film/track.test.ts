import { describe, expect, it } from "vitest";
import { monotoneCubic } from "./track";

const slope = (f: (t: number) => number, t: number, h = 1e-6) => (f(t + h) - f(t - h)) / (2 * h);

describe("monotoneCubic", () => {
  const ts = [0, 1, 1.5, 4, 5];
  const ys = [0, 2, 2.2, 6, 6];
  const f = monotoneCubic(ts, ys);

  it("passes through every key, and holds the end values outside them", () => {
    ts.forEach((t, i) => expect(f(t)).toBeCloseTo(ys[i]!, 12));
    expect(f(-3)).toBe(0);
    expect(f(9)).toBe(6);
  });

  it("never overshoots: between two keys it stays between their values", () => {
    for (let i = 0; i < ts.length - 1; i++) {
      const lo = Math.min(ys[i]!, ys[i + 1]!), hi = Math.max(ys[i]!, ys[i + 1]!);
      for (let k = 0; k <= 50; k++) {
        const y = f(ts[i]! + ((ts[i + 1]! - ts[i]!) * k) / 50);
        expect(y).toBeGreaterThanOrEqual(lo - 1e-12);
        expect(y).toBeLessThanOrEqual(hi + 1e-12);
      }
    }
  });

  it("is monotone where the keys are", () => {
    let last = -Infinity;
    for (let t = 0; t <= 5; t += 0.01) {
      const y = f(t);
      expect(y).toBeGreaterThanOrEqual(last - 1e-12);
      last = y;
    }
  });

  it("has a continuous speed: the slope is the same either side of every inner key", () => {
    for (const t of ts.slice(1, -1)) {
      const left = (f(t) - f(t - 1e-7)) / 1e-7, right = (f(t + 1e-7) - f(t)) / 1e-7;
      expect(right).toBeCloseTo(left, 4);
    }
  });

  it("only stops where the keys tell it to: a rising run never has zero speed inside it", () => {
    const g = monotoneCubic([0, 1, 2, 3], [0, 1, 3, 3.5]);
    for (let t = 0.01; t < 3; t += 0.01) expect(slope(g, t)).toBeGreaterThan(0);
  });

  it("is a straight line through two keys", () => {
    const g = monotoneCubic([2, 4], [10, 20]);
    expect(g(3)).toBeCloseTo(15, 12);
    expect(g(2.5)).toBeCloseTo(12.5, 12);
  });

  it("holds a single key's value everywhere", () => {
    const g = monotoneCubic([1], [7]);
    expect(g(-1)).toBe(7);
    expect(g(4)).toBe(7);
  });
});
