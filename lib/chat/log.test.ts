import { describe, expect, it } from "vitest";
import { asked, exchangesOf, offered } from "./log";
import type { ChatMessage } from "./types";

const m = (role: ChatMessage["role"], content: string, at = "2026-10-04T14:02:00.000Z"): ChatMessage => ({
  id: Math.random().toString(36),
  role,
  content,
  createdAt: at,
});

describe("the log: the conversation as exchanges, a question and Tycho's reply", () => {
  it("pairs each question with the reply after it", () => {
    const ex = exchangesOf([m("user", "What's his stack?"), m("assistant", "Mostly TypeScript.")]);
    expect(ex).toEqual([{ q: "What's his stack?", a: "Mostly TypeScript.", at: "2026-10-04T14:02:00.000Z" }]);
  });

  it("counts an error line as his reply", () => {
    const ex = exchangesOf([m("user", "Hi"), m("system", "I can't reach his notes right now.")]);
    expect(ex[0]!.a).toBe("I can't reach his notes right now.");
  });

  it("keeps a question whose reply was cut off, with no reply", () => {
    const ex = exchangesOf([m("user", "First?"), m("user", "Second?"), m("assistant", "Yes.")]);
    expect(ex.map((e) => [e.q, e.a])).toEqual([
      ["First?", null],
      ["Second?", "Yes."],
    ]);
  });

  it("skips empty and stray replies", () => {
    expect(exchangesOf([m("assistant", "Orphan."), m("user", "Q"), m("assistant", "")])).toEqual([
      { q: "Q", a: null, at: "2026-10-04T14:02:00.000Z" },
    ]);
  });

  it("knows which starters are asked, and offers up to three of the rest, in order", () => {
    const starters = ["A?", "B?", "C?", "D?", "E?"];
    const ex = exchangesOf([m("user", "B?"), m("assistant", "b"), m("user", "  d?  ")]);
    expect(asked(ex)).toEqual(new Set(["b?", "d?"]));
    expect(offered(starters, ex)).toEqual(["A?", "C?", "E?"]);
    expect(offered(starters, ex, "A?")).toEqual(["C?", "E?"]);
  });
});
