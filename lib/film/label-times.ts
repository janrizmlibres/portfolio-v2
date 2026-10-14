/**
 * When a block's leader-line labels come in and go, one after another (as callouts are drawn, a beat apart per
 * index): each from just before the block's text is whole, 0.07 apart, and out 0.04 apart as the text leaves. Where
 * the block's reading spot comes too soon after its text is whole for that, the stagger closes up, so every label
 * is whole by the spot: a reader at rest never finds the last one half in.
 */

/** how long a label takes to come in or go */
export const LABEL_FADE = 0.14;

/** `n` labels' times, for a block whose text is whole at `tIn`, starts to leave at `tOut`, and is read at `spot` */
export function labelTimes(n: number, b: { tIn: number; tOut: number; spot: number }) {
  const first = b.tIn - 0.15;
  const step = Math.min(0.07, Math.max(0, (b.spot - LABEL_FADE - first) / Math.max(1, n - 1)));
  return Array.from({ length: n }, (_, k) => ({ in: first + k * step, out: b.tOut + k * 0.04 }));
}
