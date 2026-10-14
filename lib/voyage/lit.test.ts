import { describe, expect, it } from "vitest";
import { KEY, matchLights, nightFill } from "./lit";

describe("matchLights: three's lights, set to light a modelled body at the key's and fill's strengths", () => {
  // three's diffuse is albedo / π times the light that reaches the surface
  const lambert = (albedo: number, irradiance: number) => (albedo / Math.PI) * irradiance;
  const L = matchLights();

  it("gives his star's light the same strength", () => {
    for (const ndl of [0.2, 0.7, 1]) expect(lambert(0.6, ndl * L.key)).toBeCloseTo(0.6 * ndl * KEY.sun, 12);
  });

  it("fills the night side brighter on what faces up, never black on what faces down", () => {
    const fill = 0.3;
    for (const ny of [-1, 0, 0.5, 1]) {
      const hemi = L.ground * fill + (L.sky - L.ground) * fill * (0.5 + 0.5 * ny);
      expect(lambert(0.6, hemi)).toBeCloseTo(0.6 * fill * KEY.fill * (0.55 + 0.45 * ny), 12);
    }
  });
});

describe("nightFill: the region's light on a night side", () => {
  const plum: [number, number, number] = [0.2, 0.12, 0.22];

  it("is half the region's hue and half grey, in linear light: a dark slate, not the hue itself", () => {
    const [r, g, b] = nightFill(plum);
    const lin = plum.map((c) => c ** 2.2), grey = (lin[0]! + lin[1]! + lin[2]!) / 3;
    expect(r).toBeCloseTo((lin[0]! + grey) * 3, 12);
    expect(g).toBeCloseTo((lin[1]! + grey) * 3, 12);
    expect(b).toBeCloseTo((lin[2]! + grey) * 3, 12);
    // the hue is still there, over a grey floor: the channels differ by what the tint's do
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeCloseTo((Math.max(...lin) - Math.min(...lin)) * 3, 12);
  });

  it("brightens where a body sits in a bright cloud", () => {
    expect(nightFill(plum, 5)[0]).toBeCloseTo(nightFill(plum)[0] * 5, 12);
  });

  it("is black only where the region's light is", () => {
    expect(nightFill([0, 0, 0])).toEqual([0, 0, 0]);
    expect(Math.min(...nightFill([0.05, 0.05, 0.08]))).toBeGreaterThan(0);
  });
});
