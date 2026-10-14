import { describe, expect, it } from "vitest";
import { layRunway, readingSpot, readingStretch } from "./spots";

const block = (id: string, sec: string, tIn: [number, number], tOut: [number, number]) => ({ id, sec, tIn, tOut });

describe("readingSpot", () => {
  it("is the middle of the block's reading stretch, where its text is fully in", () => {
    const b = block("a", "sec-about", [2, 2.7], [3.5, 3.9]);
    expect(readingStretch(b, 40)).toEqual([2.7, 3.5]);
    expect(readingSpot(b, 40)).toBeCloseTo(3.1, 12);
  });

  it("reads the last block until the film ends, when its out-window runs past the end", () => {
    const b = block("contact", "sec-contact", [41.45, 42.05], [42.45 + 5, 42.45 + 6]);
    expect(readingStretch(b, 42.45)).toEqual([42.05, 42.45]);
    expect(readingSpot(b, 42.45)).toBeCloseTo(42.25, 12);
  });
});

describe("layRunway", () => {
  const blocks = [
    block("work-0", "sec-work", [6.6, 7.1], [7.4, 7.7]),
    block("hero", "sec-hero", [-0.4, -0.05], [0.06, 0.6]),
    block("about-1", "sec-about", [1.95, 2.67], [3.56, 3.94]),
    block("about-2", "sec-about", [4.03, 4.83], [5.39, 5.77]),
  ];
  const r = layRunway(blocks, 10);

  it("lays the blocks out in the film's order, the first opening the film at its first frame", () => {
    expect(r.blocks.map((b) => b.id)).toEqual(["hero", "about-1", "about-2", "work-0"]);
    expect(r.blocks[0]!.spot).toBe(0);
  });

  it("puts each block's top at its reading spot, so landing on a block lands on its reading spot", () => {
    r.blocks.slice(0, -1).forEach((b, i) => expect(b.spot + b.height).toBeCloseTo(r.blocks[i + 1]!.spot, 12));
  });

  it("is the film's length plus one screen tall, so the last scroll position is the film's last frame", () => {
    expect(r.height).toBe(11);
    const last = r.blocks.at(-1)!;
    expect(last.spot + last.height).toBeCloseTo(11, 12);
  });

  it("groups the blocks into their sections, each starting at its first block", () => {
    expect(r.sections.map((s) => [s.id, s.blocks.map((b) => b.id)])).toEqual([
      ["sec-hero", ["hero"]],
      ["sec-about", ["about-1", "about-2"]],
      ["sec-work", ["work-0"]],
    ]);
    expect(r.sections[1]!.top).toBeCloseTo(r.blocks[1]!.spot, 12);
  });

  it("lands on a section past its intro, on its first entry, while the section still starts at its intro", () => {
    const withIntro = layRunway([...blocks.map((b) => (b.id === "work-0" ? { ...b, intro: true } : b)), block("role-a", "sec-work", [7.8, 8.1], [8.5, 8.7])], 10);
    const sec = (id: string) => withIntro.sections.find((s) => s.id === id)!;
    const at = (id: string) => withIntro.blocks.find((b) => b.id === id)!.spot;
    expect([sec("sec-work").top, sec("sec-work").land]).toEqual([at("work-0"), at("role-a")]);
    expect([sec("sec-about").top, sec("sec-about").land]).toEqual([at("about-1"), at("about-1")]);
  });

  it("lands on a section's intro when it has nothing else", () => {
    const only = layRunway([{ ...block("work-0", "sec-work", [6.6, 7.1], [7.4, 7.7]), intro: true }], 10);
    expect(only.sections[0]!.land).toBe(only.sections[0]!.top);
  });

  it("refuses a section whose blocks aren't together in the film, since the page order is the film's", () => {
    expect(() => layRunway([...blocks, block("about-3", "sec-about", [8, 8.2], [8.6, 8.8])], 10)).toThrow(/sec-about/);
  });
});
