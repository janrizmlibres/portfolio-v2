import { describe, expect, it } from "vitest";
import { dolly, pullPose, type CamPose } from "./warp-camera";

const dist = (p: CamPose) => Math.hypot(p.pos[0] - p.target[0], p.pos[1] - p.target[1], p.pos[2] - p.target[2]);
// a pose in among the bodies, looking at one a little off the sky's centre, and the whole sky from outside
const near: CamPose = { pos: [0.3, 0.1, 0.32], target: [0.3, 0.1, 0.3], cx: 0.62, cy: 0.45, near: 0.02, spread: 0.4 };
const whole: CamPose = { pos: [2.4, 0.6, 3.1], target: [0, 0, 0], cx: 0.5, cy: 0.5, near: 4, spread: 1.3 };

describe("pullPose: the pull back out to the whole sky", () => {
  it("starts on the scene's own pose and ends on the whole sky's", () => {
    expect(pullPose(near, whole, 0)).toEqual(near);
    const end = pullPose(near, whole, 1);
    end.pos.forEach((v, i) => expect(v).toBeCloseTo(whole.pos[i]!));
    end.target.forEach((v, i) => expect(v).toBeCloseTo(whole.target[i]!));
    expect(end.cx).toBeCloseTo(whole.cx);
    expect(end.near).toBeCloseTo(whole.near);
  });

  it("draws back at an even pace in scale, not in metres: halfway is the geometric mean", () => {
    const d0 = dist(near), d1 = dist(whole);
    expect(dist(pullPose(near, whole, 0.5))).toBeCloseTo(Math.sqrt(d0 * d1), 3);
    let last = 0;
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const d = dist(pullPose(near, whole, s));
      expect(d).toBeGreaterThanOrEqual(last - 1e-9);
      last = d;
    }
  });

  it("keeps the subject where it's read while it's near, recentring on the sky only once far away", () => {
    const half = pullPose(near, whole, 0.5);
    const moved = Math.hypot(half.target[0] - near.target[0], half.target[1] - near.target[1], half.target[2] - near.target[2]);
    const all = Math.hypot(whole.target[0] - near.target[0], whole.target[1] - near.target[1], whole.target[2] - near.target[2]);
    expect(moved / all).toBeLessThan(0.1);
    expect(Math.abs(half.cx - near.cx)).toBeLessThan(0.1 * Math.abs(whole.cx - near.cx) + 1e-9);
  });
});

describe("dolly: the arrival, out of the destination's point of light", () => {
  it("pulls the camera straight back along its look, the target held where it is on screen", () => {
    const far = dolly(near, 40);
    expect(far.target).toEqual(near.target);
    expect(far.cx).toBe(near.cx);
    expect(dist(far)).toBeCloseTo(dist(near) * 40);
    const dir = (p: CamPose) => p.pos.map((v, i) => (v - p.target[i]!) / dist(p));
    dir(far).forEach((v, i) => expect(v).toBeCloseTo(dir(near)[i]!));
  });
  it("at 1 is the scene's own pose", () => {
    expect(dolly(near, 1)).toEqual(near);
  });
});
