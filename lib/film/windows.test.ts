import { describe, expect, it } from "vitest";
import { extraWindow, phase, rowTimes, wordWindows } from "./windows";

describe("rowTimes", () => {
  it("shares the in-window evenly between the rows, title first", () => {
    const rows = rowTimes(4, [2, 3], [5, 6]);
    expect(rows.map((r) => r.in)).toEqual([2, 2.25, 2.5, 2.75]);
    rows.forEach((r) => expect(r.inSpan).toBeCloseTo(0.25, 12));
  });

  it("lets the rows leave over the first half of the out-window, each taking half of it", () => {
    const rows = rowTimes(2, [2, 3], [5, 6]);
    expect(rows.map((r) => r.out)).toEqual([5, 5.25]);
    rows.forEach((r) => expect(r.outSpan).toBeCloseTo(0.5, 12));
  });
});

describe("wordWindows", () => {
  const tIn = [1, 1.6] as const, tOut = [3, 3.4] as const;
  const words = wordWindows([2, 5, 3], tIn, tOut);

  it("writes the words in along their row, left to right, over 80% of the row's share", () => {
    const row1 = words[1]!;
    expect(row1[0]!.in).toBeCloseTo(1.2, 12);
    expect(row1[4]!.in).toBeCloseTo(1.2 + 0.2 * 0.8, 12);
    for (let k = 1; k < row1.length; k++) expect(row1[k]!.in).toBeGreaterThan(row1[k - 1]!.in);
  });

  it("never starts a row before the one above it", () => {
    for (let j = 1; j < words.length; j++) expect(words[j]![0]!.in).toBeGreaterThan(words[j - 1]![0]!.in);
  });

  it("keeps each word's fade between 0.05 and 0.14 screens", () => {
    for (const w of words.flat()) {
      expect(w.inD).toBeGreaterThanOrEqual(0.05);
      expect(w.inD).toBeLessThanOrEqual(0.14);
      expect(w.outD).toBeGreaterThanOrEqual(0.05);
      expect(w.outD).toBeLessThanOrEqual(0.14);
    }
  });

  it("has every word out before the in-window, in through the reading stretch, and gone after the out-window", () => {
    for (const w of words.flat()) {
      expect(phase(w, tIn[0] - 0.01).opacity).toBe(0);
      expect(phase(w, (tIn[1] + tOut[0]) / 2).opacity).toBe(1);
      expect(phase(w, tOut[1] + 0.14).opacity).toBe(0);
    }
  });

  it("is tied to the scroll: a word's state depends only on the time, so it runs backwards too", () => {
    const w = words[2]![1]!;
    const forward = [0.9, 1.4, 1.5, 2, 3.2].map((t) => phase(w, t));
    const backward = [3.2, 2, 1.5, 1.4, 0.9].map((t) => phase(w, t)).reverse();
    expect(backward).toEqual(forward);
  });
});

describe("phase", () => {
  const w = { in: 1, inD: 0.1, out: 2, outD: 0.1 };

  it("settles from the scene's tint to white over a little longer than the word takes to arrive", () => {
    expect(phase(w, 1).settle).toBe(0);
    expect(phase(w, 1.1).opacity).toBe(1);
    expect(phase(w, 1.1).settle).toBeLessThan(1);
    expect(phase(w, 1.26).settle).toBe(1);
  });

  it("reports how far in and how far out the word is", () => {
    expect(phase(w, 1.05)).toMatchObject({ ein: expect.closeTo(0.5, 9), eout: 0 });
    expect(phase(w, 2.05)).toMatchObject({ ein: 1, eout: expect.closeTo(0.5, 9) });
  });
});

describe("extraWindow", () => {
  it("brings a block's extras (caption, list, links) in after its last row, and out with its first", () => {
    const x = extraWindow(3, [1, 1.6], [3, 3.4]);
    const last = rowTimes(3, [1, 1.6], [3, 3.4])[2]!;
    expect(x.in).toBeCloseTo(last.in + last.inSpan * 0.8, 12);
    expect(x.out).toBe(3);
  });
});
