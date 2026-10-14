/**
 * The bubble's one exchange, as plain state: the question, Tycho's reply as it arrives and is revealed, and whether
 * the bubble is open. Every change is a function from one state to the next, so the bubble, its tests and anything
 * else reading it agree.
 * - One question at a time: asking while he answers is ignored. The visitor may still draft; Send waits.
 * - Thinking until the first words arrive, then the reveal shows them at the pace, never ahead of the stream; a tap
 *   shows the rest. The reply is done when the stream has ended and every word shows.
 * - Closing mid-reply doesn't stop the reply: the rest shows at once (a closed bubble has nothing to pace), so it
 *   finishes into the log, and reopening shows the same exchange.
 * - The fold: once nothing is appearing, scrolling on about a screen, either way, closes the bubble. It counts
 *   distance, not displacement, because the film settles the scroll on the next reading spot, often less than a
 *   screen on. Every close is the same change, whatever caused it.
 */
import { parseReply, unitCount } from "./reply";
import { advance, revealStart, showAll, visibleWords, type Reveal } from "./reveal";

export type Phase = "idle" | "thinking" | "streaming" | "done";

export type Conversation = {
  phase: Phase;
  question: string | null;
  /** the reply's markdown so far */
  arrived: string;
  /** the stream has ended */
  ended: boolean;
  reveal: Reveal;
  open: boolean;
  /** put away while the page warps: hidden, its reveal held, back as it was after */
  away: boolean;
  /** distance scrolled, in px, since the bubble last had nothing appearing and was open */
  scrolled: number;
};

/** How far, in screens, the page scrolls on before an open bubble with nothing appearing folds. */
export const FOLD_SCREENS = 0.8;

export const start = (): Conversation => ({
  phase: "idle",
  question: null,
  arrived: "",
  ended: false,
  reveal: revealStart(),
  open: false,
  away: false,
  scrolled: 0,
});

export const answering = (c: Conversation) => c.phase === "thinking" || c.phase === "streaming";

export const canSend = (c: Conversation, draft: string) => !answering(c) && draft.trim() !== "";

export function ask(c: Conversation, q: string): Conversation {
  q = q.trim();
  if (!q || answering(c)) return c;
  return { ...start(), phase: "thinking", question: q, open: true, away: c.away };
}

/**
 * Words arrived: everything so far, and whether the stream has ended. A stream with no words ends the reply too, and
 * an ended reply stays ended.
 */
export function arrive(c: Conversation, text: string, ended: boolean): Conversation {
  if (!answering(c)) return c;
  const phase = c.phase === "thinking" && !text && !ended ? "thinking" : "streaming";
  return { ...c, phase, arrived: text, ended: c.ended || ended };
}

export function tick(c: Conversation, dt: number, pace: number): Conversation {
  if (c.phase !== "streaming" || c.away) return c;
  const n = unitCount(parseReply(c.arrived));
  const reveal = advance(c.open ? c.reveal : showAll(c.reveal), dt, n, pace);
  const done = c.ended && visibleWords(reveal, n) >= n;
  return { ...c, reveal, phase: done ? "done" : "streaming", scrolled: 0 };
}

/** How many word units show. */
export const visible = (c: Conversation) => visibleWords(c.reveal, unitCount(parseReply(c.arrived)));

/** A tap on the text: the rest at once. */
export const tap = (c: Conversation): Conversation => (c.phase === "streaming" ? { ...c, reveal: showAll(c.reveal) } : c);

export const open = (c: Conversation): Conversation => ({ ...c, open: true, scrolled: 0 });

export function close(c: Conversation): Conversation {
  if (!c.open) return c;
  return { ...c, open: false, scrolled: 0, reveal: answering(c) ? showAll(c.reveal) : c.reveal };
}

/** The bubble put away for a warp (`on`), or back after it. */
export const away = (c: Conversation, on: boolean): Conversation => (c.away === on ? c : { ...c, away: on, scrolled: 0 });

/** The page scrolled by `dy` px on a screen `vh` px tall. */
export function scrolled(c: Conversation, dy: number, vh: number): Conversation {
  if (!c.open || c.away || answering(c)) return c;
  const d = c.scrolled + Math.abs(dy);
  return d > FOLD_SCREENS * vh ? close(c) : { ...c, scrolled: d };
}
