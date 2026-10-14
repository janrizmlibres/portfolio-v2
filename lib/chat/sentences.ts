/**
 * A reply's sentences, in its word units (`reply.ts`): each runs to a unit ending in a full stop, a question or an
 * exclamation mark, or to the end of its paragraph or list item. Screen readers hear each one once it has shown, and
 * his voice phrases each one's opening.
 */
import type { Block } from "./reply";

/** `words`: where each of its words starts in `text` */
export type Span = { index: number; from: number; to: number; text: string; words: number[]; question: boolean };

const END = /[.!?]["')\]]*$/;

/** The sentences, each ended by a unit `end` matches (his voice also breaks at a colon or a semicolon). */
export function spansOf(blocks: Block[], end = END): Span[] {
  const out: Span[] = [];
  let i = 0;
  for (const b of blocks) {
    let from = i, text = "", words: number[] = [];
    b.units.forEach((u, k) => {
      if (text && !u.glue) text += " ";
      words.push(text.length);
      text += u.text;
      i++;
      if (end.test(u.text) || k === b.units.length - 1) {
        out.push({ index: out.length, from, to: i, text, words, question: /\?["')\]]*$/.test(text) });
        from = i;
        text = "";
        words = [];
      }
    });
  }
  return out;
}

/**
 * What to announce now: the sentences after the first `upTo` that have fully shown (`visible` units) and are finished,
 * meaning more has arrived after them or the stream has ended. Returns the words to say and the new `upTo`.
 */
export function announce(blocks: Block[], visible: number, upTo: number, ended: boolean) {
  const spans = spansOf(blocks);
  const total = spans.length ? spans[spans.length - 1]!.to : 0;
  const said: string[] = [];
  let n = upTo;
  for (const s of spans.slice(upTo)) {
    if (visible < s.to || (s.to >= total && !ended)) break;
    said.push(s.text);
    n = s.index + 1;
  }
  return { say: said.join(" "), upTo: n };
}

/** The sentences whose first word showed as the shown count went from `before` to `now`. */
export const opened = (blocks: Block[], before: number, now: number) => spansOf(blocks).filter((s) => s.from >= before && s.from < now);
