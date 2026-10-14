import { describe, expect, it } from "vitest";
import { MeshStandardMaterial } from "three";
import { fadeMaterial, fadePair } from "./fade";

describe("a material that fades without recompiling (fadePair)", () => {
  it("is opaque while it stands, and see-through at its opacity while it fades", () => {
    const p = fadePair(new MeshStandardMaterial());
    const solid = p.at(1);
    expect(solid.transparent).toBe(false);
    const half = p.at(0.5);
    expect(half.transparent).toBe(true);
    expect(half.opacity).toBeCloseTo(0.5, 6);
    expect(half).not.toBe(solid);
  });

  it("never flags either material for an update, however often the fade crosses whole", () => {
    const p = fadePair(new MeshStandardMaterial());
    const [a, b] = p.both;
    const va = a.version, vb = b.version;
    for (let i = 0; i < 200; i++) p.at(i % 2 ? 1 : 0.998);
    expect(a.version).toBe(va);
    expect(b.version).toBe(vb);
  });

  it("keeps both of its materials' shaders the same as the one it was made from", () => {
    const m = new MeshStandardMaterial();
    m.customProgramCacheKey = () => "patched";
    const p = fadePair(m);
    for (const x of p.both) expect(x.customProgramCacheKey()).toBe("patched");
  });
});

describe("a material faded in place (fadeMaterial)", () => {
  it("draws see-through at its opacity while it fades and opaque once whole, recompiling only as it crosses", () => {
    const m = new MeshStandardMaterial();
    const v0 = m.version;
    fadeMaterial(m, 1);
    expect([m.transparent, m.opacity, m.version]).toEqual([false, 1, v0]);
    fadeMaterial(m, 0.5);
    expect([m.transparent, m.opacity, m.version]).toEqual([true, 0.5, v0 + 1]);
    fadeMaterial(m, 0.4);
    expect([m.transparent, m.opacity, m.version]).toEqual([true, 0.4, v0 + 1]);
    fadeMaterial(m, 1);
    expect([m.transparent, m.opacity, m.version]).toEqual([false, 1, v0 + 2]);
  });
});
