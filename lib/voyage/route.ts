/**
 * Where the voyage starts from, without three.js: the hero's view of the sky, and where home sits by his star. The page's
 * HTML needs the film's timing at first paint, so what it's placed from stays plain math.
 *
 * Coordinates are the sky's own: the unit sphere of the PCA layout.
 */
export type V3 = [number, number, number];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const along = (a: V3, d: V3, k: number): V3 => add(a, scale(d, k));
const norm = (a: V3): V3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const UP: V3 = [0, 1, 0];

// the hero looks at the sky from azimuth 0.6, elevation 0.18 (the sky's own orbit); the dive heads in from there
export const HERO_AZ = 0.6, HERO_EL = 0.18;
export const HERO_DIR = norm([Math.sin(HERO_AZ) * Math.cos(HERO_EL), Math.sin(HERO_EL), Math.cos(HERO_AZ) * Math.cos(HERO_EL)]);

/** Home: a small world just off his star, on the hero's side of it. */
export function homeOf(sun: V3) {
  const dirIn = scale(HERO_DIR, -1), side = norm(cross(dirIn, UP));
  return { P: add(along(along(sun, dirIn, 0.02), side, 0.009), [0, -0.004, 0]), r: 0.0062 };
}
