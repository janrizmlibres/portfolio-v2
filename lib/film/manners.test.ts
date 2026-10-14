import { describe, expect, it } from "vitest";
import { passStyle } from "./manners";

describe("passStyle: a row passed by the dive", () => {
  const rest = { x: 300, y: 500 }, from = { x: 900, y: 450 };
  const span = [0.1, 0.6] as const;

  it("rests where it is, fully shown, before its window", () => {
    expect(passStyle(0, span, rest, from, false)).toEqual({ x: 0, y: 0, scale: 1, opacity: 1 });
  });

  it("is pushed out from the point the dive aims at, growing as it goes, the way the nearest stars stream past", () => {
    const a = passStyle(0.3, span, rest, from, false), b = passStyle(0.5, span, rest, from, false);
    // away from his star: it sits left of it and a little below, so it goes further left and down
    expect(a.x).toBeLessThan(0);
    expect(a.y).toBeGreaterThan(0);
    expect(b.x).toBeLessThan(a.x);
    expect(b.scale).toBeGreaterThan(a.scale);
    expect(a.scale).toBeGreaterThan(1);
    // it accelerates: the second half of the window carries it further than the first
    const mid = passStyle(0.35, span, rest, from, false), end = passStyle(0.6, span, rest, from, false);
    expect(Math.abs(end.x - mid.x)).toBeGreaterThan(Math.abs(mid.x));
  });

  it("fades only in the last part of its way, and is gone at the end of its window", () => {
    expect(passStyle(0.25, span, rest, from, false).opacity).toBe(1);
    expect(passStyle(0.5, span, rest, from, false).opacity).toBeLessThan(1);
    expect(passStyle(0.6, span, rest, from, false).opacity).toBe(0);
  });

  it("travels less and fades sooner on a phone, where the lockup sits below his star", () => {
    const land = passStyle(0.45, span, rest, from, false), port = passStyle(0.45, span, rest, from, true);
    expect(Math.abs(port.x)).toBeLessThan(Math.abs(land.x));
    expect(port.opacity).toBeLessThan(land.opacity);
  });

  it("comes back the same way when you scroll up: it's a function of the time alone", () => {
    expect(passStyle(0.42, span, rest, from, false)).toEqual(passStyle(0.42, span, rest, from, false));
    expect(passStyle(-1, span, rest, from, false)).toEqual(passStyle(0, span, rest, from, false));
  });
});
