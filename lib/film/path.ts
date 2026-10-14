/**
 * The camera as one path through the whole film. A key is a pose at a time, in screens of scroll: what the camera
 * looks at (target), the direction it looks from (dir), its distance, where the target sits on screen (cx, cy), and
 * the region whose light surrounds it. Every value runs on a monotone cubic through the keys, so the camera's speed
 * is continuous everywhere and it never overshoots a key. Distance runs in log space, so a dive or a pull-out reads
 * as one steady speed however far it goes, and light blends in OKLab.
 */
import { oklchToOklab, REGION_LIGHT, type Light, type Oklab, type Region } from "@/lib/universe/light";
import { monotoneCubic } from "./track";

export type Vec3 = [number, number, number];

export type CameraKey = {
  t: number;
  target: Vec3;
  /** unit vector from the target towards the camera */
  dir: Vec3;
  dist: number;
  cx: number;
  cy: number;
  /** the distance at which stars are drawn at their own size */
  near: number;
  /** the gas's brightness */
  dust: number;
  /** how far the region's light spreads round the screen's centre */
  spread: number;
  region: Region;
  /** its light, `k` of the way from its region's to another region's (a key between two regions' shots) */
  blend?: { region: Region; k: number };
};

export type CameraPose = {
  pos: Vec3;
  target: Vec3;
  cx: number;
  cy: number;
  near: number;
  dust: number;
  spread: number;
  light: Light;
};

type KeyOptions = Partial<Omit<CameraKey, "t" | "target" | "dir" | "dist">>;

const DEFAULTS = { cx: 0.5, cy: 0.5, near: 0.32, dust: 0.03, spread: 3, region: "about" as Region };

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** A key from a target, a direction to look from, and a distance. */
export function look(t: number, target: Vec3, dir: Vec3, dist: number, o: KeyOptions = {}): CameraKey {
  return { ...DEFAULTS, ...o, t, target: [...target], dir: norm(dir), dist };
}

/** A key from a camera position and a target. */
export function keyFrom(t: number, pos: Vec3, target: Vec3, o: KeyOptions = {}): CameraKey {
  const d: Vec3 = [pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]];
  return look(t, target, d, Math.hypot(d[0], d[1], d[2]), o);
}

/**
 * The keys between two shots, a key every `step` screens, so the view turns between them evenly, round a great circle,
 * eased in and out: the film eases each component of a direction apart, so between shots looking from far apart it
 * would whip round in the middle. The target, the screen spot and the rest ease across with it, the distance in log
 * space, and the light from the one's region to the other's.
 */
export function bridge(a: CameraKey, b: CameraKey, step = 0.05): CameraKey[] {
  const n = Math.max(1, Math.round((b.t - a.t) / step)), out: CameraKey[] = [];
  const dot = Math.min(1, Math.max(-1, a.dir[0] * b.dir[0] + a.dir[1] * b.dir[1] + a.dir[2] * b.dir[2])), ang = Math.acos(dot);
  const mix = (x: number, y: number, k: number) => x + (y - x) * k;
  for (let i = 1; i < n; i++) {
    const x = i / n, e = x * x * (3 - 2 * x);
    // (slerp: the direction swept at an even rate round the great circle through both)
    const sa = ang > 1e-6 ? Math.sin((1 - e) * ang) / Math.sin(ang) : 1 - e, sb = ang > 1e-6 ? Math.sin(e * ang) / Math.sin(ang) : e;
    const dir = norm([a.dir[0] * sa + b.dir[0] * sb, a.dir[1] * sa + b.dir[1] * sb, a.dir[2] * sa + b.dir[2] * sb]);
    out.push({
      t: mix(a.t, b.t, x),
      target: [mix(a.target[0], b.target[0], e), mix(a.target[1], b.target[1], e), mix(a.target[2], b.target[2], e)],
      dir,
      dist: Math.exp(mix(Math.log(a.dist), Math.log(b.dist), e)),
      cx: mix(a.cx, b.cx, e),
      cy: mix(a.cy, b.cy, e),
      near: Math.exp(mix(Math.log(a.near), Math.log(b.near), e)),
      dust: mix(a.dust, b.dust, e),
      spread: mix(a.spread, b.spread, e),
      region: a.region,
      ...(a.region !== b.region ? { blend: { region: b.region, k: e } } : {}),
    });
  }
  return out;
}

/**
 * The keys of a flight from one shot to another, a key every `step` screens: the camera travels a curve from where `a`
 * puts it to where `b` does, leaving at `leave` and arriving at `arrive` (velocities, in units a screen; from rest, it
 * pulls away slowly), while its eye passes from `a`'s target to `b`'s over `look` (of the way, 0..1), the subject's spot
 * on screen and the light going with it. The keys pin the camera's position, so the film's easing of the eye and its
 * distance apart can't carry it on and back between them.
 */
export function travel(a: CameraKey, b: CameraKey, o: { leave: Vec3; arrive: Vec3; look: [number, number]; step?: number }): CameraKey[] {
  const span = b.t - a.t, n = Math.max(1, Math.round(span / (o.step ?? 0.05))), out: CameraKey[] = [];
  const posOf = (k: CameraKey) => [0, 1, 2].map((i) => k.target[i]! + k.dir[i]! * k.dist);
  const A = posOf(a), B = posOf(b);
  const mix = (x: number, y: number, k: number) => x + (y - x) * k;
  const [l0, l1] = o.look;
  for (let i = 1; i < n; i++) {
    const x = i / n, x2 = x * x, x3 = x2 * x;
    // a cubic Hermite curve, its tangents the velocities over the whole stretch
    const h00 = 2 * x3 - 3 * x2 + 1, h10 = x3 - 2 * x2 + x, h01 = -2 * x3 + 3 * x2, h11 = x3 - x2;
    const pos = [0, 1, 2].map((j) => h00 * A[j]! + h10 * o.leave[j]! * span + h01 * B[j]! + h11 * o.arrive[j]! * span) as Vec3;
    const s = Math.min(1, Math.max(0, (x - l0) / (l1 - l0))), e = s * s * (3 - 2 * s);
    const target = [0, 1, 2].map((j) => mix(a.target[j]!, b.target[j]!, e)) as Vec3;
    const blend = a.region !== b.region && e > 0 && e < 1 ? { blend: { region: b.region, k: e } } : {};
    out.push(keyFrom(a.t + span * x, pos, target, {
      cx: mix(a.cx, b.cx, e),
      cy: mix(a.cy, b.cy, e),
      near: Math.exp(mix(Math.log(a.near), Math.log(b.near), e)),
      dust: mix(a.dust, b.dust, e),
      spread: mix(a.spread, b.spread, e),
      region: e >= 1 ? b.region : a.region,
      ...blend,
    }));
  }
  return out;
}

// each key's row of values, one track per value
const AT = { target: 0, dir: 3, logDist: 6, cx: 7, cy: 8, logNear: 9, dust: 10, spread: 11, tint: 12, space: 15 } as const;
const FIELDS = 18;

export function buildPath(input: readonly CameraKey[]) {
  if (!input.length) throw new Error("a camera path needs at least one key");
  const keys = [...input].sort((a, b) => a.t - b.t).map((k) => ({ ...k }));
  for (let i = 1; i < keys.length; i++) if (keys[i]!.t - keys[i - 1]!.t < 1e-3) keys[i]!.t = keys[i - 1]!.t + 1e-3;
  const ts = keys.map((k) => k.t);
  const rows = keys.map((k) => {
    const light = (which: "tint" | "space") => {
      const own = oklchToOklab(REGION_LIGHT[k.region][which]);
      if (!k.blend) return own;
      const to = oklchToOklab(REGION_LIGHT[k.blend.region][which]), f = k.blend.k;
      return own.map((v, i) => v + (to[i]! - v) * f);
    };
    const tint = light("tint"), space = light("space");
    return [...k.target, ...k.dir, Math.log(k.dist), k.cx, k.cy, Math.log(k.near), k.dust, k.spread, ...tint, ...space];
  });
  const tr = Array.from({ length: FIELDS }, (_, j) => monotoneCubic(ts, rows.map((r) => r[j]!)));
  const v = (j: number, t: number): Vec3 => [tr[j]!(t), tr[j + 1]!(t), tr[j + 2]!(t)];

  return {
    keys,
    start: ts[0]!,
    end: ts[ts.length - 1]!,
    at(t: number): CameraPose {
      const one = (j: number) => tr[j]!(t);
      const target = v(AT.target, t), dir = norm(v(AT.dir, t)), dist = Math.exp(one(AT.logDist));
      return {
        target,
        pos: [target[0] + dir[0] * dist, target[1] + dir[1] * dist, target[2] + dir[2] * dist],
        cx: one(AT.cx),
        cy: one(AT.cy),
        near: Math.exp(one(AT.logNear)),
        dust: one(AT.dust),
        spread: one(AT.spread),
        light: { tint: v(AT.tint, t) as Oklab, space: v(AT.space, t) as Oklab },
      };
    },
  };
}

export type CameraPath = ReturnType<typeof buildPath>;
