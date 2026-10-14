/**
 * The film's time, in screens of scroll. The picture eases a little behind the scroll (a time constant of 0.2 s),
 * and that is all: no settling, no snapping. Under reduced motion it follows the scroll at once.
 */
export function createClock({ tau = 0.2 }: { tau?: number } = {}) {
  let t = 0;
  return {
    get t() {
      return t;
    },
    /** Moves towards the scroll's time over `dt` seconds, and returns the film's time. */
    step(target: number, dt: number, { eased = true }: { eased?: boolean } = {}) {
      t = eased ? t + (target - t) * (1 - Math.exp(-dt / tau)) : target;
      if (Math.abs(target - t) < 1e-4) t = target;
      return t;
    },
    jump(to: number) {
      t = to;
    },
  };
}

export type Clock = ReturnType<typeof createClock>;
