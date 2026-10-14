import { afterEach, describe, expect, it } from "vitest";
import { footprints, keepFootprint, pointsFootprint, registerFootprints } from "./footprints";

const frame = { w: 1440, h: 900 };

describe("keepFootprint", () => {
  it("keeps a subject's footprint, clipped to the frame", () => {
    expect(keepFootprint({ l: 1400, t: 100, r: 1600, b: 200 }, frame)).toEqual({ l: 1400, t: 100, r: 1440, b: 200 });
  });
  it("drops one that's off the screen", () => {
    expect(keepFootprint({ l: 1500, t: 100, r: 1600, b: 200 }, frame)).toBeNull();
    expect(keepFootprint({ l: 100, t: -300, r: 200, b: -10 }, frame)).toBeNull();
  });
  it("drops one too small to sit on (a speck under 3 px)", () => {
    expect(keepFootprint({ l: 100, t: 100, r: 102, b: 140 }, frame)).toBeNull();
  });
  it("drops one that fills most of the frame: that's where he is, not a subject to keep clear of", () => {
    expect(keepFootprint({ l: -200, t: -200, r: 1300, b: 1000 }, frame)).toBeNull();
    expect(keepFootprint({ l: 300, t: 100, r: 1100, b: 800 }, frame)).not.toBeNull();
  });
});

describe("the registry", () => {
  const off: Array<() => void> = [];
  afterEach(() => off.splice(0).forEach((f) => f()));

  it("gathers what every scene registered", () => {
    off.push(registerFootprints(() => [{ l: 0, t: 0, r: 10, b: 10 }]));
    off.push(registerFootprints(() => [{ l: 20, t: 20, r: 30, b: 30 }, { l: 40, t: 40, r: 50, b: 50 }]));
    expect(footprints(1)).toHaveLength(3);
  });
  it("forgets a scene that unregisters", () => {
    const stop = registerFootprints(() => [{ l: 0, t: 0, r: 10, b: 10 }]);
    stop();
    expect(footprints(2)).toEqual([]);
  });
  it("works them out once a frame, however often it's asked", () => {
    let calls = 0;
    off.push(registerFootprints(() => (calls++, [])));
    footprints(3);
    footprints(3);
    footprints(4);
    expect(calls).toBe(2);
  });
});

describe("pointsFootprint", () => {
  const inside = (rs: { l: number; t: number; r: number; b: number }[], x: number, y: number) => rs.some((r) => x >= r.l && x <= r.r && y >= r.t && y <= r.b);
  it("covers the cells round a sprawling part's points, a cell out each way, so a flat face between them is covered", () => {
    const rs = pointsFootprint([{ x: 400, y: 300 }, { x: 460, y: 300 }], frame, 32);
    expect(inside(rs, 400, 300)).toBe(true);
    expect(inside(rs, 430, 300)).toBe(true);
    expect(inside(rs, 400, 330)).toBe(true);
    expect(inside(rs, 600, 300)).toBe(false);
  });
  it("leaves the hole in a ring open", () => {
    const pts = Array.from({ length: 200 }, (_, i) => ({ x: 720 + 300 * Math.cos(i / 31.8), y: 450 + 300 * Math.sin(i / 31.8) }));
    const rs = pointsFootprint(pts, frame, 32);
    expect(inside(rs, 720 + 300, 450)).toBe(true);
    expect(inside(rs, 720, 450)).toBe(false);
  });
  it("merges each row's run of cells into one box", () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({ x: 100 + i * 16, y: 500 }));
    expect(pointsFootprint(pts, frame, 32).length).toBeLessThanOrEqual(3);
  });
  it("is nothing for no points, or for points that fill most of the frame (the setting)", () => {
    expect(pointsFootprint([], frame, 32)).toEqual([]);
    const all = [];
    for (let x = 0; x < 1440; x += 30) for (let y = 0; y < 900; y += 30) all.push({ x, y });
    expect(pointsFootprint(all, frame, 32)).toEqual([]);
  });
});
