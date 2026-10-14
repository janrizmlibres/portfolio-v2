/**
 * The page's one sound engine, once it exists. It holds only the reference, so anything that plays through the
 * engine (Tycho's chirps, the toggle) can reach it without bundling it: the engine itself loads after first paint.
 */
import type { Sound } from "./engine";

let current: Sound | null = null;
const listeners = new Set<() => void>();

export const currentSound = () => current;

export function setCurrentSound(s: Sound) {
  current = s;
  listeners.forEach((fn) => fn());
}

/** Tells `fn` when the engine arrives, and whenever its state changes. */
export function onSound(fn: () => void) {
  listeners.add(fn);
  let off = current?.subscribe(fn);
  const arrive = () => {
    off?.();
    off = current?.subscribe(fn);
  };
  listeners.add(arrive);
  return () => {
    listeners.delete(fn);
    listeners.delete(arrive);
    off?.();
  };
}
