import { describe, expect, it } from "vitest";
import { FOLD, SERVICE, ringRadius, strut, swingOf } from "./refinery";

// the shaft as the crawler drops into it, in the model's units (its long radius drawn at 1): its top 1.23 below the
// centre, a level every 1.23, six rings folded up the gallery, opening out to 0.57 once clear (0.72 on a portrait
// screen, where the crawler's drawn smaller and the shaft isn't)
const N = 6, TOP = -1.23, SP = 1.23, FULL = 0.57, FULL_PORT = 0.72;
const folded = (k: number) => FOLD.foldH - (2 * FOLD.foldH * k) / (N - 1);
const level = (k: number) => TOP - SP * k;
const ringAt = (k: number, e: number) => folded(k) + (level(k) - folded(k)) * e;
const radiusAt = (y: number, full = FULL) => ringRadius(-FOLD.clear - y, full);
// how far out a strut is at height y, or null where it doesn't reach
const strutRadiusAt = (j: number, swing: number, y: number) => {
  const { A, B } = strut(j, swing);
  if (y > Math.max(A[1], B[1]) || y < Math.min(A[1], B[1])) return null;
  const f = (y - A[1]) / (B[1] - A[1] || 1e-9);
  return Math.hypot(A[0] + (B[0] - A[0]) * f, A[2] + (B[2] - A[2]) * f);
};
// a ring's rim reaches a little past its radius; a strut keeps this far outside it
const RIM = 0.08;

describe("the service ring's struts", () => {
  it("at rest run from the ring in under the column to its axis, as the model has them", () => {
    for (let j = 0; j < 3; j++) {
      const { A, B } = strut(j, 0);
      expect(Math.hypot(A[0], A[2])).toBeCloseTo(SERVICE.r, 6);
      expect(A[1]).toBeCloseTo(SERVICE.y, 6);
      expect(Math.hypot(B[0], B[2])).toBeCloseTo(SERVICE.hubR, 6);
      expect(B[1]).toBeCloseTo(SERVICE.hubY, 6);
    }
  });

  it("draw back as the column opens, and stay back while a ring is low in the gallery", () => {
    expect(swingOf(0, folded(N - 1))).toBe(0);
    expect(swingOf(1, folded(N - 1))).toBe(1);
    expect(swingOf(0, -0.9)).toBe(1);
  });

  it("keep clear of every ring as the pipeline drops out and folds back in", () => {
    // opening: it parts ahead of the drop; closing: the drop and the parting run back together
    const runs = [(e: number) => Math.min(1, 0.29 + e), (e: number) => e];
    for (const full of [FULL, FULL_PORT]) for (const openOf of runs) {
      for (let e = 0; e <= 1.0001; e += 0.005) {
        const swing = swingOf(openOf(e), ringAt(N - 1, e));
        for (let k = 0; k < N; k++) {
          const y = ringAt(k, e);
          for (let j = 0; j < 3; j++) {
            const rs = strutRadiusAt(j, swing, y);
            if (rs !== null) expect(rs, `ring ${k} at e=${e.toFixed(3)}, strut ${j}`).toBeGreaterThan(radiusAt(y, full) + RIM);
          }
        }
      }
    }
  });
});

describe("a dropping ring", () => {
  it("stays folded until it's clear of the service ring, then opens out to the shaft's size", () => {
    expect(ringRadius(-0.1, FULL)).toBe(FOLD.foldR);
    expect(ringRadius(0, FULL)).toBe(FOLD.foldR);
    expect(ringRadius(FOLD.opening, FULL)).toBeCloseTo(FULL, 9);
    // it's clear of the ring's tube and its fittings before it opens
    expect(-FOLD.clear).toBeLessThan(SERVICE.y - SERVICE.tube);
  });
});
