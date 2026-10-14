import { describe, expect, it } from "vitest";
import { HURRY, planWarp, tripProgress, WARP_S, type WarpPlan } from "./warp-plan";

const legs = (p: WarpPlan) => [p.pull, p.circle, p.flare, p.wind, p.swallow, p.travel, p.arrive].filter(Boolean) as Array<readonly [number, number]>;

describe("planWarp", () => {
  it("a link's warp runs its beats in order: pull back and circle, wind, burst, swallow, dive, the jump, the throat, arrival", () => {
    const p = planWarp({ kind: "link", fromHero: false, flare: false });
    expect(p.pull![0]).toBe(0);
    expect(p.flare).toBeNull();
    // his jets fire and he lifts off while the camera pulls back, and flies his circle as it does
    expect(p.lift).toBeGreaterThan(0);
    expect(p.lift).toBeLessThan(p.pull![1]);
    expect(p.circle[0]).toBeCloseTo(p.lift);
    // the ring winds into the spark as he perches, and the spark bursts into the black hole
    expect(p.wind[0]).toBeLessThan(p.circle[1]);
    expect(p.burst).toBeCloseTo(p.wind[1]);
    expect(p.swallow[0]).toBeGreaterThan(p.burst);
    expect(p.dive).toBeGreaterThan(p.swallow[1]);
    // the page jumps at the peak, when the horizon covers the frame, and the throat opens out of it
    expect(p.jump).toBeGreaterThan(p.dive);
    expect(p.travel[0]).toBeGreaterThanOrEqual(p.jump);
    // the portal opens before the throat's end, and he lands on his spot as the scene comes in
    expect(p.arrive[0]).toBeLessThan(p.travel[1]);
    expect(p.land).toBeGreaterThan(p.arrive[0]);
    expect(p.land).toBeLessThanOrEqual(p.arrive[1]);
    for (const [a, b] of legs(p)) expect(b).toBeGreaterThan(a);
  });

  it("gives the page back once the destination's hold is reached: a link in about 6 s", () => {
    const p = planWarp({ kind: "link", fromHero: false, flare: false });
    expect(p.unlock).toBeCloseTo(p.arrive[1]);
    expect(p.unlock).toBeCloseTo(WARP_S.link);
    expect(p.unlock).toBeGreaterThanOrEqual(5.5);
    expect(p.unlock).toBeLessThanOrEqual(6.5);
    // his landing plays out on his spot after it, and the warp is over once it has
    expect(p.total).toBeGreaterThan(p.unlock);
    expect(p.total - p.land).toBeGreaterThan(1);
  });

  it("a question's warp flares the explored stars on the whole sky, before the ring winds in: about 7–8 s", () => {
    const p = planWarp({ kind: "question", fromHero: false, flare: true });
    expect(p.flare![0]).toBeGreaterThanOrEqual(p.pull![1] - 0.01);
    expect(p.wind[0]).toBeGreaterThan(p.flare![0]);
    expect(p.wind[1]).toBeGreaterThan(p.flare![1]);
    expect(p.unlock).toBeGreaterThanOrEqual(7);
    expect(p.unlock).toBeLessThanOrEqual(8);
  });

  it("a question with nothing explored has no flare, and is that much shorter", () => {
    const bare = planWarp({ kind: "question", fromHero: false, flare: false });
    expect(bare.flare).toBeNull();
    expect(bare.unlock).toBeLessThan(planWarp({ kind: "question", fromHero: true, flare: true }).unlock - 0.8);
  });

  it("skips the pull-back in the hero, which is already the whole sky; his circle starts as it would", () => {
    const hero = planWarp({ kind: "link", fromHero: true, flare: false });
    const away = planWarp({ kind: "link", fromHero: false, flare: false });
    expect(hero.pull).toBeNull();
    expect(hero.circle[0]).toBeCloseTo(away.circle[0]);
    expect(hero.unlock).toBeLessThanOrEqual(away.unlock);
  });

  it("is tuned by one length: every beat scales with it", () => {
    const p = planWarp({ kind: "link", fromHero: false, flare: false });
    const q = planWarp({ kind: "link", fromHero: false, flare: false, seconds: WARP_S.link * 2 });
    expect(q.unlock).toBeCloseTo(p.unlock * 2);
    expect(q.jump).toBeCloseTo(p.jump * 2);
    expect(q.burst).toBeCloseTo(p.burst * 2);
    expect(q.circle[1]).toBeCloseTo(p.circle[1] * 2);
    expect(q.total).toBeCloseTo(p.total * 2);
    expect(q.k).toBeCloseTo(p.k * 2);
  });

  it("is hurried by a click, tap or Esc to its end at 4×", () => {
    expect(HURRY).toBe(4);
  });
});

describe("tripProgress", () => {
  const p = planWarp({ kind: "link", fromHero: false, flare: false });
  it("the trip in miniature is drawn down the throat: nothing before it, all of it after", () => {
    expect(tripProgress(p, 0)).toBe(0);
    expect(tripProgress(p, p.travel[0])).toBe(0);
    expect(tripProgress(p, (p.travel[0] + p.travel[1]) / 2)).toBeGreaterThan(0.2);
    expect(tripProgress(p, (p.travel[0] + p.travel[1]) / 2)).toBeLessThan(0.8);
    expect(tripProgress(p, p.travel[1])).toBe(1);
    expect(tripProgress(p, p.total)).toBe(1);
  });
  it("only ever moves forward", () => {
    let last = -1;
    for (let t = 0; t <= p.total; t += 0.05) {
      const v = tripProgress(p, t);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});
