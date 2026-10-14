import { describe, expect, it, vi } from "vitest";
import { askTycho, onAsk } from "./ask";
import { onTalk, say } from "./talk";

describe("ask: questions from the page reach the bubble", () => {
  it("turns a question away while nothing listens", () => {
    expect(askTycho("Stack?")).toBe(false);
  });

  it("hands the question to the bubble, which says whether it took it", () => {
    const off = onAsk((q) => q !== "busy");
    expect(askTycho("Stack?")).toBe(true);
    expect(askTycho("busy")).toBe(false);
    off();
    expect(askTycho("Stack?")).toBe(false);
  });
  it("passes on how it was asked: a star keeps the page put", () => {
    const got: unknown[] = [];
    const off = onAsk((q, how) => (got.push([q, how]), true));
    askTycho("What's this?", { stay: true });
    askTycho("Stack?");
    off();
    expect(got).toEqual([["What's this?", { stay: true }], ["Stack?", undefined]]);
  });
});

describe("talk: the moments of his talking, for his voice and the score", () => {
  it("tells every listener each moment, in order, at once", () => {
    const heard: string[] = [];
    const a = onTalk((t) => heard.push(`a:${t.type}`));
    const b = onTalk((t) => heard.push(`b:${t.type}`));
    say({ type: "ask", question: "Stack?" });
    say({ type: "done" });
    expect(heard).toEqual(["a:ask", "b:ask", "a:done", "b:done"]);
    a();
    b();
  });

  it("stops telling a listener that has left", () => {
    const fn = vi.fn();
    onTalk(fn)();
    say({ type: "hush" });
    expect(fn).not.toHaveBeenCalled();
  });
});
