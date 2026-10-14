/**
 * What of the pipeline's records is drawn this frame. Each part goes while nothing of it can be on screen, so a frame
 * outside its stretch of the fall pays nothing for it. The bounds are the records' own (`swarm.ts`):
 * - a record shows from 0.03 above the search until it has sunk into Save (0.0005 above it), each lagging the fall by
 *   its own `lag`; the queries from just above Start until just past the search;
 * - a page's hairline, from 0.012 above the search until 0.002 past it;
 * - the rush only while the front is between leaving and landing.
 */
export function swarmParts(o: {
  /** how shown the shaft is */
  v: number;
  /** how far down the fall has come, and how far records lag it (least and most) */
  s: number;
  lag: { lo: number; hi: number };
  /** the search's depth and Save's */
  crawl: number;
  save: number;
  /** where the climax's front is (0 not left, 1 landed) */
  front: number;
}) {
  if (o.v <= 0.004) return { swarm: false, rush: false, beams: false };
  // the stretch of the fall (in `s`) over which some record is between `a` and `b`
  const some = (a: number, b: number) => o.s - o.lag.lo > a && o.s - o.lag.hi < b;
  const queries = o.s > -0.005 && o.s - 0.0026 < o.crawl + 0.0008;
  return {
    swarm: queries || some(o.crawl - 0.03, o.save - 0.0005),
    rush: o.front > 0 && o.front < 1,
    beams: some(o.crawl - 0.012, o.crawl + 0.002),
  };
}
