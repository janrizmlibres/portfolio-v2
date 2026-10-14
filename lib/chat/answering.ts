/**
 * Whether Tycho is answering, and which question. One question at a time: while he answers, asking is held off
 * everywhere (the bubble's Send, the suggestions, the stars and the chips), so they all read this one source.
 * The reply is done when its words have all been shown, not when the stream ends: the reveal runs behind the
 * stream at a reading pace. Only the bubble sets it; everything else subscribes (it fits useSyncExternalStore).
 */
let question: string | null = null;
const listeners = new Set<() => void>();

export function setAnswering(q: string | null) {
  if (q === question) return;
  question = q;
  for (const fn of listeners) fn();
}

export const isAnswering = () => question !== null;

export const answeringFor = () => question;

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
