/**
 * How hard a hovered star twinkles over time, as loud as the shimmer it sounds: it flares at once, as hard as the
 * pointer was fast, settles over the shimmer's length to a gentle twinkle it keeps while the pointer stays on it, and
 * dies away once the pointer leaves. A sweep across the sky leaves a trail of stars dying away behind the one it's on.
 * What a twinkle looks like (a real star's scintillation) is the sky's; this is only its level, 0..1. Times are in
 * seconds.
 */
import { clamp01 } from "./smooth";

export const TWINKLE = {
  /** how long a star takes to flare */
  attack: 0.06,
  /** how long it takes to settle from its flare to its steady twinkle: the hover shimmer's length */
  settle: 0.9,
  /** its steady twinkle while the pointer rests on it */
  sustain: 0.5,
  /** how long it takes to die away once the pointer leaves */
  release: 0.45,
  /** a slow pointer's flare */
  floor: 0.45,
  /** the pointer's speed (CSS px a second) that flares a star fully, as it sounds its shimmer loudest */
  fast: 1500,
};
export type TwinkleFeel = typeof TWINKLE;

const easeOut = (x: number) => 1 - (1 - x) * (1 - x);

/** How hard a star flares, from the pointer's speed as it reaches it. */
export function twinklePeak(speed: number, feel: TwinkleFeel = TWINKLE) {
  return feel.floor + (1 - feel.floor) * clamp01(speed / feel.fast);
}

type One = { at: number; from: number; peak: number; left: number | null; leftAt: number };

export function createTwinkles(feel: TwinkleFeel = TWINKLE) {
  const stars = new Map<number, One>();
  let on: number | null = null;

  function level(s: One, now: number): number {
    // hovered: up from where it was to its flare, then down to its steady twinkle (never above its flare)
    const k = clamp01((now - s.at) / feel.attack);
    const up = s.from + (s.peak - s.from) * easeOut(k);
    const steady = Math.min(feel.sustain, s.peak);
    const held = k < 1 ? up : s.peak + (steady - s.peak) * easeOut(clamp01((now - s.at - feel.attack) / feel.settle));
    if (s.left === null) return held;
    return s.left * (1 - easeOut(clamp01((now - s.leftAt) / feel.release)));
  }

  return {
    /** the star now under the pointer (null for none) and the pointer's speed, each frame or whenever it changes */
    hover(star: number | null, speed: number, now: number) {
      if (star === on) return;
      if (on !== null) {
        const s = stars.get(on);
        if (s) { s.left = level(s, now); s.leftAt = now; }
      }
      on = star;
      if (star === null) return;
      const was = stars.get(star);
      stars.set(star, { at: now, from: was ? level(was, now) : 0, peak: twinklePeak(speed, feel), left: null, leftAt: 0 });
    },
    /** every star twinkling now and how hard; a star that has just died away is reported once at 0, then dropped */
    levels(now: number): Array<[number, number]> {
      const out: Array<[number, number]> = [];
      for (const [star, s] of stars) {
        const v = level(s, now);
        out.push([star, v]);
        if (s.left !== null && now - s.leftAt >= feel.release) stars.delete(star);
      }
      return out;
    },
    /** nothing twinkles, so nothing need be written */
    get idle() {
      return stars.size === 0;
    },
  };
}
