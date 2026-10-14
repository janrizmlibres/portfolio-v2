/**
 * Asking Tycho from anywhere on the page: a block's "Ask Tycho about …" button, a star, a chip. The bubble listens;
 * the question is sent at once and the bubble opens on it. While he answers, a question is turned away (one question
 * at a time; `answering.ts` says when), and so is one asked before the bubble is there. A star asks to keep the page
 * put (`stay`): his answer lights the constellation instead of warping.
 */
export type AskHow = { stay?: boolean };
type Listener = (q: string, how?: AskHow) => boolean;
let listener: Listener | null = null;

/** Hands `q` to the bubble. Returns whether he took it. */
export const askTycho = (q: string, how?: AskHow) => listener?.(q, how) ?? false;

/** The bubble takes the questions (there is one bubble); returns the way to stop. */
export function onAsk(fn: Listener) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}
