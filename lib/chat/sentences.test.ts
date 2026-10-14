import { describe, expect, it } from "vitest";
import { parseReply } from "./reply";
import { announce, opened, spansOf } from "./sentences";

const blocks = (md: string) => parseReply(md);

describe("sentences: a reply's sentences in word units, for the announcements and his voice", () => {
  it("splits on a full stop, a question or an exclamation, and at the end of each paragraph or list item", () => {
    const b = blocks("Mostly TypeScript. Why? Because it scales!\n\n- Mercado\n- FlowStack");
    expect(spansOf(b).map((s) => [s.from, s.to, s.text])).toEqual([
      [0, 2, "Mostly TypeScript."],
      [2, 3, "Why?"],
      [3, 6, "Because it scales!"],
      [6, 7, "Mercado"],
      [7, 8, "FlowStack"],
    ]);
  });

  it("knows a question by its mark", () => {
    const [a, b] = spansOf(blocks("Ask me. Is he free?"));
    expect(a!.question).toBe(false);
    expect(b!.question).toBe(true);
  });

  it("keeps a link whole, and its full stop with it", () => {
    const [s] = spansOf(blocks("Write to [him](mailto:a@b.c)."));
    expect(s!.text).toBe("Write to him.");
  });

  it("breaks where it's told (his voice also at a colon), with where each word starts", () => {
    const b = blocks("Two things: speed, and care.");
    expect(spansOf(b, /[.!?:;]$/).map((s) => [s.text, s.words])).toEqual([
      ["Two things:", [0, 4]],
      ["speed, and care.", [0, 7, 11]],
    ]);
  });
});

describe("announcements: each finished sentence, politely, once", () => {
  const reply = "Mostly TypeScript. Lately he reaches for Next.js.";

  it("says nothing until a sentence has fully shown", () => {
    expect(announce(blocks(reply), 1, 0, false)).toEqual({ say: "", upTo: 0 });
  });

  it("announces a sentence once it has shown and more has arrived after it", () => {
    expect(announce(blocks(reply), 2, 0, false)).toEqual({ say: "Mostly TypeScript.", upTo: 1 });
    expect(announce(blocks(reply), 3, 1, false)).toEqual({ say: "", upTo: 1 });
  });

  it("holds the last sentence until the stream has ended, since more of it may come", () => {
    expect(announce(blocks("Mostly TypeScript"), 2, 0, false).say).toBe("");
    expect(announce(blocks("Mostly TypeScript."), 2, 0, true).say).toBe("Mostly TypeScript.");
  });

  it("joins every sentence a jump has shown", () => {
    expect(announce(blocks(reply), 7, 0, true)).toEqual({ say: "Mostly TypeScript. Lately he reaches for Next.js.", upTo: 2 });
  });
});

describe("opened: the sentences whose first word has just shown", () => {
  it("lists each sentence that opened between two counts of shown words", () => {
    const b = blocks("Mostly TypeScript. Why? Because it scales!");
    expect(opened(b, 0, 1).map((s) => s.text)).toEqual(["Mostly TypeScript."]);
    expect(opened(b, 1, 2)).toEqual([]);
    expect(opened(b, 2, 4).map((s) => s.index)).toEqual([1, 2]);
  });
});
