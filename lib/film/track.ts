/**
 * A monotone cubic Hermite curve through keys (Fritsch–Butland slopes). Every value in the film runs on one: it
 * passes through each key with a continuous slope, so motion slows and speeds up but never jerks, and it never
 * overshoots a key, so a value that should rest between two keys never swings past either. Outside the keys it
 * holds the end values. `ts` must be increasing.
 */
export function monotoneCubic(ts: readonly number[], ys: readonly number[]): (t: number) => number {
  const n = ts.length;
  if (n === 0) throw new Error("monotoneCubic needs at least one key");
  if (n === 1) return () => ys[0]!;
  const h: number[] = [], d: number[] = [], m = new Array<number>(n);
  for (let i = 0; i < n - 1; i++) {
    h.push(ts[i + 1]! - ts[i]!);
    d.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  // the ends: the slope of their stretch; inside: a weighted harmonic mean, zero where the keys turn back
  m[0] = d[0]!;
  m[n - 1] = d[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    const a = d[i - 1]!, b = d[i]!;
    m[i] = a * b <= 0 ? 0 : (3 * (h[i - 1]! + h[i]!)) / ((2 * h[i]! + h[i - 1]!) / a + (h[i]! + 2 * h[i - 1]!) / b);
  }
  return (t) => {
    if (t <= ts[0]!) return ys[0]!;
    if (t >= ts[n - 1]!) return ys[n - 1]!;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ts[mid]! <= t) lo = mid;
      else hi = mid;
    }
    const hh = h[lo]!, s = (t - ts[lo]!) / hh, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[lo]! + (s3 - 2 * s2 + s) * hh * m[lo]! + (-2 * s3 + 3 * s2) * ys[lo + 1]! + (s3 - s2) * hh * m[lo + 1]!;
  };
}
