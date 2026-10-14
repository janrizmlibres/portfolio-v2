import { describe, expect, it } from "vitest";
import { labelTimes, LABEL_FADE } from "./label-times";

describe("when a block's leader-line labels come in, one after another", () => {
  it("staggers them 0.07 apart from just before the block's text is whole", () => {
    const t = labelTimes(3, { tIn: 10, tOut: 12, spot: 11 });
    expect(t.map((x) => +x.in.toFixed(3))).toEqual([9.85, 9.92, 9.99]);
    expect(t.map((x) => +x.out.toFixed(3))).toEqual([12, 12.04, 12.08]);
  });

  it("closes the stagger up so the last label is whole by the reading spot", () => {
    // the report: its text is whole 0.1 before its spot, and it names four bars
    const t = labelTimes(4, { tIn: 32.05, tOut: 32.38, spot: 32.15 });
    expect(t[3]!.in + LABEL_FADE).toBeLessThanOrEqual(32.15 + 1e-9);
    expect(t[1]!.in).toBeGreaterThan(t[0]!.in);
    expect(t[0]!.in).toBeCloseTo(31.9, 6);
  });
});
