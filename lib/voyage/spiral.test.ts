import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { exitOf, faceOf, framesOn, outOf, outPose } from "./spiral";

const axis = new Vector3(0.0073, -0.183, -0.011);
const sp = { axis, R: 0.03, drop: 0.0042, a0: -0.045 };
const step = 0.7366666666666668;
const angs = Array.from({ length: 8 }, (_, k) => k * step);
const frames = framesOn(sp, angs);
const T = { F0: 34.25, F1: 36.25 };
// Save's store, on the axis, and the deck under it, the bore's way out
const store = new Vector3(axis.x, -0.153, axis.z), deckY = -0.161;
const REC = 0.088;

describe("the frames on the spiral", () => {
  it("stand round the shaft's axis, facing out from it, each lower than the one before", () => {
    frames.forEach((f, k) => {
      const a = sp.a0 + angs[k]!;
      expect(Math.hypot(f.P.x - axis.x, f.P.z - axis.z)).toBeCloseTo(0.03, 9);
      expect(f.n.dot(new Vector3(Math.cos(a), 0, Math.sin(a)))).toBeCloseTo(1, 9);
      expect(f.y.y).toBeCloseTo(1, 9);
      if (k > 0) expect(f.P.y).toBeLessThan(frames[k - 1]!.P.y);
    });
    expect(frames[0]!.P.y).toBeCloseTo(axis.y, 9);
  });
});

describe("the frames coming out of the store", () => {
  const wins = angs.map((_, k) => outOf(k, angs.length, T));

  it("start with the record you fell with, once the outcome's words have gone, the rest following it out one after another, all in place by the time the camera comes round", () => {
    expect(wins[0]![0]).toBeGreaterThanOrEqual(T.F0 + 0.4);
    wins.forEach((w, k) => {
      expect(w[1]).toBeGreaterThan(w[0]);
      expect(w[1]).toBeLessThanOrEqual(T.F1 + 1e-9);
      if (k > 0) expect(w[0]).toBeGreaterThan(wins[k - 1]![0]);
    });
  });

  it("each leaves the store a record lying down and ends in its place a frame, standing", () => {
    const p = new Vector3();
    for (const f of frames) {
      let s = outPose(store, f, 0, REC, p);
      expect(p.distanceTo(store)).toBeLessThan(1e-9);
      expect(s.size).toBeCloseTo(REC, 9);
      expect(s.tilt).toBe(0);
      s = outPose(store, f, 1, REC, p);
      expect(p.distanceTo(f.P)).toBeLessThan(1e-9);
      expect(s.size).toBe(1);
      expect(s.tilt).toBe(1);
    }
  });

  it("only ever falls on its way, never rising and dropping again, and stays a record's size until it's out of the shaft's bore", () => {
    const p = new Vector3();
    for (const f of frames) {
      let y = Infinity;
      for (let u = 0; u <= 1 + 1e-9; u += 0.01) {
        const s = outPose(store, f, u, REC, p);
        expect(p.y).toBeLessThanOrEqual(y + 1e-12);
        y = p.y;
        if (p.y > deckY) expect(s.size).toBeLessThan(0.3);
      }
    }
  });
});

describe("the frames going out by a hidden exit", () => {
  const n = angs.length, end = angs[n - 1]!, exit = end + step;
  const at = (k: number, s: number) => exitOf(angs[k]!, s, end, step);

  it("as the camera pulls out: none moved before, all gone after", () => {
    for (let k = 0; k < n; k++) {
      expect(at(k, 0)).toEqual({ ang: angs[k], size: 1 });
      expect(at(k, 1).size).toBe(0);
    }
  });

  it("slide on round the spiral as one chain, keeping their spacing, each shrinking into nothing at the same point a step past the last", () => {
    for (let s = 0; s <= 1; s += 0.02) {
      for (let k = 1; k < n; k++) {
        const a = at(k - 1, s), b = at(k, s);
        if (b.ang < exit) expect(b.ang - a.ang).toBeCloseTo(step, 9);
      }
    }
    for (let k = 0; k < n; k++) {
      let last = 1, gone = false;
      for (let s = 0; s <= 1 + 1e-9; s += 0.01) {
        const p = at(k, s);
        expect(p.ang).toBeLessThanOrEqual(exit + 1e-9);
        expect(p.size).toBeLessThanOrEqual(last + 1e-12);
        last = p.size;
        if (p.size === 0) { gone = true; expect(p.ang).toBeCloseTo(exit, 9); }
      }
      expect(gone).toBe(true);
    }
  });

  it("the last first, the first last", () => {
    for (let s = 0.05; s < 1; s += 0.05) for (let k = 1; k < n; k++) expect(at(k, s).size).toBeLessThanOrEqual(at(k - 1, s).size);
    expect(at(n - 1, 0.3).size).toBeLessThan(at(0, 0.3).size);
  });
});

describe("a frame turned square to you", () => {
  it("is the one the camera's round at, the rest turning back as it passes", () => {
    expect(faceOf(2 * step, 2 * step, step)).toBe(1);
    expect(faceOf(2 * step + step, 2 * step, step)).toBeLessThan(0.02);
    expect(faceOf(2 * step - 0.25 * step, 2 * step, step)).toBeGreaterThan(0.75);
  });
});
