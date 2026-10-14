import { describe, expect, it } from "vitest";
import { starMagnitude } from "./magnitude";

describe("starMagnitude", () => {
  it("is the same for a star on every load, seeded by its id", () => {
    expect(starMagnitude("s043")).toBe(starMagnitude("s043"));
    expect(starMagnitude("s043")).not.toBe(starMagnitude("s044"));
  });

  it("makes few stars bright and many faint", () => {
    const mags = Array.from({ length: 93 }, (_, i) => starMagnitude(`s${String(i).padStart(3, "0")}`));
    mags.forEach((m) => expect(m).toBeGreaterThanOrEqual(0));
    mags.forEach((m) => expect(m).toBeLessThan(1));
    expect(mags.filter((m) => m > 0.5).length).toBeLessThan(mags.filter((m) => m < 0.2).length);
  });
});
