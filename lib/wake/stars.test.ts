import { describe, expect, it } from "vitest";
import { band, cluster, galaxies, starfield } from "./stars";

describe("the stage's stars: a sparse, still field behind him on the black", () => {
  it("is the same on every load", () => {
    expect(starfield(1440, 900)).toEqual(starfield(1440, 900));
  });

  it("is sparse: about one star per patch of the frame, fewer on a phone", () => {
    const wide = starfield(1440, 900), phone = starfield(390, 844);
    expect(wide.length).toBe(Math.round((1440 * 900) / 7500));
    expect(phone.length).toBeLessThan(wide.length / 3);
  });

  it("stays inside the frame", () => {
    for (const s of starfield(1440, 900)) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1440);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(900);
    }
  });

  it("is few bright and many faint, as the sky's own stars are", () => {
    const all = starfield(1440, 900);
    const bright = all.filter((s) => s.a > 0.6).length, faint = all.filter((s) => s.a < 0.3).length;
    expect(bright).toBeGreaterThan(0);
    expect(bright / all.length).toBeLessThan(0.2);
    expect(faint / all.length).toBeGreaterThan(0.4);
  });

  it("draws every star small and sharp: under two pixels across", () => {
    for (const s of starfield(1440, 900)) expect(s.r).toBeLessThan(1);
  });
});

describe("the richer stage sky: the Milky Way, galaxies and a cluster", () => {
  const S = 1800;

  it("crosses the frame with one band of the Milky Way, its stars crowding to its line", () => {
    const b = band(S, S);
    expect(b.stars.length).toBeGreaterThan(1500);
    const off = b.stars.map((s) => Math.abs((s.x - b.x) * Math.sin(b.angle) - (s.y - b.y) * Math.cos(b.angle))).sort((p, q) => p - q);
    expect(off[Math.floor(off.length / 2)]!).toBeLessThan(b.width);
    for (const s of b.stars) expect(s.a).toBeLessThan(0.45);
  });

  it("holds a few distant galaxies, one of them a larger spiral seen edge on", () => {
    const g = galaxies(S, S);
    expect(g.length).toBeGreaterThanOrEqual(3);
    expect(g.length).toBeLessThanOrEqual(6);
    expect(g.filter((x) => x.kind === "edge")).toHaveLength(1);
    const edge = g.find((x) => x.kind === "edge")!;
    for (const x of g) if (x !== edge) expect(x.size).toBeLessThan(edge.size);
  });

  it("gathers a cluster's stars tightly round its middle", () => {
    const c = cluster(S, S);
    expect(c.stars.length).toBeGreaterThanOrEqual(20);
    for (const s of c.stars) expect(Math.hypot(s.x - c.x, s.y - c.y)).toBeLessThan(c.radius * 3);
  });

  it("is the same on every load", () => {
    expect(band(S, S)).toEqual(band(S, S));
    expect(galaxies(S, S)).toEqual(galaxies(S, S));
    expect(cluster(S, S)).toEqual(cluster(S, S));
  });
});
