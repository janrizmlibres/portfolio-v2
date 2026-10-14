import { describe, expect, it } from "vitest";
import { BARS, CUT, front, held } from "./climax";

describe("the climax's front of light: the folded pulse come back at full size", () => {
  const T = { t0: 10, dur: 0.85 };

  it("hasn't left before the climax and has landed after it", () => {
    expect(front(9.9, T).at).toBe(0);
    expect(front(10 + 0.85, T).at).toBe(1);
    expect(front(12, T).at).toBe(1);
  });

  it("launches fast and slows as it nears the bottom (Edolus's front)", () => {
    const early = front(10 + 0.1 * 0.85, T).at - front(10, T).at;
    const late = front(10 + 0.85, T).at - front(10 + 0.9 * 0.85, T).at;
    expect(early).toBeGreaterThan(late * 4);
  });

  it("burns as bright as it's fast: fierce at launch, gone as it lands", () => {
    expect(front(10.001, T).crest).toBeGreaterThan(0.95);
    expect(front(10 + 0.5 * 0.85, T).crest).toBeLessThan(front(10 + 0.2 * 0.85, T).crest);
    expect(front(10 + 0.85, T).crest).toBeCloseTo(0, 6);
    expect(front(9, T).crest).toBe(0);
  });
});

describe("a ring the front has passed", () => {
  it("flares a moment after the crest passes, not as it reaches it", () => {
    expect(held(0.5, 0.5)).toBe(0);
    expect(held(0.5, 0.56)).toBeGreaterThan(0.9);
  });

  it("stays lit once passed, and is dark before", () => {
    expect(held(0.5, 1)).toBe(1);
    expect(held(0.5, 0.3)).toBe(0);
  });
});

describe("the report's bars: Found, Merged, Enriched, Saved", () => {
  it("are four, named as the report names them", () => {
    expect(BARS.map((b) => b.name)).toEqual(["Found", "Merged", "Enriched", "Saved"]);
  });

  it("show the 70%: enriched is 30% of what would have been enriched without the dedup layers (every record found)", () => {
    const found = BARS[0]!.h, enriched = BARS[2]!.h;
    expect(enriched / found).toBeCloseTo(1 - CUT, 5);
    expect(CUT).toBe(0.7);
  });

  it("merge before enrichment what enrichment never pays for, and save no more than was enriched", () => {
    expect(BARS[1]!.h + BARS[2]!.h).toBeCloseTo(BARS[0]!.h, 5);
    expect(BARS[3]!.h).toBeLessThanOrEqual(BARS[2]!.h);
  });
});
