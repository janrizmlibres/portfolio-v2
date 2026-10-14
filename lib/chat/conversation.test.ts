import { describe, expect, it } from "vitest";
import {
  answering,
  arrive,
  ask,
  away,
  canSend,
  close,
  FOLD_SCREENS,
  open,
  scrolled,
  start,
  tap,
  tick,
  visible,
  type Conversation,
} from "./conversation";

const PACE = 4;
const REPLY = "Mostly TypeScript. Lately he reaches for Next.js and the Vercel AI SDK."; // 12 words
// a step that adds up exactly in binary, so a second of ticks is exactly a second
const run = (c: Conversation, seconds: number, step = 0.125) => {
  for (let t = 0; t < seconds - 1e-9; t += step) c = tick(c, step, PACE);
  return c;
};

describe("conversation: the bubble's one exchange, from the question to the fold", () => {
  it("starts closed and idle, with nothing asked", () => {
    const c = start();
    expect(c.open).toBe(false);
    expect(c.phase).toBe("idle");
    expect(c.question).toBeNull();
    expect(answering(c)).toBe(false);
  });

  it("asking opens the bubble on the question while Tycho thinks", () => {
    const c = ask(start(), "  What's his stack? ");
    expect(c.open).toBe(true);
    expect(c.phase).toBe("thinking");
    expect(c.question).toBe("What's his stack?");
    expect(answering(c)).toBe(true);
    expect(visible(c)).toBe(0);
  });

  it("ignores an empty question", () => {
    const c = start();
    expect(ask(c, "   ")).toBe(c);
  });

  it("the first words to arrive end the thinking, and the reply appears at the pace", () => {
    let c = arrive(ask(start(), "Stack?"), "Mostly", false);
    expect(c.phase).toBe("streaming");
    c = arrive(c, REPLY, false);
    c = run(c, 1);
    expect(visible(c)).toBe(4);
  });

  it("never shows ahead of what has arrived", () => {
    let c = arrive(ask(start(), "Stack?"), "Mostly TypeScript.", false);
    c = run(c, 3);
    expect(visible(c)).toBe(2);
    expect(c.phase).toBe("streaming");
  });

  it("a tap on the text shows the rest at once", () => {
    let c = arrive(ask(start(), "Stack?"), REPLY, false);
    c = tap(run(c, 0.5));
    c = tick(c, 0.01, PACE);
    expect(visible(c)).toBe(12);
  });

  it("is done when the stream has ended and every word shows, not when the stream ends", () => {
    let c = arrive(ask(start(), "Stack?"), REPLY, true);
    c = run(c, 1);
    expect(c.phase).toBe("streaming");
    expect(answering(c)).toBe(true);
    c = run(c, 2.5);
    expect(c.phase).toBe("done");
    expect(answering(c)).toBe(false);
  });

  it("an ended reply stays ended when a late chunk repeats it", () => {
    const c = arrive(arrive(ask(start(), "Stack?"), REPLY, true), REPLY, false);
    expect(c.ended).toBe(true);
    expect(run(c, 4).phase).toBe("done");
  });

  describe("one question at a time", () => {
    it("holds off asking while he answers", () => {
      const c = ask(start(), "Stack?");
      expect(ask(c, "Athena?")).toBe(c);
      const streaming = arrive(c, "Mostly", false);
      expect(ask(streaming, "Athena?")).toBe(streaming);
    });

    it("lets the visitor draft the next question, but Send comes back only once the reply is done", () => {
      let c = ask(start(), "Stack?");
      expect(canSend(c, "Tell me about Athena")).toBe(false);
      c = run(arrive(c, REPLY, true), 4);
      expect(canSend(c, "Tell me about Athena")).toBe(true);
      expect(canSend(c, "   ")).toBe(false);
      expect(ask(c, "Tell me about Athena").question).toBe("Tell me about Athena");
    });

    it("closing mid-reply doesn't stop it: the rest lands at once, and the reply finishes", () => {
      let c = arrive(ask(start(), "Stack?"), REPLY, false);
      c = close(run(c, 0.5));
      expect(c.open).toBe(false);
      expect(answering(c)).toBe(true);
      c = tick(arrive(c, REPLY, true), 0.01, PACE);
      expect(visible(c)).toBe(12);
      expect(c.phase).toBe("done");
      // reopening shows the same exchange
      c = open(c);
      expect(c.open).toBe(true);
      expect(c.question).toBe("Stack?");
    });

    it("an error is his line, shown like a reply", () => {
      let c = arrive(ask(start(), "Stack?"), "I can't reach his notes right now.", true);
      c = run(c, 3);
      expect(c.phase).toBe("done");
      expect(visible(c)).toBe(7);
    });
  });

  describe("the fold", () => {
    const vh = 800;
    const done = () => run(arrive(ask(start(), "Stack?"), REPLY, true), 4);

    it("stays open while a reply is appearing, however far the page scrolls", () => {
      let c = arrive(ask(start(), "Stack?"), REPLY, false);
      c = scrolled(c, 5 * vh, vh);
      expect(c.open).toBe(true);
    });

    it("folds once the reply is done and the page has scrolled on about a screen, either way", () => {
      let c = done();
      c = scrolled(c, 300, vh);
      c = scrolled(c, -300, vh);
      expect(c.open).toBe(true);
      c = scrolled(c, FOLD_SCREENS * vh - 600 + 1, vh);
      expect(c.open).toBe(false);
    });

    it("counts only the scroll after the reply is done", () => {
      let c = arrive(ask(start(), "Stack?"), REPLY, true);
      c = scrolled(c, 3 * vh, vh);
      c = run(c, 4);
      expect(c.phase).toBe("done");
      c = scrolled(c, 100, vh);
      expect(c.open).toBe(true);
    });

    it("starts counting again when reopened", () => {
      let c = scrolled(done(), vh, vh);
      c = scrolled(open(c), 100, vh);
      expect(c.open).toBe(true);
    });

    it("a bubble opened on no exchange (the greeting) folds the same way", () => {
      let c = open(start());
      c = scrolled(c, vh, vh);
      expect(c.open).toBe(false);
    });
  });

  describe("away: the bubble put away while the page warps", () => {
    it("hides the bubble, and brings it back as it was, mid-reply, without showing the rest", () => {
      let c = arrive(ask(start(), "Stack?"), REPLY, false);
      c = run(c, 1);
      const shown = visible(c);
      c = away(c, true);
      expect(c.open).toBe(true);
      expect(c.away).toBe(true);
      expect(visible(c)).toBe(shown);
      c = away(c, false);
      expect(c.away).toBe(false);
      expect(visible(c)).toBe(shown);
    });

    it("holds the reveal while away", () => {
      let c = away(arrive(ask(start(), "Stack?"), REPLY, false), true);
      c = run(c, 2);
      expect(visible(c)).toBe(0);
      c = run(away(c, false), 1);
      expect(visible(c)).toBe(4);
    });

    it("never folds for the warp's own scrolling", () => {
      const vh = 800;
      let c = run(arrive(ask(start(), "Stack?"), REPLY, true), 4);
      c = scrolled(away(c, true), 5 * vh, vh);
      expect(c.open).toBe(true);
    });

    it("stays away for a question asked mid-warp: the bubble comes back when he lands", () => {
      const c = ask(away(start(), true), "Stack?");
      expect(c.away).toBe(true);
      expect(c.phase).toBe("thinking");
    });
  });
});
