/**
 * The refinery's moving parts, as plain geometry in its model's units (its long radius drawn at 1, its axis up, its
 * centre at 0): the folded pipeline's rings dropping out of it, and the three struts under its service ring.
 */
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * How far each half slides when it opens; the folded pipeline's rings, their radius and how far up and down the
 * fairing they stack; how far below its centre a dropping ring is clear of the service ring, and how much further it
 * drops while it opens out; where the boom's top is
 */
export const FOLD = { open: 0.62, foldR: 0.3, foldH: 0.26, clear: 0.72, opening: 0.45, boom: 0.2 };

/** the service ring under the fairing's foot (its height, radius and tube), and where its struts meet, under the axis */
export const SERVICE = { y: -0.61, r: 0.44, tube: 0.026, hubY: -0.73, hubR: 0.05 };

/** a dropping ring's radius once it's `drop` below where it's clear of the service ring, opening out to `full` */
export function ringRadius(drop: number, full: number) {
  return FOLD.foldR + (full - FOLD.foldR) * smooth(0, FOLD.opening, drop);
}

type V3 = [number, number, number];

/**
 * Strut `j` (of three), from where it's fixed on the service ring (`A`) to its far end (`B`); `swing` 0 is at rest, in
 * under the column to the hub, and 1 retracted into the ring, clear of the dropping rings (as a launch tower's arms
 * draw back)
 */
export function strut(j: number, swing: number): { A: V3; B: V3 } {
  const a = (2 * Math.PI * j) / 3 + 0.5, ux = Math.cos(a), uz = -Math.sin(a);
  const out = 1 - smooth(0, 1, swing), r = SERVICE.r + (SERVICE.hubR - SERVICE.r) * out;
  return { A: [ux * SERVICE.r, SERVICE.y, uz * SERVICE.r], B: [ux * r, SERVICE.y + (SERVICE.hubY - SERVICE.y) * out, uz * r] };
}

/**
 * How far the struts have drawn back (0..1): they swing as the column parts, and stay clear while any ring is low in
 * the gallery (the lowest ring's centre at `lowest`), so the rings pass whichever way the scroll runs
 */
export function swingOf(open: number, lowest: number) {
  return Math.max(smooth(0.1, 0.7, open), smooth(-0.3, -0.42, lowest));
}
