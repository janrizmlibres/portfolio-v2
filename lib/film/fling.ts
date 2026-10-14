/**
 * A hard scroll is felt: loose things in the picture (a gate's beads, the crawler's swarm, the stream's records, the
 * moons) are thrown outwards, and close up again as you slow down. This is how hard, as one value from 0 to 1: the
 * scroll's speed in screens a second, from `from` (nothing yet) to `from + span` (all the way), rising in about
 * `rise` seconds and settling back in about `fall`, with no bounce. Each scene says how far its own things go.
 * Under reduced motion it stays at 0, and a jump (a deep link, a reload landing) isn't a scroll.
 *
 * `lag` lets a scene throw its things one after another instead of as one: each reads the fling as it was up to
 * `lag` seconds ago (`at`), by a delay of its own.
 */
export type FlingFeel = { from: number; span: number; rise: number; fall: number; lag?: number };

/** how far back `at` can read, in seconds */
const KEEP = 0.4;

export const FLING_FEEL: FlingFeel = { from: 2.5, span: 8, rise: 0.1, fall: 0.7 };

export function createFling(feel: FlingFeel = FLING_FEEL) {
  let last: number | null = null, v = 0, now = 0, trimmed = false;
  // the recent values, oldest first, each with the time it was reached
  const past: Array<[number, number]> = [];
  return {
    feel,
    /** the scroll is at `target` (in screens), `dt` seconds after the last step; `still` under reduced motion */
    step(target: number, dt: number, still: boolean) {
      const speed = last === null ? 0 : Math.abs(target - last) / Math.max(1e-3, dt);
      last = target;
      const aim = still ? 0 : Math.min(1, Math.max(0, (speed - feel.from) / feel.span));
      if (still) v = 0;
      else v += (aim - v) * (1 - Math.exp(-dt / (aim > v ? feel.rise : feel.fall)));
      if (v < 1e-4) v = 0;
      now += dt;
      past.push([now, v]);
      while (past.length > 1 && past[0]![0] < now - KEEP) { past.shift(); trimmed = true; }
      return v;
    },
    /** the value `delay` seconds ago (before the first step, at rest) */
    at(delay: number) {
      if (delay <= 0 || !past.length) return v;
      const when = now - delay + 1e-9;
      for (let i = past.length - 1; i >= 0; i--) if (past[i]![0] <= when) return past[i]![1];
      return trimmed ? past[0]![1] : 0;
    },
    /** after a jump: the next step starts from where it lands */
    reset() { last = null; v = 0; past.length = 0; trimmed = false; },
    get value() { return v; },
  };
}

export type Fling = ReturnType<typeof createFling>;
