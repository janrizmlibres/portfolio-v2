import { seeded } from "@/lib/universe/magnitude";

/**
 * The stage's stars (the wake-up): a sparse field of still stars behind Tycho on the black, as a dark sky looks from
 * space (no air, so no twinkle). Few bright and many faint by the sky's own law (`starMagnitude`'s curve), and the
 * same on every load. The full sky comes up over them when he wakes.
 */
export type Star = { x: number; y: number; r: number; a: number; c: string };

// real stars' colours, hot to cool, weighted as a dark sky shows them: mostly blue-white and white, a few warm
const COLOURS: Array<[string, number]> = [
  ["#aabfff", 0.18],
  ["#cad7ff", 0.26],
  ["#f8f7ff", 0.28],
  ["#fff4ea", 0.16],
  ["#ffd2a1", 0.09],
  ["#ffcc6f", 0.03],
];

/** the stars over a w × h CSS-pixel frame, one per `per` square pixels: each its place, radius, alpha and colour */
export function starfield(w: number, h: number, per = 7500, seed = 7): Star[] {
  const rnd = seeded(seed);
  return Array.from({ length: Math.round((w * h) / per) }, () => {
    const m = Math.pow(rnd(), 2.4);
    let k = rnd(),
      c = COLOURS[0]![0];
    for (const [hex, share] of COLOURS) {
      if ((k -= share) <= 0) {
        c = hex;
        break;
      }
    }
    return { x: rnd() * w, y: rnd() * h, r: 0.4 + m * 0.5, a: 0.14 + m * 0.76, c };
  });
}

/** a normal deviate from a seeded stream (Box-Muller) */
const gauss = (rnd: () => number) => () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

/** where a body sits: `at` of the way from the pivot (w / 2, cy) towards the frame's edge, in direction `deg` */
function toward(w: number, h: number, cy: number, deg: number, at: number) {
  const a = (deg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
  const reach = Math.min(dx ? (dx > 0 ? w / 2 : -w / 2) / dx : Infinity, dy ? (dy > 0 ? h - cy : -cy) / dy : Infinity);
  return { x: w / 2 + dx * reach * at, y: cy + dy * reach * at };
}

/**
 * The Milky Way: one band across the frame, off his middle, its stars crowding to its line (a normal spread across
 * it), dim and many. The band's glow and its dust lanes are drawn from `x`, `y`, `angle` and `width`.
 */
export type Band = { x: number; y: number; angle: number; width: number; stars: Star[] };
export function band(w: number, h: number, seed = 11): Band {
  const rnd = seeded(seed), g = gauss(rnd);
  const x = w * 0.62, y = h * 0.44, angle = -0.6, width = 0.11 * Math.min(w, h), L = Math.hypot(w, h);
  const stars: Star[] = [];
  for (let i = 0, n = Math.round(L * 1.2); i < n; i++) {
    const t = (rnd() - 0.5) * L, o = g() * width * 0.55, m = Math.pow(rnd(), 3);
    const sx = x + Math.cos(angle) * t - Math.sin(angle) * o, sy = y + Math.sin(angle) * t + Math.cos(angle) * o;
    // its heart runs a little warm, its edges cool
    const c = Math.abs(o) < width * 0.35 && rnd() < 0.5 ? "#fff1dc" : "#dfe6ff";
    if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) stars.push({ x: sx, y: sy, r: 0.3 + m * 0.35, a: 0.06 + m * 0.3, c });
  }
  return { x, y, angle, width, stars };
}

/**
 * The distant galaxies: one larger spiral seen edge on, its dust lane across it, and a few small ones (a face-on
 * spiral, ellipticals), each where its direction from his middle meets the frame, so they're in view on any screen.
 */
export type Galaxy = { x: number; y: number; size: number; ratio: number; angle: number; kind: "edge" | "spiral" | "elliptical"; a: number };
export function galaxies(w: number, h: number, cy = h / 2, seed = 23): Galaxy[] {
  const rnd = seeded(seed), M = Math.max(w, h);
  const place: Array<[Galaxy["kind"], number, number, number, number]> = [
    // kind, direction (deg), of the way to the edge, size (of the frame's longer side), axis ratio
    ["edge", 206, 0.78, 0.075, 0.13],
    ["spiral", 328, 0.8, 0.022, 0.7],
    ["elliptical", 18, 0.84, 0.014, 0.6],
    ["elliptical", 148, 0.7, 0.009, 0.45],
    ["elliptical", 262, 0.86, 0.008, 0.7],
  ];
  return place.map(([kind, deg, at, size, ratio]) => ({
    ...toward(w, h, cy, deg + (rnd() - 0.5) * 6, at),
    size: size * M,
    ratio,
    angle: (rnd() - 0.5) * 1.6,
    kind,
    a: kind === "edge" ? 0.6 : 0.35 + rnd() * 0.2,
  }));
}

/** a small open cluster, a tight knot of blue-white stars off to one side */
export type Cluster = { x: number; y: number; radius: number; stars: Star[] };
export function cluster(w: number, h: number, cy = h / 2, seed = 31): Cluster {
  const rnd = seeded(seed), g = gauss(rnd), radius = 0.012 * Math.max(w, h);
  const { x, y } = toward(w, h, cy, 302, 0.62);
  const clamp = (v: number) => Math.max(-2.6, Math.min(2.6, v));
  const stars = Array.from({ length: 26 }, () => {
    const m = Math.pow(rnd(), 1.6);
    return { x: x + clamp(g()) * radius * 0.8, y: y + clamp(g()) * radius * 0.8, r: 0.4 + m * 0.5, a: 0.3 + m * 0.65, c: rnd() < 0.7 ? "#cad7ff" : "#f8f7ff" };
  });
  return { x, y, radius, stars };
}
