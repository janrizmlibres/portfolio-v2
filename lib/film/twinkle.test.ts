import { describe, expect, it } from "vitest";
import { createTwinkles, TWINKLE, twinklePeak } from "./twinkle";

/** the level of `star` at `now`, or 0 when it isn't twinkling */
const levelOf = (tw: ReturnType<typeof createTwinkles>, star: number, now: number) => tw.levels(now).find(([s]) => s === star)?.[1] ?? 0;

describe("how hard a hovered star twinkles: as loud as its shimmer", () => {
  it("twinkles at least gently for a slow pointer, fully for a fast one, more the faster it moves", () => {
    expect(twinklePeak(0)).toBeCloseTo(TWINKLE.floor);
    expect(twinklePeak(TWINKLE.fast * 2)).toBe(1);
    expect(twinklePeak(600)).toBeGreaterThan(twinklePeak(200));
    expect(twinklePeak(600)).toBeLessThan(1);
  });
});

describe("a star's twinkle over time", () => {
  it("flares to its peak at once, settles over the shimmer's length, and keeps twinkling while it's hovered", () => {
    const tw = createTwinkles();
    tw.hover(4, TWINKLE.fast, 10);
    const early = levelOf(tw, 4, 10 + TWINKLE.attack / 2);
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(1);
    expect(levelOf(tw, 4, 10 + TWINKLE.attack)).toBeCloseTo(1);
    const mid = levelOf(tw, 4, 10 + TWINKLE.settle / 2);
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(TWINKLE.sustain);
    expect(levelOf(tw, 4, 10 + TWINKLE.attack + TWINKLE.settle)).toBeCloseTo(TWINKLE.sustain);
    tw.hover(4, 0, 30); // the pointer still on it, now resting
    expect(levelOf(tw, 4, 30)).toBeCloseTo(TWINKLE.sustain);
  });

  it("never settles above its own peak (a slow pointer's gentle twinkle stays gentle)", () => {
    const tw = createTwinkles({ ...TWINKLE, floor: 0.2, sustain: 0.4 });
    tw.hover(1, 0, 0);
    expect(levelOf(tw, 1, 5)).toBeCloseTo(0.2);
  });

  it("dies away over the release once the pointer leaves, from where it was, and is then forgotten", () => {
    const tw = createTwinkles();
    tw.hover(2, TWINKLE.fast, 0);
    const at = levelOf(tw, 2, 0.3);
    tw.hover(null, 0, 0.3);
    const half = levelOf(tw, 2, 0.3 + TWINKLE.release / 2);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(at);
    // the frame it ends, the sky is told 0 so it can clear the star; after that it isn't reported at all
    expect(tw.levels(0.3 + TWINKLE.release)).toEqual([[2, 0]]);
    expect(tw.levels(0.3 + TWINKLE.release + 0.1)).toEqual([]);
  });

  it("lets a swept star die away while the next one flares, as a sweep plays its shimmers", () => {
    const tw = createTwinkles();
    tw.hover(1, 1200, 0);
    tw.hover(2, 1200, 0.1);
    const now = tw.levels(0.15);
    expect(now.map(([s]) => s).sort()).toEqual([1, 2]);
    expect(now.every(([, v]) => v > 0)).toBe(true);
  });

  it("takes a star back up from where it was when the pointer returns to it while it dies away", () => {
    const tw = createTwinkles();
    tw.hover(3, TWINKLE.fast, 0);
    tw.hover(null, 0, 2);
    const before = levelOf(tw, 3, 2.1);
    tw.hover(3, 0, 2.1);
    expect(levelOf(tw, 3, 2.1)).toBeCloseTo(before, 2);
    expect(levelOf(tw, 3, 2.1 + TWINKLE.attack)).toBeGreaterThan(before);
  });

  it("knows when nothing twinkles, so the hand can skip the sky", () => {
    const tw = createTwinkles();
    expect(tw.idle).toBe(true);
    tw.hover(5, 0, 0);
    expect(tw.idle).toBe(false);
    tw.hover(null, 0, 1);
    tw.levels(1 + TWINKLE.release + 0.01);
    expect(tw.idle).toBe(true);
  });
});
