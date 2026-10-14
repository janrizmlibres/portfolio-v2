import { describe, expect, it } from "vitest";
import { bracketSpread, chipAt, nearestStar, placeStarLabel, subjectAt, within } from "./hand";

describe("what the pointer is over", () => {
  it("finds the nearest star within reach, never one behind the camera", () => {
    const pts = [{ x: 100, y: 100, z: 0.5 }, { x: 108, y: 100, z: 0.5 }, { x: 102, y: 100, z: 1.2 }, null];
    expect(nearestStar(pts, 106, 101)).toBe(1);
    expect(nearestStar(pts, 101, 100)).toBe(0);
    expect(nearestStar(pts, 140, 100)).toBeNull();
  });

  it("finds the subject under the pointer: a disc, with a little reach round a small one", () => {
    const subjects = [
      { hit: { kind: "disc" as const, x: 200, y: 200, R: 80 } },
      { hit: { kind: "disc" as const, x: 400, y: 200, R: 6 } },
      { hit: null },
    ];
    expect(subjectAt(subjects, 250, 230)).toBe(0);
    expect(subjectAt(subjects, 415, 200)).toBe(1); // within 22 px of a small one
    expect(subjectAt(subjects, 600, 600)).toBeNull();
  });

  it("finds a subject by its four corners, a quad on screen", () => {
    const face = { kind: "quad" as const, pts: [{ x: 100, y: 100 }, { x: 300, y: 120 }, { x: 300, y: 260 }, { x: 100, y: 240 }] };
    expect(subjectAt([{ hit: face }], 200, 180)).toBe(0);
    expect(subjectAt([{ hit: face }], 200, 300)).toBeNull();
  });

  it("prefers the subject whose middle is nearer when two overlap", () => {
    const subjects = [{ hit: { kind: "disc" as const, x: 200, y: 200, R: 100 } }, { hit: { kind: "disc" as const, x: 260, y: 200, R: 30 } }];
    expect(subjectAt(subjects, 255, 200)).toBe(1);
  });
});

describe("where the chip sits", () => {
  it("sits below and right of the pointer", () => {
    expect(chipAt({ x: 100, y: 100 }, 120, 24, 1440, 900)).toEqual({ x: 118, y: 118 });
  });

  it("stays inside the window", () => {
    const p = chipAt({ x: 1430, y: 890 }, 120, 24, 1440, 900);
    expect(p.x + 120).toBeLessThanOrEqual(1432);
    expect(p.y + 24).toBeLessThanOrEqual(892);
  });
});

describe("the chip's brackets spread with the pointer's speed", () => {
  it("are closed when the pointer is still, and open no further than their limit", () => {
    expect(bracketSpread(0)).toBe(0);
    expect(bracketSpread(600)).toBeGreaterThan(0);
    expect(bracketSpread(1e6)).toBe(12);
  });
});

describe("the star label", () => {
  const size = { w: 160, h: 34 };

  it("hangs on a leader line from the ring, up and to the right", () => {
    const p = placeStarLabel({ x: 500, y: 400 }, size.w, size.h, 1440, 900);
    expect(p.line).not.toBeNull();
    const [x1, y1, x2, y2] = p.line!;
    expect(Math.hypot(x1 - 500, y1 - 400)).toBeGreaterThan(6); // it starts at the ring, not the star
    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBeLessThan(y1);
    expect(p.x).toBeGreaterThanOrEqual(x2 - 1);
  });

  it("turns to the left near the window's right edge", () => {
    const p = placeStarLabel({ x: 1400, y: 400 }, size.w, size.h, 1440, 900);
    expect(p.line![2]).toBeLessThan(p.line![0]);
    expect(p.x + size.w).toBeLessThanOrEqual(p.line![2] + 1);
  });

  it("hangs downwards near the window's top", () => {
    const p = placeStarLabel({ x: 500, y: 20 }, size.w, size.h, 1440, 900);
    expect(p.line![3]).toBeGreaterThan(p.line![1]);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });
});

describe("the film's windows, where the hand answers", () => {
  it("holds a time inside any of its spans, their ends included", () => {
    const spans = [[-Infinity, 0.5], [3, 4]] as const;
    expect(within(spans, -1)).toBe(true);
    expect(within(spans, 0.5)).toBe(true);
    expect(within(spans, 1)).toBe(false);
    expect(within(spans, 3.5)).toBe(true);
    expect(within(spans, 4)).toBe(true);
    expect(within(spans, 4.01)).toBe(false);
    expect(within([], 0)).toBe(false);
  });
});
