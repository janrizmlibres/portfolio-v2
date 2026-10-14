import { describe, expect, it } from "vitest";
import { parseReply, unitCount } from "./reply";

describe("parseReply: a reply's markdown as paragraphs and list items of word units, for the reveal", () => {
  it("splits a paragraph into its words", () => {
    expect(parseReply("Mostly TypeScript, lately Next.js.")).toEqual([
      { kind: "p", units: [{ text: "Mostly" }, { text: "TypeScript," }, { text: "lately" }, { text: "Next.js." }] },
    ]);
  });

  it("keeps a link or a bold run whole, as one unit, so half a reply never shows raw markdown", () => {
    expect(parseReply("Open **Mercado** first: [Live demo](https://example.com).")[0]?.units).toEqual([
      { text: "Open" },
      { text: "Mercado", bold: true },
      { text: "first:" },
      { text: "Live demo", href: "https://example.com" },
      { text: "." , glue: true },
    ]);
  });

  it("reads a list as list items, and paragraphs apart by blank lines", () => {
    const blocks = parseReply("Three things:\n\n- one thing\n- two things\n\nThat's all.");
    expect(blocks.map((b) => b.kind)).toEqual(["p", "li", "li", "p"]);
    expect(unitCount(blocks)).toBe(2 + 2 + 2 + 2);
  });

  it("holds back a link or bold run still arriving, rather than showing its markdown", () => {
    expect(parseReply("See [Live de")).toEqual([{ kind: "p", units: [{ text: "See" }] }]);
    expect(parseReply("It's **Merc")).toEqual([{ kind: "p", units: [{ text: "It's" }] }]);
  });
});
