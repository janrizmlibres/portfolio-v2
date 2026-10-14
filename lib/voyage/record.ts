/**
 * A record: one thin slate you can follow down the pipeline and on to Athena, whose face shows what it is at each stage
 * (Janriz picked it on 2026-10-13, over e-paper and etched quartz). Satin aluminium round black glass, its screen lit
 * under the glass: a white web page at Search, a record of fields in dark mode once the press has passed (some still
 * empty), the empty ones lit warm as it's enriched, and the screen going dark when it's a duplicate merged into its
 * twin or stored at Save. Each instance carries its state in `aS` (extracted 0..1, enriched 0..1, powered 0..1, which
 * layout 0..3).
 * Faces show layouts only (a short label, then a value broken into words; a page's bars and pictures), never text.
 * Its face is the plate's top (+y), 1 across and 1.6 long, 0.06 thick.
 */
import {
  DataTexture, ExtrudeGeometry, InstancedBufferAttribute, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, RGBAFormat,
  Shape, UnsignedByteType, type BufferGeometry, type InstancedMesh, type IUniform,
} from "three";
import { neutralOut, raw } from "./lit";

const W = 256, H = 410;

// ---------------------------------------------------------------- the slates' faces
/** the atlas: four layouts side by side, each a cell W wide, its face the top H rows of AH */
const CELLS = 4, AW = W * CELLS, AH = 512;

/**
 * The slates' faces as masks, one per channel: R a page's ink (on a white page), G a record's content (its labels, the
 * values it has, and the outlines of the ones it's missing), B the values it's missing (filled in as it's enriched),
 * A a page's pictures. Four of each, one a cell: a landing page, an article, a list of results and a profile with a
 * table, and the record each becomes.
 */
function slateAtlas(): DataTexture {
  const data = new Uint8Array(AW * AH * 4);
  const tex = new DataTexture(data, AW, AH, RGBAFormat, UnsignedByteType);
  if (typeof document !== "undefined") {
    const ch = [0, 1, 2, 3].map(() => {
      const cv = document.createElement("canvas");
      cv.width = AW;
      cv.height = AH;
      const g = cv.getContext("2d")!;
      g.fillStyle = "#000";
      g.fillRect(0, 0, AW, AH);
      return g;
    });
    const [ink, rec, miss, pic] = ch as [CanvasRenderingContext2D, CanvasRenderingContext2D, CanvasRenderingContext2D, CanvasRenderingContext2D];
    for (let k = 0; k < CELLS; k++) drawCell(k, ink, rec, miss, pic);
    const px = ch.map((g) => g.getImageData(0, 0, AW, AH).data);
    // packed upside down: a texture's first row is its bottom, so a face's top (the page's browser bar) is at v = 1
    for (let y = 0; y < AH; y++) {
      const src = (AH - 1 - y) * AW * 4, dst = y * AW * 4;
      for (let x = 0; x < AW; x++) for (let c = 0; c < 4; c++) data[dst + x * 4 + c] = px[c]![src + x * 4]!;
    }
  }
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

let shared: DataTexture | null = null;
/** the faces' atlas, drawn once and shared by every scene's records (one that disposes it has it uploaded again) */
export const recordAtlas = () => (shared ??= slateAtlas());

function drawCell(k: number, ink: CanvasRenderingContext2D, rec: CanvasRenderingContext2D, miss: CanvasRenderingContext2D, pic: CanvasRenderingContext2D) {
  const x0 = k * W, P = 12;
  let seed = 31 + k * 977;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const grey = (v: number) => { const c = Math.round(v * 255); return `rgb(${c},${c},${c})`; };
  const box = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, r = 0) => {
    g.fillStyle = grey(v);
    g.beginPath();
    g.roundRect(x0 + x, y, w, h, r);
    g.fill();
  };
  const outline = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, r = 2) => {
    g.strokeStyle = grey(v);
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(x0 + x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
    g.stroke();
  };
  /** a line of words: bars of random widths, to `w` wide (shorter on a paragraph's last line) */
  const words = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number) => {
    let at = x;
    while (at < x + w - 6) {
      const ww = Math.min(x + w - at, 8 + rnd() * 26);
      box(g, at, y, ww, h, v, 1);
      at += ww + 5;
    }
  };
  const para = (g: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, v: number, step = 9) => {
    for (let i = 0; i < n; i++) words(g, x, y + i * step, i === n - 1 ? w * (0.4 + 0.4 * rnd()) : w, 4, v);
  };

  // ---------------------------------------------------------------- the page: the browser's bar, its site's bar
  box(ink, 0, 0, W, 24, 0.16);
  for (let i = 0; i < 3; i++) { ink.fillStyle = grey(0.6); ink.beginPath(); ink.arc(x0 + 11 + i * 10, 12, 3, 0, Math.PI * 2); ink.fill(); }
  box(ink, 50, 6, 168, 12, 0, 6);
  box(ink, 60, 10, 70 + rnd() * 40, 4, 0.35, 2);
  box(ink, P, 34, 34, 10, 0.95, 2);
  for (let i = 0; i < 3; i++) box(ink, W - P - 28 - i * 34, 37, 24, 4, 0.55, 2);
  if (k === 0) {
    // a landing page: a picture across, a headline, a button, three cards
    box(pic, P, 54, W - 2 * P, 108, 1, 3);
    box(ink, P, 174, 176, 12, 1, 2);
    box(ink, P, 192, 120, 12, 1, 2);
    para(ink, P, 214, 200, 2, 0.55);
    box(ink, P, 238, 64, 16, 0.95, 8);
    for (let i = 0; i < 3; i++) {
      const cx = P + i * 79;
      box(pic, cx, 272, 70, 52, 1, 3);
      box(ink, cx, 330, 54, 6, 0.9, 1);
      para(ink, cx, 342, 70, 3, 0.5, 8);
    }
  } else if (k === 1) {
    // an article: a headline, its byline, a picture, paragraphs and a quote
    box(ink, P, 56, 210, 13, 1, 2);
    box(ink, P, 74, 150, 13, 1, 2);
    box(ink, P, 94, 80, 4, 0.5, 1);
    box(pic, P, 106, W - 2 * P, 92, 1, 3);
    para(ink, P, 210, W - 2 * P, 6, 0.6);
    box(ink, P, 268, 3, 34, 0.9);
    para(ink, P + 12, 270, W - 2 * P - 20, 3, 0.85, 11);
    para(ink, P, 314, W - 2 * P, 9, 0.6);
  } else if (k === 2) {
    // a list of results: a search box, then five results with a thumbnail each
    outline(ink, P, 52, W - 2 * P, 20, 0.6, 10);
    box(ink, P + 12, 60, 80, 4, 0.4, 2);
    for (let i = 0; i < 5; i++) {
      const y = 86 + i * 64;
      box(pic, P, y, 50, 50, 1, 3);
      box(ink, P + 60, y + 2, 120 + rnd() * 50, 7, 0.95, 1);
      box(ink, P + 60, y + 14, 70, 4, 0.45, 1);
      para(ink, P + 60, y + 26, W - 2 * P - 60, 2, 0.55, 8);
    }
  } else {
    // a profile: its picture, its name and lines, then a table
    box(pic, P, 56, 100, 100, 1, 4);
    box(ink, P + 112, 60, 110, 12, 1, 2);
    box(ink, P + 112, 78, 70, 5, 0.6, 1);
    para(ink, P + 112, 94, W - 2 * P - 112, 6, 0.55);
    for (let i = 0; i < 9; i++) {
      const y = 172 + i * 24;
      box(ink, P, y + 21, W - 2 * P, 1.5, 0.22);
      box(ink, P, y + 7, 46 + rnd() * 20, 5, 0.75, 1);
      words(ink, P + 96, y + 7, 60 + rnd() * 80, 5, 0.5);
    }
  }

  // ---------------------------------------------------------------- the record it becomes
  // its kind and id, a status light, a rule, then seven fields: a label and its value, or the outline of a value it's
  // missing (two or three of them, a different few on each)
  box(rec, P, 16, 44, 14, 0.9, 7);
  box(rec, P + 54, 21, 84, 5, 0.45, 2);
  rec.fillStyle = grey(0.9);
  rec.beginPath();
  rec.arc(x0 + W - P - 6, 23, 4.5, 0, Math.PI * 2);
  rec.fill();
  box(rec, P, 40, W - 2 * P, 1.5, 0.3);
  const missing = [[1, 4], [2, 5, 6], [0, 3], [3, 5, 6]][k]!;
  const vx = P + 78, vw = W - P - vx;
  for (let i = 0; i < 7; i++) {
    const y = 58 + i * 46;
    box(rec, P, y + 2, 34 + rnd() * 28, 6, 0.5, 2);
    const w = vw * (0.45 + 0.55 * rnd());
    if (missing.includes(i)) {
      outline(rec, vx - 5, y - 5, vw + 5, 20, 0.28, 3);
      words(miss, vx, y, w, 10, 1);
    } else {
      words(rec, vx, y, w, 10, 0.95);
      if (rnd() < 0.5) words(rec, vx, y + 16, w * 0.6, 6, 0.6);
    }
  }
  box(rec, P, 384, W - 2 * P, 1.5, 0.3);
  words(rec, P, 392, 110, 5, 0.35);
}

/** A plate 1 × 0.06 × 1.6, its corners rounded and its edges chamfered, so its rim catches the light. */
function slateGeometry(): BufferGeometry {
  const T = 0.06, bev = 0.012, r = 0.07, w = 0.5 - bev, l = 0.8 - bev, rr = r - bev;
  const s = new Shape();
  s.moveTo(-w + rr, -l);
  s.lineTo(w - rr, -l);
  s.quadraticCurveTo(w, -l, w, -l + rr);
  s.lineTo(w, l - rr);
  s.quadraticCurveTo(w, l, w - rr, l);
  s.lineTo(-w + rr, l);
  s.quadraticCurveTo(-w, l, -w, l - rr);
  s.lineTo(-w, -l + rr);
  s.quadraticCurveTo(-w, -l, -w + rr, -l);
  const geo = new ExtrudeGeometry(s, { depth: T - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 4 });
  // lying down: its thickness up (y), its length along z, centred
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(T - 2 * bev) / 2, 0);
  return geo;
}

// the face's state, per instance, and where the fragment is on the plate (object space)
const SLATE_VS_DECL = "attribute vec4 aS; varying vec4 vS; varying vec3 vSP; varying vec3 vSN;";
const SLATE_VS = "vS = aS; vSP = position; vSN = normal;";
const SLATE_FS_DECL = "uniform sampler2D uSlate; varying vec4 vS; varying vec3 vSP; varying vec3 vSN;";

/** the screen's inset from the plate's edge, across its width */
const BEZEL = 0.055;

/**
 * Where the fragment is on a slate: `face` (the top, 0 on its chamfer, sides and back) and `su` (on the screen, 0..1
 * across and along, 1 its top edge, the page's browser bar).
 */
const SLATE_WHERE = /* glsl */ `
  float face = smoothstep(0.82, 0.96, vSN.y);
  vec2 fu = vec2(vSP.x + 0.5, -vSP.z / 1.6 + 0.5);
  vec2 bz = vec2(${BEZEL.toFixed(3)}, ${(BEZEL / 1.6).toFixed(4)});
  vec2 su = (fu - bz) / (1.0 - 2.0 * bz);
`;

/**
 * What the screen shows, from `face`, `su` and the state `vS`: `inS` (inside the screen), `tx` (the atlas's masks
 * there), `rec` (how much of it the press has turned into a record, wiped in from the top edge), `scan` (the press's
 * line as it passes).
 */
const SCREEN = /* glsl */ `
  vec2 e2 = min(su, 1.0 - su);
  float aa = fwidth(su.x) + fwidth(su.y) + 1e-4;
  float inS = face * smoothstep(0.0, aa, min(e2.x, e2.y));
  vec2 sc = clamp(su, 0.0, 1.0);
  vec4 tx = texture2D(uSlate, vec2((vS.w + sc.x) / ${CELLS.toFixed(1)}, 1.0 - (1.0 - sc.y) * ${(H / AH).toFixed(4)}));
  float ext = vS.x, en = vS.y, on = vS.z;
  float edge = 1.0 - ext;
  float rec = ext > 0.999 ? 1.0 : step(0.001, ext) * smoothstep(edge - aa, edge + aa, su.y);
  float scan = ext > 0.001 && ext < 0.999 ? exp(-pow((su.y - edge) / 0.03, 2.0)) : 0.0;
  // a picture's colour, a different one for each layout, shading down it
  vec3 picC = mix(vec3(0.20, 0.36, 0.52), vec3(0.52, 0.40, 0.28), fract(vS.w * 0.37 + 0.15)) * (0.75 + 0.35 * sc.y);
`;

/**
 * the slate's surface and glow (`slateGlow`, added to its emitted light): satin aluminium round it, black glass over its
 * whole face, the screen lit under the glass (a web page, white with dark ink; then a record in dark mode, its fields in
 * cool light, the ones enriched in warm)
 */
const GLASS = /* glsl */ `
  ${SCREEN}
  diffuseColor.rgb = mix(vec3(0.80, 0.81, 0.83), vec3(0.010, 0.011, 0.014), face);
  metalnessFactor = mix(1.0, 0.0, face);
  roughnessFactor = mix(0.34, 0.06, face);
  vec3 page = mix(vec3(0.80, 0.81, 0.84) * (1.0 - 0.88 * tx.r), picC, tx.a) * 0.52;
  vec3 recC = vec3(0.003, 0.005, 0.009) + vec3(0.40, 0.60, 0.95) * tx.g * 0.62
    + vec3(1.0, 0.60, 0.28) * tx.b * en * (0.75 + 1.4 * en * (1.0 - en));
  slateGlow = (mix(page, recC, rec) + vec3(0.65, 0.82, 1.0) * scan * 0.9) * inS * on;
`;

/** The record's geometry, its material, and the patch that draws its face (to chain into a scene's own shading). */
export function recordSlate() {
  const geo = slateGeometry(), atlas = recordAtlas();
  const patch = (sh: { vertexShader: string; fragmentShader: string; uniforms: Record<string, IUniform> }) => {
    sh.uniforms.uSlate = { value: atlas };
    sh.vertexShader = sh.vertexShader
      .replace("void main() {", `${SLATE_VS_DECL}\nvoid main() {`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${SLATE_VS}`);
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", `${SLATE_FS_DECL}\nvoid main() {\nvec3 slateGlow = vec3(0.0);`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\n{${SLATE_WHERE}${GLASS}}`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += slateGlow;");
  };
  // on its own (the stream's records): through PBR Neutral, then its face; a scene chaining its own shading onto a
  // clone calls `patch` itself, as `neutralOut` replaces what was there
  const mat = neutralOut(new MeshStandardMaterial({ color: raw("#ffffff"), metalness: 0.9, roughness: 0.3 }));
  const neutral = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { neutral.call(mat, sh, r); patch(sh); };
  mat.customProgramCacheKey = () => "slate";
  return { geo, mat, patch, atlas };
}

export type RecordSlate = ReturnType<typeof recordSlate>;

/**
 * Patches `m` (chaining whatever `onBeforeCompile` it has) so a flat surface shows a finished record's screen under
 * black glass, as a slate's face does, laid out by its `uv` (0..1 across and along the record, 1 its top edge): every
 * field filled, its screen at `on` (a stored record's is low), in layout `cell` of the four. Its program cache key
 * gains a suffix.
 */
export function recordFace<M extends MeshStandardMaterial>(m: M, atlas: DataTexture, o: { on: number; cell: number }): M {
  const before = m.onBeforeCompile, key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    before.call(m, sh, r);
    sh.uniforms.uSlate = { value: atlas };
    sh.vertexShader = sh.vertexShader
      .replace("void main() {", "varying vec2 vRU;\nvoid main() {")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRU = uv;");
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform sampler2D uSlate; varying vec2 vRU;\nvoid main() {\nvec3 slateGlow = vec3(0.0);")
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        {
          vec4 vS = vec4(1.0, 1.0, ${o.on.toFixed(3)}, ${o.cell.toFixed(1)});
          float face = 1.0;
          vec2 bz = vec2(${(BEZEL * 0.6).toFixed(4)}, ${((BEZEL * 0.6) / 1.6).toFixed(4)});
          vec2 su = (vRU - bz) / (1.0 - 2.0 * bz);
          ${GLASS}
        }`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += slateGlow;");
  };
  m.customProgramCacheKey = () => `${key}+record`;
  return m;
}

/**
 * Gives an instanced mesh of slates its per-instance state (`aS`), each from `of(i)`: [extracted, enriched, powered];
 * its layout is the instance's, one of the atlas's four. The mesh's geometry must be its own (a clone).
 */
export function slateState(mesh: InstancedMesh, of: (i: number) => [number, number, number]) {
  const a = new InstancedBufferAttribute(new Float32Array(mesh.count * 4), 4);
  for (let i = 0; i < mesh.count; i++) a.setXYZW(i, ...of(i), i % CELLS);
  mesh.geometry.setAttribute("aS", a);
  return a;
}
