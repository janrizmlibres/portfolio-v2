import { describe, expect, it } from "vitest";
import { MeshPhysicalMaterial, MeshStandardMaterial, Texture, Vector2 } from "three";
import { FINISHES, finished, panelTones, surfaceOf, weave, TONES } from "./finish";

describe("surfaceOf: what each of the hardware's surfaces becomes in a finish, by its material's name", () => {
  it("knows the finishes in use alone: the station's cloth (settled 2026-10-11) and the relay's metal", () => {
    expect(Object.keys(FINISHES).sort()).toEqual(["cloth", "metal"]);
  });

  it("turns the station's structure and fittings to metal in the cloth finish, as the metal one does, and leaves its handrails and windows", () => {
    for (const n of ["aluminium plain", "aluminium", "dark metal", "black anodised", "gold foil", "silver foil"]) {
      expect(surfaceOf("cloth", n)?.metalness).toBeGreaterThan(0.5);
      expect(surfaceOf("cloth", n)).toEqual(surfaceOf("metal", n));
    }
    for (const n of ["window glass", "handrail"]) expect(surfaceOf("cloth", n)).toBeNull();
  });

  it("turns the blankets to satin aluminium under a clear coat in the metal finish, as Tycho's shells are", () => {
    const hull = surfaceOf("metal", "mmod blanket")!;
    expect(hull.metalness).toBe(1);
    expect(hull.clearcoat).toBeGreaterThan(0.5);
    expect(surfaceOf("metal", "aluminium plain")).toEqual(surfaceOf("cloth", "aluminium plain"));
  });

  it("makes the rest real in the cloth finish, not metal: the blankets beta cloth, the radiators glossy white, the cells thin-film", () => {
    const cloth = surfaceOf("cloth", "mmod blanket")!;
    // cloth, not metal: its own quilted maps, a soft sheen, each panel its own white
    expect(cloth.metalness).toBe(0);
    expect(cloth.keepMaps).toBe(true);
    expect(cloth.color).toBeUndefined();
    expect(cloth.sheen?.roughness).toBeGreaterThan(0.3);
    expect(cloth.weave).toBe(true);
    const rad = surfaceOf("cloth", "radiator")!;
    expect(rad.metalness).toBe(0);
    expect(rad.keepMaps).toBe(true);
    expect(rad.roughness).toBeLessThan(cloth.roughness);
    const cells = surfaceOf("cloth", "solar cells")!;
    expect(cells.keepMaps).toBe(true);
    expect(cells.iridescence?.ior).toBeGreaterThan(1);
  });

  it("reads a part's material by its name before the part (the relay's are named per part)", () => {
    expect(surfaceOf("metal", "mmod blanket / ringA")).toEqual(surfaceOf("metal", "mmod blanket"));
    expect(surfaceOf("cloth", "gold foil / frame")).toEqual(surfaceOf("cloth", "gold foil"));
  });

  it("never touches what glows: the emitters, the core, the windows' light", () => {
    for (const f of ["cloth", "metal"] as const) for (const n of ["emitter coil 0", "core", "visitor window", "visitor strobe"]) expect(surfaceOf(f, n)).toBeNull();
  });
});

describe("finished: a material in its finish", () => {
  it("becomes a physical material reflecting the studio, keeping its name and its baked occlusion", () => {
    const ao = new Texture(), env = new Texture();
    const src = new MeshStandardMaterial({ name: "mmod blanket / ringA", map: new Texture(), aoMap: ao });
    const m = finished(src, surfaceOf("metal", src.name)!, env);
    expect(m).toBeInstanceOf(MeshPhysicalMaterial);
    expect(m.name).toBe("mmod blanket / ringA");
    expect(m.aoMap).toBe(ao);
    expect(m.envMap).toBe(env);
    expect(m.clearcoat).toBeGreaterThan(0.5);
    // a clean panel: its quilting goes with its blanket
    expect(m.map).toBeNull();
  });

  it("makes a blanket beta cloth: its own colour, quilting and roughness maps, its quilts puffed up, a soft sheen, marked to be woven", () => {
    const color = new Texture(), normal = new Texture(), rough = new Texture();
    const src = new MeshStandardMaterial({ name: "mmod blanket", map: color, normalMap: normal, roughnessMap: rough, normalScale: new Vector2(1, 1) });
    const m = finished(src, surfaceOf("cloth", src.name)!, new Texture());
    expect([m.map, m.normalMap, m.roughnessMap]).toEqual([color, normal, rough]);
    expect(m.normalScale.x).toBeGreaterThan(1);
    expect(m.sheen).toBeGreaterThan(0);
    expect(m.metalness).toBe(0);
    expect(m.userData.weave).toBe(true);
  });

  it("gives the solar cells a thin film over their own grid, keeping the grid's metal", () => {
    const metal = new Texture();
    const src = new MeshStandardMaterial({ name: "solar cells", map: new Texture(), metalnessMap: metal });
    const m = finished(src, surfaceOf("cloth", src.name)!, new Texture());
    expect(m.iridescence).toBeGreaterThan(0);
    expect(m.iridescenceThicknessRange[1]).toBeGreaterThan(m.iridescenceThicknessRange[0]);
    expect(m.metalnessMap).toBe(metal);
    expect(m.userData.weave).toBeUndefined();
  });

  it("keeps foil's own maps, so it glints in its crinkles", () => {
    const rough = new Texture(), normal = new Texture(), color = new Texture();
    const src = new MeshStandardMaterial({ name: "gold foil", map: color, roughnessMap: rough, normalMap: normal });
    const m = finished(src, surfaceOf("cloth", "gold foil")!, new Texture());
    expect([m.map, m.roughnessMap, m.normalMap]).toEqual([color, rough, normal]);
  });
});

describe("panelTones: each quilted panel its own white", () => {
  const { w, h } = TONES;
  const t = panelTones();
  const at = (c: number, r: number) => { const i = (((r % h) + h) % h) * w + (((c % w) + w) % w); return [t[i * 3]!, t[i * 3 + 1]!, t[i * 3 + 2]!]; };
  const lum = (x: number[]) => 0.2126 * x[0]! + 0.7152 * x[1]! + 0.0722 * x[2]!;

  it("never gives two touching panels the same white, across the table's wrap too (rows are staggered, so diagonals touch)", () => {
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++)
      for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const) {
        const a = at(c, r), b = at(c + dc, r + dr);
        expect([c, r, dc, dr, Math.max(...a.map((x, k) => Math.abs(x - b[k]!))) > 0.012]).toEqual([c, r, dc, dr, true]);
      }
  });

  it("varies them as aged cloth does, about the blanket's own white: some newer and brighter, some yellowed, some greyer", () => {
    const all = Array.from({ length: w * h }, (_, i) => at(i % w, Math.floor(i / w)));
    const L = all.map(lum), mean = L.reduce((a, b) => a + b) / L.length, sd = Math.sqrt(L.reduce((a, b) => a + (b - mean) ** 2, 0) / L.length);
    expect(Math.abs(mean - 1)).toBeLessThan(0.02);
    expect(sd).toBeGreaterThan(0.025);
    expect(sd).toBeLessThan(0.07);
    for (const x of all) for (const k of x) { expect(k).toBeGreaterThan(0.8); expect(k).toBeLessThan(1.1); }
    // yellowed: blue down against red
    expect(all.filter((x) => x[0]! - x[2]! > 0.04).length).toBeGreaterThan(w * h * 0.1);
    expect(all.filter((x) => x[2]! >= x[0]!).length).toBeGreaterThan(w * h * 0.1);
  });

  it("is the same every load", () => {
    expect(panelTones()).toEqual(t);
  });
});

describe("weave: the cloth's own patch", () => {
  it("runs after the patches before it, tones each panel from the table and dirties the crevices, under its own program key", () => {
    const m = new MeshPhysicalMaterial({ normalMap: new Texture() });
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", "// before"); };
    m.customProgramCacheKey = () => "neutral-out";
    const tones = new Texture();
    weave(m, tones);
    const sh = { uniforms: {} as Record<string, { value: unknown }>, vertexShader: "", fragmentShader: "void main() {\n#include <map_fragment>\n#include <dithering_fragment>\n}" };
    m.onBeforeCompile(sh as never, null as never);
    expect(sh.fragmentShader).toContain("// before");
    expect(sh.fragmentShader).toContain("uTones");
    expect(sh.uniforms.uTones!.value).toBe(tones);
    expect(m.customProgramCacheKey()).toBe("neutral-out+weave");
  });
});
