/**
 * The warp's camera, as poses the sky draws from (its position, what it looks at, where that sits on screen, and the
 * stars' scale). Plain math, so it's tested without three.js.
 * - `pullPose`: the pull back out to the whole sky. It draws back at an even pace in scale (each step multiplies the
 *   distance), and the subject stays where it was read until the camera is far enough for the sky to take over the
 *   frame; only then does the look swing to the sky's centre. A gentle curve, never a swing at the start.
 * - `dolly`: the arrival. The camera comes in straight along its own look to the scene's pose, so the subject grows
 *   out of a point of light where it will be read.
 */
export type V3 = [number, number, number];
export type CamPose = { pos: V3; target: V3; cx: number; cy: number; near: number; spread: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

// the direction from `a` to `b`, `t` of the way round (spherical)
function slerp(a: V3, b: V3, t: number): V3 {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const th = Math.acos(d);
  if (th < 1e-5) return a;
  const s = Math.sin(th), ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

export function pullPose(from: CamPose, to: CamPose, s: number): CamPose {
  if (s <= 0) return from;
  const o0 = sub(from.pos, from.target), o1 = sub(to.pos, to.target);
  const d0 = Math.max(1e-9, len(o0)), d1 = Math.max(1e-9, len(o1));
  const d = Math.exp(lerp(Math.log(d0), Math.log(d1), s));
  // how far the camera has come in metres: the look and the framing follow that, so they hold while it's near
  const w = Math.abs(d1 - d0) < 1e-9 ? s : Math.min(1, Math.max(0, (d - d0) / (d1 - d0)));
  const dir = slerp(scale(o0, 1 / d0), scale(o1, 1 / d1), w);
  const target: V3 = [lerp(from.target[0], to.target[0], w), lerp(from.target[1], to.target[1], w), lerp(from.target[2], to.target[2], w)];
  return {
    pos: [target[0] + dir[0] * d, target[1] + dir[1] * d, target[2] + dir[2] * d],
    target,
    cx: lerp(from.cx, to.cx, w),
    cy: lerp(from.cy, to.cy, w),
    near: Math.exp(lerp(Math.log(Math.max(1e-9, from.near)), Math.log(Math.max(1e-9, to.near)), s)),
    spread: lerp(from.spread, to.spread, w),
  };
}

/** The pose `m` times as far from what it looks at, along its own look. */
export function dolly(p: CamPose, m: number): CamPose {
  if (m === 1) return p;
  const o = sub(p.pos, p.target);
  return { ...p, pos: [p.target[0] + o[0] * m, p.target[1] + o[1] * m, p.target[2] + o[2] * m] };
}
