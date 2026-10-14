import { describe, expect, it } from "vitest";
import { arcClear, arcPoint, bodyBox, bowFor, coverage, createShake, edgeCandidates, isClear, placeSpot, releaseAt } from "./spots";

const frame = { vw: 1440, vh: 900 };

describe("bodyBox", () => {
  it("is his body round its centre, narrower than his canvas", () => {
    const b = bodyBox({ x: 100, y: 100 }, 128);
    expect(b.r - b.l).toBeLessThan(128);
    expect((b.l + b.r) / 2).toBeCloseTo(100);
    expect((b.t + b.b) / 2).toBeCloseTo(100);
  });
});

describe("isClear", () => {
  const line = { l: 0, t: 0, r: 200, b: 20 };
  it("keeps 10 px between his body and any text", () => {
    const b = bodyBox({ x: 0, y: 0 }, 128);
    const below = line.b - b.t; // his centre's y with his top touching the line's bottom
    expect(isClear({ x: 100, y: below }, 128, [line])).toBe(false);
    expect(isClear({ x: 100, y: below + 9 }, 128, [line])).toBe(false);
    expect(isClear({ x: 100, y: below + 11 }, 128, [line])).toBe(true);
  });
});

describe("edgeCandidates", () => {
  it("lie just inside the frame's edges", () => {
    const cs = edgeCandidates(1440, 900, 128);
    expect(cs.length).toBeGreaterThan(8);
    for (const c of cs) expect(placeSpot({ cands: [c], size: 128, ...frame, page: [], bodies: [] })).toEqual({ at: c, small: false });
  });
});

describe("createShake", () => {
  it("counts a shake as four reversals inside 0.9 s", () => {
    const s = createShake();
    const xs = [0, 30, 0, 30, 0, 30];
    let level = 0;
    xs.forEach((x, i) => (level = s.feed(x, 0, i * 100)));
    expect(level).toBeGreaterThanOrEqual(4);
  });
  it("forgets reversals older than 0.9 s", () => {
    const s = createShake();
    let level = 0;
    [0, 30, 0, 30, 0].forEach((x, i) => (level = s.feed(x, 0, i * 400)));
    expect(level).toBeLessThan(4);
  });
  it("ignores jitter under 14 px", () => {
    const s = createShake();
    let level = 0;
    [0, 8, 0, 8, 0, 8, 0].forEach((x, i) => (level = s.feed(x, 0, i * 50)));
    expect(level).toBe(0);
  });
});

describe("releaseAt", () => {
  it("throws him on along his flick for 0.22 s, kept in the frame", () => {
    expect(releaseAt({ x: 500, y: 500 }, { x: 1000, y: 0 }, 128, frame)).toEqual({ x: 720, y: 500 });
    const far = releaseAt({ x: 1400, y: 500 }, { x: 5000, y: 0 }, 128, frame);
    expect(far.x).toBeLessThan(1440 - 40);
  });
});

describe("coverage", () => {
  it("is nothing on a clear spot, and grows with what his padded body overlaps", () => {
    const at = { x: 500, y: 500 };
    expect(coverage(at, 128, [{ l: 0, t: 0, r: 100, b: 100 }])).toBe(0);
    const b = bodyBox(at, 128);
    const half = coverage(at, 128, [{ l: b.l, t: b.t, r: at.x, b: b.b }]);
    const whole = coverage(at, 128, [{ l: b.l, t: b.t, r: b.r, b: b.b }]);
    expect(half).toBeGreaterThan(0);
    expect(whole).toBeGreaterThan(half);
  });
  it("counts the 10 px margin round his body", () => {
    const b = bodyBox({ x: 500, y: 500 }, 128);
    expect(coverage({ x: 500, y: 500 }, 128, [{ l: b.r + 5, t: b.t, r: b.r + 40, b: b.b }])).toBeGreaterThan(0);
  });
});

describe("placeSpot", () => {
  const cands = [{ x: 200, y: 200 }, { x: 800, y: 200 }, { x: 1200, y: 700 }];
  const base = { cands, size: 128, ...frame, page: [], bodies: [] };
  const over = (c: { x: number; y: number }, w = 60) => ({ l: c.x - w, t: c.y - w, r: c.x + w, b: c.y + w });
  it("keeps clear of the 3D subjects on screen as well as the text", () => {
    const p = placeSpot({ ...base, bodies: [over(cands[1]!)], prefer: { x: 900, y: 300 } });
    expect(p).toEqual({ at: { x: 1200, y: 700 }, small: false });
  });
  it("with no spot clear, takes the least-covered one and stays small", () => {
    const bodies = [over(cands[0]!, 80), over(cands[1]!, 20), over(cands[2]!, 80)];
    expect(placeSpot({ ...base, bodies, prefer: cands[0] })).toEqual({ at: cands[1], small: true });
  });
  it("would rather sit on a subject than on the text being read", () => {
    const p = placeSpot({ ...base, page: [over(cands[0]!, 10), over(cands[2]!, 10)], bodies: [over(cands[1]!, 80)], prefer: cands[0] });
    expect(p).toEqual({ at: cands[1], small: true });
  });
  it("never goes back to a spot he was shooed from", () => {
    const p = placeSpot({ ...base, offLimits: [{ x: 790, y: 210 }], prefer: { x: 900, y: 300 } });
    expect(p?.at).toEqual({ x: 1200, y: 700 });
  });
  it("has nowhere to go only when no spot is in the frame", () => {
    expect(placeSpot({ ...base, cands: [{ x: 20, y: 20 }] })).toBeNull();
  });
});

describe("the flight's arc", () => {
  const a = { x: 200, y: 800 }, b = { x: 1000, y: 800 };
  it("is clear when nothing lies along it", () => {
    expect(arcClear(a, b, 0.14, 128, [])).toBe(true);
  });
  it("bows away from a subject in its way", () => {
    // flying right, the usual bow (+) dips below the straight line and the other (-) rises above it
    const usual = arcPoint(a, b, 0.14, 0.5), other = arcPoint(a, b, -0.14, 0.5);
    expect(usual.y).toBeGreaterThan(800);
    expect(other.y).toBeLessThan(800);
    const lump = { l: usual.x - 30, t: usual.y - 30, r: usual.x + 30, b: usual.y + 30 };
    expect(arcClear(a, b, 0.14, 128, [lump])).toBe(false);
    expect(bowFor(a, b, 128, [lump])).toBe(-0.14);
  });
  it("bows into the frame, never out past its edge, flying along it", () => {
    // down the left edge, the usual bow (+) swings his body (40 px either side of his centre) out past x = 0
    const top = { x: 54, y: 100 }, bottom = { x: 54, y: 800 };
    expect(arcPoint(top, bottom, 0.14, 0.5).x).toBeLessThan(40);
    expect(bowFor(top, bottom, 128, [], frame)).toBe(-0.14);
    expect(bowFor(bottom, top, 128, [], frame)).toBe(0.14);
  });
  it("keeps the usual bow when both sides are as clear", () => {
    expect(bowFor(a, b, 128, [])).toBe(0.14);
  });
});
