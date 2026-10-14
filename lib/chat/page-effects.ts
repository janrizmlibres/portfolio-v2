/**
 * What a reply does to the page, in order: Tycho lights the stars he reads, and moves the page where the answer is
 * (a warp to a section, or the point at a subject, which takes the page there first).
 *
 * - **The stars.** Each search's stars light as they arrive (the chat stream sends their ids); a new question puts the
 *   last one's out first.
 * - **A move waits for the stars.** The warp flares the stars the question lit, so a move asked while a search is in
 *   flight waits for that search's stars (at most `patience` ms, in case they never come). A move with no search in
 *   flight still waits a moment (`settle` ms) for another asked in the same breath.
 * - **The point wins.** Asked together, a point and a warp make the point: it takes the page to its subject anyway.
 *   Only the first point goes. A later step's move goes too, once the first has gone.
 * - **The reply's end** makes a waiting move at once; a new question drops it.
 * - **A question asked to keep the page put** (a star: `question({ stay: true })`) drops its moves, so the
 *   constellation lighting up is the answer's show.
 * - **`moving()`** says a move is waiting, so the reply can hold until the page has moved (`hold.ts`).
 */
import type { ScrollSection } from "@/lib/tool-effects/event-bus";

export type Move = { kind: "section"; section: ScrollSection } | { kind: "point"; subject: string };

type Timers = { set(fn: () => void, ms: number): unknown; clear(id: unknown): void };
const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export function createPageEffects(o: {
  light(stars: string[]): void;
  unlight(): void;
  go(move: Move): void;
  settle?: number;
  patience?: number;
  timers?: Timers;
}) {
  const settle = o.settle ?? 250, patience = o.patience ?? 4000, timers = o.timers ?? realTimers;
  const searching = new Set<string>();
  let waiting: Move[] = [];
  let stay = false;
  let settleTimer: unknown = null, patienceTimer: unknown = null;

  const stopTimers = () => {
    if (settleTimer !== null) timers.clear(settleTimer);
    if (patienceTimer !== null) timers.clear(patienceTimer);
    settleTimer = patienceTimer = null;
  };
  const flush = () => {
    stopTimers();
    if (!waiting.length) return;
    const move = waiting.find((m) => m.kind === "point") ?? waiting[0]!;
    waiting = [];
    o.go(move);
  };
  // the move goes a moment after the last one asked, once no search is in flight
  const tryLater = () => {
    if (settleTimer !== null) timers.clear(settleTimer);
    settleTimer = timers.set(() => {
      settleTimer = null;
      if (!searching.size) flush();
    }, settle);
  };

  return {
    /** whether a move is waiting to go */
    moving: () => waiting.length > 0,
    /** a new question: the last one's stars go out, and anything still waiting is dropped; `stay` keeps the page put */
    question({ stay: still = false }: { stay?: boolean } = {}) {
      stay = still;
      stopTimers();
      waiting = [];
      searching.clear();
      o.unlight();
    },
    /** a search went out (its call id) */
    search(id: string) {
      searching.add(id);
    },
    /** the stars search `id` read */
    stars(id: string, stars: string[]) {
      searching.delete(id);
      if (stars.length) o.light(stars);
      if (waiting.length && !searching.size) tryLater();
    },
    /** a move the reply asks for */
    move(m: Move) {
      if (stay) return;
      waiting.push(m);
      if (patienceTimer === null) patienceTimer = timers.set(flush, patience);
      if (!searching.size) tryLater();
    },
    /** the reply ended (or failed): a waiting move goes now */
    end() {
      searching.clear();
      flush();
    },
  };
}

