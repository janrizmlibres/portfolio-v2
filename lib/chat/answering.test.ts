import { afterEach, describe, expect, it, vi } from "vitest";
import { answeringFor, isAnswering, setAnswering, subscribe } from "./answering";

describe("answering: whether Tycho is answering, the one source the bubble, stars and chips all read", () => {
  afterEach(() => setAnswering(null));

  it("is idle until a question is asked", () => {
    expect(isAnswering()).toBe(false);
    expect(answeringFor()).toBeNull();
  });

  it("holds the question while Tycho answers it, and lets go when the reply is done", () => {
    setAnswering("What's his stack?");
    expect(isAnswering()).toBe(true);
    expect(answeringFor()).toBe("What's his stack?");
    setAnswering(null);
    expect(isAnswering()).toBe(false);
    expect(answeringFor()).toBeNull();
  });

  it("tells each listener on a change, and only on a change", () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    setAnswering("Is he available?");
    setAnswering("Is he available?");
    setAnswering(null);
    expect(fn).toHaveBeenCalledTimes(2);
    off();
    setAnswering("Tell me about Athena");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
