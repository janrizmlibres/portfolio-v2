/**
 * A material that fades without recompiling: a pair of it, opaque while what it's on stands whole and see-through
 * while it fades, both compiled once. Plain rules, kept apart from the models.
 */
import type { Material } from "three";

/**
 * A material as two: opaque while its body stands (so its own surfaces hide each other cheaply) and see-through
 * while it fades. Both are compiled up front; the fade picks one each frame, so crossing whole never flags an update
 * (which made three look its program up again, hundreds of times in a fast scroll).
 */
export function fadePair<M extends Material>(m: M) {
  const opaque = m.clone() as M, see = m.clone() as M;
  for (const x of [opaque, see]) {
    // a clone keeps neither the shader patch nor its cache key
    x.onBeforeCompile = m.onBeforeCompile;
    x.customProgramCacheKey = m.customProgramCacheKey;
  }
  opaque.transparent = false;
  opaque.opacity = 1;
  see.transparent = true;
  return {
    both: [opaque, see] as const,
    /** the material to draw with at fade `v` (0..1) */
    at(v: number): M {
      if (v >= 0.999) return opaque;
      see.opacity = v;
      return see;
    },
  };
}

/**
 * One material faded in place: see-through at `opacity` while it fades, opaque once whole. three keeps the program a
 * material compiled with until it's flagged, so the switch flags it: compiled opaque, a fade would draw it solid.
 */
export function fadeMaterial(m: Material, opacity: number) {
  m.opacity = opacity;
  const t = opacity < 0.999;
  if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; }
}
