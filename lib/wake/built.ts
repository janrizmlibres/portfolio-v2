/**
 * What of the voyage past the first scene is built: each later scene, and the warp, marks itself here once it's
 * fetched, built, compiled, uploaded and warmed (shadow maps included), and the wake-up's count waits on every one
 * (count.ts) before it shows the wake button. A mark made before the wake-up listens is heard when it does. Kept free
 * of three.js.
 */
import type { Milestone } from "./count";

const built = new Set<Milestone>();
const listeners = new Set<(m: Milestone) => void>();

export function markBuilt(m: Milestone) {
  if (built.has(m)) return;
  built.add(m);
  listeners.forEach((l) => l(m));
}

/** Tells `cb` each part built, those built already first; returns the way to stop. */
export function onBuilt(cb: (m: Milestone) => void) {
  built.forEach(cb);
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
