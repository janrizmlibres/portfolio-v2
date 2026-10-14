/**
 * Seeded randomness, so the sky looks the same on every load, and each star's magnitude: no data says how bright a
 * passage is, so it's seeded by the star's id, few bright and many faint. Plain math, so the page can know which
 * star is brightest without loading the sky.
 */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0..1 */
export function starMagnitude(id: string) {
  return Math.pow(seeded(parseInt(id.slice(1), 10) * 9973)(), 2.4);
}
