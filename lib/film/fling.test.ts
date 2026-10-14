import { describe, expect, it } from "vitest";
import { createFling, FLING_FEEL } from "./fling";

const DT = 1 / 60;
/** scrolls at `speed` screens a second for `secs`, from `at`; returns where it got to and every value on the way */
function scroll(f: ReturnType<typeof createFling>, at: number, speed: number, secs: number, still = false) {
  const vs: number[] = [];
  let t = at;
  for (let i = 0; i < Math.round(secs / DT); i++) {
    t += speed * DT;
    vs.push(f.step(t, DT, still));
  }
  return { at: t, vs };
}

describe("the fling: how hard the scroll is, as a value loose things are thrown outwards by", () => {
  it("is round 3's feel unless told otherwise", () => {
    expect(FLING_FEEL).toEqual({ from: 2.5, span: 8, rise: 0.1, fall: 0.7 });
  });

  it("stays at rest at a reading pace", () => {
    const f = createFling();
    const { vs } = scroll(f, 0, 1, 2);
    expect(Math.max(...vs)).toBe(0);
  });

  it("throws things out on a hard scroll, either way", () => {
    const down = createFling(), up = createFling();
    expect(scroll(down, 0, 15, 0.4).vs.at(-1)).toBeGreaterThan(0.9);
    expect(scroll(up, 20, -15, 0.4).vs.at(-1)).toBeGreaterThan(0.9);
  });

  it("grows with the scroll's speed between where it starts and full", () => {
    const soft = createFling(), hard = createFling();
    const a = scroll(soft, 0, FLING_FEEL.from + FLING_FEEL.span * 0.5, 1).vs.at(-1)!;
    expect(a).toBeCloseTo(0.5, 2);
    expect(scroll(hard, 0, 30, 1).vs.at(-1)).toBeCloseTo(1, 3);
  });

  it("closes up softly as the scroll stops, with no bounce", () => {
    const f = createFling();
    const { at } = scroll(f, 0, 15, 0.5);
    const { vs } = scroll(f, at, 0, 3);
    for (let i = 1; i < vs.length; i++) expect(vs[i]!).toBeLessThanOrEqual(vs[i - 1]!);
    expect(Math.min(...vs)).toBeGreaterThanOrEqual(0);
    expect(vs[Math.round(0.5 / DT)]!).toBeLessThan(0.55);
    expect(vs.at(-1)!).toBeLessThan(0.02);
  });

  it("is still under reduced motion", () => {
    const f = createFling();
    expect(Math.max(...scroll(f, 0, 30, 1, true).vs)).toBe(0);
  });

  it("doesn't take a jump (a deep link, a reload landing) for a hard scroll", () => {
    const f = createFling();
    scroll(f, 0, 1, 0.5);
    f.reset();
    expect(f.step(30, DT, false)).toBe(0);
    expect(f.step(30, DT, false)).toBe(0);
  });

  it("takes another feel: from a gentler speed, closing faster", () => {
    const gentle = createFling({ ...FLING_FEEL, from: 0.5, span: 2, fall: 0.2 });
    const { at, vs } = scroll(gentle, 0, 2.5, 1);
    expect(vs.at(-1)).toBeGreaterThan(0.9);
    expect(scroll(gentle, at, 0, 1).vs.at(-1)).toBeLessThan(0.01);
  });

  it("hands each loose thing the fling as it was a moment ago, so a staggered take can throw them one after another", () => {
    const f = createFling({ ...FLING_FEEL, lag: 0.25 });
    expect(f.feel.lag).toBe(0.25);
    const { vs } = scroll(f, 0, 15, 0.3);
    expect(f.at(0)).toBe(f.value);
    expect(f.at(0.1)).toBeCloseTo(vs.at(-1 - Math.round(0.1 / DT))!, 5);
    expect(f.at(0.1)).toBeLessThan(f.value);
  });

  it("reads as it is now with no lag, and as at rest from before it started", () => {
    const f = createFling();
    expect(f.feel.lag ?? 0).toBe(0);
    scroll(f, 0, 15, 0.1);
    expect(f.at(5)).toBe(0);
    f.reset();
    expect(f.at(0.1)).toBe(0);
  });
});
