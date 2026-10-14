/**
 * The log: the stored conversation read as exchanges, each a question and Tycho's reply. An error line (a `system`
 * message) is his reply too. A question whose reply never landed (the page was left mid-reply) keeps its place with
 * no reply.
 */
import type { ChatMessage } from "./types";

export type Exchange = { q: string; a: string | null; at: string };

export function exchangesOf(messages: ChatMessage[]): Exchange[] {
  const out: Exchange[] = [];
  for (const m of messages) {
    if (m.role === "user") out.push({ q: m.content, a: null, at: m.createdAt });
    else if ((m.role === "assistant" || m.role === "system") && m.content) {
      const last = out[out.length - 1];
      if (last && last.a === null) last.a = m.content;
    }
  }
  return out;
}

const key = (q: string) => q.trim().toLowerCase();

/** The questions already asked, compared loosely (case and surrounding space). */
export const asked = (ex: Exchange[]) => new Set(ex.map((e) => key(e.q)));

/** Up to three starters not yet asked, in their order; `also` is a question in flight that isn't stored yet. */
export function offered(starters: string[], ex: Exchange[], also?: string | null) {
  const done = asked(ex);
  if (also) done.add(key(also));
  return starters.filter((s) => !done.has(key(s))).slice(0, 3);
}
