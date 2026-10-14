/**
 * What Tycho's talking does, moment by moment, for anything that follows it (his voice, the score). The bubble says;
 * each listener hears every event, in order, synchronously, so `ask` still runs inside the click, tap or key that
 * asked (the only moment a browser lets sound start).
 * - `ask`: a question was just asked, in the asking gesture.
 * - `open`: the reply's first word shows.
 * - `sentence`: a sentence's first word shows; `span` gives its words and whether it's a question.
 * - `show`: more words show; `blocks` is the reply so far and `visible` how many word units show. Every frame that
 *   shows a word sends one.
 * - `hush`: the rest of this reply shows at once (a tap on the text, or the bubble closed mid-reply), so whatever
 *   follows the words falls silent until the next question.
 * - `done`: the reply has shown in full.
 */
import type { Block } from "./reply";
import type { Span } from "./sentences";

export type Talk =
  | { type: "ask"; question: string }
  | { type: "open" }
  | { type: "sentence"; span: Span }
  | { type: "show"; blocks: Block[]; visible: number }
  | { type: "hush" }
  | { type: "done" };

const listeners = new Set<(t: Talk) => void>();

export function say(t: Talk) {
  for (const fn of listeners) fn(t);
}

export function onTalk(fn: (t: Talk) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
