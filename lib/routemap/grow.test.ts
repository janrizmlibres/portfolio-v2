import { describe, expect, it } from "vitest";
import { foldSteps, openSteps } from "./grow";

describe("openSteps", () => {
  it("opening from rest waits for the map: the lines and their dots once it's grown, then the names", () => {
    expect(openSteps(0)).toEqual({ map: 0, lines: 0.25, dots: 0.25, names: 0.4, stagger: 0.04 });
  });

  it("coming back while it folds, with the map still grown, brings the lines and names back at once, together", () => {
    expect(openSteps(1)).toEqual({ map: 0, lines: 0, dots: 0, names: 0, stagger: 0 });
  });

  it("waits only for the growing left to do", () => {
    const half = openSteps(0.5);
    expect(half.lines).toBeCloseTo(0.125);
    expect(half.names).toBeCloseTo(0.2);
  });

  it("holds its order however far it's got: the map, then the lines, then the names", () => {
    for (const g of [0, 0.2, 0.6, 0.9]) {
      const s = openSteps(g);
      expect(s.map).toBeLessThanOrEqual(s.lines);
      expect(s.lines).toBeLessThan(s.names);
    }
  });

  it("clamps how far the map has grown", () => {
    expect(openSteps(-0.3)).toEqual(openSteps(0));
    expect(openSteps(1.4)).toEqual(openSteps(1));
  });
});

describe("foldSteps", () => {
  it("folding an open map: the names and lines go first, the dots once the names are out, then the map shrinks", () => {
    expect(foldSteps(1)).toEqual({ names: 0, lines: 0, dots: 0.12, map: 0.18, stagger: 0.012 });
  });

  it("folding an open that hadn't drawn anything shrinks the map at once, with nothing to wait for", () => {
    expect(foldSteps(0)).toEqual({ names: 0, lines: 0, dots: 0, map: 0, stagger: 0.012 });
  });

  it("waits only for what's out", () => {
    const half = foldSteps(0.5);
    expect(half.dots).toBeCloseTo(0.06);
    expect(half.map).toBeCloseTo(0.09);
  });

  it("clamps how much is out", () => {
    expect(foldSteps(-1)).toEqual(foldSteps(0));
    expect(foldSteps(3)).toEqual(foldSteps(1));
  });
});
