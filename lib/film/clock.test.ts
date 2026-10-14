import { describe, expect, it } from "vitest";
import { createClock } from "./clock";

describe("createClock", () => {
  it("eases the film's time a little behind the scroll: about 63% of the way after one time constant", () => {
    const c = createClock({ tau: 0.2 });
    let t = 0;
    for (let i = 0; i < 12; i++) t = c.step(10, 1 / 60);
    expect(t).toBeCloseTo(10 * (1 - Math.exp(-1)), 6);
  });

  it("never overshoots the scroll, and lands on it exactly once it's close", () => {
    const c = createClock({ tau: 0.2 });
    let t = 0;
    for (let i = 0; i < 600; i++) {
      t = c.step(3, 1 / 60);
      expect(t).toBeLessThanOrEqual(3);
    }
    expect(t).toBe(3);
  });

  it("follows the scroll at once when told not to ease (reduced motion)", () => {
    const c = createClock({ tau: 0.2 });
    expect(c.step(7, 1 / 60, { eased: false })).toBe(7);
  });

  it("jumps, for a deep link or a resize, so they land on the same frame", () => {
    const c = createClock({ tau: 0.2 });
    c.jump(4.2);
    expect(c.t).toBe(4.2);
    expect(c.step(4.2, 1 / 60)).toBe(4.2);
  });
});
