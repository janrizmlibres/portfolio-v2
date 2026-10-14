import { describe, expect, it } from "vitest";
import { createVoicePool } from "./voices";

function pool(opts?: { cap?: number }) {
  const cuts: Array<{ note: number; fade: number; at: number }> = [];
  const started: number[] = [];
  const p = createVoicePool<{ note: number }>({
    ...opts,
    start: (note) => {
      started.push(note);
      return { note };
    },
    cut: (v, at, fade) => void cuts.push({ note: v.note, fade, at }),
  });
  return { p, cuts, started };
}

describe("the instrument's voices: 16 at once, the oldest cut, each note at most every 100 ms", () => {
  it("plays up to 16 voices without cutting any", () => {
    const { p, cuts } = pool();
    for (let i = 0; i < 16; i++) expect(p.play(i, 0)).toBe(true);
    expect(p.sounding).toBe(16);
    expect(cuts).toEqual([]);
  });

  it("cuts the oldest voice, over 40 ms, to make room for the 17th", () => {
    const { p, cuts } = pool();
    for (let i = 0; i < 17; i++) p.play(i, i * 0.01);
    expect(cuts).toEqual([{ note: 0, fade: 0.04, at: 0.16 }]);
    expect(p.sounding).toBe(16);
  });

  it("sounds the same note at most every 100 ms", () => {
    const { p, started } = pool();
    expect(p.play(5, 1)).toBe(true);
    expect(p.play(5, 1.05)).toBe(false);
    expect(p.play(6, 1.05)).toBe(true);
    expect(p.play(5, 1.1)).toBe(true);
    expect(started).toEqual([5, 6, 5]);
  });

  it("lets a voice go when it ends, so it no longer counts towards the cap", () => {
    const { p, cuts } = pool({ cap: 2 });
    p.play(1, 0);
    p.play(2, 0);
    p.ended(p.voices[1]!);
    p.play(3, 0);
    expect(cuts).toEqual([]);
    expect(p.sounding).toBe(2);
  });
});
