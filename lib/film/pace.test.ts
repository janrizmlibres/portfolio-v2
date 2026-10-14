import { describe, expect, it } from "vitest";
import { createPacer, framesPerDraw } from "./pace";

// `n` display frames `ms` apart from `from.now`, each with up to `jitter` ms of noise: how many were drawn
function play(p: ReturnType<typeof createPacer>, n: number, ms: number, from = { now: 0 }, jitter = 0) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    from.now += ms;
    if (p.tick(from.now + (i % 2 ? jitter : -jitter))) drawn++;
  }
  return drawn;
}

describe("how many display frames go by for each frame drawn", () => {
  it("every one at 60 Hz or slower, and on a display under about 75 Hz", () => {
    expect([1000 / 60, 1000 / 30, 1000 / 75, 1000 / 90].map(framesPerDraw)).toEqual([1, 1, 1, 1]);
  });

  it("on a faster display, the step nearest 60 fps that isn't under it", () => {
    expect([1000 / 120, 1000 / 144, 1000 / 165, 1000 / 240, 1000 / 300].map(framesPerDraw)).toEqual([2, 2, 2, 4, 5]);
  });

  it("every one until the display's interval is known", () => {
    expect(framesPerDraw(Infinity)).toBe(1);
  });
});

describe("the film drawn at 60 fps on a high-refresh display", () => {
  it("draws every frame of a 60 Hz display", () => {
    const p = createPacer(), t = { now: 0 };
    play(p, 60, 1000 / 60, t);
    expect(play(p, 60, 1000 / 60, t)).toBe(60);
  });

  it("draws every other frame of a 120 Hz display once it has measured it, its frames' timing jittering or not", () => {
    const p = createPacer(), t = { now: 0 };
    expect(play(p, 30, 1000 / 120, t)).toBe(30);
    expect(play(p, 120, 1000 / 120, t)).toBe(60);
    expect(play(p, 120, 1000 / 120, t, 0.6)).toBe(60);
  });

  it("draws 60 a second at an unlimited rate (300 frames a second)", () => {
    const p = createPacer(), t = { now: 0 };
    play(p, 30, 1000 / 300, t);
    expect(play(p, 300, 1000 / 300, t)).toBe(60);
  });

  it("draws at once a frame that came a display frame late", () => {
    const p = createPacer(), t = { now: 0 };
    play(p, 60, 1000 / 120, t);
    const drawnLate = p.tick((t.now += 2 * (1000 / 120)) + 1000 / 120);
    expect(drawnLate).toBe(true);
  });

  it("draws every frame once the window is on a 60 Hz display after a 120 Hz one", () => {
    const p = createPacer(), t = { now: 0 };
    play(p, 120, 1000 / 120, t);
    expect(play(p, 60, 1000 / 60, t)).toBe(60);
  });

  it("says how far apart its frames are drawn", () => {
    const p = createPacer(), t = { now: 0 };
    play(p, 60, 1000 / 120, t);
    expect(p.every).toBe(2);
    expect(p.display).toBeCloseTo(1000 / 120, 6);
  });
});
