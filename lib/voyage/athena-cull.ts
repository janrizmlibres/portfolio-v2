/**
 * What of Athena is drawn each frame, and how loose things of hers take the fling. Plain numbers, no three.js, so it's
 * tested where it's decided.
 *
 * Her scene holds her (`vis` 1) from the flight to her until the pull-out, through the crawler, its pipeline and the
 * ribbon, where she's mostly out of frame or a speck. While she is, nothing of hers is drawn and her star's shadow
 * map isn't re-rendered: the light itself stays (removing a light makes three recompile every lit material).
 */
export type AthenaSight = {
  /** her scene's hold on her, and on the stream of records */
  vis: number;
  streamVis: number;
  /** her long radius on screen, in px */
  bodyPx: number;
  /** whether her body (opened as she is), her ring and the stream's reach touch the camera's frustum */
  bodyInFrame: boolean;
  ringInFrame: boolean;
  streamInFrame: boolean;
  /** whether either moon is drawn (each fades by its own size) */
  moonsShown: boolean;
};

/** her disc's radius (px) under which her shadow map isn't re-rendered: the wedges' and moons' shading can't be read */
export const SHADOW_PX = 10;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ON = 0.004;

export function cullAthena(s: AthenaSight) {
  // a body under ~16 px across fades by its size, as every block does
  const fade = s.vis * smooth(5, 16, s.bodyPx * 2);
  const body = fade > ON && s.bodyInFrame;
  const ring = fade > ON && s.ringInFrame;
  const shadow = body && s.bodyPx >= SHADOW_PX;
  const slabs = s.streamVis > ON && s.streamInFrame;
  return { any: body || ring || slabs || s.moonsShown, body, ring, shadow, slabs, fade };
}

/**
 * A hard scroll throws her moons outwards from her, off their orbits (`out` of their distance from her at full
 * fling), tumbling (`tumble` radians a screen of scroll); they settle back as you slow.
 */
export const MOON_THROW = { out: 0.45, tumble: 2.4 };

/** where a moon is thrown to, relative to her: straight out from her, further the harder the scroll */
export function flungMoon(rel: [number, number, number], f: number): [number, number, number] {
  const k = 1 + MOON_THROW.out * f;
  return [rel[0] * k, rel[1] * k, rel[2] * k];
}

/**
 * The fling as thing `k` of `n` feels it: with a staggered feel (`lag`), each one reads it as it was a moment ago, so
 * they leave one after another; otherwise as it is.
 */
export function staggered(f: { feel: { lag?: number }; at(delay: number): number } | undefined, v: number, k: number, n: number) {
  return f && f.feel.lag ? f.at((k / Math.max(1, n - 1)) * f.feel.lag) : v;
}

/**
 * How much larger a record is drawn at `u` along the stream (0 at the crawler's port, 1 at her): along the upstream
 * reach, where the camera follows the stream close by, it's grown so it reads as a record rather than a speck; where it
 * joins her ring it's its own size.
 */
export function slabSize(u: number) {
  return 1 + 1.2 * (1 - smooth(0.25, 0.6, u));
}
