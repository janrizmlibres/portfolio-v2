/**
 * The personal work, scene 13: the ribbon. Its frames are the pipeline's records grown: after the climax they come out
 * of Save's store, down the bore and out from under the shaft's foot, the record you fell with first, and each grows
 * into a frame as it swings out to its place on a spiral winding down round the shaft's axis (spiral.ts). No machine
 * holds them, since they're the pipeline's data: they stand free, as the stream's records fly. The camera comes round the spiral, each frame turning
 * square to you as it comes round; as the camera pulls out to Contact they slide on round the spiral as one chain
 * and go out by a hidden exit a step past the last, each shrinking into thin air there.
 * - A frame: a slab of black anodised metal with a chamfered edge, a screen set in it showing one screenshot, its back
 *   the face of the record it was (record.ts), its screen kept low as Save stored it.
 * - A screen is lit from within at a fixed level, a little dimmer seen edge on, as a real display is; the crawler's star
 *   lights only the metal round it, and glints off the glass as a frame turns, gone once it's square to you. Each
 *   screen is written in from its leading edge as its frame swings out, as the press wiped a page into a record at
 *   Extract.
 * - The metal's night side takes the region's light, so a frame turned from the star never reads as a hole, and where
 *   the star is behind a frame it wraps the chamfered edges as a rim. They're lit by the crawler's star, as the shaft
 *   is: its own key (crawler.ts) while the crawler's in, then the ribbon's, from the same star, once the crawler's gone
 *   (out of frame, while they're read).
 * The film sets `gal` and the time windows (`times`); nothing moves by the clock but a hard scroll's sway.
 */
import {
  BufferAttribute, BufferGeometry, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, Matrix4, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera,
  Quaternion, ShaderMaterial, Shape, ShapeGeometry, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderTarget,
  type Camera, type Material, type Scene, type Texture, type WebGLRenderer,
} from "three";
import { OWN_PROJECTS } from "@/lib/content/voyage";
import { registerSubject } from "@/lib/film/pointer";
import { stillsStale } from "@/lib/film/stage";
import { inTurn } from "@/lib/film/turns";
import type { SubjectHit } from "@/lib/film/hand";
import { lightBy } from "./dark-lights";
import { matchLights, neutralOut, raw } from "./lit";
import { recordAtlas, recordFace } from "./record";
import { exitOf, faceOf, framesOn, outOf, outPose } from "./spiral";
import { REC } from "./swarm";
import { UP, type World } from "./world";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** a frame's thickness, its chamfer, its corner, the bezel round its screen (world units; its height is 0.0125) */
const THICK = 0.0007, CHAMFER = 0.00012, CORNER = 0.00075, BEZEL = 0.00055;
/** a record's long side, as the swarm draws it (1.6 times its width) */
const REC_LONG = REC * 1.6;
/** how far a frame comes off the spiral towards you as it turns to you, less on a portrait screen */
export const RIBBON_LIFT = { land: 0.008, port: 0.004 };

// ---------------------------------------------------------------- a screen: lit from within
const SCREEN_VS = /* glsl */ `
  varying vec2 vUv; varying vec3 vN, vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }`;
const SCREEN_FS = /* glsl */ `
  uniform sampler2D uMap; uniform float uVis, uWrite, uGlint, uCrop, uReady;
  uniform vec3 uKey; uniform vec4 uTZ;
  varying vec2 vUv; varying vec3 vN, vV;
  void main() {
    vec3 N = normalize(vN), Vd = normalize(vV);
    float ndv = clamp(dot(N, Vd), 0.0, 1.0);
    // the screenshot covers the frame, cropped at its sides to the frame's shape
    vec3 img = texture2D(uMap, vec2(0.5 + (vUv.x - 0.5) * uCrop, vUv.y)).rgb;
    // written in from the leading edge (its left, as you face it), a thin line of light where it's being written
    float w = uReady * smoothstep(vUv.x - 0.012, vUv.x + 0.012, uWrite);
    float edge = uReady * exp(-pow((vUv.x - uWrite) / 0.007, 2.0)) * step(0.002, uWrite) * step(uWrite, 0.998);
    vec3 c = mix(vec3(0.016, 0.018, 0.024), img * 0.92 * mix(0.6, 1.0, ndv), w);
    c += vec3(0.8, 0.88, 1.0) * edge * 0.45;
    // the star off the glass: a tight glint and a broad sheen
    float rl = max(dot(reflect(-Vd, N), uKey), 0.0);
    c += vec3(1.0, 0.95, 0.86) * (pow(rl, 220.0) * 1.3 + pow(rl, 14.0) * 0.05) * uGlint;
    if (uTZ.x > 0.5) c *= mix(uTZ.w, 1.0, smoothstep(uTZ.y, uTZ.z, uTZ.x < 1.5 ? gl_FragCoord.x : gl_FragCoord.y));
    gl_FragColor = vec4(c, uVis);
  }`;

/** a frame's outline, inset `inset` from its edge, its corners rounded */
function frameShape(w: number, h: number, inset: number) {
  const X = w / 2 - inset, Y = h / 2 - inset, r = Math.max(0.0002, CORNER - inset), pts: Vector2[] = [];
  for (const [cx, cy, a0] of [[X - r, Y - r, 0], [-X + r, Y - r, 0.5], [-X + r, -Y + r, 1], [X - r, -Y + r, 1.5]] as const) {
    for (let j = 0; j <= 6; j++) { const a = (a0 + j / 12) * Math.PI; pts.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  }
  return new Shape(pts);
}

/** uv over the whole frame for a geometry laid out in its plane; on the `back` the record's face lies along it */
function frameUv(g: BufferGeometry, w: number, h: number, back = false) {
  const p = g.attributes.position!, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) + w / 2) / w, v = (p.getY(i) + h / 2) / h;
    // the record is laid out standing (1 across, 1.6 long): on its side, it's the frame's own shape
    if (back) { uv[i * 2] = v; uv[i * 2 + 1] = 1 - u; } else { uv[i * 2] = u; uv[i * 2 + 1] = v; }
  }
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  return g;
}

/** a frame's three parts: its anodised body (chamfered), its screen, and its back (the record's face) */
function frameParts(w: number, h: number) {
  const body = new ExtrudeGeometry(frameShape(w, h, CHAMFER), {
    depth: THICK - 2 * CHAMFER, bevelEnabled: true, bevelThickness: CHAMFER, bevelSize: CHAMFER, bevelSegments: 1, curveSegments: 6,
  });
  body.translate(0, 0, -(THICK - 2 * CHAMFER) / 2);
  const screen = frameUv(new ShapeGeometry(frameShape(w, h, BEZEL), 6), w, h);
  screen.translate(0, 0, THICK / 2 + 0.000004);
  const back = frameUv(new ShapeGeometry(frameShape(w, h, CHAMFER * 2), 6), w, h, true);
  back.translate(0, 0, -THICK / 2 - 0.000004);
  return { body, screen, back };
}

export function createRibbon(c: {
  W: World;
  owned: Owned;
  /** the space the metal reflects */
  env: Texture;
  /** the region's light as it fills a night side (linear), followed every frame */
  fill: Color;
  renderer: WebGLRenderer;
}) {
  const { W, owned } = c;
  const RB = W.RIB, H = RB.H, Wd = RB.H * RB.A, N = RB.cards.length, STEP = RB.step;
  const root = new Object3D();
  /** what the film sets: `vis` fades it all, `exit` takes the frames out by the spiral's hidden exit (0..1) */
  const gal = { vis: 1, exit: 0 };
  let T = { F0: 1e9, F1: 1e9, G1: 1e9 }, thOf: (t: number) => number = () => 0;
  let fling = 0, hidden = false;

  // ---------------------------------------------------------------- where they stand, and where they come out of
  const frames = framesOn({ axis: RB.axis, R: RB.R, drop: RB.drop, a0: RB.a0 }, RB.cards.map((cd) => cd.ang));
  const qRest = frames.map((f) => new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(f.x, f.y, f.n)));

  // ---------------------------------------------------------------- the crawler's star on the metal
  // its key is the crawler's own (crawler.ts) while the crawler's in, lighting the shaft over them, then this one, from
  // the same star: never both, and the metal takes only that star's
  const toStar = W.CRW.lightP.clone().sub(W.CRW.P).normalize(), starCol = raw("#fff1dc"), L = matchLights();
  const key = new DirectionalLight(starCol, 0), keyAt = new Object3D();
  keyAt.position.copy(RB.axis);
  key.position.copy(RB.axis).addScaledVector(toStar, 0.2);
  key.target = keyAt;
  root.add(key, keyAt);

  // ---------------------------------------------------------------- the metal: the text zone, its night fill, its rim
  // The text zone: bodies dim where the lines are read (`uTZ`: the mode, 0 off, 1 across x, 2 up y; where the dimming
  // ends and the frame is whole, device px; how dim). The night fill: the region's light, so a side turned from the
  // star reads as dark metal, never a hole. The rim: the star from behind a frame, wrapping its edges.
  const TZ = { value: new Vector4(0, 0, 1, 1) };
  const LT = { uFill: { value: new Color() }, uKeyV: { value: new Vector3(0, 0, 1) }, uRimC: { value: starCol.clone().multiplyScalar(1.4) } };
  // Every surface fades with the ribbon (`gal.vis`), but it's drawn as an opaque surface whenever it's whole: a
  // transparent one is drawn far to near with nothing hidden skipped, and a two-sided one twice, which cost the scene
  // ~4 ms of GPU at 1440 with the frames filling the view. Both kinds of program compile in `warm`.
  const surfaces: Material[] = [];
  const fadeTo = (m: Material, a: number) => {
    const t = a < 0.999;
    if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; }
  };
  const finish = <M extends MeshStandardMaterial>(m: M, keyName: string, fill = 0) => {
    m.envMap = c.env;
    m.envMapIntensity = m.metalness > 0.2 ? 1 : 0.25;
    m.transparent = false;
    surfaces.push(m);
    owned.push(m);
    neutralOut(m);
    const before = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      before.call(m, sh, r);
      Object.assign(sh.uniforms, LT, { uTZ: TZ });
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "uniform vec4 uTZ; uniform vec3 uFill, uKeyV, uRimC;\nvoid main() {")
        .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
          reflectedLight.indirectDiffuse += uFill * ${fill.toFixed(2)} * material.diffuseColor;
          {
            vec3 Vd = normalize(vViewPosition);
            float back = clamp(dot(uKeyV, -Vd), 0.0, 1.0);
            reflectedLight.directSpecular += uRimC * pow(1.0 - clamp(dot(normal, Vd), 0.0, 1.0), 4.0) * back * back;
          }`)
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
          if (uTZ.x > 0.5) gl_FragColor.rgb *= mix(uTZ.w, 1.0, smoothstep(uTZ.y, uTZ.z, uTZ.x < 1.5 ? gl_FragCoord.x : gl_FragCoord.y));`);
    };
    m.customProgramCacheKey = () => `rib-${keyName}`;
    return m;
  };
  // every key light stays in the scene all film long (rig.ts), and each reaches every surface: the metal takes only
  // the crawler's (set last, as it keys the program on what came before)
  const OWN = { value: toStar };
  const own = <M extends MeshStandardMaterial>(m: M) => lightBy(m, OWN) as M;
  const metal = own(finish(new MeshStandardMaterial({ color: raw("#1d1e23"), metalness: 0.62, roughness: 0.34 }), "anodised", 0.6));
  // the back: the face of the record it was (record.ts), black glass over its fields, its screen kept low as Save stored
  // it; seen from inside the spiral it faces the star more often than the frame's screen does
  const atlas = recordAtlas();
  owned.push(atlas);
  const backMat = recordFace(own(finish(new MeshStandardMaterial({ color: raw("#ffffff"), side: DoubleSide }), "back", 4)), atlas, { on: 0.35, cell: 0 });
  // the back and the screen lie on the body's faces: drawn in front of them at any size (a frame comes out a record's
  // size, a fraction of its own, where any gap between them is below the depth buffer's grain)
  backMat.polygonOffset = true;
  backMat.polygonOffsetFactor = -1;
  backMat.polygonOffsetUnits = -4;

  // ---------------------------------------------------------------- the screenshots, small on a phone
  // They're past the first scene, so they load after the wake (the page's first load is the opening's), one after
  // another in the ribbon's order, each up to the GPU as it arrives rather than the first time it's seen.
  const small = typeof matchMedia !== "undefined" && matchMedia("(max-width: 700px)").matches;
  const loader = new TextureLoader();
  const shots = RB.cards.map((cd) => {
    const u = {
      uMap: { value: null as Texture | null }, uVis: { value: 0 }, uWrite: { value: 0 }, uGlint: { value: 0 }, uCrop: { value: 1 }, uReady: { value: 0 },
      uKey: LT.uKeyV, uTZ: TZ,
    };
    const name = cd.img.replace(/^\/projects\/(\w+)\/(\d+)\.png$/, "$1-$2");
    const m = new ShaderMaterial({ uniforms: u, vertexShader: SCREEN_VS, fragmentShader: SCREEN_FS, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    owned.push(m);
    return { u, m, src: `/voyage/ribbon/${name}${small ? "-1024" : ""}.webp` };
  });
  let gone = false, shotsIn = () => {};
  const shotsReady = new Promise<void>((done) => (shotsIn = done));
  const loadShot = (k: number) => {
    const shot = shots[k];
    if (!shot || gone) return shotsIn();
    // each up in a turn of its own, never two in one frame
    loader.load(shot.src, (tex) => void inTurn(() => {
      if (gone) return tex.dispose();
      tex.anisotropy = 8;
      const img = tex.image as { width: number; height: number };
      shot.u.uCrop.value = Math.min(1, RB.A / (img.width / img.height));
      shot.u.uMap.value = tex;
      shot.u.uReady.value = 1;
      owned.push(tex);
      c.renderer.initTexture(tex);
      // a reduced-motion still taken before it arrived is taken again
      stillsStale();
      loadShot(k + 1);
    }), undefined, () => loadShot(k + 1));
  };
  // under the wake-up's loader, with every scene (ADR 0018)
  loadShot(0);

  // ---------------------------------------------------------------- the frames
  const parts = frameParts(Wd, H);
  owned.push(parts.body, parts.screen, parts.back);
  const cards = RB.cards.map((_, k) => {
    const obj = new Object3D();
    obj.matrixAutoUpdate = false;
    root.add(obj);
    const s = new Mesh(parts.screen, shots[k]!.m);
    s.renderOrder = 1;
    // a frame out of frame isn't drawn (most of the spiral is behind or beside the camera as it comes round)
    obj.add(new Mesh(parts.body, metal), s, new Mesh(parts.back, backMat));
    return obj;
  });
  const ready = shotsReady;

  // in development, a handle for the measuring scripts
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") (window as unknown as { __ribbon: unknown }).__ribbon = { root, metal, backMat, shots, frames, hide: () => { hidden = true; } };

  // ---------------------------------------------------------------- the pointer: the frame square to you is asked about
  const hits: Array<SubjectHit | null> = OWN_PROJECTS.map(() => null);
  const unregister = OWN_PROJECTS.map((p, j) => registerSubject({ id: `own-${p.slug}`, label: p.title, q: `Tell me about ${p.title}.`, hit: () => hits[j]! }));

  // ---------------------------------------------------------------- per frame
  const m4 = new Matrix4(), q = new Quaternion(), qF = new Quaternion(), qT = new Quaternion(), s3 = new Vector3();
  const pos = new Vector3(), toCam = new Vector3(), zx = new Vector3(), zy = new Vector3(), tmp = new Vector3(), pv = new Vector3();
  const X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0);
  const M = frames.map(() => new Matrix4());
  const outs = frames.map(() => [0, 0] as [number, number]);
  /** a record's size, as a fraction of a frame's (its long side along the frame's width) */
  const recSize = REC_LONG / Wd;
  /** the last frame's angle round the spiral: the hidden exit is a step past it */
  const END = RB.cards.at(-1)!.ang;

  // the star's direction as the camera that draws a part sees it, set as the part is drawn: the film poses the camera
  // only when it draws, so a still (a jump to a reading spot) would otherwise light the metal from the last frame's view
  const keyFor = (_r: WebGLRenderer, _s: Scene, cam: Camera) => { LT.uKeyV.value.copy(toStar).transformDirection(cam.matrixWorldInverse); };
  root.traverse((o) => { if ((o as Mesh).isMesh) o.onBeforeRender = keyFor; });

  /**
   * `eye`: where the camera is for this frame, as the film has posed it (the camera itself takes the pose as it draws);
   * `starLit`: whether the crawler's key, from the same star, is lighting them this frame
   */
  function update(t: number, camera: Camera, size: { w: number; h: number }, dpr: number, eye?: Vector3, starLit = false) {
    const shown = !hidden && gal.vis > 0.004 && t > outs[0]![0] && t < T.G1 + 2;
    root.visible = shown;
    key.intensity = shown && !starLit ? L.key : 0;
    hits.fill(null);
    if (!shown) return;
    const cam = eye ?? camera.position, now = performance.now() / 1000;
    const port = size.w / size.h < 0.8, LIFT = port ? RIBBON_LIFT.port : RIBBON_LIFT.land;
    // on a portrait screen the lines start about 0.59 of the way down: whatever's below that dims, the frame above it
    // doesn't
    if (port) TZ.value.set(2, size.h * 0.4 * dpr, size.h * 0.47 * dpr, 0.14);
    else TZ.value.set(1, size.w * 0.3 * dpr, size.w * 0.4 * dpr, 0.12);
    // the region's light, most of the way to grey, as the ship's night side takes it
    const g = c.fill.r * 0.2126 + c.fill.g * 0.7152 + c.fill.b * 0.0722;
    LT.uFill.value.setRGB(g, g, g).lerp(c.fill, 0.35);

    const th = thOf(t), on = smooth(T.F1 + 0.15, T.F1 + 0.6, t) * (1 - smooth(T.G1 - 0.2, T.G1 + 0.4, t));
    const faces = RB.cards.map((cd) => on * smooth(0, 1, faceOf(th, cd.ang, STEP)));
    for (let k = 0; k < N; k++) {
      const f = frames[k]!, [a, b] = outs[k]!, u = smooth(a, b, t);
      // on its way out: down the bore from the store, growing as it swings out to its place and tipping up to stand
      const o = outPose(RB.store, f, u, recSize, pos);
      q.copy(qRest[k]!).multiply(qT.setFromAxisAngle(X, (1 - o.tilt) * Math.PI * 0.5));
      // going out by the hidden exit as the camera pulls out: on round the spiral, standing as it would there, shrinking
      const ex = exitOf(f.ang, gal.exit, END, STEP);
      if (gal.exit > 0) {
        const at = RB.a0 + ex.ang;
        pos.set(RB.axis.x + Math.cos(at) * RB.R, RB.axis.y - ex.ang * RB.drop, RB.axis.z + Math.sin(at) * RB.R);
        q.setFromRotationMatrix(m4.makeBasis(zx.set(Math.sin(at), 0, -Math.cos(at)), UP, zy.set(Math.cos(at), 0, Math.sin(at))));
      }
      // turned square to you as the camera comes round, and lifted off the spiral towards you
      const e = faces[k]!;
      if (e > 0.001) {
        toCam.copy(cam).sub(pos).normalize();
        zx.crossVectors(UP, toCam).normalize();
        zy.crossVectors(toCam, zx);
        qF.setFromRotationMatrix(m4.makeBasis(zx, zy, toCam));
        pos.lerp(tmp.copy(pos).addScaledVector(toCam, LIFT), e);
        q.slerp(qF, e);
      }
      // a hard scroll sways it on its upright, each a beat after the one before
      if (fling > 0.001 && u >= 1) q.multiply(qT.setFromAxisAngle(Y, fling * 0.32 * Math.sin(now * 5.2 - k * 0.9)));
      const size = o.size * ex.size;
      M[k]!.compose(pos, q, s3.setScalar(Math.max(1e-6, size)));

      // what's shown of it: from as it leaves the store, its screen written in as it swings out, and lit till it's all
      // but gone into the exit
      const vis = gal.vis * smooth(a, a + 0.06, t) * smooth(0, 0.25, ex.size) * (size > 0.004 ? 1 : 0);
      const sh = shots[k]!.u;
      sh.uVis.value = vis;
      fadeTo(shots[k]!.m, vis);
      sh.uWrite.value = smooth(0.55, 0.95, u);
      // the glint as a frame turns; gone once it's square to you
      sh.uGlint.value = 1 - smooth(0.6, 0.95, e);
      cards[k]!.visible = vis > 0.004;
      cards[k]!.matrix.copy(M[k]!);
      cards[k]!.matrixWorldNeedsUpdate = true;
    }
    for (const m of surfaces) { m.opacity = gal.vis; fadeTo(m, gal.vis); }

    // the frame square to you is what the pointer asks about, by its project
    OWN_PROJECTS.forEach((p, j) => {
      let best = -1, be = 0.5;
      RB.cards.forEach((cd, k) => { if (cd.slug === p.slug && faces[k]! > be) { be = faces[k]!; best = k; } });
      if (best < 0 || gal.vis < 0.3) return;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
        pv.set((sx! * Wd) / 2, (sy! * H) / 2, 0).applyMatrix4(M[best]!).project(camera);
        return { x: (pv.x * 0.5 + 0.5) * size.w, y: (-pv.y * 0.5 + 0.5) * size.h, z: pv.z };
      });
      if (pts.every((pt) => pt.z < 1)) hits[j] = { kind: "quad", pts };
    });
  }

  return {
    root,
    gal,
    ready,
    /** its key light, from the crawler's star */
    key,
    /** the frames, each its body, screen and back (the warp carries a couple of them off down its throat) */
    frames: () => cards,
    /** the scene's times (film), and the camera's angle round the spiral at a time */
    times(o: { F0: number; F1: number; G1: number; thOf: (t: number) => number }) {
      T = { F0: o.F0, F1: o.F1, G1: o.G1 };
      thOf = o.thOf;
      outs.forEach((w, k) => { [w[0], w[1]] = outOf(k, N, T); });
    },
    fling(v: number) { fling = v; },
    update,
    /** draws it once off screen, everything shown, so its shaders compile before it's seen */
    warm(renderer: WebGLRenderer, scene: Scene) {
      const was = root.visible, culled: Object3D[] = [];
      root.visible = true;
      for (const cd of cards) cd.visible = true;
      // every part drawn, in frame or not
      root.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
      const cam = new PerspectiveCamera(40, 1, 0.001, 2);
      cam.position.copy(frames[0]!.P).addScaledVector(frames[0]!.n, 0.06);
      cam.lookAt(frames[0]!.P);
      cam.updateMatrixWorld();
      const rt = new WebGLRenderTarget(4, 4), prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      // whole and fading, so neither kind of program compiles the first time it's seen
      const all = [...surfaces, ...shots.map((x) => x.m)];
      for (const a of [0.5, 1]) {
        all.forEach((m) => fadeTo(m, a));
        renderer.render(scene, cam);
      }
      renderer.setRenderTarget(prev);
      rt.dispose();
      for (const o of culled) o.frustumCulled = true;
      root.visible = was;
    },
    dispose() {
      gone = true;
      unregister.forEach((u) => u());
    },
  };
}

export type Ribbon = ReturnType<typeof createRibbon>;
