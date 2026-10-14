/**
 * The camera through Work (work.ts); how the path is kept smooth is ADR 0003's amendment of 2026-10-11.
 * - The departure, judged by eye in the relay's harness (local research): held behind the relay by home while Work's
 *   intro is read, over its gimbal and down onto its axis, charged, and thrown down its barrel to the flash, which is a
 *   cut (to August 2023).
 * - The build, judged in home-build's harness (.scratch/redesign/research/home-build): out of the flash close on home's
 *   bare core, drawing back as the first quarter builds, then rising slowly from 12° above the ring's plane to 36° and
 *   drawing back as the ring grows, the ship framed right of the column. It holds the side his star lights from the side
 *   (its light a quarter turn off the view), so every quarter is built in light: the ring turns under it (`turnOf`), the
 *   camera never goes round it.
 */
import { Quaternion, Vector3 } from "three";
import { keyFrom, type CameraKey, type Vec3 } from "@/lib/film/path";
import type { WorkPlan } from "./work";
import type { World } from "./world";

const tup = (v: Vector3): Vec3 => [v.x, v.y, v.z];
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const DEG = Math.PI / 180;
/** keys this far apart, in screens; through the relay's drop, its charge and its throw, closer, so the film's easing
 *  between them doesn't ripple the camera's speed where it's close to the hardware */
const STEP = 0.05, FINE = 0.02;

type Relay = World["relay"];
type V = readonly [number, number, number];
const unit = (x: number, y: number, z: number): V => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
const plus = (a: V, d: V, k: number): V => [a[0] + d[0] * k, a[1] + d[1] * k, a[2] + d[2] * k];

/** In the relay's model frame (x to its right, y along its throw, z up; its gimbal's outer ring is 0.78 across). */
export const SPOT = {
  /** where the eye rests: between the core and the barrel */
  look: [0.15, 0.7, -0.05] as V,
  mouth: [0, 3.3, 0] as V,
  /** the throw starts here: on the axis, in the gap between the gimbal and the first coil */
  launch: [0, 1.15, 0] as V,
  /** the align comes over the gimbal and down into that gap, still moving on along the axis as it drops onto it (a
   *  drop from straight above the launch spot carried the camera past it and back) */
  over: [-1.2, -0.2, 1.9] as V,
  down: [0, 0.7, 0.95] as V,
};
/** behind and left of the relay, above it, `d` out from where the eye rests */
const behind = (d: number) => plus(SPOT.look, unit(-3.05, -3.3, 1.4), d);
const at = (r: Relay, p: V) => r.at(p[0], p[1], p[2]);

type Pose = { pos: Vector3; target: Vector3; cx: number; cy: number };

/**
 * The departure's keys, from the relay's hold to its throw's flash. The way in to the hold is the film's own: from
 * Around home's last key, it flies the camera in as it flies between any two shots.
 */
export function departKeys({ W, plan, port }: { W: World; plan: WorkPlan; port: boolean }): CameraKey[] {
  const keys: CameraKey[] = [];
  const cxHold = port ? 0.5 : 0.63, cyHold = port ? 0.34 : 0.5, cyRun = port ? 0.42 : 0.5;
  // on a phone the relay is seen from further, so its length fits the width
  const far = port ? 1.7 : 1;
  const push = (t: number, p: Pose) => keys.push(keyFrom(t, tup(p.pos), tup(p.target), { cx: p.cx, cy: p.cy, near: 0.3, region: "work" }));
  const each = (t0: number, t1: number, f: (t: number, x: number) => Pose, end = true, step = STEP) => {
    const n = Math.max(1, Math.round((t1 - t0) / step));
    for (let i = 0; i < n + (end ? 1 : 0); i++) { const t = t0 + ((t1 - t0) * i) / n; push(t, f(t, i / n)); }
  };
  const r = W.relay, D = plan.depart.at;
  // the hold behind it: a still frame drifting a little closer
  each(D.hold[0], D.hold[1], (_, x) => ({ pos: at(r, behind((6.4 - 0.3 * smooth(0, 1, x)) * far)), target: at(r, SPOT.look), cx: cxHold, cy: cyHold }), false);
  // over the gimbal and down onto the axis, the eye moving from the gimbal to the mouth, and looking down the throw (on
  // a phone the camera stands further out, so the way over the gimbal swings wider with it); the eye stays as far off as
  // it was when the drop began and only turns: the film eases the eye and its distance apart, so an eye that leapt ahead
  // or fell back would carry the camera on past the launch spot and back
  const wide = (p: V): V => plus(SPOT.launch, [p[0] - SPOT.launch[0], p[1] - SPOT.launch[1], p[2] - SPOT.launch[2]], Math.sqrt(far));
  const eye = (pos: Vector3, toward: Vector3, d: number) => pos.clone().addScaledVector(toward.clone().sub(pos).normalize(), d);
  const dEye = r.scale * 6.1 * far;
  const pts = [at(r, behind(6.1 * far)), at(r, wide(SPOT.over)), at(r, SPOT.down), at(r, SPOT.launch)];
  const uAt = byLength((u) => catmull(pts, u));
  each(D.align[0], D.align[1], (t, x) => {
    const e = smooth(0, 1, x), pos = catmull(pts, uAt(e));
    // the eye goes to the mouth early: it's further off than the core the camera passes over, so the view swings less
    const toward = at(r, SPOT.look).lerp(at(r, SPOT.mouth), smooth(D.align[0], D.align[0] + (D.align[1] - D.align[0]) * 0.35, t))
      .lerp(pos.clone().addScaledVector(r.axis, r.scale * 10), smooth(D.align[1] - 0.55 * (D.align[1] - D.align[0]), D.align[1], t));
    return { pos, target: eye(pos, toward, dEye), cx: cxHold + (0.5 - cxHold) * e, cy: cyHold + (cyRun - cyHold) * e };
  }, false, FINE);
  each(D.charge[0], D.charge[1], () => ({ pos: at(r, SPOT.launch), target: at(r, SPOT.launch).addScaledVector(r.axis, dEye), cx: 0.5, cy: cyRun }), false, FINE);
  // thrown down the barrel, faster and faster, the eye as far ahead as the charge held it
  const start = at(r, SPOT.launch), to = start.clone().addScaledVector(r.axis, 0.05);
  const thrown = (x: number) => {
    const pos = start.clone().lerp(to, 0.01 * x + 0.99 * x ** 3.2);
    return { pos, target: pos.clone().addScaledVector(r.axis, dEye), cx: 0.5, cy: cyRun };
  };
  each(D.throw[0], D.throw[1], (_, x) => thrown(x), false, FINE);
  // its last frame held to the flash's peak, so what comes after it (a cut, under the flash) is a cut
  keys.push(keyFrom(D.throw[1] - 0.003, tup(thrown(1).pos), tup(thrown(1).target), { cx: 0.5, cy: cyRun, near: 0.3, region: "work" }));
  return keys;
}

/**
 * The build's side: the azimuth the camera looks from, round the ship's axis as its model's bays run (0 is bay 0's way,
 * (cos az, 0, −sin az) in its frame): a quarter turn round from his star, so the ship's lit from the side.
 * `frame`: the ship's pose; `toSun`: from home towards his star.
 */
export function buildSide(frame: Quaternion, toSun: Vector3) {
  const s = toSun.clone().applyQuaternion(frame.clone().invert());
  return Math.atan2(-s.z, s.x) - Math.PI / 2;
}

/**
 * The ring's turn about its axis (radians) with `q` quarters turned: quarter q's middle (its model's 30° + 90° q) comes
 * round to 15° right of the camera's way in, the near side his star lights from the side, so the next is always built
 * there.
 */
export const turnOf = (side: number, q: number) => side + 15 * DEG - 30 * DEG - (Math.PI / 2) * q;

/** The build's keys, from the bare core out of the flash to the closed ring (`plan.total`). */
export function buildKeys({ home, r, frame, side, plan, port, aspect, tanH }: {
  /** home's middle, and the ship's bounding radius as drawn */
  home: Vector3; r: number;
  /** the ship's pose, and the build's side (`buildSide`) */
  frame: Quaternion; side: number;
  plan: WorkPlan; port: boolean; aspect: number; tanH: number;
}): CameraKey[] {
  const keys: CameraKey[] = [];
  const t0 = plan.core[0], t1 = plan.total;
  // on a phone the ring must fit the frame's width
  const fit = (r * 1.12) / (tanH * aspect);
  const cx = port ? 0.5 : 0.64, cy = port ? 0.36 : 0.52;
  const dir = (az: number, el: number) => new Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)).applyQuaternion(frame);
  const n = Math.max(1, Math.round((t1 - t0) / STEP));
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    // close on the bare core, drawing back as the first quarter builds, then on back slowly as the ring grows
    const g = smooth(t0, t1, t), g1 = clamp01((t - t0 + 0.1) / 0.9), back = 1 - (1 - g1) ** 2;
    const el = (12 + 24 * g) * DEG, d = Math.max((2.6 + 0.9 * back + 0.6 * g) * r, port ? fit * (0.75 + 0.25 * back) : 0);
    keys.push(keyFrom(t, tup(home.clone().addScaledVector(dir(side, el), d)), tup(home), { cx, cy, near: 0.3, region: "work" }));
  }
  return keys;
}

/**
 * How much the throw's streaks show at `t` (0..1): in as the throw goes, full at its flash, gone over the first stretch
 * after it, and nowhere else in the film.
 */
export function streaksAt(plan: WorkPlan) {
  const [a, b] = plan.depart.at.throw;
  return (t: number) => smooth(a, a + 0.6 * (b - a), t) * (1 - smooth(b + 0.02, b + 0.3, t));
}

/**
 * A curve's parameter by how far along it is (0..1 of its length), so it's travelled at the pace it's eased by: taken by
 * its own parameter, a Catmull–Rom curve's speed swells and sags from one stretch to the next, and the camera jolts.
 */
function byLength(curve: (u: number) => Vector3, n = 64) {
  const lens = [0];
  for (let i = 1, prev = curve(0); i <= n; i++) { const p = curve(i / n); lens.push(lens[i - 1]! + p.distanceTo(prev)); prev = p; }
  return (k: number) => {
    const s = k * lens[n]!, i = Math.max(0, Math.min(n - 1, lens.findIndex((l) => l >= s) - 1));
    return (i + clamp01((s - lens[i]!) / Math.max(1e-12, lens[i + 1]! - lens[i]!))) / n;
  };
}

/** a uniform Catmull–Rom through `pts`, at `x` (0..1) by parameter (the points are spread evenly enough for it) */
function catmull(pts: Vector3[], x: number) {
  const n = pts.length - 1, f = Math.min(n - 1e-9, Math.max(0, x * n)), i = Math.floor(f), w = f - i;
  const p0 = pts[Math.max(0, i - 1)]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[Math.min(n, i + 2)]!;
  const w2 = w * w, w3 = w2 * w;
  return new Vector3(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * w + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * w2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * w3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * w + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * w2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * w3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * w + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * w2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * w3),
  );
}
