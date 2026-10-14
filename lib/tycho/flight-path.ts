/**
 * Tycho's flight through the warp, as plain math (tested without three.js), after *Warp or scroll*'s journey.
 * World space is the viewport's own: x right and y down in CSS px, plus z towards the visitor's eye, which sits D px
 * in front of the middle of the screen (a 45° view). The page lies at z = 0, so a point there shows where it is; a
 * point at depth z shows at c + (p - c)·D/(D - z), D/(D - z) times as big. He flies along smooth paths through keys;
 * his pose follows from the motion (rig.ts), and his boosters' trails are points in this same space (warp-trail.ts).
 */
export type P3 = { x: number; y: number; z: number };
export type Key = P3 & { t: number; v?: [number, number, number] };
export type At = { x: number; y: number; z: number; vx: number; vy: number; vz: number; ax: number; ay: number; az: number };
export type Track = { t0: number; t1: number; at(t: number): At };

/** How far the eye sits in front of a screen `h` CSS px tall, for a 45° view. */
export const eyeDist = (h: number) => h / 2 / Math.tan((22.5 * Math.PI) / 180);

/** Where world point `p` shows on the screen (CSS px), and how many times its size at depth 0 (`k`). */
export function project(p: P3, c: { x: number; y: number }, D: number) {
  const k = D / Math.max(D * 0.04, D - p.z);
  return { x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k, k };
}

/**
 * A path through keys: times in seconds, and `v` (px/s) where it must pass at a given velocity (a stop is [0, 0, 0]).
 * Between keys, a cubic Hermite. Where `v` isn't given, the tangent is the slope of the parabola through the key and
 * its neighbours, so its velocity is continuous and uneven key spacing doesn't make it overshoot.
 */
export function path(keys: Key[]): Track & { keys: Key[] } {
  const n = keys.length, P = keys.map((k) => [k.x, k.y, k.z]), T = keys.map((k) => k.t);
  const V = keys.map((k, i) => {
    if (k.v) return k.v as number[];
    if (n === 1) return [0, 0, 0];
    if (i === 0) return P[1]!.map((x, j) => (x - P[0]![j]!) / (T[1]! - T[0]!));
    if (i === n - 1) return P[i]!.map((x, j) => (x - P[i - 1]![j]!) / (T[i]! - T[i - 1]!));
    const h0 = T[i]! - T[i - 1]!, h1 = T[i + 1]! - T[i]!;
    return P[i]!.map((x, j) => (((x - P[i - 1]![j]!) / h0) * h1 + ((P[i + 1]![j]! - x) / h1) * h0) / (h0 + h1));
  });
  const out: At = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0 };
  return {
    t0: T[0]!, t1: T[n - 1]!, keys,
    at(t) {
      if (n === 1 || t <= T[0]! || t >= T[n - 1]!) {
        const e = t <= T[0]! ? 0 : n - 1;
        [out.x, out.y, out.z] = P[e] as [number, number, number];
        out.vx = out.vy = out.vz = out.ax = out.ay = out.az = 0;
        return out;
      }
      let i = 0;
      while (i < n - 2 && t > T[i + 1]!) i++;
      const h = T[i + 1]! - T[i]!, s = (t - T[i]!) / h, s2 = s * s, s3 = s2 * s;
      const c = [2 * s3 - 3 * s2 + 1, (s3 - 2 * s2 + s) * h, -2 * s3 + 3 * s2, (s3 - s2) * h];
      const d = [(6 * s2 - 6 * s) / h, 3 * s2 - 4 * s + 1, (-6 * s2 + 6 * s) / h, 3 * s2 - 2 * s];
      const a = [(12 * s - 6) / (h * h), (6 * s - 4) / h, (-12 * s + 6) / (h * h), (6 * s - 2) / h];
      const f = (w: number[], j: number) => w[0]! * P[i]![j]! + w[1]! * V[i]![j]! + w[2]! * P[i + 1]![j]! + w[3]! * V[i + 1]![j]!;
      out.x = f(c, 0); out.y = f(c, 1); out.z = f(c, 2);
      out.vx = f(d, 0); out.vy = f(d, 1); out.vz = f(d, 2);
      out.ax = f(a, 0); out.ay = f(a, 1); out.az = f(a, 2);
      return out;
    },
  };
}

/** Several tracks back to back, each owning [t0, t1]; between them (or past the last) he holds the nearest end. */
export function route(...tracks: Track[]) {
  const list = [...tracks];
  return {
    add(p: Track) {
      list.push(p);
      list.sort((a, b) => a.t0 - b.t0);
    },
    at(t: number) {
      let best = list[0]!;
      for (const p of list) if (t >= p.t0) best = p;
      return best.at(t);
    },
  };
}

type OrbitOpts = {
  c: { x: number; y: number }; D: number; R: number; e?: number; depth: (a: number) => number; from: P3; dir: 1 | -1; t0: number; t1: number;
  turn?: number; lo?: number; hi?: number; endR?: number; endZ?: number; rise?: number; fall?: number; ringTol?: number;
};

/**
 * His one clean circle: from a standstill at `from`, it spirals onto a circle round c, goes round it the way `dir`
 * goes (+1 or -1: the sign of the angle's change, y down), and spirals off it into a standstill a little inside it.
 * Drawn on the screen, not in the world: the line the eye sees is the circle (radius R, its height squeezed by e) and
 * the spirals onto and off it, which bend the same way all along (no S); the depth (depth(a) round the circle,
 * easing from `from`'s and to endZ) only makes him smaller or bigger, and each point is placed in the world where it
 * shows at its place on the screen.
 * - The spirals: the radius eases from `from`'s to R quadratically over the first stretch of the angle, long enough
 *   that it never bends back, and from R to endR·R over the last stretch.
 * - How far round: as near a whole `turn` as lets it end in the sector [lo, hi] (angles, y down: the bottom of the
 *   circle by default), where it stops; `end` is where that is.
 * - The pace sets off quickly, cruises and brakes (up over `rise` of the time, down over `fall`).
 * `q(t)` is how far round (0..1) and `tq` its inverse; `angle(q)` the angle on the circle; `ringAt(a)` the circle's
 * point at angle a in the world; `angleOf(p)` the angle a world point shows at, seen from the middle; `ringOn` and
 * `ringOff` when he's on the circle, his fire there being the ring: from when his spiral onto it comes within `ringTol`
 * of its radius (the spiral eases in slowly, so he looks on it well before he's exactly on it) to when he leaves it.
 */
export function orbit({ c, D, R, e = 1, depth, from, dir, t0, t1, turn = Math.PI * 1.9, lo = Math.PI * 0.22, hi = Math.PI * 0.78, endR = 0.8, endZ = 0, rise = 0.16, fall = 0.3, ringTol = 0.05 }: OrbitOpts) {
  const TAU = Math.PI * 2, wrap = (x: number) => ((x % TAU) + TAU) % TAU, clamp = (a: number, b: number, x: number) => Math.min(b, Math.max(a, x));
  const sm = (x: number) => { const k = clamp(0, 1, x); return k * k * (3 - 2 * k); };
  const kf = D / (D - from.z), X0 = (from.x - c.x) * kf, Y0 = ((from.y - c.y) * kf) / e;
  const a0 = Math.atan2(Y0, X0), r0 = Math.hypot(X0, Y0);
  const sIn = wrap(dir > 0 ? lo - a0 : a0 - hi), sOut = sIn + (hi - lo);
  const fits = [clamp(sIn, sOut, turn), clamp(sIn + TAU, sOut + TAU, turn)].filter((s) => s > Math.PI * 0.9);
  const sweep = fits.sort((a, b) => Math.abs(a - turn) - Math.abs(b - turn))[0]!;
  const qe = Math.min(0.55, Math.max(0.9, Math.sqrt((2 * Math.max(0, r0 - R)) / (0.6 * R))) / sweep), qx = Math.min(0.35, 0.9 / sweep);
  // where the spiral comes within ringTol of the circle: its radius is off by |r0 - R|·(1 - q/qe)²
  const qIn = Math.abs(r0 - R) > ringTol * R ? qe * (1 - Math.sqrt((ringTol * R) / Math.abs(r0 - R))) : 0;
  const angle = (q: number) => a0 + dir * sweep * q;
  const world = (sx: number, sy: number, z: number, o: P3) => { const k = D / (D - z); o.x = c.x + (sx - c.x) / k; o.y = c.y + (sy - c.y) / k; o.z = z; return o; };
  const place = (q: number, o: P3) => {
    const a = angle(q), zR = depth(a);
    let r = R, z = zR;
    if (q < qe) { const u = q / qe; r = R + (r0 - R) * (1 - u) ** 2; z = from.z + (zR - from.z) * sm(u); }
    if (q > 1 - qx) { const u = (q - 1 + qx) / qx; r = R + (endR * R - R) * u * u; z = zR + (endZ - zR) * sm(u); }
    return world(c.x + r * Math.cos(a), c.y + e * r * Math.sin(a), z, o);
  };
  // the pace: speed (in the sweep's units) over time, integrated into a table
  const N = 400, tab = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N; tab[i] = tab[i - 1]! + sm(u / rise) * sm((1 - u) / fall); }
  for (let i = 1; i <= N; i++) tab[i]! /= tab[N]!;
  const q = (t: number) => {
    const u = clamp(0, 1, (t - t0) / (t1 - t0)) * N, i = Math.min(N - 1, Math.floor(u));
    return tab[i]! + (tab[i + 1]! - tab[i]!) * (u - i);
  };
  const tq = (v: number) => {
    let i = 0;
    while (i < N && tab[i + 1]! < v) i++;
    return t0 + ((t1 - t0) * (i + (i >= N ? 0 : clamp(0, 1, (v - tab[i]!) / Math.max(1e-9, tab[i + 1]! - tab[i]!))))) / N;
  };
  const out: At = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0 };
  const p0 = { x: 0, y: 0, z: 0 }, p1 = { x: 0, y: 0, z: 0 }, p2 = { x: 0, y: 0, z: 0 }, h = 1 / 240;
  return {
    t0, t1, sweep, dir, q, tq, angle, end: place(1, { x: 0, y: 0, z: 0 }), ringOn: tq(qIn), ringOff: tq(1 - qx),
    ringAt: (a: number, o: P3 = { x: 0, y: 0, z: 0 }) => world(c.x + R * Math.cos(a), c.y + e * R * Math.sin(a), depth(a), o),
    angleOf: (p: P3) => { const k = D / (D - p.z); return Math.atan2(((p.y - c.y) * k) / e, (p.x - c.x) * k); },
    at(t: number): At {
      const tc = clamp(t0, t1, t), still = t <= t0 || t >= t1;
      place(q(tc - h), p0); place(q(tc), p1); place(q(tc + h), p2);
      for (const k of ["x", "y", "z"] as const) {
        out[k] = p1[k];
        out[`v${k}`] = still ? 0 : (p2[k] - p0[k]) / (2 * h);
        out[`a${k}`] = still ? 0 : (p2[k] - 2 * p1[k] + p0[k]) / (h * h);
      }
      return out;
    },
  };
}
export type Orbit = ReturnType<typeof orbit>;

/**
 * The fire a jet leaves between one frame and the next: `steps` points along his path (`along`, from time t0 to t1),
 * each at the nozzle, whose offset from him turns from where it was at t0 (`from`) to where it is at t1 (`to`) as he
 * goes. Held at `to` for the whole frame, the offset would jump at each frame's first point, and a jet turning with
 * him would leave a saw-toothed line.
 */
export function nozzleTrail(along: (t: number) => P3, t0: number, t1: number, from: P3, to: P3, steps: number): P3[] {
  const out: P3[] = [];
  for (let i = 1; i <= steps; i++) {
    const u = i / steps, f = along(t0 + (t1 - t0) * u);
    out.push({ x: f.x + from.x + (to.x - from.x) * u, y: f.y + from.y + (to.y - from.y) * u, z: f.z + from.z + (to.z - from.z) * u });
  }
  return out;
}

/** How fast his lean may swing round in flight: the tip of his up crossing the sky, rad/s, from its turning alone. */
export const LEAN_SWING = 12;

/**
 * Which way he leans in flight, as an angle round the vertical (his up tips that way, by `tilt`): turned from where it
 * was (`prev`; NaN for nowhere yet) towards where his push wants it (`want`), the short way, and with the tip of his up
 * crossing the sky no faster than `rate` rad/s. His push can swing round in a frame (where it passes near straight
 * down, or at a key of his path, where his acceleration changes at once), and the way he leans would jump with it.
 * Pointing almost straight down (`aim`, its angle from straight up, near π), which way it leans says nothing, so he
 * keeps leaning the way he was. With next to no lean, the way can turn as fast as it likes.
 */
export function leanAround(prev: number, want: number, aim: number, tilt: number, dt: number, rate = LEAN_SWING) {
  if (!Number.isFinite(prev)) return want;
  const k = Math.min(1, Math.max(0, (Math.sin(aim) - 0.02) / 0.08)), say = aim > Math.PI / 2 ? k * k * (3 - 2 * k) : 1;
  const max = (rate * dt * say) / Math.max(Math.sin(tilt), 1e-3);
  const d = want - prev - Math.PI * 2 * Math.round((want - prev) / (Math.PI * 2));
  return prev + Math.max(-max, Math.min(max, d));
}

/** The camera's shake: smooth noise from a few incommensurate sines, within one unit each way on each axis. */
export function quake(t: number) {
  return {
    x: 0.55 * Math.sin(t * 37.1) + 0.3 * Math.sin(t * 61.7 + 1.3) + 0.15 * Math.sin(t * 103.3 + 4.1),
    y: 0.55 * Math.sin(t * 41.9 + 2.2) + 0.3 * Math.sin(t * 57.3 + 0.4) + 0.15 * Math.sin(t * 97.1 + 3.3),
  };
}
