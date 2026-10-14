/**
 * The camera's turn round the ribbon's spiral. It comes round evenly from the first frame (at `t0`) to the last
 * (`thEnd`, at `t1`), except that at each project's reading spot it is round at a frame: the one nearest where the even
 * turn would be then. So the frame square to you at a reading spot is the one the camera is looking at, centred where
 * the shot puts it, not half a frame to one side and clipped by the screen's edge. Between those the turn eases
 * on and stays within half a card of the even one, never stopping or turning back (a monotone cubic through them).
 */
import { monotoneCubic } from "@/lib/film/track";

export function spiralTurn(o: { t0: number; t1: number; thEnd: number; step: number; spots: readonly number[] }): (t: number) => number {
  const { t0, t1, thEnd, step } = o;
  const linear = (t: number) => (thEnd * (t - t0)) / (t1 - t0);
  const ts = [t0], ys = [0];
  for (const s of [...o.spots].sort((a, b) => a - b)) {
    if (s <= t0 || s >= t1) continue;
    const th = Math.round(linear(s) / step) * step;
    // a card is landed on once, and only between the ends
    if (th <= ys.at(-1)! || th >= thEnd) continue;
    ts.push(s);
    ys.push(th);
  }
  ts.push(t1);
  ys.push(thEnd);
  const curve = monotoneCubic(ts, ys);
  return (t: number) => (t <= t0 ? 0 : t >= t1 ? thEnd : curve(t));
}

/**
 * The times the spiral's camera is keyed at: every `every` screens from `t0` to `t1`, and at each reading spot
 * between them, which takes the place of any grid key closer to it than a few frames (so the path passes exactly
 * through the pose the spot is read in).
 */
export function keyTimes(o: { t0: number; t1: number; every: number; spots: readonly number[] }): number[] {
  const { t0, t1, every } = o, NEAR = 0.025;
  const spots = o.spots.filter((s) => s > t0 && s < t1);
  const out: number[] = [];
  for (let i = 0; t0 + i * every <= t1 + 1e-6; i++) {
    const t = t0 + i * every;
    if (!spots.some((s) => Math.abs(s - t) < NEAR)) out.push(t);
  }
  return [...out, ...spots].sort((a, b) => a - b);
}
