export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** smoothstep: 0 at `a`, 1 at `b`, eased at both ends */
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
