/**
 * The sky: the wiki drawn as the universe's stars, one per passage the agent can read, placed by meaning (PCA).
 * Drawn with plain three.js and rendered from a `gsap.ticker` listener, so GSAP is the only clock.
 *
 * Layers, back to front:
 * - the hero's light: the region's tint round the sky, falling to its space colour;
 * - the far galaxies: soft smudges at infinity, always dimmer than the faintest real star;
 * - the gas: puffs round each star and filaments along the links between neighbours in meaning, drawn at
 *   half the CSS size and composited, since it is soft anyway and costs per pixel. A puff the camera is inside
 *   (or nearly) fades and isn't drawn, so flying through the gas never washes out the frame;
 * - the threads: each star joined to its two nearest neighbours, and a page's passages chained. They show
 *   only round a hovered star and between stars the agent read, and one longer than about half the frame
 *   fades, so close stars never throw lines across the picture;
 * - the stars.
 *
 * Per-star state (heat = energy, lit = read by the agent, hover, twinkle) lives in a 128×1 float texture every layer
 * samples, so one GSAP tween on a star warms its core, its gas and its threads together. The film and the chat each
 * have their own pair: the film's timeline sets `heat` and `lit` (About's lines, his star), the chat's reading sets
 * `flare` and `read`, and the texture takes the larger of each, so neither ever overwrites or kills the other's tweens.
 *
 * A twinkling star scintillates as a real one does through air: its light is log-normal about its mean, flickering
 * mostly between 3 and 14 times a second, and its colours flicker a few hundredths of a second apart (the air bends
 * each a little differently), so it flashes faintly red and blue; the brighter instants throw its spikes further. The
 * hand sets how hard (0 still, 1 a full flare); it never moves under reduced motion.
 *
 * Colour carries meaning here (warmth is energy, white is what matters), so every colour is written as a display
 * value and nothing is tone mapped or converted on the way out: what's in LIGHT is what's on screen.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DataTexture,
  FloatType,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearSRGBColorSpace,
  MathUtils,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import gsap from "gsap";
import type { Rgb } from "./light";
import { seeded as rng, starMagnitude } from "./magnitude";
import { noise3 } from "./noise";
import type { Tier } from "./tier";
import { createGovernor } from "./governor";
import { lowerQuality } from "./tier";

type Vec3 = [number, number, number];
export type StarLayout = { version: number; layout: string; stars: { id: string; x: number; y: number; z: number; topic: string }[] };
export type Hit = { star: string; sim: number };
export type Pose = { pos: [number, number, number]; target: [number, number, number]; cx: number; cy: number; near: number; spread: number };

export const LIGHT = {
  star: "#dfe7ff", // a star at rest: cool white
  hot: "#fff6ea", // a star's core at full energy
  energy: "#ffa95a", // warmth = energy only; it cools back to white
  dust1: "#3a3aa8", // the gas: blue-violet
  dust2: "#177a8c", //          and a cold teal
  thread: "#aebbe6",
  galaxy: "#a9b4d4", // the far galaxies: grey-blue
  galaxy2: "#bdb3dc", //                  and pale lavender, never warm
};

const MAXS = 128; // state texture width: room for the sky to grow past its 93 stars
const FOV = 32;
const SKY_RADIUS = 0.9;
const DUST_SCALE = 0.5;

// hex read as raw display values: no sRGB → linear conversion, and nothing converts on the way out either
const col = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new Color().setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, LinearSRGBColorSpace);
};

function gauss(r: () => number) {
  let u = 0, v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// a quad of 4 corners in `position` (xy = -1..1), instanced
function quad() {
  const g = new InstancedBufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
const inst = (arr: Float32Array, n: number) => new InstancedBufferAttribute(arr, n);

const STATE_GLSL = /* glsl */ `
  uniform sampler2D uState;
  vec4 starState(float i) { return texture2D(uState, vec2((i + 0.5) / ${MAXS.toFixed(1)}, 0.5)); }`;

const bgVS = /* glsl */ `varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const bgFS = /* glsl */ `
  uniform vec3 uSpace, uTint; uniform vec2 uRes, uCenter; uniform float uSpread;
  varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 p = (vUv - uCenter) * vec2(uRes.x / uRes.y, 1.0);
    vec3 c = mix(uTint, uSpace, smoothstep(0.0, 1.0, length(p) / uSpread));
    c += (h(gl_FragCoord.xy) - 0.5) / 255.0;   // dither, so the dark falloff never bands
    gl_FragColor = vec4(c, 1.0);
  }`;

const galVS = /* glsl */ `
  uniform vec2 uRes; uniform float uDpr;
  attribute vec3 aDir; attribute vec4 aG;   // size css px, ellipticity, angle, brightness
  attribute vec2 aH;                         // spiral arms (0 none .. 1), tint
  varying vec2 vQ; varying vec4 vG; varying vec2 vH;
  void main() {
    // at "infinity": centred on the camera, so they never drift as the camera travels
    vec4 clip = projectionMatrix * viewMatrix * vec4(cameraPosition + aDir * 40.0, 1.0);
    if (clip.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    float hw = aG.x * 2.2 + 1.0;
    clip.xy += position.xy * hw * uDpr / uRes * 2.0 * clip.w;
    gl_Position = clip; vQ = position.xy * hw; vG = aG; vH = aH;
  }`;
const galFS = /* glsl */ `
  uniform vec3 uGal, uGal2, uStar; uniform float uGalGain;
  varying vec2 vQ; varying vec4 vG; varying vec2 vH;
  void main() {
    float c = cos(vG.z), s = sin(vG.z);
    vec2 q = mat2(c, -s, s, c) * vQ; q.y /= vG.y;
    float sz = vG.x * 0.5, r = length(q) / sz;
    float disc = exp(-r * r * 0.5) * 0.6, core = exp(-r * r * 3.0) * 0.55;
    // the few big ones get two arms wound round a bright core
    float arms = 0.5 + 0.5 * cos(2.0 * (atan(q.y, q.x) - 2.6 * log(r + 0.08)));
    disc *= mix(1.0, 0.5 + 0.8 * arms * smoothstep(0.15, 0.6, r), vH.x * 0.75);
    vec3 tint = mix(mix(uGal, uGal2, vH.y), uStar, core);
    gl_FragColor = vec4(tint * (disc + core) * vG.w * uGalGain, 1.0);
  }`;

const starVS = /* glsl */ `
  ${STATE_GLSL}
  uniform float uDpr, uNear, uTime; uniform vec2 uRes;
  attribute vec3 aPos; attribute vec2 aMeta;   // magnitude 0..1, star index
  varying vec2 vQ; varying float vMag, vNear, vHw, vFlash; varying vec4 vS; varying vec3 vTw;
  float hh(float n) { return fract(sin(n) * 43758.5453); }
  float vn(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hh(i), hh(i + 1.0), f) * 2.0 - 1.0; }
  // the log-amplitude of a star's light through air: three bands of smooth noise, most of it between 3 and 14 Hz
  float chi(float t, float s) { return 0.55 * vn(t * 3.1 + s) + 0.32 * vn(t * 7.3 + s * 1.7 + 11.0) + 0.2 * vn(t * 13.9 + s * 2.3 + 37.0); }
  void main() {
    vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
    vec4 st = starState(aMeta.y);
    float near = clamp(uNear / -mv.z, 0.55, 1.8), mag = aMeta.x;
    // the twinkle: each colour's gain this instant, log-normal about 1; red and blue lag and lead green a little
    vTw = vec3(1.0); vFlash = 0.0;
    if (st.a > 0.001) {
      float s = aMeta.y * 7.31, k = 2.0 * st.a, g = chi(uTime, s);
      vec3 c3 = mix(vec3(g), vec3(chi(uTime + 0.035, s), g, chi(uTime - 0.035, s)), 0.6);
      vTw = exp(c3 * k - 0.5 * (0.3 * k) * (0.3 * k));
      vFlash = max(0.0, dot(vTw, vec3(0.3, 0.5, 0.2)) - 1.0);
    }
    float spike = (smoothstep(0.62, 1.0, mag) * 22.0 + st.g * 26.0 + st.r * 58.0 + st.b * 8.0 + st.a * (36.0 + 60.0 * vFlash)) * near;
    float halo = (7.0 + mag * 7.0 + st.g * 10.0 + st.r * 26.0 + st.b * 3.0) * near;
    float hw = max(spike, halo) + 2.0;
    vec4 clip = projectionMatrix * mv;
    clip.xy += position.xy * hw * uDpr / uRes * 2.0 * clip.w;
    gl_Position = clip;
    vQ = position.xy * hw; vMag = mag; vS = st; vNear = near; vHw = hw;
  }`;
const starFS = /* glsl */ `
  uniform vec3 uStar, uEnergy, uHot; uniform float uRecede;
  varying vec2 vQ; varying float vMag, vNear, vHw, vFlash; varying vec4 vS; varying vec3 vTw;
  void main() {
    float r = length(vQ), mag = vMag, heat = vS.r, lit = vS.g, hov = vS.b, tw = vS.a;
    float depth = mix(0.5, 1.2, clamp((vNear - 0.55) / 0.9, 0.0, 1.0));   // far stars dimmer: the depth cue
    float bright = ((0.32 + 0.95 * mag) * depth + lit * 0.9 + heat * 1.3 + hov * 0.9) * (1.0 - uRecede * 0.55 * (1.0 - clamp(lit * 2.0, 0.0, 1.0)));
    float sc = (0.75 + 0.85 * mag + lit * 0.7 + heat * 1.1 + hov * 0.3) * vNear;
    float core = exp(-r * r / (2.0 * sc * sc));
    float hs = (2.2 + 2.6 * mag + lit * 3.0 + heat * 9.0 + hov * 1.5) * vNear;
    float halo = exp(-r / hs) * (0.09 + 0.22 * lit + 0.5 * heat + 0.12 * hov);
    float spikeAmt = 0.3 * smoothstep(0.62, 1.0, mag) * depth + 0.4 * lit + 0.7 * heat + tw * (0.2 + 0.6 * vFlash);
    float sp = 0.0;
    if (spikeAmt > 0.001) {
      float L = (smoothstep(0.62, 1.0, mag) * 16.0 + lit * 16.0 + heat * 40.0 + tw * (14.0 + 50.0 * vFlash) + 2.0) * vNear * 0.33;
      vec2 q = abs(vQ); float w = 0.55;
      sp = (exp(-q.y * q.y / (2.0 * w * w)) * exp(-q.x / L) + exp(-q.x * q.x / (2.0 * w * w)) * exp(-q.y / L)) * spikeAmt;
    }
    vec3 warm = mix(uStar, uEnergy, clamp(heat * 1.15, 0.0, 1.0));
    vec3 c = mix(warm, uHot, clamp(heat + lit * 0.4, 0.0, 1.0)) * core * bright + warm * (halo + sp) * (0.55 + bright * 0.45);
    c *= vTw;
    // hover: a thin ring round this passage and its page's other passages (an outline, not a colour)
    float rk = hov * 0.55;
    c += rk > 0.01 ? uStar * exp(-pow(r - 6.5 * vNear, 2.0) / 0.5) * rk : vec3(0.0);
    float edge = 1.0 - smoothstep(vHw - 2.5, vHw, max(abs(vQ.x), abs(vQ.y)));
    gl_FragColor = vec4(c * edge, 1.0);
  }`;

const dustVS = /* glsl */ `
  ${STATE_GLSL}
  uniform float uRecede;
  attribute vec3 aPi, aPj, aOff;   // stars i and j
  attribute vec4 aD;               // size (world), alpha, u along i → j, tint
  attribute vec2 aK;               // index i, index j
  varying vec2 vQ; varying float vA, vTint, vHeat, vLit, vHov;
  void main() {
    vec4 mv = modelViewMatrix * vec4(mix(aPi, aPj, aD.z) + aOff, 1.0);
    vec4 S = mix(starState(aK.x), starState(aK.y), aD.z);
    vQ = position.xy; vTint = aD.w; vHeat = S.r; vLit = S.g; vHov = S.b;
    vA = aD.y * (1.0 - uRecede * 0.6 * (1.0 - clamp(S.g * 2.0, 0.0, 1.0)));
    vA *= smoothstep(aD.x * 0.8, aD.x * 3.0, -mv.z);
    if (vA < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    mv.xy += position.xy * aD.x;
    gl_Position = projectionMatrix * mv;
  }`;
const dustFS = /* glsl */ `
  uniform vec3 uDust1, uDust2, uEnergy; uniform float uDustGain;
  varying vec2 vQ; varying float vA, vTint, vHeat, vLit, vHov;
  void main() {
    float d = dot(vQ, vQ);
    float a = exp(-d * 3.5) * (1.0 - smoothstep(0.75, 1.0, d));
    vec3 c = mix(uDust1, uDust2, smoothstep(0.38, 0.62, vTint));   // violet and teal regions, not an even mix
    c = mix(c, uEnergy, clamp(vHeat * 0.95, 0.0, 1.0));
    float boost = 1.0 + vLit * 1.4 + vHeat * 4.0 + vHov * 1.2;
    gl_FragColor = vec4(c * a * vA * uDustGain * boost, 1.0);
  }`;
const compFS = /* glsl */ `
  uniform sampler2D uTex; varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture2D(uTex, vUv).rgb, 1.0); }`;

const threadVS = /* glsl */ `
  ${STATE_GLSL}
  uniform float uDpr, uNear, uWidth, uRecede; uniform vec2 uRes;
  attribute vec3 aA, aB; attribute vec3 aE;   // index a, index b, kind (0 neighbour, 1 same page)
  varying float vA, vHeat, vLit, vHov, vY, vT, vGap;
  void main() {
    vec4 ca = projectionMatrix * modelViewMatrix * vec4(aA, 1.0);
    vec4 cb = projectionMatrix * modelViewMatrix * vec4(aB, 1.0);
    vec2 sa = ca.xy / ca.w * 0.5 * uRes, sb = cb.xy / cb.w * 0.5 * uRes;
    vec2 d = sb - sa; float len = max(length(d), 0.001); d /= len;
    vec2 n = vec2(-d.y, d.x);
    float t = position.x * 0.5 + 0.5;
    vec4 c = mix(ca, cb, t);
    vec2 s = mix(sa, sb, t) + n * position.y * uWidth * uDpr;
    gl_Position = vec4(s / (0.5 * uRes) * c.w, c.z, c.w);
    vec4 A = starState(aE.x), B = starState(aE.y);
    float near = clamp(uNear / c.w, 0.55, 1.8);
    // the fragment keeps the thread off its two stars' cores, so it reads as joining them, not crossing them
    vT = t; vGap = min(0.45, 7.0 * uDpr / len);
    vA = (aE.z > 0.5 ? 0.26 : 0.12) * mix(0.45, 1.15, clamp((near - 0.55) / 0.9, 0.0, 1.0));
    vHeat = min(A.r, B.r); vLit = min(A.g, B.g); vHov = min(A.b, B.b) * aE.z; vY = position.y;
    vA *= 1.0 - uRecede * 0.6 * (1.0 - clamp(vLit * 2.0, 0.0, 1.0));
    // a thread shows only when it's asked for: the hovered star's neighbours, its page's chain, or two read stars
    float hov = aE.z > 0.5 ? smoothstep(0.2, 0.55, vHov) : smoothstep(0.8, 1.0, max(A.b, B.b));
    vA *= max(hov, smoothstep(0.2, 0.6, vLit)) * 1.6;
    vA *= 1.0 - smoothstep(0.3, 0.55, len / min(uRes.x, uRes.y));
  }`;
const threadFS = /* glsl */ `
  uniform vec3 uThread, uEnergy;
  varying float vA, vHeat, vLit, vHov, vY, vT, vGap;
  void main() {
    if (vA < 0.001) discard;
    float ends = smoothstep(0.0, vGap, vT) * smoothstep(0.0, vGap, 1.0 - vT);
    float a = vA * ends * (1.0 - smoothstep(0.35, 1.0, abs(vY)));
    vec3 c = mix(uThread, uEnergy, clamp(vHeat * 1.2, 0.0, 1.0)) * (1.0 + vLit * 2.6 + vHeat * 5.0 + vHov * 3.0);
    gl_FragColor = vec4(c * a, 1.0);
  }`;

// depth-tested but never writing depth: nothing in the sky hides anything, but later solid worlds can hide the sky
const additive = { transparent: true, depthTest: true, depthWrite: false, blending: AdditiveBlending } as const;

export type Sky = ReturnType<typeof createSky>;

export function createSky(canvas: HTMLCanvasElement, { layout, tier, reduced }: { layout: StarLayout; tier: Tier; reduced: boolean }) {
  const ids = layout.stars.map((s) => s.id).sort();
  const N = Math.min(ids.length, MAXS);
  const byId = new Map(layout.stars.map((s) => [s.id, s]));
  const index = new Map(ids.slice(0, N).map((id, i) => [id, i]));
  const topicOf = ids.map((id) => byId.get(id)!.topic);
  const pos = (i: number): Vec3 => { const s = byId.get(ids[i]!)!; return [s.x, s.y, s.z]; };

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true });
  const dpr = tier.dpr;
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  renderer.outputColorSpace = LinearSRGBColorSpace; // no conversion: display values go straight to the screen

  const camera = new PerspectiveCamera(FOV, 1, 0.05, 200);
  const screen = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new Scene(), bgScene = new Scene(), dustScene = new Scene();
  const owned: Array<BufferGeometry | Material | DataTexture | WebGLRenderTarget> = [];

  const stateData = new Float32Array(MAXS * 4);
  const stateTex = new DataTexture(stateData, MAXS, 1, RGBAFormat, FloatType);
  stateTex.magFilter = stateTex.minFilter = NearestFilter;
  stateTex.needsUpdate = true;
  owned.push(stateTex);
  const state = ids.slice(0, N).map(() => ({ heat: 0, lit: 0, hover: 0, twinkle: 0, flare: 0, read: 0 }));

  const U = {
    uState: { value: stateTex }, uDpr: { value: dpr }, uNear: { value: 3 },
    uRes: { value: new Vector2(1, 1) }, uCenter: { value: new Vector2(0.5, 0.5) }, uSpread: { value: 1 },
    uSpace: { value: new Color(0, 0, 0) }, uTint: { value: new Color(0, 0, 0) }, uStar: { value: col(LIGHT.star) },
    uHot: { value: col(LIGHT.hot) }, uEnergy: { value: col(LIGHT.energy) }, uDust1: { value: col(LIGHT.dust1) },
    uDust2: { value: col(LIGHT.dust2) }, uThread: { value: col(LIGHT.thread) }, uGal: { value: col(LIGHT.galaxy) },
    uGal2: { value: col(LIGHT.galaxy2) }, uDustGain: { value: 0.085 }, uRecede: { value: 0 }, uGalGain: { value: 0.85 },
    uWidth: { value: 0.9 }, uTime: { value: 0 },
  };
  const mat = (vertexShader: string, fragmentShader: string) => {
    const m = new ShaderMaterial({ uniforms: U, vertexShader, fragmentShader, ...additive });
    owned.push(m);
    return m;
  };
  const mesh = (g: BufferGeometry, m: Material) => { owned.push(g); const o = new Mesh(g, m); o.frustumCulled = false; return o; };

  // the hero's light, centred on the sky
  const bgMat = new ShaderMaterial({ uniforms: U, vertexShader: bgVS, fragmentShader: bgFS, depthTest: false, depthWrite: false });
  owned.push(bgMat);
  bgScene.add(mesh(new PlaneGeometry(2, 2), bgMat));

  // the far galaxies, generated once at load from a fixed seed: mostly specks near the limit of seeing, some
  // small smudges, and a rare big spiral, so an "empty" patch of sky turns out to be full
  const galaxies = (() => {
    const r = rng(7), g = quad(), count = tier.galaxies;
    const dir = new Float32Array(count * 3), m = new Float32Array(count * 4), hh = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - u * u);
      dir.set([q * Math.cos(a), u, q * Math.sin(a)], i * 3);
      const big = Math.pow(r(), 6), rare = r() < 0.0018;
      const size = rare ? 9 + r() * 9 : 1.6 + big * 5;
      m.set([size, rare ? 0.4 + r() * 0.5 : 0.3 + r() * 0.7, r() * Math.PI, rare ? 0.3 + r() * 0.15 : 0.05 + Math.pow(r(), 3) * 0.3], i * 4);
      hh.set([rare ? 1 : size > 4.5 && r() < 0.4 ? 0.6 : 0, r()], i * 2);
    }
    g.setAttribute("aDir", inst(dir, 3)); g.setAttribute("aG", inst(m, 4)); g.setAttribute("aH", inst(hh, 2));
    g.instanceCount = count;
    return mesh(g, mat(galVS, galFS));
  })();

  // stars: few bright, many faint (no data says how bright a passage is, so magnitude is seeded by its id)
  const mags = new Float32Array(N);
  const stars = (() => {
    const g = quad(), a = new Float32Array(N * 3), meta = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      mags[i] = starMagnitude(ids[i]!);
      a.set(pos(i), i * 3); meta.set([mags[i]!, i], i * 2);
    }
    g.setAttribute("aPos", inst(a, 3)); g.setAttribute("aMeta", inst(meta, 2)); g.instanceCount = N;
    return mesh(g, mat(starVS, starFS));
  })();
  stars.renderOrder = 3;

  // the links: each star's two nearest neighbours, and each page's passages chained by a nearest-neighbour walk
  const edges: Array<[number, number, 0 | 1]> = [];
  {
    const seen = new Set<string>();
    const add = (i: number, j: number, kind: 0 | 1) => { const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(k)) { seen.add(k); edges.push([i, j, kind]); } };
    const d2 = (i: number, j: number) => { const p = pos(i), q = pos(j); return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; };
    for (let i = 0; i < N; i++) {
      [...Array(N).keys()].filter((j) => j !== i).sort((x, y) => d2(i, x) - d2(i, y)).slice(0, 2).forEach((j) => add(i, j, 0));
    }
    const byTopic = new Map<string, number[]>();
    topicOf.slice(0, N).forEach((t, i) => byTopic.set(t, [...(byTopic.get(t) ?? []), i]));
    for (const list of byTopic.values()) {
      const left = new Set(list.slice(1));
      let cur = list[0]!;
      while (left.size) {
        let best = -1;
        for (const j of left) if (best < 0 || d2(cur, j) < d2(cur, best)) best = j;
        add(cur, best, 1); left.delete(best); cur = best;
      }
    }
  }

  const threads = (() => {
    const g = quad(), E = edges.length, A = new Float32Array(E * 3), B = new Float32Array(E * 3), e = new Float32Array(E * 3);
    edges.forEach(([i, j, kind], k) => { A.set(pos(i), k * 3); B.set(pos(j), k * 3); e.set([i, j, kind], k * 3); });
    g.setAttribute("aA", inst(A, 3)); g.setAttribute("aB", inst(B, 3)); g.setAttribute("aE", inst(e, 3));
    g.instanceCount = E;
    return mesh(g, mat(threadVS, threadFS));
  })();
  threads.renderOrder = 2;

  // the gas: a small puff round each star, and filaments along the links, so related passages share one cloud
  // with lanes in it instead of a blob per star
  const dust = (() => {
    const r = rng(11), nz = noise3(3), nz2 = noise3(5);
    const P: Array<[number, number, Vec3, number, number, number, number]> = [];
    const lane = (w: Vec3) => Math.pow(nz(w[0] * 4 + 5, w[1] * 4, w[2] * 4), 2.0) * 2.4;
    for (let i = 0; i < N; i++) {
      const pa = pos(i), sigma = 0.022 + r() * 0.02;
      for (let j = 0; j < 14; j++) {
        const o: Vec3 = [gauss(r) * sigma, gauss(r) * sigma, gauss(r) * sigma], w: Vec3 = [pa[0] + o[0], pa[1] + o[1], pa[2] + o[2]];
        P.push([i, i, o, 0.018 + r() * 0.04, Math.min(1.5, lane(w)) * (0.6 + mags[i]! * 0.7), 0, nz2(w[0] * 2, w[1] * 2 + 9, w[2] * 2)]);
      }
    }
    for (const [i, j, kind] of edges) {
      const a = pos(i), b = pos(j), len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const n = Math.max(4, Math.round(len * (kind ? 70 : 110)));
      for (let k = 0; k < n; k++) {
        const u = (k + r()) / n, th = 0.006 + 0.016 * Math.sin(Math.PI * u) * r();
        const o: Vec3 = [gauss(r) * th, gauss(r) * th, gauss(r) * th];
        const w: Vec3 = [a[0] + (b[0] - a[0]) * u + o[0], a[1] + (b[1] - a[1]) * u + o[1], a[2] + (b[2] - a[2]) * u + o[2]];
        P.push([i, j, o, 0.014 + r() * 0.03, Math.min(1.5, lane(w)) * 0.75, u, nz2(w[0] * 2, w[1] * 2 + 9, w[2] * 2)]);
      }
    }
    const M = P.length, g = quad();
    const pi = new Float32Array(M * 3), pj = new Float32Array(M * 3), off = new Float32Array(M * 3), d = new Float32Array(M * 4), kk = new Float32Array(M * 2);
    P.forEach(([i, j, o, size, alpha, u, tint], m) => {
      pi.set(pos(i), m * 3); pj.set(pos(j), m * 3); off.set(o, m * 3); d.set([size, alpha, u, tint], m * 4); kk.set([i, j], m * 2);
    });
    g.setAttribute("aPi", inst(pi, 3)); g.setAttribute("aPj", inst(pj, 3)); g.setAttribute("aOff", inst(off, 3));
    g.setAttribute("aD", inst(d, 4)); g.setAttribute("aK", inst(kk, 2));
    g.instanceCount = M;
    return mesh(g, mat(dustVS, dustFS));
  })();
  dustScene.add(dust);

  // the gas is drawn at half the CSS size into its own target, then composited over the hero's light
  const dustRT = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
  owned.push(dustRT);
  const compMat = new ShaderMaterial({ uniforms: { uTex: { value: dustRT.texture } }, vertexShader: bgVS, fragmentShader: compFS, ...additive });
  owned.push(compMat);
  bgScene.add(mesh(new PlaneGeometry(2, 2), compMat));

  scene.add(galaxies, threads, stars);

  // ---------------------------------------------------------------- the camera: orbits the sky's centre
  const cam = { az: 0.6, el: 0.18, size: 1, tx: 0, ty: 0, tz: 0, cx: 0.5, cy: 0.5 };
  const spin = { speed: 0.035, factor: 1 }; // rad/s; factor lets the film pause the spin
  let w = 1, h = 1, k = 0;

  // (a phone's toolbar fires resize without changing the canvas, which is the large viewport's height)
  function resize() {
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight, ck = renderer.getPixelRatio();
    if (cw === w && ch === h && ck === k) return;
    w = cw;
    h = ch;
    k = ck;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    U.uDpr.value = k;
    U.uRes.value.set(w * k, h * k);
    dustRT.setSize(Math.max(1, Math.round(w * DUST_SCALE)), Math.max(1, Math.round(h * DUST_SCALE)));
  }

  // rewritten each frame: whoever is handed it reads it then and keeps nothing
  const orbit: Pose = { pos: [0, 0, 0], target: [0, 0, 0], cx: 0.5, cy: 0.5, near: 1, spread: 1 };
  function orbitPose(): Pose {
    // the distance that fits the sky into `size` of the shorter side
    const t = Math.tan(MathUtils.degToRad(FOV / 2)), fit = Math.min(1, camera.aspect);
    const dist = SKY_RADIUS / (cam.size * t * fit);
    const ce = Math.cos(cam.el);
    orbit.pos[0] = cam.tx + Math.sin(cam.az) * ce * dist;
    orbit.pos[1] = cam.ty + Math.sin(cam.el) * dist;
    orbit.pos[2] = cam.tz + Math.cos(cam.az) * ce * dist;
    orbit.target[0] = cam.tx;
    orbit.target[1] = cam.ty;
    orbit.target[2] = cam.tz;
    orbit.cx = cam.cx;
    orbit.cy = cam.cy;
    orbit.near = dist;
    orbit.spread = 0.95 * cam.size * Math.min(1, w / h) + 0.35;
    return orbit;
  }
  function applyPose(p: Pose) {
    camera.position.set(...p.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...p.target);
    // shift the frame so the target sits at (cx, cy) of the screen
    camera.setViewOffset(w, h, (0.5 - p.cx) * w, (0.5 - p.cy) * h, w, h);
    camera.updateMatrixWorld();
    U.uNear.value = p.near;
    U.uCenter.value.set(p.cx, 1 - p.cy);
    U.uSpread.value = p.spread;
  }

  // frame cost: GPU time where the browser offers the timer query, its queries pooled
  const gl = renderer.getContext() as WebGL2RenderingContext;
  let tq = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const perf = { gpu: null as number | null, pending: [] as WebGLQuery[] };
  const spare: WebGLQuery[] = [];
  // the resolution, stepped down while the GPU can't hold 60 fps and back up once it can (governor.ts)
  const governor = createGovernor({ dpr, lower: lowerQuality });
  let lastFrame = 0;

  // A lost context takes its queries and extensions with it. three rebuilds its own state when the context is
  // restored; the timer query is fetched again (one fetched before the loss names a target the new context refuses).
  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    perf.pending.length = spare.length = 0;
    perf.gpu = null;
  };
  const onRestored = () => {
    lost = false;
    tq = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    lastFrame = 0;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  function frame() {
    if (lost) return;
    const t0 = performance.now();
    if (lastFrame) {
      const scale = governor.feed({ gpu: tq ? perf.gpu : null, dt: t0 - lastFrame, now: t0 });
      if (scale !== null) {
        renderer.setPixelRatio(dpr * scale);
        resize();
      }
    }
    lastFrame = t0;
    const dt = gsap.ticker.deltaRatio(60) / 60;
    if (!reduced) {
      cam.az += spin.speed * spin.factor * dt;
      U.uTime.value = (performance.now() / 1000) % 1000; // the twinkle's clock, kept small for the shader's precision
    }
    applyPose(api.drive ? api.drive(orbitPose) : orbitPose());
    for (let i = 0; i < N; i++) {
      const s = state[i]!;
      stateData[i * 4] = Math.max(s.heat, s.flare); stateData[i * 4 + 1] = Math.max(s.lit, s.read); stateData[i * 4 + 2] = s.hover; stateData[i * 4 + 3] = reduced ? 0 : s.twinkle;
    }
    stateTex.needsUpdate = true;

    const q = tq ? (spare.pop() ?? gl.createQuery()) : null;
    if (q && tq) gl.beginQuery(tq.TIME_ELAPSED_EXT, q);
    // what's drawn over the sky's own frame (the warp), which may cover all of it: then the sky needn't draw
    const over = api.overlay, hidden = !!over?.covers();
    renderer.setClearColor(0x000000, 1);
    if (!hidden) {
      renderer.setRenderTarget(dustRT);
      renderer.clear();
      renderer.render(dustScene, camera);
    }
    renderer.setRenderTarget(null);
    renderer.clear();
    if (!hidden) {
      renderer.render(bgScene, screen);
      renderer.render(scene, camera);
    }
    over?.draw(renderer);
    if (q && tq) { gl.endQuery(tq.TIME_ELAPSED_EXT); perf.pending.push(q); }
    while (tq && perf.pending.length) {
      const p = perf.pending[0]!;
      if (!gl.getQueryParameter(p, gl.QUERY_RESULT_AVAILABLE)) break;
      if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) perf.gpu = gl.getQueryParameter(p, gl.QUERY_RESULT) / 1e6;
      spare.push(perf.pending.shift()!);
    }
  }

  // ---------------------------------------------------------------- Flare: what the agent read lights up
  // the chat's pair only: the film's own tweens of heat and lit are never touched
  const kill = (s: object) => gsap.killTweensOf(s, "flare,read");
  let gen = 0;
  // warm flare where the star sits, then cool to a brighter white than the rest
  function flare(i: number, k: number) {
    const s = state[i]!;
    kill(s);
    const lvl = Math.max(s.read, k);
    if (reduced) {
      gsap.to(s, { read: lvl, duration: 0.4 });
      gsap.fromTo(s, { flare: 0.55 * k }, { flare: 0, duration: 1.4, ease: "none" });
      return;
    }
    gsap.timeline()
      .to(s, { flare: 0.35 + 0.75 * k, duration: 0.16, ease: "power2.out" })
      .to(s, { read: lvl, duration: 0.8, ease: "power2.out" }, 0.05)
      .to(s, { flare: 0, duration: 2.8, ease: "power2.inOut" }, 0.3);
  }

  let manual = false;
  const api = {
    N, ids, index, topicOf, state, perf, camera, renderer, scene, cam, spin,
    /** Where star `i` sits, in the sky's own coordinates. */
    pos,
    /** The light the agent's reading leaves behind (0..1: the rest of the sky recedes), and the gas's brightness. */
    U: { recede: U.uRecede, dustGain: U.uDustGain },
    /** The frame's size in device pixels, and the pixel ratio: for anything drawn a set number of pixels wide. */
    px: { res: U.uRes, dpr: U.uDpr },
    /** A later driver (the film) hands in the camera's pose each frame; without one the camera orbits the sky. */
    drive: null as null | ((orbit: () => Pose) => Pose),
    /**
     * Drawn over the sky's frame each time it's drawn (the warp, lib/voyage/warp-hole.ts): `draw` after the sky's
     * scene; while `covers` says it hides the whole frame, the sky skips drawing its own.
     */
    overlay: null as null | { draw: (r: WebGLRenderer) => void; covers: () => boolean },
    /**
     * Manual: the sky stops drawing itself on GSAP's ticker, and whoever drives it calls `render()` once a frame,
     * so the frame and whatever is laid over it (the film's text) are placed from the same camera.
     */
    setManual(on: boolean) {
      if (on === manual) return;
      manual = on;
      if (on) gsap.ticker.remove(frame);
      else gsap.ticker.add(frame);
    },
    /** Draws a frame now. */
    render: () => frame(),
    /** Sets the camera to this frame's pose now (drawing does too), for whoever reads the camera before drawing. */
    pose() {
      applyPose(api.drive ? api.drive(orbitPose) : orbitPose());
    },
    /** The light round the camera: the region's space colour and tint, as display values. */
    setLight(space: Rgb, tint: Rgb) {
      U.uSpace.value.setRGB(space[0], space[1], space[2], LinearSRGBColorSpace);
      U.uTint.value.setRGB(tint[0], tint[1], tint[2], LinearSRGBColorSpace);
    },
    /** keeps the resolution as it is for `ms` (a warp drawing from the frame's own pixels) */
    holdScale(ms: number) { governor.hold(performance.now(), ms); },
    get size() { return { w, h }; },
    /**
     * The agent read these passages (one search's hits, best first): each flares where it sits, a beat apart, best
     * first, with brightness following similarity. The film keeps its own camera and recede. Returns the indices of
     * the stars that light; `onFlare` hears each star as it flares (its index and brightness), for its sound.
     */
    light(hits: Hit[], { onFlare }: { onFlare?: (i: number, k: number) => void } = {}) {
      const kept = hits.filter((x) => index.has(x.star));
      if (!kept.length) return [];
      const top = Math.max(...kept.map((x) => x.sim)), low = Math.min(...kept.map((x) => x.sim));
      const list = kept.map((x) => ({ i: index.get(x.star)!, k: top === low ? 1 : 0.45 + (0.55 * (x.sim - low)) / (top - low) }));
      const g = gen;
      list.forEach(({ i, k }, rank) => gsap.delayedCall(reduced ? 0 : rank * 0.08, () => { if (g === gen) { flare(i, k); onFlare?.(i, k); } }));
      return list.map((x) => x.i);
    },
    /** What the agent read goes out. */
    clearLit() {
      gen++;
      state.forEach((s) => { kill(s); gsap.to(s, { read: 0, flare: 0, duration: reduced ? 0.2 : 0.9, ease: "power2.out" }); });
    },
    /** Rings a star and its page's other passages, and shows their threads. */
    setHover(i: number | null) {
      const t = i == null ? null : topicOf[i];
      state.forEach((s, j) => gsap.to(s, { hover: j === i ? 1 : t && topicOf[j] === t ? 0.55 : 0, duration: 0.25, overwrite: "auto" }));
    },
    /** Where a star is on screen, in CSS px, for labels and picking. */
    project(i: number, out = new Vector3()) {
      out.set(...pos(i)).project(camera);
      return { x: (out.x * 0.5 + 0.5) * w, y: (-out.y * 0.5 + 0.5) * h, z: out.z };
    },
    dispose() {
      // star flares still waiting on their beat
      gen++;
      gsap.ticker.remove(frame);
      removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gsap.killTweensOf([U.uRecede, spin, cam, ...state]);
      if (!lost) for (const q of [...perf.pending, ...spare]) gl.deleteQuery(q);
      owned.forEach((o) => o.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };

  resize();
  addEventListener("resize", resize);
  gsap.ticker.add(frame);
  return api;
}
