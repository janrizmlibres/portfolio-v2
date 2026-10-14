/**
 * The route map's open and fold: when each of their steps starts, in seconds, from wherever the last one left it.
 * - Opening, the map grows, and once it has (nearly), the leader lines draw out from their marks with a dot on each,
 *   then the names come in. They're laid out for the grown map, so they wait only for the growing it has left to do:
 *   coming back while it folds, with the map still grown, they come straight back from where they'd got to.
 * - Folding, the names go and the lines draw back into their marks, the dots go, and only then does the map shrink
 *   (the lines would hang off it). It waits only for what's out: an open left before anything was drawn shrinks at once.
 */
export type Steps = { map: number; lines: number; dots: number; names: number; stagger: number };

const unit = (x: number) => Math.min(1, Math.max(0, x));

/** An open's steps, from a map `grown` of the way (0 at rest, 1 grown). */
export function openSteps(grown: number): Steps {
  const k = 1 - unit(grown);
  // from rest the lines and names come one after another; coming back they were folded together, and come back so
  return { map: 0, lines: 0.25 * k, dots: 0.25 * k, names: 0.4 * k, stagger: 0.04 * k };
}

/** A fold's steps, from `shown`: how far out the lines and names are (0 none, 1 all). */
export function foldSteps(shown: number): Steps {
  const k = unit(shown);
  return { names: 0, lines: 0, dots: 0.12 * k, map: 0.18 * k, stagger: 0.012 };
}
