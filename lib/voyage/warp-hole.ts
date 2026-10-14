/**
 * The warp's wormhole, after *Warp or scroll*'s journey: full-screen shaders, no particles and no streaks, drawn by
 * the sky's own renderer after its scene (lib/universe/sky.ts `overlay`), so it costs no context of its own and sits
 * under the page's HTML. The warp tweens the numbers in `state`; they mix the journey's views:
 * - the sky left behind, bent round the hole by gravitational lensing (what's behind the hole shows as arcs round a
 *   ring) and falling into it, nearest first, spiralling in (`drain`); it's the frame itself, copied as it's drawn,
 *   so the stars that bend and fall are the real ones; beyond it, the deep sky;
 * - the hole: a face-on accretion disk of turbulent gas that turns faster nearer the hole, a thin photon ring, and
 *   the black shadow of the horizon;
 * - the charge and the shock: a spark gathering where the hole will open, then a ring of light racing out from it,
 *   refracting what's behind it;
 * - the throat: inside the wormhole, walls of glowing gas spiralling past towards the light at its end (log-polar,
 *   so the walls keep their shape at every depth instead of smearing into streaks);
 * - the exit: a portal opening out of that light onto the destination (the live frame, the camera coming in from
 *   afar) and its white hole, settling from the warp's fire into the destination's own light (`cool`): the warp is in
 *   the destination's hue from the start (`palette`, lib/film/warp-palette.ts);
 * - a flash, for the blows.
 * It draws into a target of capped size (its gas is soft; the frame's own stars stay sharp wherever the lensing
 * barely moves them, since there the frame shows through), composited over the frame. Its noise is a 64³ tiling 3D
 * texture baked once, so each octave is one filtered fetch. Compiled ahead (`warm`); while the throat covers the
 * whole frame, the sky needn't draw at all (`covered`).
 */
import {
  CustomBlending, Data3DTexture, FramebufferTexture, LinearFilter, Mesh, MirroredRepeatWrapping, OneFactor, OneMinusSrcAlphaFactor, OrthographicCamera,
  PlaneGeometry, RedFormat, RepeatWrapping, Scene, ShaderMaterial, UnsignedByteType, Vector2, Vector3, WebGLRenderTarget, type WebGLRenderer,
} from "three";

const VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FS = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  uniform vec2 uRes;       // the frame, CSS px
  uniform vec2 uRT;        // this target, its px
  uniform vec2 uC;         // the hole's centre, CSS px from the top left
  uniform float uTime, uOn, uLens, uDrain, uTwist, uShock, uShockA, uCharge;
  uniform float uHole, uDisk, uDiskR, uSpin, uRing, uWhite, uInside, uTravel, uExit, uGlow, uFlash, uCool;
  uniform int uOct;
  uniform vec3 uAccent, uDim, uDeep, uHue;
  uniform sampler3D uNoise;
  uniform sampler2D uSnap;
  const vec3 HOT = vec3(1.0, 0.94, 0.86);
  const vec3 PAPER = vec3(0.87, 0.9, 1.0);

  float noise(vec3 p) { return texture(uNoise, p * 0.125).r * 2.0 - 1.0; }
  float fbm(vec3 p, int oct) {
    float s = 0.0, a = 0.6;
    for (int i = 0; i < 4; i++) { if (i >= oct) break; s += a * noise(p); p = p * 2.03 + vec3(17.1, 5.3, 11.7); a *= 0.45; }
    return s;
  }
  float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec3 warm() { return mix(uAccent, uHue, uCool); }

  // the deep sky beyond the frame left behind: one star per occupied cell, measured where the light came from, so
  // lensing stretches a star into an arc
  vec3 starLayer(vec2 q, float cell, float dens, float seed) {
    vec2 g = q / cell, id = floor(g), f = fract(g);
    float h = hash(id + seed);
    if (h > dens) return vec3(0.0);
    vec2 o = 0.15 + 0.7 * vec2(hash(id + seed + 17.0), hash(id + seed + 31.0));
    float d = length((f - o) * cell), b = hash(id + seed + 5.0);
    float s = mix(0.55, 1.4, b * b * b);
    return PAPER * exp(-d * d / (s * s)) * mix(0.15, 0.8, b);
  }
  vec3 deepSky(vec2 q, float fw) {
    float fade = clamp(1.8 / max(fw, 0.001), 0.0, 1.0);
    vec3 s = starLayer(q, 38.0, 0.28, 0.0) + starLayer(q * 1.6 + 97.0, 28.0, 0.24, 13.0) * 0.5;
    float n = fbm(vec3(q * 0.0014, uTime * 0.01), 2);
    return uDeep * 0.18 * smoothstep(-0.3, 0.7, n) + s * fade;
  }

  // the sky left behind: bent round the hole, refracted by the shock and falling in; moved: how far (CSS px) this
  // pixel's light has been moved, so where it barely has, the frame itself shows through
  vec3 space(vec2 p, float r, out float moved) {
    float E = uLens;
    float k = E > 0.5 ? max(1.0 - E * E / max(r * r, 1.0), -6.0) : 1.0;
    vec2 x = p * k;
    x += (p / max(r, 1.0)) * uShockA * 28.0 * exp(-pow((r - uShock) / 40.0, 2.0));
    float rx = length(x), diag = length(uRes);
    // the fall: everything drawn round and in, nearest first, slowly and then all at once
    float rho = rx * (1.0 + 0.6 * uDrain) + diag * 0.8 * uDrain * uDrain;
    float th = atan(x.y, x.x) + uDrain * uTwist * (1.0 + 3.0 * E / (rx + E + 1.0));
    vec2 q = vec2(cos(th), sin(th)) * rho;
    moved = length(q - p);
    vec2 sp = uC + q;
    // the frame is read mirrored past its edges, so its edge never shows as it turns and falls; what falls from far
    // enough out gives way to the deep sky
    vec2 uv = vec2(sp.x / uRes.x, 1.0 - sp.y / uRes.y);
    float keep = 1.0 - smoothstep(0.6 * diag, 1.3 * diag, rho);
    vec3 s = keep > 0.0 ? texture(uSnap, uv).rgb * keep : vec3(0.0);
    return s + deepSky(q, length(fwidth(q))) * (1.0 - keep);
  }

  // the hole's light and its shadow (cover, 0..1, black)
  vec3 hole(vec2 p, float r, out float cover) {
    float R = uHole;
    vec3 col = vec3(0.0), w = warm();
    cover = 0.0;
    float DR = uDiskR;
    if (uDisk > 0.001 && DR > 0.5) {
      float x = r / DR;
      if (x > 0.9 && x < 6.0) {
        float a = atan(p.y, p.x), lr = log(x);
        float A = a - uSpin * pow(x, -1.5) - uTwist * lr * 1.4;
        vec3 np = vec3(cos(A) * 1.6, sin(A) * 1.6, lr * 3.2);
        float n = fbm(np, uOct);
        float n2 = fbm(np * 2.4 + vec3(0.0, 0.0, n * 1.5), max(uOct - 1, 1));
        float prof = smoothstep(0.97, 1.12, x) * pow(1.15 / x, 2.3);
        float gas = prof * (0.2 + 1.1 * smoothstep(-0.3, 0.7, n + 0.5 * n2));
        vec3 c1 = mix(uDim, w, smoothstep(0.04, 0.35, gas));
        col += mix(c1, HOT, smoothstep(0.6, 1.5, gas)) * gas * uDisk;
      }
    }
    if (R > 0.5) {
      float ring = exp(-pow((r - R * 1.035) / (1.2 + R * 0.018), 2.0));
      float halo = exp(-max(r - R, 0.0) / (R * 0.3 + 5.0));
      col += (HOT * ring * 1.5 + w * halo * 0.35) * uRing;
      cover = 1.0 - smoothstep(R - 1.2, R + 1.2, r);
      col *= 1.0 - cover;
    }
    if (uWhite > 0.001) {
      float g = uWhite * (exp(-r / 7.0) * 1.4 + exp(-r / 55.0) * 0.6 + exp(-r / 240.0) * 0.08);
      col += mix(w, HOT, exp(-r / 45.0)) * g;
    }
    return col;
  }

  vec3 throat(vec2 p, float r) {
    float m = min(uRes.x, uRes.y) * 0.5, rn = max(r / m, 0.001), a = atan(p.y, p.x);
    float v = -log(rn) * 1.25 + uTravel;
    float A = a + uTwist * v * 0.55 + uSpin * 0.15;
    vec3 np = vec3(cos(A) * 1.25, sin(A) * 1.25, v);
    float n = fbm(np, uOct);
    float rid = 1.0 - abs(fbm(np * 2.0 + vec3(n, -n, 0.0) * 0.9 + 3.1, max(uOct - 1, 1)));
    rid = pow(clamp(rid, 0.0, 1.0), 7.0);
    float keep = smoothstep(0.5, 0.12, fwidth(v));
    vec3 w = warm();
    vec3 wall = uDeep * (0.12 + 0.62 * smoothstep(-0.5, 0.6, n)) + w * rid * 1.5 + HOT * pow(rid, 3.0) * 0.9;
    wall *= (0.3 + 0.7 * smoothstep(-0.5, 0.7, n)) * mix(0.32, 1.2, exp(-rn * 1.5));
    float core = exp(-rn * 10.0) * 1.2 + exp(-rn * 3.0) * 0.3;
    return wall * keep + mix(w, HOT, exp(-rn * 16.0)) * core * uGlow;
  }

  void main() {
    vec2 f = gl_FragCoord.xy / uRT;
    vec2 p = vec2(f.x, 1.0 - f.y) * uRes - uC;
    float r = length(p), diag = length(uRes);
    float cover = 0.0;
    vec3 col = vec3(0.0);
    if (uOn > 0.001 && (uInside < 0.999 || uExit > 0.5)) {
      float moved;
      vec3 sp = space(p, r, moved);
      float c = uOn * smoothstep(0.35, 1.5, moved);
      float hc;
      vec3 h = hole(p, r, hc);
      col = sp * c * (1.0 - hc) + h;
      cover = c + hc * (1.0 - c);
    }
    if (uInside > 0.001) {
      vec3 inC = throat(p, r) * (1.0 - 0.3 * smoothstep(0.35, 0.75, r / diag));
      float rb = uInside * 1.3 * diag;
      float w = 1.0 - smoothstep(rb * 0.55, rb, r);
      vec3 rim = vec3(0.0);
      if (uExit > 0.5) {
        float a = atan(p.y, p.x);
        float edge = uExit * (1.0 + 0.06 * noise(vec3(cos(a) * 1.7, sin(a) * 1.7, uTime * 1.2)));
        w *= smoothstep(edge - 2.0, edge + 3.0, r);
        rim = HOT * 1.3 * exp(-pow((r - edge) / (2.0 + uExit * 0.012), 2.0)) + warm() * 0.5 * step(edge, r) * exp(-(r - edge) / (20.0 + uExit * 0.1));
      }
      col = inC * w + col * (1.0 - w) + rim;
      cover = w + cover * (1.0 - w);
    }
    vec3 wc = warm();
    col += mix(wc, HOT, 0.55) * 1.3 * uShockA * exp(-pow((r - uShock) / (5.0 + uShock * 0.012), 2.0));
    float ch = uCharge * (exp(-r / 5.0) * 1.5 + exp(-r / 26.0) * 0.55 + exp(-r / 110.0) * 0.14) * (0.88 + 0.12 * sin(uTime * 53.0));
    col += mix(wc, HOT, exp(-r / 9.0)) * ch;
    col += HOT * uFlash * (0.12 + 1.2 * exp(-r / (diag * 0.14)));
    col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0 * cover;
    gl_FragColor = vec4(max(col, 0.0), clamp(cover, 0.0, 1.0));
  }
`;

// laid over the frame, premultiplied: where it covers, its own colour; its light added everywhere
const COMP = /* glsl */ `
  uniform sampler2D uTex;
  varying vec2 vUv;
  void main() { gl_FragColor = texture2D(uTex, vUv); }
`;

/** A 64³ tiling noise, baked once: smooth value noise on 8³, 16³ and 32³ lattices (weights 1, ½, ¼), wrapped. */
function noiseTexture(N = 64) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const layers = ([[8, 1], [16, 0.5], [32, 0.25]] as const).map(([L, w]) => ({ L, w, v: Float32Array.from({ length: L * L * L }, rnd) }));
  const f = new Float32Array(N * N * N), sm = (t: number) => t * t * (3 - 2 * t), l = (a: number, b: number, t: number) => a + (b - a) * t;
  for (const { L, w, v } of layers) {
    const k = L / N, at = (x: number, y: number, z: number) => v[((z % L) * L + (y % L)) * L + (x % L)]!;
    for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x * k, gy = y * k, gz = z * k, x0 = gx | 0, y0 = gy | 0, z0 = gz | 0;
      const u = sm(gx - x0), vv = sm(gy - y0), ww = sm(gz - z0);
      const c = l(l(l(at(x0, y0, z0), at(x0 + 1, y0, z0), u), l(at(x0, y0 + 1, z0), at(x0 + 1, y0 + 1, z0), u), vv),
        l(l(at(x0, y0, z0 + 1), at(x0 + 1, y0, z0 + 1), u), l(at(x0, y0 + 1, z0 + 1), at(x0 + 1, y0 + 1, z0 + 1), u), vv), ww);
      f[(z * N + y) * N + x]! += c * w;
    }
  }
  let lo = Infinity, hi = -Infinity;
  for (const x of f) { if (x < lo) lo = x; if (x > hi) hi = x; }
  const t = new Data3DTexture(Uint8Array.from(f, (x) => Math.round(((x - lo) / (hi - lo)) * 255)), N, N, N);
  t.format = RedFormat;
  t.type = UnsignedByteType;
  t.unpackAlignment = 1;
  t.minFilter = t.magFilter = LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

const BLANK = {
  on: 0, lens: 0, drain: 0, shock: -1e4, shockA: 0, charge: 0, hole: 0, disk: 0, diskR: 0, spinRate: 0, ring: 0, white: 0, inside: 0, speed: 0,
  twist: 0, exit: 0, glow: 1, flash: 0, cool: 0,
};
export type HoleState = typeof BLANK & { time: number; spin: number; travel: number; cx: number; cy: number };

// display values (written straight to the screen: the sky's renderer converts nothing)
const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

export type WarpHole = ReturnType<typeof createWarpHole>;

export function createWarpHole({ renderer, lite }: { renderer: WebGLRenderer; lite: () => boolean }) {
  const buf = new Vector2();
  renderer.getDrawingBufferSize(buf);
  const snapOf = (w: number, h: number) => {
    const t = new FramebufferTexture(Math.max(1, w), Math.max(1, h));
    t.wrapS = t.wrapT = MirroredRepeatWrapping;
    return t;
  };
  let snap = snapOf(buf.x, buf.y);
  const rt = new WebGLRenderTarget(1, 1, { type: UnsignedByteType, depthBuffer: false });
  rt.texture.minFilter = rt.texture.magFilter = LinearFilter;
  const v = <T,>(value: T) => ({ value });
  const U = {
    uRes: v(new Vector2(1, 1)), uRT: v(new Vector2(1, 1)), uC: v(new Vector2()), uTime: v(0), uOn: v(0), uLens: v(0), uDrain: v(0), uTwist: v(0),
    uShock: v(0), uShockA: v(0), uCharge: v(0), uHole: v(0), uDisk: v(0), uDiskR: v(0), uSpin: v(0), uRing: v(0), uWhite: v(0), uInside: v(0),
    uTravel: v(0), uExit: v(0), uGlow: v(1), uFlash: v(0), uCool: v(0), uOct: v(3),
    uAccent: v(hex("#ff7a3a")), uDim: v(new Vector3(0.6, 0.1196, 0.0910)), uDeep: v(hex("#3a3aa8")), uHue: v(new Vector3(1, 1, 1)),
    uNoise: v(noiseTexture()), uSnap: v(snap),
  };
  const mat = new ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false });
  const comp = new ShaderMaterial({
    uniforms: { uTex: v(rt.texture) }, vertexShader: VS, fragmentShader: COMP, depthTest: false, depthWrite: false, transparent: true,
    blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor, blendSrcAlpha: OneFactor, blendDstAlpha: OneMinusSrcAlphaFactor,
  });
  const geo = new PlaneGeometry(2, 2);
  const holeScene = new Scene(), compScene = new Scene(), cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const q1 = new Mesh(geo, mat), q2 = new Mesh(geo, comp);
  q1.frustumCulled = q2.frustumCulled = false;
  holeScene.add(q1);
  compScene.add(q2);

  const state: HoleState = { ...BLANK, time: 0, spin: 0, travel: 0, cx: 0, cy: 0 };
  /** the frame's size in CSS px */
  const css = () => { renderer.getDrawingBufferSize(buf); const k = renderer.getPixelRatio(); return { w: buf.x / k, h: buf.y / k }; };

  function resize() {
    renderer.getDrawingBufferSize(buf);
    if (buf.x !== snap.image.width || buf.y !== snap.image.height) {
      snap.dispose();
      snap = snapOf(buf.x, buf.y);
      renderer.initTexture(snap);
      U.uSnap.value = snap;
    }
    // the target: at most this many px (its gas is soft), and never more than the frame's own; lighter, plainer gas
    const light = lite(), cap = light ? 0.6e6 : 1.5e6;
    U.uOct.value = light ? 2 : 3;
    const k = Math.min(1, Math.sqrt(cap / Math.max(1, buf.x * buf.y)));
    const w = Math.max(1, Math.round(buf.x * k)), h = Math.max(1, Math.round(buf.y * k));
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    U.uRT.value.set(w, h);
  }
  resize();

  const lens = () => state.on > 0.001 && (state.lens > 0.5 || state.drain > 0 || state.shockA > 0.001) && !(state.inside > 0.999 && state.exit < 0.5);
  const lit = () => {
    const s = state;
    return s.charge > 0.001 || s.shockA > 0.001 || s.flash > 0.001 || s.inside > 0.001 || (s.on > 0.001 && (s.hole > 0.5 || s.disk > 0.001 || s.white > 0.001 || s.lens > 0.5 || s.drain > 0));
  };

  return {
    state,
    resize,
    reset(o: Partial<HoleState> = {}) {
      const f = css();
      Object.assign(state, BLANK, { cx: f.w / 2, cy: f.h / 2 }, o);
    },
    step(dt: number) {
      state.time += dt;
      state.spin += state.spinRate * dt;
      state.travel += state.speed * dt;
    },
    /** the throat covers the whole frame: nothing behind it needs drawing */
    get covered() { return state.inside > 0.999 && state.exit < 0.5; },
    /** drawn after the sky's scene: copies the frame if it's to be bent, draws the hole into its target, lays it over */
    draw(r: WebGLRenderer) {
      if (!lit()) return;
      if (lens()) r.copyFramebufferToTexture(snap);
      const f = css(), s = state;
      U.uRes.value.set(f.w, f.h);
      U.uC.value.set(s.cx, s.cy);
      U.uTime.value = s.time; U.uOn.value = s.on; U.uLens.value = s.lens; U.uDrain.value = s.drain; U.uTwist.value = s.twist;
      U.uShock.value = s.shock; U.uShockA.value = s.shockA; U.uCharge.value = s.charge; U.uHole.value = s.hole; U.uDisk.value = s.disk;
      U.uDiskR.value = s.diskR || s.hole; U.uSpin.value = s.spin; U.uRing.value = s.ring; U.uWhite.value = s.white; U.uInside.value = s.inside;
      U.uTravel.value = s.travel; U.uExit.value = s.exit; U.uGlow.value = s.glow; U.uFlash.value = s.flash; U.uCool.value = s.cool;
      const prev = r.getRenderTarget();
      r.setRenderTarget(rt);
      r.setClearColor(0x000000, 0);
      r.clear();
      r.render(holeScene, cam);
      r.setRenderTarget(prev);
      r.render(compScene, cam);
    },
    /** the destination's hue, the white hole cools into */
    hue(rgb: [number, number, number]) { U.uHue.value.set(rgb[0], rgb[1], rgb[2]); },
    /** its gas's colours, in the destination's hue (lib/film/warp-palette.ts): the accent and the disk's thin gas */
    palette(p: { accent: readonly number[]; dim: readonly number[] }) {
      U.uAccent.value.set(p.accent[0]!, p.accent[1]!, p.accent[2]!);
      U.uDim.value.set(p.dim[0]!, p.dim[1]!, p.dim[2]!);
    },
    /** compiles its programs and makes its storage ahead, where the browser can do it off the main thread */
    warm(camera: import("three").Camera) {
      renderer.initTexture(snap);
      renderer.initRenderTarget(rt);
      renderer.initTexture(U.uNoise.value);
      return Promise.all([renderer.compileAsync(holeScene, camera), renderer.compileAsync(compScene, camera)]).catch(() => {});
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      comp.dispose();
      rt.dispose();
      snap.dispose();
      U.uNoise.value.dispose();
    },
  };
}
