/**
 * What's in the picture on screen, for whatever on the page keeps clear of it (Tycho parks and flies clear of the
 * film's 3D subjects as well as its text). Each scene registers a source that answers its bodies' footprints: boxes in
 * CSS px of the viewport, for what's drawn this frame only. Readers ask `footprints()`, which works them out at most
 * once a frame, however often it's asked, so the projection costs nothing between reads.
 *
 * A footprint is kept only while it's something to keep clear of: on screen, at least a few px across, and not filling
 * most of the frame (a body the camera is in or right up against is the setting, not a subject beside the text).
 */
import gsap from "gsap";

export type Rect = { l: number; t: number; r: number; b: number };

/** a footprint smaller than this (px) isn't a subject to keep clear of */
const SPECK = 3;
/** a footprint covering more than this share of the frame is the setting, not a subject */
const SETTING = 0.5;

/** The footprint clipped to the frame, or null when it isn't one to keep clear of. */
export function keepFootprint(r: Rect, f: { w: number; h: number }): Rect | null {
  const c = { l: Math.max(0, r.l), t: Math.max(0, r.t), r: Math.min(f.w, r.r), b: Math.min(f.h, r.b) };
  const w = c.r - c.l, h = c.b - c.t;
  if (r.r - r.l < SPECK || r.b - r.t < SPECK || w <= 0 || h <= 0) return null;
  if (w * h > SETTING * f.w * f.h) return null;
  return c;
}

type Source = () => Iterable<Rect>;
const sources = new Set<Source>();
let at = -1, cached: Rect[] = [];

/** Adds a scene's bodies; returns the way to take them off again. */
export function registerFootprints(source: Source) {
  sources.add(source);
  at = -1;
  return () => {
    sources.delete(source);
    at = -1;
  };
}

/** Every registered body's footprint as of `frame` (GSAP's ticker frame by default). */
export function footprints(frame = gsap.ticker.frame): readonly Rect[] {
  if (frame === at) return cached;
  at = frame;
  cached = [];
  for (const s of sources) for (const r of s()) cached.push(r);
  return cached;
}

/**
 * A sprawling part's footprint from points of it on screen (its vertices, projected): the grid cells (`cell` px) they
 * fall in, a cell out each way so the faces between them are covered too, each row's run of cells as one box. A ring
 * keeps its hole. Nothing when the cells fill most of the frame (the setting).
 */
export function pointsFootprint(pts: Iterable<{ x: number; y: number }>, f: { w: number; h: number }, cell = 32): Rect[] {
  const cols = Math.ceil(f.w / cell), rows = Math.ceil(f.h / cell), hit = new Uint8Array(cols * rows);
  let any = false;
  for (const p of pts) {
    if (!(p.x >= 0 && p.x < f.w && p.y >= 0 && p.y < f.h)) continue;
    const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
    for (let y = Math.max(0, cy - 1); y <= Math.min(rows - 1, cy + 1); y++)
      for (let x = Math.max(0, cx - 1); x <= Math.min(cols - 1, cx + 1); x++) hit[y * cols + x] = 1;
    any = true;
  }
  if (!any) return [];
  let n = 0;
  for (const v of hit) n += v;
  if (n * cell * cell > SETTING * f.w * f.h) return [];
  const out: Rect[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (!hit[y * cols + x]) continue;
      const x0 = x;
      while (x + 1 < cols && hit[y * cols + x + 1]) x++;
      out.push({ l: x0 * cell, t: y * cell, r: Math.min(f.w, (x + 1) * cell), b: Math.min(f.h, (y + 1) * cell) });
    }
  return out;
}
