/**
 * The voyage's hardware in the finish Tycho settled on, metallic to match the UI: real metals that reflect clean studio softboxes, satin aluminium under a
 * clear coat, dark anodised titanium, foil that catches the light in its crinkles. Tried on the relay and the ring ship.
 *
 * In black space a metal reflects black, which is why the hardware's metals were made mostly diffuse. Here they
 * reflect a studio instead: a dark dome with a broad softbox where the scene's key light is, a tall strip off to one
 * side and a dim one behind, so a turning ring carries a strip of light round it, as his helmet does. The dome stays
 * near black, so the shadow side stays deep.
 *
 * Each finish is a table from a material's name (as the Blender builds name them, before any " / part") to what it
 * becomes; a name it doesn't list keeps its material. Both turn the structure and fittings to metal (`FITTINGS`):
 * - `metal` (the relay): the blankets too, as satin aluminium hull panels under a clear coat;
 * - `cloth` (the station, settled 2026-10-11): the rest made real rather than metal (Janriz, of metal on the fittings
 *   alone: "more realistic … without going full metal"): the blankets beta cloth (a soft sheen, the quilts puffed up,
 *   each panel its own white, grime where they're crowded; `weave`), the radiators glossy white, the solar cells under
 *   a thin film that shifts blue to violet as the ring turns.
 */
import {
  BackSide, BufferAttribute, Color, DataTexture, DoubleSide, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, NearestFilter, PlaneGeometry, PMREMGenerator,
  RGBAFormat, Scene, SphereGeometry, UnsignedByteType, Vector3, type Material, type MeshStandardMaterial, type Texture, type WebGLRenderer,
} from "three";

export type Surface = {
  /** a base colour in place of its own map and colour (display hex), or keep its own */
  color?: string;
  metalness: number;
  roughness: number;
  /** keep its roughness and normal maps (foil's crinkles), else a clean surface */
  keepMaps?: boolean;
  /** keep its metalness map too (a solar cell's silver fingers); foil's packs its roughness there, so it doesn't */
  keepMetal?: boolean;
  /** its normal map this much stronger (the quilts puffed up) */
  normalScale?: number;
  /** a fabric's sheen: its colour and how soft */
  sheen?: { color: string; roughness: number };
  /** a thin film over it: its index and its thickness range (nm) */
  iridescence?: { ior: number; thickness: [number, number] };
  /** each quilted panel its own white, and grime where it's crowded (`weave`, applied with the scene's own patches) */
  weave?: true;
  clearcoat?: number;
  clearcoatRoughness?: number;
  /** how strongly it reflects the studio */
  env: number;
};
export type FinishName = "metal" | "cloth";

const SATIN: Surface = { color: "#c4c8ce", metalness: 1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, env: 1.5 };
const BRUSHED: Surface = { color: "#b9bdc3", metalness: 1, roughness: 0.38, env: 1.4 };
const TITANIUM: Surface = { color: "#5a5d63", metalness: 1, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.1, env: 1.4 };
const ANODISED: Surface = { color: "#1c1d21", metalness: 0.8, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.15, env: 0.8 };
const FOIL_GOLD: Surface = { metalness: 1, roughness: 0.35, keepMaps: true, env: 1.6 };
const FOIL_SILVER: Surface = { metalness: 1, roughness: 0.3, keepMaps: true, env: 1.6 };
const PAINT: Surface = { metalness: 0, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.08, env: 0.6 };
/** beta cloth: its own map, quilting and roughness (about 0.72), the quilts puffed up (their wrinkles showing), a soft sheen */
const BETA_CLOTH: Surface = { metalness: 0, roughness: 1, keepMaps: true, normalScale: 3, sheen: { color: "#3a3936", roughness: 0.55 }, env: 0.2, weave: true };
/** a radiator's white coating: its ribs and seams, glossier than the cloth round it */
const RADIATOR: Surface = { metalness: 0, roughness: 0.6, keepMaps: true, clearcoat: 0.25, clearcoatRoughness: 0.2, env: 0.45 };
/** solar cells under cover glass: their own grid and silver fingers, a thin film over them */
const CELLS: Surface = { metalness: 1, roughness: 1, keepMaps: true, keepMetal: true, iridescence: { ior: 1.35, thickness: [260, 420] }, env: 1 };

/** the structure and fittings, in metal in either finish */
const FITTINGS: Record<string, Surface> = {
  "aluminium plain": BRUSHED,
  aluminium: BRUSHED,
  "dark metal": TITANIUM,
  "black anodised": ANODISED,
  "gold foil": FOIL_GOLD,
  "silver foil": FOIL_SILVER,
  "grey paint": PAINT,
  "visitor dark": TITANIUM,
  "visitor white": PAINT,
};
export const FINISHES: Record<FinishName, Record<string, Surface>> = {
  metal: { ...FITTINGS, "mmod blanket": SATIN, radiator: PAINT },
  cloth: { ...FITTINGS, "mmod blanket": BETA_CLOTH, radiator: RADIATOR, "solar cells": CELLS },
};

/** What a material becomes under `finish`, by its name ("gold foil / ringA" is "gold foil"), or null to keep it. */
export function surfaceOf(finish: FinishName, materialName: string): Surface | null {
  return FINISHES[finish][materialName.split(" / ")[0]!.trim()] ?? null;
}

/**
 * The studio a finish reflects, prefiltered: a dark dome (a little lighter overhead, by `up`), a broad softbox towards
 * the key light (`toKey`), a tall strip at right angles to it and a dim box behind, as Tycho's softboxes are set.
 */
export function studio(renderer: WebGLRenderer, toKey: Vector3, up = new Vector3(0, 1, 0)): { texture: Texture; dispose(): void } {
  const scene = new Scene();
  const dome = new SphereGeometry(20, 32, 16), pos = dome.getAttribute("position"), tone = new Float32Array(pos.count * 3);
  const u = up.clone().normalize(), p = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    const h = p.fromBufferAttribute(pos, i).normalize().dot(u), k = 0.025 + 0.07 * Math.max(0, h) + 0.1 * Math.max(0, h) ** 2;
    tone.set([k, k, k * 1.1], i * 3);
  }
  dome.setAttribute("color", new BufferAttribute(tone, 3));
  const owned: Array<{ dispose(): void }> = [dome];
  const domeMat = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  owned.push(domeMat);
  scene.add(new Mesh(dome, domeMat));
  const K = toKey.clone().normalize(), side = new Vector3().crossVectors(K, u).normalize();
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  const box = (w: number, h: number, dir: Vector3, k: number) => {
    const g = new PlaneGeometry(w, h), m = new MeshBasicMaterial({ color: new Color(k, k, k), side: DoubleSide });
    owned.push(g, m);
    const o = new Mesh(g, m);
    o.position.copy(dir.clone().normalize().multiplyScalar(4));
    o.lookAt(0, 0, 0);
    scene.add(o);
  };
  box(3.6, 2, K.clone().addScaledVector(u, 0.25), 6);
  box(0.6, 3.4, side.clone().addScaledVector(K, 0.2), 4);
  box(0.5, 2.8, side.clone().negate().addScaledVector(K, -0.6).addScaledVector(u, 0.3), 2.2);
  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();
  owned.forEach((o) => o.dispose());
  return { texture: rt.texture, dispose: () => rt.dispose() };
}

/**
 * `mat` in `surface`: a physical material (for the clear coat) keeping the original's maps where the surface keeps
 * them, its occlusion and its name, reflecting `env`. The caller passes it through the scene's own output after.
 */
export function finished(mat: MeshStandardMaterial, s: Surface, env: Texture): MeshPhysicalMaterial {
  const m = new MeshPhysicalMaterial({
    name: mat.name,
    color: s.color ? new Color(s.color) : mat.color.clone(),
    map: s.color ? null : mat.map,
    metalness: s.metalness,
    roughness: s.roughness,
    roughnessMap: s.keepMaps ? mat.roughnessMap : null,
    metalnessMap: s.keepMetal ? mat.metalnessMap : null,
    normalMap: s.keepMaps ? mat.normalMap : null,
    normalScale: mat.normalScale.clone().multiplyScalar(s.normalScale ?? 1),
    aoMap: mat.aoMap,
    aoMapIntensity: mat.aoMapIntensity,
    clearcoat: s.clearcoat ?? 0,
    clearcoatRoughness: s.clearcoatRoughness ?? 0,
    sheen: s.sheen ? 1 : 0,
    sheenColor: new Color(s.sheen?.color ?? 0),
    sheenRoughness: s.sheen?.roughness ?? 1,
    iridescence: s.iridescence ? 1 : 0,
    iridescenceIOR: s.iridescence?.ior ?? 1.3,
    iridescenceThicknessRange: s.iridescence?.thickness ?? [100, 400],
    envMap: env,
    envMapIntensity: s.env,
    side: mat.side,
    transparent: mat.transparent,
    opacity: mat.opacity,
  });
  if (s.weave) m.userData.weave = true;
  return m;
}

/** The panel tones' table: so many panels round and along, repeating past that (a module is fewer round). */
export const TONES = { w: 32, h: 16 };
/** a tone's range: what a byte of the table spans */
const TONE_LO = 0.8, TONE_SPAN = 0.3;

/**
 * Each quilted panel's white, as a multiplier on the blanket's own (rgb, row by row): beta cloth ages unevenly, so a
 * real hull is a patchwork. About a third as it was, a quarter yellowed (warmer, a little darker), a fifth newer
 * (brighter, a touch cool), a fifth greyer; no two touching panels alike, across the table's wrap too (rows are
 * staggered by half a panel, so a panel touches the two above it and the two below).
 */
export function panelTones(): Float32Array {
  const { w, h } = TONES, out = new Float32Array(w * h * 3);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const roll = (i: number) => {
    const k = rnd(), u = rnd();
    let v: number, warm: number, cool: number;
    if (k < 0.25) { v = 0.98 - 0.04 * u; warm = 0.05 + 0.04 * rnd(); cool = 0; }
    else if (k < 0.45) { v = 1.03 + 0.03 * u; warm = 0; cool = 0.01; }
    else if (k < 0.65) { v = 0.96 - 0.04 * u; warm = 0; cool = 0.005 + 0.01 * rnd(); }
    else { v = 0.98 + 0.04 * u; warm = 0.02 * rnd(); cool = 0; }
    out.set([v * (1 + 0.35 * warm), v * (1 + 0.1 * warm), v * (1 - 0.9 * warm + cool)], i * 3);
  };
  const idx = (c: number, r: number) => (((r % h) + h) % h) * w + (((c % w) + w) % w);
  const apart = (a: number, b: number) => Math.max(...[0, 1, 2].map((k) => Math.abs(out[a * 3 + k]! - out[b * 3 + k]!))) > 0.016;
  for (let i = 0; i < w * h; i++) roll(i);
  // re-roll any panel too like one it touches, until none is
  for (let pass = 0; pass < 50; pass++) {
    let clash = false;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++)
      for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const)
        if (!apart(idx(c, r), idx(c + dc, r + dr))) { roll(idx(c + dc, r + dr)); clash = true; }
    if (!clash) break;
  }
  // about the blanket's own white
  let L = 0;
  for (let i = 0; i < w * h; i++) L += 0.2126 * out[i * 3]! + 0.7152 * out[i * 3 + 1]! + 0.0722 * out[i * 3 + 2]!;
  const k = (w * h) / L;
  for (let i = 0; i < out.length; i++) out[i] = Math.min(TONE_LO + TONE_SPAN, Math.max(TONE_LO, out[i]! * k));
  return out;
}

/** The panel tones as a table the cloth's shader reads (a byte a channel, across `TONE_LO` to `TONE_LO + TONE_SPAN`). */
export function panelToneTexture(): DataTexture {
  const t = panelTones(), data = new Uint8Array((t.length / 3) * 4);
  for (let i = 0; i < t.length / 3; i++) {
    for (let k = 0; k < 3; k++) data[i * 4 + k] = Math.round(((t[i * 3 + k]! - TONE_LO) / TONE_SPAN) * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, TONES.w, TONES.h, RGBAFormat, UnsignedByteType);
  tex.name = "panel tones";
  tex.magFilter = tex.minFilter = NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The cloth's own patch on `m` (chaining the patches it has, under its own program key): each quilted panel toned from
 * `tones`, found from the quilting's coordinates as the blanket's maps lay it (`tex.py`: four panels across a tile and
 * two down, alternate rows staggered by half a panel), and grime where the baked occlusion says the cloth is crowded:
 * round hatches, berthing rings and fittings.
 */
export function weave<M extends Material>(m: M, tones: Texture): M {
  const before = m.onBeforeCompile, key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    before.call(m, sh, r);
    sh.uniforms.uTones = { value: tones };
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform sampler2D uTones;\nvoid main() {")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        #ifdef USE_NORMALMAP
        {
          vec2 q = vNormalMapUv * vec2(4.0, 2.0);
          float row = floor(q.y), col = floor(q.x + mod(row, 2.0) * 0.5);
          vec2 size = vec2(${TONES.w}.0, ${TONES.h}.0);
          diffuseColor.rgb *= ${TONE_LO.toFixed(2)} + texture2D(uTones, (mod(vec2(col, row), size) + 0.5) / size).rgb * ${TONE_SPAN.toFixed(2)};
        }
        #endif
        #ifdef USE_AOMAP
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.84, 0.8, 0.72), 0.8 * smoothstep(0.95, 0.5, texture2D(aoMap, vAoMapUv).r));
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `${key}+weave`;
  return m;
}
