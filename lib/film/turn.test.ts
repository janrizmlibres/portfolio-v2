import { describe, expect, it } from "vitest";
import { clampPitch, createTurnCoast, orbitTurn, PITCH_RANGE, turnBy, turnSpeed } from "./turn";

const len = (v: readonly number[]) => Math.hypot(...v);
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i]!);

/** runs a coast released at (`az`, `el`) for `secs` at `hz`; returns how far it turned on each axis and its speed then */
function coast(az: number, el: number, secs: number, hz = 60) {
  const c = createTurnCoast(), dt = 1 / hz;
  c.release(az, el);
  const turned = { az: 0, el: 0 };
  let last = { az, el };
  for (let i = 0; i < Math.round(secs * hz); i++) { last = c.step(dt); turned.az += last.az * dt; turned.el += last.el * dt; }
  return { turned, last };
}

describe("a drag turns the view on both axes, as a grab would", () => {
  it("swings it round as the pointer moves sideways, and over as it moves up or down", () => {
    expect(turnBy(10, 0).az).toBeLessThan(0);
    expect(turnBy(10, 0).el).toBe(0);
    // pulling down lifts the camera, so the sky comes down with the hand
    expect(turnBy(0, 10).el).toBeGreaterThan(0);
    expect(turnBy(0, -10).el).toBeLessThan(0);
    expect(turnBy(0, 10).az).toBe(0);
  });

  it("turns as far per px on either axis", () => {
    expect(Math.abs(turnBy(0, 25).el)).toBeCloseTo(Math.abs(turnBy(25, 0).az), 9);
  });
});

describe("the drag's speed on both axes", () => {
  it("follows the pointer's last move, in radians a second, either way", () => {
    const s = turnSpeed(10, -6, 16.7);
    expect(s.az).toBeLessThan(0);
    expect(s.el).toBeLessThan(0);
    expect(turnSpeed(0, 0, 16.7)).toEqual({ az: 0, el: 0 });
  });

  it("is capped as a whole, keeping the flick's direction", () => {
    const s = turnSpeed(4000, 3000, 1);
    expect(Math.hypot(s.az, s.el)).toBeLessThanOrEqual(1.8 + 1e-9);
    expect(s.el / s.az).toBeCloseTo(-3000 / 4000, 6);
  });
});

describe("the coast: the view keeps turning when let go, on both axes", () => {
  it("carries on for about 3 s, like a massive thing", () => {
    expect(Math.abs(coast(1, 0.5, 2).last.az)).toBeGreaterThan(0.02);
    expect(coast(1, 0.5, 3.2).last).toEqual({ az: 0, el: 0 });
    expect(coast(1, 0.5, 4).turned.az).toBeGreaterThan(0.6);
    expect(coast(1, 0.5, 4).turned.el).toBeGreaterThan(0.3);
  });

  it("feels the same at 60 Hz and 120 Hz", () => {
    expect(coast(1, -1, 2, 120).turned.el).toBeCloseTo(coast(1, -1, 2, 60).turned.el, 2);
  });

  it("stops when told, and its pitch alone can be stopped (at the clamp)", () => {
    const c = createTurnCoast();
    c.release(1, 1);
    c.stopPitch();
    expect(c.step(1 / 60).el).toBe(0);
    expect(c.step(1 / 60).az).toBeGreaterThan(0);
    c.stop();
    expect(c.step(1 / 60)).toEqual({ az: 0, el: 0 });
    expect(c.moving).toBe(false);
  });
});

describe("the pitch is clamped, so the view never tips over the pole", () => {
  it("holds within its range either side of where it rests", () => {
    expect(clampPitch(0.18 + 2, 0.18)).toBeCloseTo(0.18 + PITCH_RANGE, 9);
    expect(clampPitch(0.18 - 2, 0.18)).toBeCloseTo(0.18 - PITCH_RANGE, 9);
    expect(clampPitch(0.3, 0.18)).toBe(0.3);
    expect(0.18 + PITCH_RANGE).toBeLessThan(Math.PI / 2 - 0.3);
  });
});

describe("orbitTurn: a pose turned about the world's origin", () => {
  const pos = [0, 0, 5] as const, target = [0, 0, 0] as const;

  it("swings the camera round the vertical by the yaw", () => {
    const r = orbitTurn(pos, target, Math.PI / 2, 0);
    expect(r.pos[0]).toBeCloseTo(5, 6);
    expect(r.pos[2]).toBeCloseTo(0, 6);
  });

  it("lifts the camera by the pitch, keeping its distance, never twisting it sideways", () => {
    const r = orbitTurn(pos, target, 0, 0.3);
    expect(r.pos[1]).toBeCloseTo(5 * Math.sin(0.3), 6);
    expect(r.pos[0]).toBeCloseTo(0, 9);
    expect(len(r.pos)).toBeCloseTo(5, 6);
  });

  it("turns the target with the camera, so a pose aimed off the origin keeps its aim", () => {
    const p = [1, 2, 6] as const, t = [0.5, 0.2, 1] as const;
    const r = orbitTurn(p, t, 0.4, -0.2);
    expect(len(sub(r.pos, r.target))).toBeCloseTo(len(sub(p, t)), 6);
    expect(len(r.target)).toBeCloseTo(len(t), 6);
  });

  it("leaves the pose as it was with nothing to turn", () => {
    const r = orbitTurn([1, 2, 3], [0.1, 0.2, 0.3], 0, 0);
    expect(r.pos).toEqual([1, 2, 3]);
    expect(r.target).toEqual([0.1, 0.2, 0.3]);
  });
});
