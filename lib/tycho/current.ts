/**
 * Tycho's rig, once his 3D body is drawn: anything outside his bubble that plays him (the wake-up, the warp) reaches
 * him here without bundling three.js. Null before the rig exists, and for the flat Tycho drawn without 3D.
 */
import type { TychoRig } from "./rig";

let current: TychoRig | null = null;
const listeners = new Set<() => void>();

export const currentRig = () => current;

export function setCurrentRig(r: TychoRig | null) {
  if (r === current) return;
  current = r;
  listeners.forEach((fn) => fn());
}

/** Tells `fn` whenever the rig arrives or goes; returns the way to stop. */
export function onRig(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Where Tycho is on the screen and a way to hold him there, for whatever flies him off his spot and back (the warp):
 * his spot is his centre in CSS px of the viewport, with his canvas's size and his scale; held, he neither thinks,
 * wanders nor answers a drag or a shake. Null before his roam starts, and for the flat Tycho, who never moves.
 */
export type Roam = { spot(): { x: number; y: number; size: number; scale: number }; hold(on: boolean): void };
let roam: Roam | null = null;
export const currentRoam = () => roam;
export function setCurrentRoam(r: Roam | null) {
  roam = r;
}
