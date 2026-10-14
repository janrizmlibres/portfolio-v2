/**
 * The ribbon's frames as plain math: where each stands on the spiral that winds down under the shaft's foot, how it
 * comes out of Save's store to there, and how it goes out by the spiral's hidden exit as the camera pulls out. No machine holds them: they're
 * the pipeline's records, grown into frames, standing free as the stream's records fly (ribbon.ts draws them).
 */
import { Vector3 } from "three";

/** a frame where it stands: its centre `P`, its face's way out `n`, its width's way `x` (against the angle, so its front reads the right way round from outside), and up `y` */
export type Frame = { P: Vector3; x: Vector3; y: Vector3; n: Vector3; ang: number };

const UP = new Vector3(0, 1, 0);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * A frame at each angle round the spiral: `R` out from the axis, standing, facing out, the first at `axis` (on the
 * axis, at its height) turned `a0` round it, each `drop` lower per radian further round.
 */
export function framesOn(sp: { axis: Vector3; R: number; drop: number; a0: number }, angs: number[]): Frame[] {
  return angs.map((ang) => {
    const a = sp.a0 + ang, n = new Vector3(Math.cos(a), 0, Math.sin(a));
    const P = sp.axis.clone().addScaledVector(n, sp.R).addScaledVector(UP, -ang * sp.drop);
    const x = new Vector3(Math.sin(a), 0, -Math.cos(a));
    return { P, x, y: new Vector3().crossVectors(n, x), n, ang };
  });
}

/**
 * When frame `k` of `n` comes out of the store (film time): the first once the outcome's words have gone (`F0` + 0.4),
 * out of the bore as the camera's view comes down the shaft to its way out (`F0` + 0.8); the rest after it, one after
 * another, the last in its place as the camera starts round the spiral (`F1`).
 */
export function outOf(k: number, n: number, T: { F0: number; F1: number }): [number, number] {
  if (k === 0) return [T.F0 + 0.8, T.F0 + 1.7];
  const a0 = T.F0 + 1.2, last = T.F1 - 0.4, a = n > 2 ? a0 + ((k - 1) * (last - a0)) / (n - 2) : a0;
  return [a, a + 0.4];
}

/**
 * Frame `f` on its way out at `u` (0 in the store, 1 in its place), into `out`: down the bore from the store, then
 * out to its place, only ever falling (a curve from the store through the axis at its place's height). It stays a
 * record (`rec`, its size as a fraction of a frame's) while it's in the bore, then grows into a frame as it swings
 * out, tipping up from lying (`tilt` 0) to standing (1).
 */
export function outPose(store: Vector3, f: Frame, u: number, rec: number, out: Vector3) {
  // (the curve's middle point is on the axis, under the store, at the frame's height)
  const v = 1 - u, mid = 2 * u * v;
  out.set(v * v * store.x + mid * store.x + u * u * f.P.x, v * v * store.y + mid * f.P.y + u * u * f.P.y, v * v * store.z + mid * store.z + u * u * f.P.z);
  return { size: u >= 1 ? 1 : rec + (1 - rec) * smooth(0.3, 0.9, u), tilt: u <= 0 ? 0 : u >= 1 ? 1 : smooth(0.35, 0.95, u) };
}

/**
 * A frame going out by the spiral's hidden exit as the camera pulls out by `s` (0..1), each shrinking into thin air: the
 * frames slide on round the spiral as one chain, and each, from the last frame's place (`end`) on, shrinks into nothing
 * by a step further (`step`), where it's gone. The frame from angle `ang`: where round the spiral it is, and its size.
 */
export function exitOf(ang: number, s: number, end: number, step: number) {
  const exit = end + step, a = Math.min(exit, ang + Math.max(0, s) * exit);
  return { ang: a, size: 1 - smooth(end, exit, a) };
}

/** How far a frame at angle `ang` has turned square to you, with the camera round at `th` (frames `step` apart). */
export function faceOf(th: number, ang: number, step: number) {
  return Math.exp(-(((th - ang) / (0.5 * step)) ** 2));
}
