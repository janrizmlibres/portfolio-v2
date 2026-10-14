/**
 * The reveal: a reply's words shown in the bubble at a steady reading pace (words a second), never ahead of what
 * the stream has delivered. Time spent waiting on the stream earns no credit, so a stall never ends in a burst.
 * A tap shows the rest at once, and from then on each word shows as it lands.
 */
export type Reveal = { shown: number; all: boolean };

/** The reveal's pace in words a second: brisker than reading aloud, so he never keeps you waiting (4 felt slow).
 * His voice's chirps are timed to it. */
export const PACE = 7;

export const revealStart = (): Reveal => ({ shown: 0, all: false });

export function advance(s: Reveal, dt: number, arrived: number, pace: number): Reveal {
  if (s.all) return { shown: arrived, all: true };
  return { shown: Math.min(arrived, s.shown + dt * pace), all: false };
}

export const showAll = (s: Reveal): Reveal => ({ shown: s.shown, all: true });

/** How many whole words show: the first as soon as anything has been revealed. */
export const visibleWords = (s: Reveal, arrived: number) => (s.all ? arrived : Math.min(arrived, Math.ceil(s.shown)));
