import { describe, expect, it } from "vitest";
import { keyTimes, spiralTurn } from "./ribbon-turn";

const step = 0.7366666666666668;
const thEnd = 7 * step;
const t0 = 35.95, t1 = 39.55;
const linear = (t: number) => thEnd * Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
// the scene's three reading spots, as the script lays them (Mercado, FlowStack, PulseVR)
const spots = [36.94, 37.81, 39.22];

describe("the camera's turn round the column", () => {
  it("is the even turn when nothing is read", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots: [] });
    for (let t = t0 - 0.5; t <= t1 + 0.5; t += 0.05) expect(th(t)).toBeCloseTo(linear(t), 9);
  });

  it("starts at the first card and ends at the last, held there either side", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots });
    expect(th(t0)).toBeCloseTo(0, 9);
    expect(th(t0 - 1)).toBeCloseTo(0, 9);
    expect(th(t1)).toBeCloseTo(thEnd, 9);
    expect(th(t1 + 1)).toBeCloseTo(thEnd, 9);
  });

  it("is round at the card nearest its even turn at each reading spot, so that card is square to you there", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots });
    for (const s of spots) {
      const card = Math.round(linear(s) / step);
      expect(th(s) / step).toBeCloseTo(card, 9);
    }
  });

  it("never turns back, and never stops", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots });
    let last = th(t0);
    for (let t = t0 + 0.01; t <= t1; t += 0.01) {
      const v = th(t);
      expect(v).toBeGreaterThan(last);
      last = v;
    }
  });

  it("stays near the even turn: within half a card", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots });
    for (let t = t0; t <= t1; t += 0.01) expect(Math.abs(th(t) - linear(t))).toBeLessThanOrEqual(0.5 * step + 1e-9);
  });

  it("leaves out a spot outside the turn, or one that would land on the card a spot before it already did", () => {
    const th = spiralTurn({ t0, t1, thEnd, step, spots: [t0 - 0.2, 36.94, 36.95, t1 + 0.3] });
    const one = spiralTurn({ t0, t1, thEnd, step, spots: [36.94] });
    for (let t = t0; t <= t1; t += 0.05) expect(th(t)).toBeCloseTo(one(t), 9);
  });
});

describe("the spiral's camera keys", () => {
  it("are every `every` screens, with one at each reading spot in place of a grid key too close to it", () => {
    const ts = keyTimes({ t0: 0, t1: 1, every: 0.1, spots: [0.31, 0.5, 2] });
    expect(ts).toContain(0.31);
    expect(ts).toContain(0.5);
    expect(ts.some((t) => Math.abs(t - 0.3) < 1e-9)).toBe(false);
    expect(ts.filter((t) => Math.abs(t - 0.5) < 1e-9)).toHaveLength(1);
    expect(ts[0]).toBe(0);
    expect(ts.at(-1)).toBeCloseTo(1, 9);
    for (let i = 1; i < ts.length; i++) expect(ts[i]! - ts[i - 1]!).toBeGreaterThanOrEqual(0.025);
  });
});
