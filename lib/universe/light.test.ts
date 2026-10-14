import { describe, expect, it } from "vitest";
import { oklabToSrgb, oklchToOklab, textTint } from "./light";

const close = (a: number[], b: number[], digits = 3) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, digits));

describe("oklchToOklab", () => {
  it("puts chroma on a at hue 0 and on b at hue 90", () => {
    close(oklchToOklab([0.5, 0.1, 0]), [0.5, 0.1, 0]);
    close(oklchToOklab([0.5, 0.1, 90]), [0.5, 0, 0.1]);
  });
});

describe("oklabToSrgb", () => {
  it("maps white and black to themselves", () => {
    close(oklabToSrgb([1, 0, 0]), [1, 1, 1]);
    close(oklabToSrgb([0, 0, 0]), [0, 0, 0]);
  });

  it("returns encoded sRGB display values (pure red round-trips)", () => {
    close(oklabToSrgb([0.627955, 0.224863, 0.125846]), [1, 0, 0], 2);
  });

  it("clamps colours outside the gamut into 0..1", () => {
    for (const v of oklabToSrgb([0.9, 0.4, -0.4])) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("textTint", () => {
  it("is the region's light, bright enough to write in", () => {
    expect(textTint("about")).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    const [r, g, b] = textTint("about").match(/\d+/g)!.map(Number);
    // plum: red and blue over green, and light
    expect(r!).toBeGreaterThan(g!);
    expect(b!).toBeGreaterThan(g!);
    expect(Math.min(r!, g!, b!)).toBeGreaterThan(150);
    expect(textTint("work")).not.toBe(textTint("about"));
  });
});
