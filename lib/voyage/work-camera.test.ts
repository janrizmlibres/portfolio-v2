import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import stars from "@/public/sky/stars-pca.json";
import { buildPath } from "@/lib/film/path";
import { buildKeys, buildSide, departKeys, streaksAt, turnOf } from "./work-camera";
import { voyageScript } from "./script";
import { layWorld } from "./world";
import type { V3 } from "./route";

const script = voyageScript();
const starAt = (id: string): V3 => { const s = (stars as { stars: Array<{ id: string; x: number; y: number; z: number }> }).stars.find((x) => x.id === id)!; return [s.x, s.y, s.z]; };
const W = layWorld(script, starAt);
const plan = script.plan;
const DEG = Math.PI / 180;
// a ship posed as About poses it, roughly: its axis tipped towards the camera
const frame = new Quaternion().setFromAxisAngle(new Vector3(1, 0.3, 0.2).normalize(), 0.9);
const toSun = W.SUN.clone().sub(W.HOME.P).normalize();
const r = W.HOME.r * 1.316, tanH = Math.tan(16 * DEG);
const build = (port: boolean) => buildKeys({ home: W.HOME.P, r, frame, side: buildSide(frame, toSun), plan, port, aspect: port ? 390 / 844 : 1440 / 900, tanH });

/** the view's turn along the film's own path, in degrees per screen, outside the flash */
function peakTurn(port: boolean) {
  const path = buildPath([...departKeys({ W, plan, port }), ...build(port)]);
  const t0 = plan.depart.at.hold[0], t1 = plan.total, dt = 0.01, f = plan.flash;
  const dirAt = (t: number) => { const p = path.at(t); return new Vector3(...p.target).sub(new Vector3(...p.pos)).normalize(); };
  let prev = dirAt(t0), peak = 0;
  for (let t = t0 + dt; t <= t1; t += dt) {
    const cur = dirAt(t);
    if (t < f - 0.12 || t > f + 0.15) peak = Math.max(peak, (Math.asin(Math.min(1, new Vector3().crossVectors(prev, cur).length())) / DEG) / dt);
    prev = cur;
  }
  return peak;
}

describe("buildSide and turnOf: the build is seen from the side his star lights from the side", () => {
  it("looks from a quarter turn round from his star, in the ring's plane, whatever the ship's pose", () => {
    const side = buildSide(frame, toSun);
    const axis = new Vector3(0, 1, 0).applyQuaternion(frame);
    const view = new Vector3(Math.cos(side), 0, -Math.sin(side)).applyQuaternion(frame);
    const sunFlat = toSun.clone().addScaledVector(axis, -toSun.dot(axis)).normalize();
    expect(view.dot(sunFlat)).toBeCloseTo(0, 6);
  });

  it("turns each quarter's middle round to just right of the camera's way in, before it builds", () => {
    const side = 1.234;
    for (let q = 0; q < 4; q++) {
      const mid = (30 + 90 * q) * DEG + turnOf(side, q);
      const off = (((mid - side - 15 * DEG) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      expect(off).toBeCloseTo(0, 9);
    }
  });
});

describe("buildKeys: the camera on home as it's built", () => {
  for (const port of [false, true]) {
    const label = port ? "on a phone" : "on a desktop", keys = build(port);
    it(`looks at home from the flash to the closed ring, rising and drawing back the whole way, ${label}`, () => {
      expect(keys[0]!.t).toBeCloseTo(plan.core[0], 9);
      expect(keys.at(-1)!.t).toBeCloseTo(plan.total, 9);
      const axis = new Vector3(0, 1, 0).applyQuaternion(frame);
      let lastEl = -1, lastD = 0;
      for (const k of keys) {
        expect(new Vector3(...k.target).distanceTo(W.HOME.P)).toBeLessThan(1e-9);
        const d = k.dist, el = Math.asin(new Vector3(...k.dir).dot(axis));
        expect(el).toBeGreaterThanOrEqual(lastEl - 1e-9);
        expect(d).toBeGreaterThanOrEqual(lastD - 1e-9);
        lastEl = el; lastD = d;
      }
      expect(lastEl / DEG).toBeCloseTo(36, 0);
    });
  }

  it("stands far enough off on a phone that the ring fits the frame's width", () => {
    for (const k of build(true)) expect(k.dist * tanH * (390 / 844)).toBeGreaterThan(r * 0.8);
  });
});

describe("the departure and the build together", () => {
  for (const port of [false, true]) {
    const PEAK = port ? 320 : 265;
    it(`turns gently ${port ? "on a phone" : "on a desktop"}: never faster than ${PEAK}° a screen outside the flash`, () => {
      expect(peakTurn(port)).toBeLessThan(PEAK);
    });
  }

  it("ends the departure on the flash, which is a cut, and has the throw's streaks only round it", () => {
    const keys = departKeys({ W, plan, port: false });
    expect(keys.at(-1)!.t).toBeCloseTo(plan.flash - 0.003, 9);
    const s = streaksAt(plan);
    expect(s(plan.flash)).toBeCloseTo(1, 2);
    expect(s(plan.depart.at.hold[0])).toBe(0);
    expect(s(plan.quarters[0]!.build[0])).toBe(0);
  });
});
