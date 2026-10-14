/**
 * The fire Tycho's jets leave in the warp, after *Warp or scroll*'s journey: one trail per jet, the points it left in
 * the flight's world space (lib/tycho/flight-path.ts), drawn as a ribbon that glows white-hot at the nozzle and cools
 * to an ember as it fades and spreads. Being points in space, they can be carried off: the arc his circle leaves runs
 * on round it and closes into a ring (`close`), the ring is gathered into its centre (`gather`, turning as it goes:
 * the spark the hole opens from), the rest is drawn round and into the hole (`pull`, `swirl`) or streamed past us
 * down the throat (`drift`). Drawn by the sky's renderer over the hole, under Tycho's own canvas; the ribbon is added
 * to what's under it.
 */
import {
  BufferAttribute, BufferGeometry, Camera, CustomBlending, DoubleSide, DynamicDrawUsage, Mesh, OneFactor, Scene, ShaderMaterial, Vector2, Vector3, ZeroFactor,
  type WebGLRenderer,
} from "three";
import { project, type P3 } from "@/lib/tycho/flight-path";

const VS = /* glsl */ `
  attribute float aSide, aA, aHeat;
  uniform vec2 uRes;
  varying float vSide, vA, vHeat;
  void main() {
    vSide = aSide; vA = aA; vHeat = aHeat;
    gl_Position = vec4(position.x / uRes.x * 2.0 - 1.0, 1.0 - position.y / uRes.y * 2.0, 0.0, 1.0);
  }`;
const FS = /* glsl */ `
  uniform vec3 uHot, uAccent, uEmber;
  varying float vSide, vA, vHeat;
  void main() {
    float across = exp(-vSide * vSide * 4.0);
    float core = exp(-vSide * vSide * 30.0) * smoothstep(0.45, 1.0, vHeat);
    vec3 col = mix(uEmber, uAccent, smoothstep(0.0, 0.6, vHeat)) * across + uHot * core * 0.9;
    gl_FragColor = vec4(col * vA * 0.85, 0.0);
  }`;

// how many points the ring's two ends overlap by, crossfading, so the closed ring shows no join
const OVER = 3;
/**
 * Where the ring's point `i` of `n` (0 the newest) goes once it's closed, as the angle back round from the newest,
 * and how brightly it shows there: the ring runs a little past a whole turn, and its ends fade across the overlap.
 */
export function ringSpot(i: number, n: number) {
  if (n < OVER * 2 + 2) return { to: n > 1 ? (Math.PI * 2 * 0.97 * i) / (n - 1) : 0, fade: 1 };
  return { to: (Math.PI * 2 * i) / (n - 1 - OVER), fade: Math.min(1, i / OVER, (n - 1 - i) / OVER) };
}

// cut: the line breaks between this point and the newer one before it (fire between them has gone)
type Pt = P3 & { w: number; h: number; life: number; age: number; ring: boolean; cut?: boolean };
/** Takes point k out of trail t; if it had fire on both sides, the line breaks there rather than bridging the gap. */
const drop = (t: Pt[], k: number) => {
  if (k > 0 && k < t.length - 1) t[k + 1]!.cut = true;
  t.splice(k, 1);
};
const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

export type WarpTrail = ReturnType<typeof createWarpTrail>;

// max: room for each jet's points, enough for the ring with a second of fire beside it at 120 frames a second
export function createWarpTrail({ jets = 3, max = 240 } = {}) {
  const trails: Pt[][] = Array.from({ length: jets }, () => []);
  const V = jets * max * 2;
  const pos = new Float32Array(V * 3), side = new Float32Array(V), aa = new Float32Array(V), heat = new Float32Array(V);
  const idx: number[] = [];
  for (let j = 0; j < jets; j++) for (let i = 0; i < max - 1; i++) { const b = (j * max + i) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  const geo = new BufferGeometry();
  const attr = (a: Float32Array, n: number) => new BufferAttribute(a, n).setUsage(DynamicDrawUsage);
  geo.setAttribute("position", attr(pos, 3));
  geo.setAttribute("aSide", attr(side, 1));
  geo.setAttribute("aA", attr(aa, 1));
  geo.setAttribute("aHeat", attr(heat, 1));
  geo.setIndex(idx);
  const u = { uRes: { value: new Vector2(1, 1) }, uHot: { value: hex("#fff1dc") }, uAccent: { value: hex("#ff7a3a") }, uEmber: { value: hex("#7a1a08") } };
  const mat = new ShaderMaterial({
    uniforms: u, vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false, transparent: true, side: DoubleSide,
    blending: CustomBlending, blendSrc: OneFactor, blendDst: OneFactor, blendSrcAlpha: ZeroFactor, blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new Camera();

  // what carries the points off (the warp tweens these): close 0..1 spreads the ring's points evenly round the whole
  // circle he flew (ringAt(a): its point at angle a, in the world; ringAngle(p): the angle a point is at; the newest
  // stays where it left the circle, at ringA1, the rest run back round it the way he went, ringDir); gather 0..1
  // pulls them into its centre while spin turns them about it (turns); pull (1/s) and swirl (rad/s) draw every other
  // point round and into the hole at `hole`, where they go out at its horizon (holeR, px on screen); drift (px/s)
  // streams them towards us; fade speeds up their cooling
  const fx = {
    close: 0, ringAt: null as null | ((a: number, o?: P3) => P3), ringAngle: null as null | ((p: P3) => number), ringA1: 0, ringDir: 1,
    gather: 0, spin: 0, ring: { x: 0, y: 0, z: 0 }, pull: 0, swirl: 0, hole: { x: 0, y: 0, z: 0 }, holeR: 0, drift: 0, fade: 1,
  };
  let count = 0;
  const T: P3 = { x: 0, y: 0, z: 0 }, T0: P3 = { x: 0, y: 0, z: 0 };
  return {
    fx,
    get count() { return count; },
    /** its colours, in the destination's hue (lib/film/warp-palette.ts): the fire as it leaves the nozzle and as it cools */
    palette(p: { accent: readonly number[]; ember: readonly number[] }) {
      u.uAccent.value.set(p.accent[0]!, p.accent[1]!, p.accent[2]!);
      u.uEmber.value.set(p.ember[0]!, p.ember[1]!, p.ember[2]!);
    },
    clear() {
      trails.forEach((t) => (t.length = 0));
      Object.assign(fx, { close: 0, gather: 0, spin: 0, pull: 0, swirl: 0, holeR: 0, drift: 0, fade: 1 });
    },
    /** the ring's points, once gathered into the spark */
    dropRing() {
      trails.forEach((t, j) => (trails[j] = t.filter((p) => !p.ring)));
      fx.close = fx.gather = fx.spin = 0;
    },
    /** a new point at jet j's nozzle: p in world px, w its width (px at depth 0), heat 0..1, life (s); ring: kept until gathered */
    push(j: number, p: P3, w: number, h: number, life = 0.45, ring = false) {
      const t = trails[j];
      if (!t) return;
      t.unshift({ x: p.x, y: p.y, z: p.z, w, h, life: ring ? 1e9 : life, age: 0, ring });
      // out of room: the oldest loose fire makes way, never the ring, which is gathered whole into the spark
      if (t.length > max) {
        const k = t.findLastIndex((q) => !q.ring);
        drop(t, k < 0 ? t.length - 1 : k);
      }
    },
    step(dt: number) {
      const { pull, swirl, drift, hole } = fx;
      const kp = 1 - Math.exp(-pull * dt), ca = Math.cos(swirl * dt), sa = Math.sin(swirl * dt);
      for (const t of trails) {
        for (const p of t) {
          p.age += dt * fx.fade;
          if (pull > 0 && !p.ring) {
            const dx = p.x - hole.x, dy = p.y - hole.y;
            p.x = hole.x + (dx * ca - dy * sa) * (1 - kp);
            p.y = hole.y + (dx * sa + dy * ca) * (1 - kp);
            p.z += (hole.z - p.z) * kp;
          }
          if (drift) p.z += drift * dt;
        }
        // burnt-out fire goes wherever it is: the fire he leaves in front of the ring burns out while the ring
        // behind it stays, and a change in his fire's life burns newer fire out before older
        for (let i = t.length - 1; i >= 0; i--) if (t[i]!.age > t[i]!.life) drop(t, i);
      }
    },
    /** projected onto the frame (CSS px `res`, the eye at `c`, `D` in front) and drawn */
    draw(renderer: WebGLRenderer, res: { w: number; h: number }, c: { x: number; y: number }, D: number) {
      u.uRes.value.set(res.w, res.h);
      const g = fx.gather, spin = fx.spin * Math.PI * 2, cs = Math.cos(spin), sn = Math.sin(spin), R = fx.ring;
      const hs = fx.holeR > 0.5 ? project(fx.hole, c, D) : null;
      count = 0;
      const cl = fx.ringAt ? fx.close : 0, TAU = Math.PI * 2, wrapPi = (x: number) => x - TAU * Math.round(x / TAU);
      for (let j = 0; j < trails.length; j++) {
        const t = trails[j]!, base = j * max * 2, sp: Array<{ x: number; y: number; w: number; a: number; h: number; ring?: boolean }> = [];
        const nR = cl > 0 ? t.reduce((n, p) => n + (p.ring ? 1 : 0), 0) : 0;
        let ri = 0, back: number | null = null, wasRing: boolean | null = null, past = false;
        for (const p of t) {
          let q: P3 = p, fade = 1;
          if (p.ring && cl > 0 && fx.ringAt && fx.ringAngle) {
            // how far back round from the newest point it is (unwrapped along the trail), and where it goes: it slides
            // round the circle between the two, keeping its own small offset from it as it goes
            const rawA = fx.ringDir * (fx.ringA1 - fx.ringAngle(p));
            back = back == null ? wrapPi(rawA) : back + wrapPi(rawA - back);
            const spot = ringSpot(ri++, nR), d = back + (spot.to - back) * cl;
            fade = 1 - cl * (1 - spot.fade);
            fx.ringAt(fx.ringA1 - fx.ringDir * d, T);
            fx.ringAt(fx.ringA1 - fx.ringDir * back, T0);
            q = { x: T.x + (p.x - T0.x) * (1 - cl), y: T.y + (p.y - T0.y) * (1 - cl), z: T.z + (p.z - T0.z) * (1 - cl) };
          }
          if (p.ring && (g > 0 || fx.spin)) {
            const dx = q.x - R.x, dy = q.y - R.y, k = 1 - g;
            q = { x: R.x + (dx * cs - dy * sn) * k, y: R.y + (dx * sn + dy * cs) * k, z: R.z + (q.z - R.z) * k };
          }
          // fire that has streamed past the eye isn't drawn, and the line breaks there: fire older than it, left while
          // he was further off, can still be in front of us
          if (q.z > D * 0.8) { past = true; continue; }
          const s = project(q, c, D), life = p.ring ? 1 : 1 - p.age / p.life;
          // the ring and the loose fire either side of it are drawn apart: unlit points of no width between them break
          // the ribbon (with any width, the quads across the break would show as a wedge)
          if (wasRing !== null && (wasRing !== p.ring || p.cut || past) && sp.length) {
            const lastP = sp.at(-1)!;
            sp.push({ ...lastP, w: 0, a: 0 }, { x: s.x, y: s.y, w: 0, a: 0, h: lastP.h });
          }
          wasRing = p.ring;
          past = false;
          // it thins out as it streams past the eye, rather than blowing up over the screen
          let a = fade * Math.max(0, life) ** 1.6 * (p.ring ? 1 + g * 1.5 : 1) * Math.min(1, Math.max(0, (D * 0.8 - q.z) / (D * 0.3)));
          if (hs) { const r = Math.hypot(s.x - hs.x, s.y - hs.y); a *= Math.min(1, Math.max(0, (r - fx.holeR * 0.95) / (fx.holeR * 0.25))); }
          sp.push({ ring: p.ring, x: s.x, y: s.y, w: Math.min(70, p.w * s.k * (1 + (1 - life) * 1.6) * (p.ring ? 1 - g * 0.5 : 1)), a, h: p.ring ? 0.72 + 0.28 * g : p.h * (0.25 + 0.75 * life * life) });
        }
        const end = sp.at(-1) ?? { x: -1e4, y: -1e4 };
        // how many points each is from the break on its newer side and on its older side (the strip's ends, a break
        // between ring and loose fire, or where fire has gone): loose fire fades in and out over a few points there
        // rather than ending square, and so does the ring's first point while he's still flying it (once it's closed,
        // its two ends crossfade instead, ringSpot)
        const newer = sp.map(() => 0), older = sp.map(() => 0), isBreak = (q: { w: number; a: number }) => q.w === 0 && q.a === 0;
        for (let i = 0, n = 0; i < sp.length; i++) { n = isBreak(sp[i]!) ? 0 : n + 1; newer[i] = n; }
        for (let i = sp.length - 1, n = 0; i >= 0; i--) { n = isBreak(sp[i]!) ? 0 : n + 1; older[i] = n; }
        const edgeFade = (n: number) => Math.min(1, Math.max(0, (n - 1) / 3));
        let ptx = 0, pty = 0;
        for (let i = 0; i < max; i++) {
          const b = base + i * 2, q = sp[i];
          // past the end: every vertex on the last point, so the unused triangles cover nothing
          if (!q) { for (const o of [b, b + 1]) { pos[o * 3] = end.x; pos[o * 3 + 1] = end.y; aa[o] = 0; } continue; }
          const pa = sp[Math.max(0, i - 1)]!, pb = sp[Math.min(sp.length - 1, i + 1)]!;
          let tx = pb.x - pa.x, ty = pb.y - pa.y;
          const l = Math.hypot(tx, ty) || 1;
          tx /= l; ty /= l;
          // its sides never swap as the points bunch up and double back (he brakes): a swap twists the ribbon into stripes
          if (i > 0 && tx * ptx + ty * pty < 0) { tx = -tx; ty = -ty; }
          ptx = tx; pty = ty;
          // the ring's ends: at the nozzle, or at the break to the fire he leaves braking off it, and at its first point
          const ends = Math.min(1, (newer[i]! - 1) / 3) * edgeFade(older[i]!);
          const hw = q.w * 1.2, fadeIn = q.ring ? ends + (1 - ends) * cl : edgeFade(Math.min(newer[i]!, older[i]!));
          pos[b * 3] = q.x - ty * hw; pos[b * 3 + 1] = q.y + tx * hw; side[b] = -1;
          pos[b * 3 + 3] = q.x + ty * hw; pos[b * 3 + 4] = q.y - tx * hw; side[b + 1] = 1;
          aa[b] = aa[b + 1] = q.a * fadeIn * (i === sp.length - 1 ? 0 : 1);
          heat[b] = heat[b + 1] = q.h;
        }
        count += sp.length;
      }
      for (const n of ["position", "aSide", "aA", "aHeat"]) geo.attributes[n]!.needsUpdate = true;
      if (count) renderer.render(scene, camera);
    },
    warm(renderer: WebGLRenderer) { return renderer.compileAsync(scene, camera).catch(() => {}); },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
