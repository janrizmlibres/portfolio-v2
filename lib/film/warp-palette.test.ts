import { describe, expect, it } from "vitest";
import { oklchOf, WARP_BASE, warpPalette } from "./warp-palette";

const HUES = { hero: 274, about: 320, work: 210, projects: 256, contact: 248 };
const hueGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const hex = (c: readonly number[]) => c.map((x) => Math.round(x * 255));

describe("warpPalette: the warp's fire and gas in the destination's hue", () => {
  it("turns the whole palette round the hue circle, its accent to the destination's hue, keeping each colour's lightness", () => {
    const turn0 = oklchOf(WARP_BASE.accent)[2];
    for (const hue of Object.values(HUES)) {
      const p = warpPalette(hue);
      expect(hueGap(oklchOf(p.accent)[2], hue)).toBeLessThan(1.5);
      for (const name of Object.keys(WARP_BASE) as Array<keyof typeof WARP_BASE>) {
        const [L0, C0, h0] = oklchOf(WARP_BASE[name]), [L, C, h] = oklchOf(p[name]);
        expect(L).toBeCloseTo(L0, 2);
        // as much of its chroma as the screen can show at that lightness and hue, never more
        expect(C).toBeLessThanOrEqual(C0 + 1e-3);
        // the ember a little redder than the accent and the glow a little yellower, as in the orange
        if (C > 0.02) expect(hueGap(h, h0 + hue - turn0)).toBeLessThan(1.5);
        for (const x of p[name]) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(1); }
      }
      expect(oklchOf(p.accent)[0]).toBeGreaterThan(oklchOf(p.ember)[0] + 0.3);
    }
  });

  it("keeps the fire vivid in every region's hue", () => {
    for (const hue of Object.values(HUES)) expect(oklchOf(warpPalette(hue).accent)[1]).toBeGreaterThan(0.08);
  });

  it("is the orange it was at the orange's own hue", () => {
    const [, , h] = oklchOf(WARP_BASE.accent), p = warpPalette(h);
    expect(hex(p.accent)).toEqual(hex(WARP_BASE.accent));
    expect(hex(p.ember)).toEqual(hex(WARP_BASE.ember));
  });
});
