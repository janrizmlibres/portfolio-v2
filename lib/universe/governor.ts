/**
 * The sky's resolution, held to what the GPU can draw at 60 fps. The budget is a mid-range laptop: a body filling the
 * frame costs about 8 ms of GPU at DPR 1.8 on a fast one, so a slower GPU goes over a 16.7 ms frame there. The cost is
 * per pixel, so the governor steps the pixel ratio down while the frame costs too much and back up once the finer
 * step would fit again, never below one device pixel per CSS pixel (where the sky turns soft).
 * - It reads the GPU timer query where the browser offers it (ms per frame), and missed frames where it doesn't. A frame
 *   is missed against the display's own interval, so a display held to 30 fps (Low Power Mode) isn't read as a slow GPU.
 * - With the timer, a step down that didn't save at least half the cost its pixels predicted is taken back, and the
 *   governor steps no lower: the cost isn't in the pixels, and fewer of them would only soften the sky.
 * - It judges half a second at a time (30 frames); a step down needs one bad half second, a step up a run of good ones
 *   long enough not to see-saw (with only missed frames to go on, longer each time a step up had to be taken back).
 * - At its floor, with frames still missed (and with the timer, the GPU still over budget) for STUCK windows in a row,
 *   it asks for the visit's quality a level lower (`lower`, tier.ts): what's left of the cost isn't in the sky's pixels.
 * - A stall (a hidden tab, a long task) is ignored, and while held (a warp drawing from the frame's own pixels) it
 *   changes nothing.
 */

const STEPS = [1, 0.85, 0.72, 0.6, 0.5];
/** frames per judgement */
const WINDOW = 30;
/** GPU ms per frame over which it steps down */
const HIGH = 12;
/** GPU ms per frame the finer step must be expected under, to step up */
const FITS = 9;
/** good windows in a row before stepping up: with the GPU timer, and with missed frames only */
const CALM_GPU = 4, CALM_DT = 10;
/** with missed frames only: the share of missed frames that counts as over budget */
const MISSED = 0.3;
/** with missed frames only: a frame is missed this many display intervals after the last (and never under 20 ms) */
const LATE = 1.25;
/** a frame this long is a stall, not the GPU */
const STALL_MS = 100;
/** frames ignored after a change (the canvas is reallocated) */
const SETTLE = 10;
/** windows in a row at the floor, still missing frames, before it asks for a lower quality */
const STUCK = 4;

export function createGovernor({ dpr, lower }: { dpr: number; lower?: () => boolean }) {
  const steps = STEPS.filter((s) => dpr * s >= 1 - 1e-9);
  const last = steps.at(-1)!;
  if (dpr > 1 && dpr * last > 1.05) steps.push(1 / dpr);
  let level = 0, n = 0, gsum = 0, gn = 0, calm = 0, settle = 0, holdUntil = -Infinity;
  let upAt = -Infinity, backoff = 1, stuck = 0, lowering = !!lower;
  // the display's interval: the steadiest the frames have come, which a display held to 30 fps never beats
  let cadence = Infinity;
  // the coarsest step allowed, and after a timed step down the GPU ms its first window must come in under
  let floor = steps.length - 1, want: number | null = null;
  const dts = new Float64Array(WINDOW);
  const reset = () => { n = gsum = gn = 0; };

  return {
    get scale() { return steps[level]!; },
    /** no change before `now + ms` */
    hold(now: number, ms: number) {
      holdUntil = Math.max(holdUntil, now + ms);
      reset();
      calm = stuck = 0;
      want = null;
    },
    /** one frame: its GPU time (null without the timer query), its interval and the clock (ms); the new scale on a change */
    feed({ gpu, dt, now }: { gpu: number | null; dt: number; now: number }): number | null {
      if (now < holdUntil || dt > STALL_MS) return null;
      if (settle > 0) { settle--; return null; }
      dts[n++] = dt;
      if (gpu !== null) { gsum += gpu; gn++; }
      if (n < WINDOW) return null;
      const timed = gn > WINDOW / 2, mean = timed ? gsum / gn : 0;
      reset();
      dts.sort();
      cadence = Math.min(cadence, dts[WINDOW >> 1]!);
      const late = Math.max(20, cadence * LATE);
      let missed = 0;
      for (const d of dts) if (d > late) missed++;
      if (want !== null) {
        const helped = !timed || mean < want;
        want = null;
        if (!helped) {
          calm = 0;
          floor = --level;
          settle = SETTLE;
          return steps[level]!;
        }
      }
      const over = timed ? mean > HIGH : missed / WINDOW > MISSED;
      stuck = over && level >= floor && missed / WINDOW > MISSED ? stuck + 1 : 0;
      if (over) {
        calm = 0;
        if (level >= floor) {
          if (stuck >= STUCK && lowering) {
            stuck = 0;
            settle = SETTLE;
            lowering = lower!();
          }
          return null;
        }
        // a step up taken back soon after: wait longer before the next one
        if (!timed && now - upAt < 4000) backoff = Math.min(8, backoff * 2);
        if (timed) want = (mean * (1 + (steps[level + 1]! / steps[level]!) ** 2)) / 2;
        level++;
        settle = SETTLE;
        return steps[level]!;
      }
      if (level === 0) return null;
      const up = steps[level - 1]!, here = steps[level]!;
      const fits = timed ? mean * (up / here) ** 2 < FITS : missed <= 1;
      calm = fits ? calm + 1 : 0;
      if (calm < (timed ? CALM_GPU : CALM_DT * backoff)) return null;
      calm = 0;
      level--;
      upAt = now;
      settle = SETTLE;
      return steps[level]!;
    },
  };
}
