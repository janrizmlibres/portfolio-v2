/**
 * The sky, once it has loaded, for what the page draws beside it (the route map plays the flare on its own stars).
 * It loads after first paint, so whoever needs it subscribes and takes it up when it arrives. Type-only: three.js
 * never comes in through here.
 */
import type { Sky } from "./sky";

let current: Sky | null = null;
const listeners = new Set<(s: Sky | null) => void>();

export function provideSky(s: Sky | null) {
  current = s;
  listeners.forEach((l) => l(s));
}

export function onSky(cb: (s: Sky | null) => void) {
  listeners.add(cb);
  cb(current);
  return () => { listeners.delete(cb); };
}
