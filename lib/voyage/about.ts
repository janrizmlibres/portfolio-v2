/**
 * About's camera on the ring ship, and Around home's frame. From past his star the camera comes down and in on a curve,
 * low across the ring's near modules, holds still on them while About is read (`aboutHold`), then pulls out, on round
 * the same way, to Around home's frame (`spreadView`), where the ship is a speck in the cloud of stars his About lit,
 * spread across the right of the frame.
 * One way round, on curved paths, never twisting (the camera's up stays the world's, and it never looks straight down
 * or up). Angles are taken in the ring's own frame: `phi` round its axis, `th` above its plane. Each runs on a
 * monotone cubic through the beats, the distance in log space, and the path is sampled into keys for the film's
 * camera path.
 */
import { Vector3 } from "three";
import { look, type CameraKey, type Vec3 } from "@/lib/film/path";
import { monotoneCubic } from "@/lib/film/track";

export type RingFrame = { n: Vector3; e1: Vector3; e2: Vector3 };

/** The ring's frame: its axis `n`, `e1` in its plane towards `ref`, `e2` = n × e1. */
export function ringFrame(axis: Vector3, ref: Vector3): RingFrame {
  const n = axis.clone().normalize();
  const e1 = ref.clone().addScaledVector(n, -ref.dot(n)).normalize();
  return { n, e1, e2: new Vector3().crossVectors(n, e1) };
}

/** The direction from the ship towards a camera `phi` round the axis and `th` above the plane. */
export function dirAt(F: RingFrame, phi: number, th: number) {
  return F.e1.clone().multiplyScalar(Math.cos(phi) * Math.cos(th)).addScaledVector(F.e2, Math.sin(phi) * Math.cos(th)).addScaledVector(F.n, Math.sin(th));
}

export function anglesOf(F: RingFrame, dir: Vector3) {
  const d = dir.clone().normalize();
  return { phi: Math.atan2(d.dot(F.e2), d.dot(F.e1)), th: Math.asin(Math.max(-1, Math.min(1, d.dot(F.n)))) };
}

const deg = Math.PI / 180;
/** a key at least this often (screens), so the path follows the arc rather than cutting across it */
const STEP = 0.05;
/**
 * A key the camera arrives from or goes on to: its time; where it is, `dir` and `dist` out from home (for where it goes
 * on to, out from what it looks at); what it looks at, `target` (home if none); and its screen spot.
 */
type End = { t: number; dir: Vector3; dist: number; cx?: number; cy?: number; target?: Vector3 };

/**
 * The hold, a still camera once About settles, low and close as if panning to a shot of the modules, one module taking
 * up about half the frame and the hub's stem still in it: just outside the rim and a few degrees over the ring's plane, looking across the near modules at the hub, whose stem stands at the
 * frame's right edge. The nearest module fills the middle and the ring's near arc runs from it to just clear of About's
 * words on the left; any closer and the ring would run on under them. It stands far enough round that the ring, posed
 * tilted, runs at a slant (never straight across), from the upper left down to the right, its far side rising to the hub. The ring turns through the held frame, so
 * modules and solar wings pass. How far out it stands comes from the frame's width (`holdOut`); the aim is `aimR` rims
 * out from the hub, `round` from the camera, and `aimUp` rims up its axis.
 */
export const HOLD = { phi: -55 * deg, th: 9 * deg, round: 0, aimR: 0, aimUp: 0.1, cx: 0.9, cy: 0.46 };
/** the ring's turn: radians a screen of scroll on the way in, and radians a second once it's settled (`ringSpin`) */
export const RING_TURN = { scroll: 0.25, rate: 0.02 };
/** on a phone: further out and a little higher, the station across the top half and About's words on the dark below */
const HOLD_PORT = { out: 2.5, th: 8 * deg, aimUp: 0.05, cx: 0.5, cy: 0.26 };
/** where the ring's near end may come to on a wide screen: just right of About's words (their column ends at about 0.3) */
const WORDS_EDGE = 0.345;
/** the modules' outer edges above and below the ring's plane, in rims */
const TUBE = 0.075;
const WORLD_UP = new Vector3(0, 1, 0);

/**
 * How far out from the hub the hold stands on a wide screen, in rims: as close as it can while the ring's near end, as
 * its camera sees it (the camera's up is the world's), stays right of About's words, with the hub at its spot on the
 * right. The ring is taken as its modules' outer edges; the search runs from 1.3 rims (off its hull) out.
 */
export function holdOut({ F, aspect, tanH }: { F: RingFrame; aspect: number; tanH: number }) {
  const nearEnd = (out: number) => {
    const cam = dirAt(F, HOLD.phi, HOLD.th).multiplyScalar(out), aim = F.n.clone().multiplyScalar(HOLD.aimUp);
    const f = aim.sub(cam).normalize(), r = new Vector3().crossVectors(f, WORLD_UP).normalize();
    let x = Infinity;
    for (let i = 0; i < 360; i++)
      for (const z of [-TUBE, TUBE]) {
        const p = dirAt(F, (i / 360) * Math.PI * 2, 0).addScaledVector(F.n, z).sub(cam), d = p.dot(f);
        if (d > 0) x = Math.min(x, HOLD.cx + p.dot(r) / d / (2 * tanH * aspect));
      }
    return x;
  };
  let lo = 1.3, hi = 4;
  if (nearEnd(lo) >= WORDS_EDGE) return lo;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (nearEnd(mid) >= WORDS_EDGE) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * The ring's turn in radians: with the scroll (`scroll` a screen) until it's settled at `settle`, and from then on only
 * by the clock (`rate` a second, `now` in seconds), so once you're there it turns on its own and scrolling just moves
 * on.
 */
export function ringSpin(t: number, now: number, { settle, scroll, rate }: { settle: number; scroll: number; rate: number }) {
  return scroll * Math.min(t, settle) + rate * now;
}

/**
 * About's camera for the station made real: from past his star it comes down and in on a curve, low across the ring's
 * near modules, lands on the hold as About's words finish writing in, holds dead still while they're read and while
 * they leave (`hold`), then pulls out, on round the same way, to Around home's frame.
 */
export function aboutHold({ H, axis, ref, rimR, from, hold, to, port, aspect, tanH }: {
  H: { P: Vector3 };
  axis: Vector3;
  ref: Vector3;
  rimR: number;
  /** the dive's last key, past his star (the stage keeps it) */
  from: End;
  /** from About's words being in to their having gone: the camera holds still */
  hold: [number, number];
  /** Around home's frame, which the pull-out arrives at (the stage keeps that key) */
  to: End;
  port: boolean;
  aspect: number;
  tanH: number;
}): CameraKey[] {
  const F = ringFrame(axis, ref);
  const S = port ? { ...HOLD, ...HOLD_PORT } : { ...HOLD, out: holdOut({ F, aspect, tanH }) };
  const [h0, h1] = hold;
  const a0 = anglesOf(F, from.dir), fromTarget = from.target ?? H.P;
  // Around home's camera, as seen from the hub
  const toTarget = to.target ?? H.P, toCam = toTarget.clone().addScaledVector(to.dir, to.dist);
  const a1 = anglesOf(F, toCam.clone().sub(H.P)), d1 = toCam.distanceTo(H.P);
  const out = rimR * S.out, sx = S.cx, sy = S.cy;
  // round the one way: from his star's side down to the hold, and on round to Around home's side
  let phi0 = a0.phi;
  while (phi0 > S.phi - 20 * deg) phi0 -= Math.PI * 2;
  while (phi0 < S.phi - 200 * deg) phi0 += Math.PI * 2;
  let phiEnd = a1.phi;
  while (phiEnd < S.phi + 30 * deg) phiEnd += Math.PI * 2;
  while (phiEnd > S.phi + 330 * deg) phiEnd -= Math.PI * 2;
  // what it looks at while held
  const held = H.P.clone().addScaledVector(dirAt(F, S.phi + S.round, 0), rimR * S.aimR).addScaledVector(F.n, rimR * S.aimUp);
  const X = (x: number) => (port ? 0.5 : x);
  const ln = Math.log;
  // each beat: time, phi, th, ln of the distance from the hub, cx, cy, and the aim (0 the hub .. 1 the hold's)
  // in and out at an even pace (the distance runs in log space, so it closes in at the same rate all the way), and the
  // pull-out mirrors the way in
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const cx0 = from.cx ?? X(sx), cy0 = from.cy ?? sy, cx1 = to.cx ?? X(sx), cy1 = to.cy ?? sy;
  const inAt = (k: number, aim: number): [number, number, number, number, number, number, number] =>
    [lerp(from.t, h0, k), lerp(phi0, S.phi, k), lerp(a0.th, S.th, k), lerp(ln(from.dist), ln(out), k), lerp(cx0, sx, k), lerp(cy0, sy, k), aim];
  const outAt = (k: number): [number, number, number, number, number, number, number] =>
    [lerp(h1, to.t, k), lerp(S.phi, phiEnd, k), lerp(S.th, a1.th, k), lerp(ln(out), ln(d1), k), lerp(sx, cx1, k), lerp(sy, cy1, k), 1];
  const beats: Array<[number, number, number, number, number, number, number]> = [
    inAt(0, 0),
    // the pan: down and in on a curve
    inAt(0.35, 0.2),
    inAt(0.7, 0.7),
    // held
    [h0, S.phi, S.th, ln(out), sx, sy, 1],
    [h1, S.phi, S.th, ln(out), sx, sy, 1],
    // the pull-out, back and on round
    outAt(0.3),
    outAt(0.65),
    outAt(1),
  ];
  const ts = beats.map((b) => b[0]);
  const tr = [1, 2, 3, 4, 5, 6].map((j) => monotoneCubic(ts, beats.map((b) => b[j]!)));
  const keys: CameraKey[] = [];
  const n = Math.ceil((to.t - from.t) / STEP);
  for (let i = 1; i < n; i++) {
    const t = from.t + ((to.t - from.t) * i) / n;
    const [phi, th, lnD, cx, cy, aim] = tr.map((f) => f(t)) as [number, number, number, number, number, number];
    const cam = H.P.clone().addScaledVector(dirAt(F, phi, th), Math.exp(lnD));
    // the aim pans from what the dive looked at onto the hold's on the way in, and over to Around home's on the way out
    const v = Math.min(1, Math.max(0, (t - from.t) / ((h0 - from.t) * 0.7))), w = Math.min(1, Math.max(0, (t - h1) / (to.t - h1)));
    const tg = fromTarget.clone().lerp(H.P.clone().lerp(held, aim), v * v * (3 - 2 * v)).lerp(toTarget, w * w * (3 - 2 * w));
    const d = cam.clone().sub(tg);
    keys.push(look(t, [tg.x, tg.y, tg.z], [d.x, d.y, d.z].map((v) => v / d.length()) as Vec3, d.length(), { cx, cy, near: 0.32, region: "about" }));
  }
  return keys;
}

// ---------------------------------------------------------------- Around home's frame

/** The eigenvector of a symmetric 3×3 matrix with the smallest eigenvalue (Jacobi rotations). */
function leastAxis(m: number[][]): Vector3 {
  const a = m.map((r) => [...r]), v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 24; sweep++) {
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]] as const) {
      if (Math.abs(a[p]![q]!) < 1e-14) continue;
      const th = 0.5 * Math.atan2(2 * a[p]![q]!, a[q]![q]! - a[p]![p]!), c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < 3; k++) {
        const akp = a[k]![p]!, akq = a[k]![q]!;
        a[k]![p] = c * akp - s * akq; a[k]![q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p]![k]!, aqk = a[q]![k]!;
        a[p]![k] = c * apk - s * aqk; a[q]![k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k]![p]!, vkq = v[k]![q]!;
        v[k]![p] = c * vkp - s * vkq; v[k]![q] = s * vkp + c * vkq;
      }
    }
  }
  const i = [0, 1, 2].reduce((b, j) => (a[j]![j]! < a[b]![b]! ? j : b), 0);
  return new Vector3(v[0]![i]!, v[1]![i]!, v[2]![i]!).normalize();
}

/**
 * Where to look from so a cloud of points (the stars About lit, round home) spreads as wide as it can in the frame:
 * along the cloud's thinnest axis (the side of it nearer `prefer`), tipped no further than `maxTip` from level so the
 * camera never looks straight down or up. Then the distance and the screen spot that fit the cloud, as seen, into
 * `box` (fractions of the frame: left, top, right, bottom), centred in it. The camera looks at home, which stays
 * among them. Points further than `within` from home are left out of the fit, so a few far stars don't shrink the rest.
 */
export function spreadView(pts: Vector3[], home: Vector3, { prefer, aspect, tanH, box, maxTip = 0.6, within = Infinity }: {
  prefer: Vector3; aspect: number; tanH: number; box: [number, number, number, number]; maxTip?: number;
  /** only the points this near home are fitted; the far ones' threads run on out of the frame */
  within?: number;
}) {
  const all = [...pts.filter((p) => p.distanceTo(home) <= within), home];
  const c = all.reduce((s, p) => s.add(p), new Vector3()).multiplyScalar(1 / all.length);
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of all) {
    const d = [p.x - c.x, p.y - c.y, p.z - c.z];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i]![j]! += d[i]! * d[j]!;
  }
  const dir = leastAxis(m);
  // (the camera looks at home from out along it, so home holds still as the pull-out arrives)
  if (dir.dot(prefer) < 0) dir.negate();
  // held within maxTip of level
  const UP = new Vector3(0, 1, 0), lim = Math.sin(maxTip);
  if (Math.abs(dir.y) > lim) {
    const flat = new Vector3(dir.x, 0, dir.z).normalize();
    dir.copy(flat.multiplyScalar(Math.sqrt(1 - lim * lim))).addScaledVector(UP, Math.sign(dir.y) * lim).normalize();
  }
  // the camera stands `D` out from the cloud's middle along `dir`, looking at home: the cloud's extent on screen, in
  // tan units round home
  const view = (D: number) => {
    const cam = c.clone().addScaledVector(dir, D), f = home.clone().sub(cam).normalize();
    const r = new Vector3().crossVectors(f, UP).normalize(), u = new Vector3().crossVectors(r, f);
    return { cam, f, r, u };
  };
  const extent = (D: number) => {
    const { cam, f, r, u } = view(D);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of all) {
      const q = p.clone().sub(cam), z = q.dot(f);
      if (z < 1e-6) return null;
      const x = q.dot(r) / z, y = q.dot(u) / z;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x0, x1, y0, y1 };
  };
  const [bl, bt, br, bb] = box, bw = (br - bl) * 2 * tanH * aspect, bh = (bb - bt) * 2 * tanH;
  const fits = (D: number) => { const e = extent(D); return !!e && e.x1 - e.x0 <= bw && e.y1 - e.y0 <= bh; };
  let lo = 1e-4, hi = 1;
  while (!fits(hi)) hi *= 2;
  for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
  const D = hi, e = extent(D)!, { cam } = view(D);
  // the cloud's middle on screen goes to the box's middle
  const mx = (e.x0 + e.x1) / 2, my = (e.y0 + e.y1) / 2;
  const cx = (bl + br) / 2 - mx / (2 * tanH * aspect), cy = (bt + bb) / 2 + my / (2 * tanH);
  return { target: home.clone(), dir: cam.clone().sub(home).normalize(), dist: cam.distanceTo(home), cx, cy };
}
