/**
 * Where Tycho can be in the frame. He's drawn on a square canvas, `size` px a side, centred on his spot; his body is
 * the box inside it his silhouette fills. A spot is free when no text, nothing else of the page's he mustn't cover,
 * and no 3D subject's footprint on screen comes within 10 px of his body, and when his body stays inside the frame.
 */
export type Pt = { x: number; y: number };
export type Rect = { l: number; t: number; r: number; b: number };
export type Frame = { vw: number; vh: number };

/** px kept clear between his body and any text */
const MARGIN = 10;
/** how far round a spot he was shooed from stays off-limits, px */
export const OFF_LIMITS_R = 120;
/** how much of his canvas his body fills: across (his arms at rest), and down (helmet to booster bell) */
const BODY_W = 0.62, BODY_H = 0.9;
/** px his body keeps inside the frame's edge */
const EDGE = 8;

export function bodyBox(c: Pt, size: number): Rect {
  const w = (size * BODY_W) / 2, h = (size * BODY_H) / 2;
  return { l: c.x - w, t: c.y - h, r: c.x + w, b: c.y + h };
}

const hits = (a: Rect, b: Rect) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

export function isClear(c: Pt, size: number, obstacles: readonly Rect[], margin = MARGIN) {
  const b = bodyBox(c, size), g = { l: b.l - margin, t: b.t - margin, r: b.r + margin, b: b.b + margin };
  return !obstacles.some((o) => hits(g, o));
}

export function inFrame(c: Pt, size: number, { vw, vh }: Frame) {
  const b = bodyBox(c, size);
  return b.l >= EDGE && b.t >= EDGE && b.r <= vw - EDGE && b.b <= vh - EDGE;
}

/** how far in from the frame's edges his centre sits when he hugs them */
const inset = (size: number) => ({ x: (size * BODY_W) / 2 + EDGE + 6, y: (size * BODY_H) / 2 + EDGE + 6 });

/** Spots just inside the frame's edges, about every `step` px, corners included. */
export function edgeCandidates(vw: number, vh: number, size: number, step = 80): Pt[] {
  const i = inset(size);
  const L = i.x, T = i.y, R = vw - i.x, B = vh - i.y, out: Pt[] = [];
  const along = (a: number, b: number) => {
    const n = Math.max(1, Math.round((b - a) / step));
    return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  };
  for (const x of along(L, R)) out.push({ x, y: T }, { x, y: B });
  for (const y of along(T, B).slice(1, -1)) out.push({ x: L, y }, { x: R, y });
  return out;
}

/**
 * Shaking the pointer over him: a reversal is a change of direction after at least 14 px of travel, on either axis;
 * `feed` answers how many reversals the busier axis has made in the last 0.9 s (four is a shake).
 */
export function createShake() {
  const axis = () => ({ dir: 0, anchor: NaN, prev: NaN, rev: [] as number[] });
  let ax = axis(), ay = axis();
  const step = (a: ReturnType<typeof axis>, v: number, now: number) => {
    if (Number.isNaN(a.prev)) { a.prev = a.anchor = v; return; }
    const d = v - a.prev;
    if (Math.abs(d) >= 1) {
      const dir = Math.sign(d);
      if (dir !== a.dir) {
        if (a.dir !== 0 && Math.abs(a.prev - a.anchor) >= 14) a.rev.push(now);
        a.anchor = a.prev;
        a.dir = dir;
      }
      a.prev = v;
    }
    while (a.rev.length && now - a.rev[0]! > 900) a.rev.shift();
  };
  return {
    feed(x: number, y: number, now: number) {
      step(ax, x, now);
      step(ay, y, now);
      return Math.max(ax.rev.length, ay.rev.length);
    },
    reset() { ax = axis(); ay = axis(); },
  };
}

/** Where a flick throws him: on along his velocity (px/s) for 0.22 s, his body kept inside the frame. */
export function releaseAt(at: Pt, v: Pt, size: number, { vw, vh }: Frame): Pt {
  const i = inset(size);
  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
  return { x: clamp(at.x + v.x * 0.22, i.x, vw - i.x), y: clamp(at.y + v.y * 0.22, i.y, vh - i.y) };
}

/** how much he shrinks on a spot that isn't clear */
export const SMALL = 0.7;

/** How much of his body, with its 10 px margin, the rects cover (px², overlaps counted once per rect). */
export function coverage(c: Pt, size: number, rects: readonly Rect[], margin = MARGIN) {
  const b = bodyBox(c, size), g = { l: b.l - margin, t: b.t - margin, r: b.r + margin, b: b.b + margin };
  let a = 0;
  for (const o of rects) {
    const w = Math.min(g.r, o.r) - Math.max(g.l, o.l), h = Math.min(g.b, o.b) - Math.max(g.t, o.t);
    if (w > 0 && h > 0) a += w * h;
  }
  return a;
}

/**
 * Where he parks among `cands`, keeping 10 px clear of the page (`page`: the text being read, label plates, the
 * page's chrome) and of the 3D subjects on screen (`bodies`), never within OFF_LIMITS_R of a spot he was shooed from:
 * - the clear spot nearest `prefer` (or the first clear one);
 * - with none clear, the one the subjects cover least among those clear of the page, where he stays small;
 * - with none clear of the page either, the least covered of all, small.
 * Null only when no spot is inside the frame.
 */
export function placeSpot({ cands, size, vw, vh, page, bodies, offLimits = [], prefer }: {
  cands: readonly Pt[]; size: number; vw: number; vh: number; page: readonly Rect[]; bodies: readonly Rect[]; offLimits?: readonly Pt[]; prefer?: Pt;
}): { at: Pt; small: boolean } | null {
  const ok = cands.filter((c) => inFrame(c, size, { vw, vh }) && !offLimits.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < OFF_LIMITS_R));
  if (!ok.length) return null;
  const dist = (c: Pt) => (prefer ? Math.hypot(c.x - prefer.x, c.y - prefer.y) : 0);
  const nearest = (cs: Pt[]) => cs.reduce((best, c) => (dist(c) < dist(best) ? c : best));
  const all = [...page, ...bodies];
  const clear = ok.filter((c) => isClear(c, size, all));
  if (clear.length) return { at: nearest(clear), small: false };
  const s = size * SMALL;
  // least covered first, then nearest the preferred spot
  const least = (cs: Pt[], rects: readonly Rect[]) => {
    let best = cs[0]!, bc = Infinity;
    for (const c of cs) {
      const cv = coverage(c, s, rects);
      if (cv < bc - 1e-6 || (Math.abs(cv - bc) <= 1e-6 && dist(c) < dist(best))) { bc = cv; best = c; }
    }
    return best;
  };
  const offPage = ok.filter((c) => isClear(c, s, page));
  return { at: offPage.length ? least(offPage, bodies) : least(ok, all), small: true };
}

/** the usual bow of his flight, as a share of its length off the straight line */
export const BOW = 0.14;

/** Where his flight from `a` to `b`, bowed by `bow`, is at `k` (0..1): direct, on a shallow arc. */
export function arcPoint(a: Pt, b: Pt, bow: number, k: number): Pt {
  const dx = b.x - a.x, dy = b.y - a.y, c = { x: (a.x + b.x) / 2 - dy * bow, y: (a.y + b.y) / 2 + dx * bow }, u = 1 - k;
  return { x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y };
}

/** samples along a flight, ends left out (he's leaving one spot and landing on another, each checked as a spot) */
const SAMPLES = [0.2, 0.35, 0.5, 0.65, 0.8];

/** Whether his body, along the flight, keeps clear of the rects. */
export function arcClear(a: Pt, b: Pt, bow: number, size: number, rects: readonly Rect[]) {
  return SAMPLES.every((k) => isClear(arcPoint(a, b, bow, k), size, rects));
}

/**
 * The bow that keeps his flight clearest: the usual one, unless the other side passes over less. Given the frame, a
 * bow that would carry his body out past its edge counts as passing over everything.
 */
export function bowFor(a: Pt, b: Pt, size: number, rects: readonly Rect[], frame?: Frame) {
  const out = size * size * 4;
  const cover = (bow: number) =>
    SAMPLES.reduce((s, k) => {
      const p = arcPoint(a, b, bow, k);
      return s + coverage(p, size, rects) + (frame && !inFrame(p, size, frame) ? out : 0);
    }, 0);
  return cover(-BOW) < cover(BOW) ? -BOW : BOW;
}
