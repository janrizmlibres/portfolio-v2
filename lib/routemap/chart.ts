/**
 * The route map's chart, without three.js: the sky in miniature, seen from the hero's side and never turning (a map
 * doesn't turn), so it can be drawn in the page's HTML at first paint.
 * - The stars, projected straight along the hero's line of sight (a chart, not a perspective), framed on the voyage
 *   so its sections can be told apart (the whole sky would crowd them into a sixth of it): the stars beyond the
 *   frame's edge (radius 1) are left out, the ones near it fade. Screen y grows downwards.
 * - The voyage as one track through them, each point tied to the film time the camera is there, so where you are
 *   and the part you've travelled follow the film exactly: from the sky's centre, the dive to his star and home, Work's
 *   relay by home and back to home (its throw goes back in time, not across the sky) while it's built, straight on to
 *   Athena, the crawler, the ribbon hung under its shaft, and back out to his star at Contact.
 * - Each section marked where it sits.
 */
import { ATHENA, CRAWLER, HIS_STAR, PIPELINE } from "@/lib/content/voyage";
import type { SectionId } from "@/lib/film/block";
import { HERO_DIR, homeOf, UP, type V3 } from "@/lib/voyage/route";
import type { VoyageScript } from "@/lib/voyage/script";

export type P2 = [number, number];
type Star = { id: string; x: number; y: number; z: number };

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mix = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Projects the sky onto a chart seen along `dir`: right and up as the hero's camera has them, y downwards. */
export function projector(dir: V3) {
  const D = norm(dir), R = norm(cross(UP, D)), U = cross(D, R);
  return (p: V3): P2 => [dot(p, R), -dot(p, U)];
}

// where the world sets LogoLife's worlds off their stars (lib/voyage/world.ts)
const ATH_OFF: V3 = [-0.014, 0.006, 0.012], CRW_OFF: V3 = [-0.012, 0.005, 0.012];
/**
 * How far straight down from the crawler the ribbon's middle hangs, as the world lays it (ADR 0016, world.ts's
 * `RIB.C`): the shaft starts 1.6 of the crawler's radius under it, the spiral's axis starts just under the report's
 * deck, and its middle is half its drop further down. chart.test.ts holds the two together.
 */
function ribbonDrop(thEnd: number) {
  const CRW_R = 0.0078, SP = 0.0125, DROP = 0.0042;
  const report = PIPELINE.findIndex((s) => s.id === "report");
  return CRW_R * 1.6 + ((report - 1) * SP + 0.5 * SP) + 0.0235 + 0.5 * DROP * thEnd;
}

export type Mark = { at: P2; more?: P2[]; line?: P2[] };

export function layChart(script: VoyageScript, stars: readonly Star[]) {
  const raw = projector(HERO_DIR);
  const starAt = (id: string): V3 => { const s = stars.find((x) => x.id === id)!; return [s.x, s.y, s.z]; };

  const { relay, plan, times: T } = script;
  const SUN = starAt(HIS_STAR), HOME = homeOf(SUN).P;
  const ATH = add(starAt(ATHENA.star), ATH_OFF), CRW = add(starAt(CRAWLER.star), CRW_OFF);
  const RIB = add(CRW, [0, -ribbonDrop(T.thEnd), 0]);

  // the track: [film time, where the camera is looking]
  const way: Array<[number, V3]> = [[0, [0, 0, 0]], [0.55, SUN], [2.2, HOME], [T.O(6.2), HOME]];
  // Work: to the relay by home, held through its throw, then home again while it's built (the jump is back in time)
  way.push([plan.depart.at.come[1], relay.P], [plan.flash, relay.P], [plan.flash + 1e-3, HOME], [plan.total, HOME]);
  // straight on from home to Athena, as the camera's eye goes from the one to the other, and at her while she's read;
  // then the crawler through its pipeline, and down to the ribbon under its shaft while it turns
  way.push([T.A0, ATH], [T.A0 + 3.0, ATH], [T.C0 - 0.6, CRW], [T.PIPE_END, CRW], [T.F1, RIB], [T.G1, RIB], [T.END, SUN]);
  // framed on the voyage: its middle at the centre, its farthest point at 0.86 of the chart's half-width
  const rawWay = way.map((w) => raw(w[1]));
  const xs = rawWay.map((p) => p[0]), ys = rawWay.map((p) => p[1]);
  const c: P2 = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const k = 0.86 / Math.max(...rawWay.map((p) => dist(p, c)));
  const project = (p: V3): P2 => { const q = raw(p); return [(q[0] - c[0]) * k, (q[1] - c[1]) * k]; };
  const ts = way.map((w) => w[0]), pts = rawWay.map((q): P2 => [(q[0] - c[0]) * k, (q[1] - c[1]) * k]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + dist(pts[i - 1]!, pts[i]!));
  const total = cum.at(-1)!;

  // the segment the film is on at `t`, and how far through it
  const seg = (t: number) => {
    if (t <= ts[0]!) return { i: 0, w: 0 };
    if (t >= ts.at(-1)!) return { i: ts.length - 2, w: 1 };
    let i = 0;
    while (ts[i + 1]! <= t) i++;
    const span = ts[i + 1]! - ts[i]!;
    return { i, w: span > 0 ? (t - ts[i]!) / span : 1 };
  };
  const hereAt = (t: number): P2 => { const { i, w } = seg(t); return mix(pts[i]!, pts[i + 1]!, w); };
  /** the part of the track travelled by film time `t`, as a fraction of its length */
  const travelled = (t: number) => { const { i, w } = seg(t); return (cum[i]! + (cum[i + 1]! - cum[i]!) * w) / total; };

  const scenes = [...script.scenes].sort((x, y) => x.t0 - y.t0);
  const sectionAt = (t: number): SectionId => (scenes.findLast((s) => s.t0 <= t + 1e-9) ?? scenes[0]!).sec;

  const marks: Record<SectionId, Mark> = {
    "sec-hero": { at: project([0, 0, 0]) },
    "sec-about": { at: project(HOME) },
    "sec-work": { at: project(relay.P), line: [project(relay.P), project(HOME)] },
    "sec-projects": { at: project(ATH), more: [project(CRW), project(RIB)] },
    "sec-contact": { at: project(SUN) },
  };

  return {
    project,
    // the stars inside the frame, fading out over its last stretch
    stars: stars.flatMap((s) => {
      const at = project([s.x, s.y, s.z]), r = Math.hypot(at[0], at[1]);
      return r > 1.1 ? [] : [{ id: s.id, at, fade: r < 0.8 ? 1 : Math.max(0.05, (1.1 - r) / 0.3) }];
    }),
    track: pts,
    hereAt,
    travelled,
    sectionAt,
    marks,
  };
}

export type Chart = ReturnType<typeof layChart>;

/** The reading spot nearest film time `t`: under reduced motion its still is the one shown (they hand over half-way). */
export const spotNear = (t: number, spots: readonly number[]) =>
  spots.reduce((best, s) => (Math.abs(s - t) < Math.abs(best - t) ? s : best), spots[0]!);

/** A light-travel arc from `a` to `b`, bowed away from the chart's centre, as `n` points. */
export function arc(a: P2, b: P2, bend = 0.28, n = 32): P2[] {
  const m = mix(a, b, 0.5), l = dist(a, b);
  let nx = -(b[1] - a[1]) / (l || 1), ny = (b[0] - a[0]) / (l || 1);
  if (nx * m[0] + ny * m[1] < 0) { nx = -nx; ny = -ny; }
  const c: P2 = [m[0] + nx * bend * l, m[1] + ny * bend * l];
  return Array.from({ length: n + 1 }, (_, k) => {
    const s = k / n;
    return [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]];
  });
}
