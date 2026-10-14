import { describe, expect, it } from "vitest";
import { advance, revealStart, showAll, visibleWords } from "./reveal";

const run = (pace: number, steps: Array<[dt: number, arrived: number]>) =>
  steps.reduce((s, [dt, arrived]) => advance(s, dt, arrived, pace), revealStart());

describe("reveal: a reply's words shown at a reading pace, never ahead of what has arrived", () => {
  it("shows words at the pace, the first at once", () => {
    expect(visibleWords(run(4, [[0.01, 20]]), 20)).toBe(1);
    expect(visibleWords(run(4, [[0.5, 20]]), 20)).toBe(2);
    expect(visibleWords(run(4, [[0.5, 20], [0.5, 20], [1, 20]]), 20)).toBe(8);
  });

  it("never runs ahead of the stream", () => {
    expect(visibleWords(run(4, [[3, 5]]), 5)).toBe(5);
  });

  it("keeps the pace after a stall, rather than bursting to catch up", () => {
    // 2 s with only 3 words arrived, then 20 have: the next half second shows 2 more, not 8
    const s = run(4, [[2, 3], [0.5, 20]]);
    expect(visibleWords(s, 20)).toBe(5);
  });

  it("shows the rest at once on a tap, and words still arriving appear as they land", () => {
    const s = showAll(run(4, [[0.5, 12]]));
    expect(visibleWords(s, 12)).toBe(12);
    expect(visibleWords(advance(s, 0.01, 30, 4), 30)).toBe(30);
  });

  it("finishes at the pace when the stream ends before the reveal catches up", () => {
    // the whole 10-word reply arrived at once; at 4 a second it takes 2.5 s to show
    const s = run(4, [[0.01, 10], [1, 10]]);
    expect(visibleWords(s, 10)).toBe(5);
    expect(visibleWords(advance(s, 2, 10, 4), 10)).toBe(10);
  });
});
