import { describe, expect, it } from "vitest";
import { SWAY, swayAt } from "./sway";

const W = 1440,
  H = 900;

describe("the wake-up's sway: the pointer swings the camera round him a few degrees at most", () => {
  it("holds still with the pointer at the centre", () => {
    expect(swayAt(W / 2, H / 2, W, H)).toEqual({ az: 0, el: 0 });
  });

  it("swings the camera right with the pointer right, and left with it left, the most at the edges", () => {
    expect(swayAt(W, H / 2, W, H)).toEqual({ az: SWAY.az, el: 0 });
    expect(swayAt(0, H / 2, W, H)).toEqual({ az: -SWAY.az, el: 0 });
  });

  it("raises the camera with the pointer up, and lowers it with the pointer down", () => {
    expect(swayAt(W / 2, 0, W, H)).toEqual({ az: 0, el: SWAY.el });
    expect(swayAt(W / 2, H, W, H)).toEqual({ az: 0, el: -SWAY.el });
  });

  it("moves in proportion between the centre and the edges", () => {
    const s = swayAt(W * 0.75, H * 0.25, W, H);
    expect(s.az).toBeCloseTo(SWAY.az / 2);
    expect(s.el).toBeCloseTo(SWAY.el / 2);
  });

  it("goes no further than the edges, wherever the pointer is reported", () => {
    expect(swayAt(W + 500, -300, W, H)).toEqual({ az: SWAY.az, el: SWAY.el });
  });

  it("is about 4° across and 2° up and down", () => {
    expect(SWAY.az).toBeCloseTo((4 * Math.PI) / 180, 2);
    expect(SWAY.el).toBeCloseTo((2 * Math.PI) / 180, 2);
  });
});
