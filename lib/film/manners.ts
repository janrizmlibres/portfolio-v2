/**
 * Text manners that move whole rows rather than single words, each tied to what its scene does. Like the word modes,
 * every one is a function of the scroll time alone, so it runs backwards just as well.
 *   pass   — the hero's lockup is passed by the dive: each row is pushed out from the star the camera dives at and
 *            grows as it goes, the way the nearest stars stream past, and fades only near the end of its way
 */
import { clamp01, smooth } from "./smooth";
import type { Span } from "./windows";

export type Manner = "pass";

export type Pt = { x: number; y: number };

// ---------------------------------------------------------------- pass

/**
 * A row of the lockup at time `t`, passed over its window `span`: its offset in px from where it rests, its scale and
 * its opacity. `from` is the point the dive aims at, on screen. On a phone the lockup sits below his star, so a full
 * push would carry it into Tycho's corner: it travels half as far and fades sooner there.
 */
export function passStyle(t: number, [a, z]: Span, rest: Pt, from: Pt, port: boolean) {
  const e = clamp01((t - a) / (z - a));
  if (e <= 0) return { x: 0, y: 0, scale: 1, opacity: 1 };
  const k = e * e, push = port ? 0.55 : 1.1;
  return {
    x: (rest.x - from.x) * k * push,
    y: (rest.y - from.y) * k * push,
    scale: 1 + 0.55 * k,
    opacity: 1 - (port ? smooth(0.25, 0.8, e) : smooth(0.4, 1, e)),
  };
}
