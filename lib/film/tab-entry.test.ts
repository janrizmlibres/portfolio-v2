import { describe, expect, it } from "vitest";
import { tabEntry } from "./tab-entry";

// the runway's focusable elements, in page order, each at its block's reading spot
const spots = [3.14, 8.24, 11.62, 22.53, 25.83, 26.89, 42.25, 42.25];

describe("tabEntry: where Tab comes into the page's text", () => {
  it("going forward, at the block on screen", () => {
    expect(tabEntry(spots, 22.53, 1)).toBe(3);
  });

  it("going forward from a block with nothing to focus, at the next one that has something", () => {
    // Projects' intro, between the road's end and Athena
    expect(tabEntry(spots, 20.45, 1)).toBe(3);
  });

  it("going backward, at the last of that same block", () => {
    expect(tabEntry(spots, 22.53, -1)).toBe(3);
    expect(tabEntry(spots, 42.25, -1)).toBe(7);
    expect(tabEntry(spots, 40, -1)).toBe(7);
  });

  it("at the start of the film, at the page's first", () => {
    expect(tabEntry(spots, 0, 1)).toBe(0);
  });

  it("past the last, nowhere going forward and at the last going backward", () => {
    expect(tabEntry(spots, 43, 1)).toBe(-1);
    expect(tabEntry(spots, 43, -1)).toBe(7);
    expect(tabEntry([], 3, 1)).toBe(-1);
  });
});
