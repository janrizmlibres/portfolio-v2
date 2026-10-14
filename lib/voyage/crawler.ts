/**
 * The AI Web Crawler, in the ship's family (documentary-real, lit by its own star through PBR Neutral):
 * - It's a refinery craft clamped onto a captured rock: its processing column a clamshell fairing over the pipeline
 *   folded inside, its output port on top, where the records leave; the rock held at its flank by three jointed arms
 *   and fed in by a ribbed chute, riding the half that faces it; a solar wing on a mast off its service ring.
 * - The lens (Edolus's x-ray): before it opens, a soft-edged lens round the pointer turns its shell to a ghost, so the
 *   pipeline inside shows: the fairing reads as a thin skin, its edges and panel lines faint over the dark inside. It
 *   stays open while the pointer rests on it. On a touch screen it opens once at its centre while it's read; under
 *   reduced motion its still shows it open there.
 * - It opens by splitting into two halves that part, and the pipeline unfolds down out of the gap: its rings drop to
 *   their places in the shaft below, each opening out to full size once it's clear.
 * - The pipeline (pipeline.ts) is held folded inside it: its rings stacked up the gallery, a pulse of light running
 *   down them, and records falling through.
 * - Its two companions: a relay satellite, its dish held on the refinery (the Crawler Dashboard), and a service tug
 *   with a robotic arm (the Data Maintenance Pipeline).
 * Every state a scene changes is a plain number the film sets: `vis`, `open` (0..1), `deploy` (0..1), the moons' `ang`.
 */
import {
  Box3, CylinderGeometry, DirectionalLight, Frustum, FrontSide, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial, Object3D, PerspectiveCamera, Quaternion, Sphere, Vector3, WebGLRenderTarget,
  type BufferGeometry, type Camera, type Material, type Scene, type Texture, type WebGLRenderer,
} from "three";
import { fadeMaterial } from "./fade";
import { voyageLoader, warmInTurn } from "./loading";
import { pointer as pt, registerSubject } from "@/lib/film/pointer";
import { getTier } from "@/lib/film/tier";
import { matchLights, neutralOut, raw } from "./lit";
import { recordSlate, slateState } from "./record";
import type { Pipeline } from "./pipeline";
import { FOLD as F, SERVICE, ringRadius, strut, swingOf } from "./refinery";
import { occludeDirect } from "./ships";
import { UP, type World } from "./world";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ease = (from: number, to: number, dt: number, tau: number) => from + (to - from) * (1 - Math.exp(-dt / tau));

/**
 * the lens: its radius as a fraction of the screen's height (Edolus's 0.18), and of its disc at most; opened on its own
 * (touch, the still), at most `own` of its disc, inside the fairing
 */
const LENS = { h: 0.18, disc: 0.9, own: 0.3, soft: 0.2 };
const FALLING = 40;

// ---------------------------------------------------------------- the lens, in its shell's shader
// Inside the lens the shell is a ghost: its own light at a twelfth, with a faint rim where it turns from you, and its
// depth pushed to the back so the pipeline inside draws over it (Edolus's x-ray). A white fairing is drawn as a thin
// skin: its silhouette and its panel lines (where its map is darker) faint white over the dark inside. The edge is soft
// and drifts a little (fbm), and a stipple decides, pixel by pixel across it, which side of the edge a pixel's depth
// falls on.
const LENS_DECL = /* glsl */ `
  uniform vec3 uLens; uniform float uSoft, uTime;
  float lh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ln(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(lh(i), lh(i + vec2(1, 0)), f.x), mix(lh(i + vec2(0, 1)), lh(i + vec2(1, 1)), f.x), f.y); }
  float lfbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * ln(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
  float lbayer(vec2 p) { vec2 q = mod(floor(p), 4.0); float b = 0.0;
    b = mod(q.x, 2.0) * 2.0 + mod(q.y + q.x, 2.0); b = b * 4.0 + mod(floor(q.x / 2.0), 2.0) * 2.0 + mod(floor(q.y / 2.0) + floor(q.x / 2.0), 2.0);
    return (b + 0.5) / 16.0; }`;
const lensEnd = (skin: boolean) => /* glsl */ `
  {
    float inL = 0.0;
    if (uLens.z > 0.5) {
      vec2 d = (gl_FragCoord.xy - uLens.xy) / uLens.z;
      float warp = (lfbm(d * 2.0 + uTime * 0.05) - 0.5) * 0.7;
      inL = 1.0 - smoothstep(1.0 - uSoft, 1.0, length(d) + warp * uSoft * 0.5);
    }
    bool through = inL > lbayer(gl_FragCoord.xy) * 0.98 + 0.01;
    float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
    ${skin ? `float line = 1.0 - smoothstep(0.33, 0.42, dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)));
    vec3 ghost = gl_FragColor.rgb * 0.04 + vec3(0.78, 0.82, 0.9) * (fres * 0.4 + line * 0.2);` : `vec3 ghost = gl_FragColor.rgb * 0.08 + vec3(0.62, 0.68, 0.8) * fres * 0.22;`}
    gl_FragColor.rgb = mix(gl_FragColor.rgb, ghost, inL);
    gl_FragDepth = through ? 0.999999 : gl_FragCoord.z;
  }`;

export function createCrawler(c: {
  W: World;
  owned: Owned;
  renderer: WebGLRenderer;
  scene: Scene;
  /** the space the hardware's metal reflects */
  env: Texture;
  /** its pipeline, whose rings it holds folded and drops (pipeline.ts) */
  pipe: Pipeline;
}) {
  const { W, owned } = c;
  const P0 = W.CRW.P;
  const Rl = W.CRW.r * W.CRW.size; // its long radius, drawn
  let scale = 1;
  const root = new Object3D();
  const tier = getTier();

  /** `vis` fades it in and out, `open` parts it, `deploy` unfolds the pipeline down out of it (0..1) */
  const crawler = { obj: root, vis: 0, open: 0, deploy: 0 };

  // ---------------------------------------------------------------- its pose: upright, turning about its short axis
  const body = new Object3D(), spinner = new Object3D();
  body.position.copy(P0);
  body.add(spinner);
  root.add(body);

  // ---------------------------------------------------------------- its star's light, with shadows
  const L = matchLights(), starCol = raw("#fff1dc");
  const key = new DirectionalLight(starCol, 0);
  const toStar = W.CRW.lightP.clone().sub(P0).normalize();
  const reach = W.CRW.r * 3.6;
  key.position.copy(P0).addScaledVector(toStar, reach * 2);
  key.target = body;
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -reach; sc.right = sc.top = reach; sc.near = reach * 0.5; sc.far = reach * 3.5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = Rl * 0.004;
  key.shadow.intensity = 0.85;
  root.add(key);
  // while the pipeline falls its key's shadow follows the fall, a box round the stage being passed, so its rings,
  // fixtures and mast shade each other and what falls through them; otherwise it covers the crawler
  const shadowAt = new Object3D();
  root.add(shadowAt);
  let shadowOnFall = false;
  const aimShadow = (depth: number | null) => {
    const fall = depth !== null;
    if (fall) {
      shadowAt.position.copy(W.shaft.at(Math.max(0, depth)));
      key.position.copy(shadowAt.position).addScaledVector(toStar, W.shaft.R * 12);
    }
    if (fall === shadowOnFall) return;
    shadowOnFall = fall;
    const half = fall ? W.shaft.R * 3.2 : reach;
    key.target = fall ? shadowAt : body;
    if (!fall) key.position.copy(P0).addScaledVector(toStar, reach * 2);
    sc.left = sc.bottom = -half; sc.right = sc.top = half;
    sc.near = fall ? W.shaft.R * 4 : reach * 0.5; sc.far = fall ? W.shaft.R * 20 : reach * 3.5;
    sc.updateProjectionMatrix();
    key.shadow.needsUpdate = true;
  };

  // ---------------------------------------------------------------- materials
  const mats: MeshStandardMaterial[] = [];
  const lensU = { uLens: { value: new Vector3() }, uSoft: { value: LENS.soft }, uTime: { value: 0 } };
  const finish = (m: MeshStandardMaterial) => {
    m.transparent = true;
    m.side = FrontSide;
    m.envMap = c.env;
    m.envMapIntensity = m.metalness > 0.2 ? 1 : 0.25;
    mats.push(m);
    owned.push(m);
    for (const t of Object.values(m)) if ((t as Texture)?.isTexture && t !== c.env) owned.push(t as Texture);
    return m;
  };
  /**
   * its shell, in two versions: one the lens turns to a ghost, drawn only while a lens is open (its pushed-back depth
   * turns off the GPU's early depth test, so every hidden wall inside would be shaded too), and one plain. `skin` draws
   * the ghost as a thin white skin (the fairing's panels).
   */
  const lensed = (m: MeshStandardMaterial, lens: boolean, skin: boolean) => {
    const before = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      Object.assign(sh.uniforms, lensU);
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", `${lens ? LENS_DECL : ""}\nvoid main() {`)
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>\n${lens ? lensEnd(skin) : ""}`);
      before.call(m, sh, r);
    };
    m.customProgramCacheKey = () => `crawler-${skin ? "skin" : "shell"}-${lens ? "lens" : "plain"}`;
    return m;
  };
  // each shell mesh, with its plain and its lensed materials, swapped as the lens opens and closes
  const shells: Array<{ mesh: Mesh; plain: Material | Material[]; lens: Material | Material[] }> = [];
  let lensOn = false;
  const lensShell = (on: boolean) => {
    if (on === lensOn) return;
    lensOn = on;
    for (const x of shells) x.mesh.material = on ? x.lens : x.plain;
  };

  // ---------------------------------------------------------------- its halves
  type Half = { obj: Object3D; dir: Vector3; base: Vector3 };
  const halves: Half[] = [];
  const loader = voyageLoader();
  const load = (url: string) => new Promise<Object3D | null>((res) => loader.load(url, (g) => res(g.scene), undefined, () => res(null)));
  const prep = (model: Object3D, shell: boolean) => {
    model.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      m.renderOrder = -1;
      if (shell) m.onBeforeRender = (_r, _s, camera) => aimOnce(camera);
      owned.push(m.geometry);
      const list = Array.isArray(m.material) ? m.material : [m.material];
      // a part's materials are its own copies (each carries its own baked occlusion), named `<material>.001` and on
      const named = (s: MeshStandardMaterial) => s.name.replace(/\.\d+$/, "");
      const tune = (s: MeshStandardMaterial) => {
        occludeDirect(neutralOut(s));
        // rock is near black in truth (albedo ~0.04); its maps are drawn a little brighter, so its relief reads
        if (named(s) === "rock" || named(s) === "moonlet") s.color.multiplyScalar(0.7);
        // the refinery's white panels, drawn under a full white so they don't burn out in its star's key light
        if (named(s) === "hull white") s.color.multiplyScalar(0.6);
        return s;
      };
      const skin = (s: MeshStandardMaterial) => named(s) === "hull white";
      if (!shell) {
        const out = list.map((x) => (mats.includes(x as MeshStandardMaterial) ? x : finish(tune(x as MeshStandardMaterial))));
        m.material = Array.isArray(m.material) ? out : out[0]!;
        return;
      }
      const plain = list.map((x) => { const s = x as MeshStandardMaterial; return finish(lensed(tune(s.clone()), false, skin(s))); });
      const lens = list.map((x) => { const s = x as MeshStandardMaterial; return finish(lensed(tune(s), true, skin(s))); });
      const pick = (a: Material[]) => (Array.isArray(m.material) ? a : a[0]!);
      shells.push({ mesh: m, plain: pick(plain), lens: pick(lens) });
      m.material = pick(lensOn ? lens : plain);
    });
  };
  const bodyReady = load("/voyage/crawler/refinery.glb").then((model) => {
    if (!model) return;
    model.scale.setScalar(Rl);
    spinner.add(model);
    for (let k = 0; k < 2; k++) {
      const h = model.getObjectByName(`half${k}`);
      if (!h) continue;
      prep(h, true);
      // its direction: from its axis through its middle, flat to its equator (the model's offset and scale live in
      // the node, so the geometry is read through its matrix)
      h.updateMatrix();
      const mid = new Vector3(), p = new Vector3();
      h.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        const toModel = h.matrix.clone().multiply(m === h ? new Matrix4() : m.matrix);
        const pos = m.geometry.attributes.position!;
        for (let i = 0; i < pos.count; i += 7) { mid.add(p.fromBufferAttribute(pos, i).applyMatrix4(toModel)); }
      });
      halves.push({ obj: h, dir: V(mid.x, 0, mid.z).normalize(), base: h.position.clone() });
    }
    aimSeam();
    const frame = model.getObjectByName("frame");
    if (frame) {
      stripStruts(frame);
      prep(frame, false);
      // its struts, made here so they can draw back clear of the dropping rings, in the frame's own grey
      const grey = materialOf(frame, "hull grey");
      const geo = new CylinderGeometry(0.008, 0.008, 1, 8, 1, true);
      owned.push(geo);
      for (let j = 0; j < 3; j++) {
        const m = new Mesh(geo, grey);
        m.castShadow = m.receiveShadow = true;
        model.add(m);
        struts.push(m);
      }
      swung = -1;
    }
  });
  // the service ring's struts, drawn back by how far it's opened and how low its rings have dropped
  const struts: Mesh[] = [];
  let swung = -1;
  const sA = new Vector3(), sB = new Vector3();
  const swingStruts = (swing: number) => {
    if (Math.abs(swing - swung) < 1e-4) return;
    swung = swing;
    struts.forEach((m, j) => {
      const { A, B } = strut(j, swing);
      sA.set(...A); sB.set(...B);
      m.position.copy(sA).add(sB).multiplyScalar(0.5);
      sB.sub(sA);
      m.visible = sB.length() > 1e-3;
      m.scale.set(1, Math.max(1e-3, sB.length()), 1);
      m.quaternion.setFromUnitVectors(UP, sB.normalize());
    });
  };

  // ---------------------------------------------------------------- the pipeline, folded: its rings are the pipeline's own
  // (pipeline.ts), placed here while they're inside and dropping out; records falling through them while folded, the
  // pipeline in miniature: web pages at the top, records once past the press, their missing fields lit warm once past
  // the heaters
  const pl = c.pipe;
  const folds = W.shaft.levels.map((l, k) => ({
    fold: F.foldH - (2 * F.foldH * k) / Math.max(1, W.shaft.levels.length - 1), full: W.shaft.at(l.d),
  }));
  const press = W.shaft.levels.findIndex((l) => l.id === "extract"), heaters = W.shaft.levels.findIndex((l) => l.id === "enrich");
  const rec = recordSlate();
  owned.push(rec.geo, rec.atlas);
  const falling = new InstancedMesh(rec.geo, finish(rec.mat), FALLING);
  const fallingState = slateState(falling, () => [0, 0, 1]);
  falling.frustumCulled = false;
  const pipeRoot = new Object3D();
  root.add(pipeRoot);
  pipeRoot.add(falling);

  // ---------------------------------------------------------------- its companions
  type Moon = { obj: Object3D; m: World["moons"][number]; ang: number; vis: number; model: Object3D | null; speed: number };
  const moons: Moon[] = W.moons.filter((m) => m.of === "ai-web-crawler").map((m) => {
    const obj = new Object3D();
    obj.position.copy(W.moonAt(m, m.phase));
    root.add(obj);
    return { obj, m, ang: m.phase, vis: 0, model: null, speed: m.speed };
  });
  // the relay is `craft0`, the tug `craft1`; each faces the refinery with its dish or its arm (the model's +z)
  const moonsReady = load("/voyage/crawler/companions.glb").then((model) => {
    if (!model) return;
    moons.forEach((x) => {
      const dash = x.m.slug === "crawler-dashboard";
      const one = model.getObjectByName(dash ? "craft0" : "craft1");
      if (!one) return;
      one.removeFromParent();
      one.position.set(0, 0, 0);
      one.scale.setScalar(x.m.r);
      prep(one, false);
      x.obj.add(one);
      x.model = one;
    });
  });

  // ---------------------------------------------------------------- the lens
  let tArrive = 0, tOpen = 0, spinOpen = 0;
  // the turn that brings its seam square to the camera as it opens (from where the camera looks then), the half
  // without the rock parting to the right, so the rock stays on the side its title is; once its halves are loaded, as
  // until then there's no seam to turn
  const seamFor = new Vector3(0, 0, 1);
  const aimSeam = () => {
    const d0 = halves[1]?.dir;
    if (!d0) return;
    const right = new Vector3().crossVectors(seamFor.clone().negate(), UP).normalize();
    spinOpen = Math.atan2(right.x, right.z) - Math.atan2(d0.x, d0.z);
  };
  const lens = { x: 0, y: 0, r: 0, on: false };
  const ringEl = typeof document === "undefined" || tier !== "film" ? null : document.createElement("div");
  if (ringEl) {
    ringEl.setAttribute("aria-hidden", "true");
    Object.assign(ringEl.style, {
      position: "fixed", left: "0", top: "0", width: "0", height: "0", zIndex: "3", pointerEvents: "none",
      border: "1px solid rgba(226, 232, 255, 0.5)", borderRadius: "50%", opacity: "0", transition: "opacity .25s",
    });
    document.body.append(ringEl);
  }
  let hit: { kind: "disc"; x: number; y: number; R: number } | null = null;
  let clearPx = 0;
  /** how far from the crawler's centre (px) each of its moons' labels keeps */
  const clearFor = new Map<string, number>();
  const unregister = registerSubject({ id: "crawler", label: "the AI Web Crawler", q: "How does the AI Web Crawler work?", hit: () => hit });

  // where each moon is on screen this frame (CSS px), for tuning their phases in development
  const moonPx: Array<[number, number]> = [];
  if (process.env.NODE_ENV !== "production") (globalThis as unknown as { __crawler: unknown }).__crawler = { hide: () => { root.visible = false; hidden = true; }, lens, moons, moonPx, parts: { key, body, pipeRoot }, get inFrame() { return root.visible && inFrame; } };
  // both versions of its shell, each fading and whole, warmed up, so neither the lens nor its arrival hitches
  const ready = Promise.all([bodyReady, moonsReady]).then(() => warmInTurn(c.renderer, (r) => {
    for (const lensed of [true, false])
      for (const a of [0.5, 1]) {
        lensShell(lensed);
        for (const m of mats) fadeMaterial(m, a);
        warmUp(r, c.scene, root, P0, toStar, Rl);
      }
  }));

  // ---------------------------------------------------------------- the lens, aimed as the frame draws
  // It's aimed from the camera the frame is drawn with (the film poses the camera only when it draws), so a still and
  // the moving film both find it where it is.
  let frameT = 0, frameDt = 0, frameSize = { w: 1, h: 1 };
  const aimV = new Vector3();
  function aimLens(camera: Camera) {
    const t = frameT, dt = frameDt, size = frameSize;
    const ctr = aimV.copy(P0).project(camera);
    const cx = (ctr.x * 0.5 + 0.5) * size.w, cy = (-ctr.y * 0.5 + 0.5) * size.h;
    const dist = (camera as PerspectiveCamera).position.distanceTo(P0);
    const discPx = (Rl * scale) / Math.max(1e-6, dist) * (size.h / 2 / Math.tan(((camera as PerspectiveCamera).fov / 2) * (Math.PI / 180)));
    const live = t > tArrive && t < tOpen + 0.02 && crawler.open < 0.05 && ctr.z < 1;
    let want = 0, wx = lens.x, wy = lens.y;
    // a lens round a pointer may reach most of its disc; one it opens on its own (touch, the still) stays a window
    // inside the fairing, so the skin round it says what's being seen through
    const rMax = Math.min(LENS.h * size.h, discPx * LENS.disc), rOwn = Math.min(LENS.h * size.h * 0.75, discPx * LENS.own);
    if (tier === "film" && live && pt.fine && pt.in && !pt.overUI && Math.hypot(pt.x - cx, pt.y - cy) < discPx * 1.1) {
      want = rMax; wx = pt.x; wy = pt.y;
    } else if (tier === "film" && live && !pt.fine) {
      // on a touch screen it opens once at its centre while it's read
      want = rOwn * Math.exp(-(((t - (tArrive + 0.6)) / 0.22) ** 2)); wx = cx; wy = cy;
    } else if (tier === "still" && t > tArrive && t < tOpen + 0.02) {
      want = rOwn; wx = cx; wy = cy;
    }
    if (!lens.on && want > 0) { lens.x = wx; lens.y = wy; }
    lens.on = want > 0 || lens.r > 0.5;
    lens.x = tier === "film" ? ease(lens.x, wx, dt, 0.08) : wx;
    lens.y = tier === "film" ? ease(lens.y, wy, dt, 0.08) : wy;
    lens.r = tier === "film" ? ease(lens.r, want, dt, want > lens.r ? 0.35 : 0.3) : want;
    if (lens.r < 0.5) lens.r = 0;
    const dpr = c.renderer.getPixelRatio();
    lensU.uLens.value.set(lens.x * dpr, (size.h - lens.y) * dpr, lens.r * dpr);
    if (ringEl) {
      const on = lens.r > 2 ? 1 : 0;
      ringEl.style.opacity = String(on);
      if (on) Object.assign(ringEl.style, { transform: `translate(${(lens.x - lens.r).toFixed(1)}px, ${(lens.y - lens.r).toFixed(1)}px)`, width: `${(lens.r * 2).toFixed(1)}px`, height: `${(lens.r * 2).toFixed(1)}px` });
    }
  }
  // whatever of its draws first in a frame aims it (its shell draws before what's inside it), once a frame
  let aimed = -1;
  const aimOnce = (camera: Camera) => {
    const f = c.renderer.info.render.frame;
    if (f === aimed) return;
    aimed = f;
    aimLens(camera);
  };
  pl.hook(aimOnce);

  let hidden = false, last = 0;
  const cv = new Vector3(), m4 = new Matrix4(), q = new Quaternion(), s3 = new Vector3(), p3 = new Vector3();
  const look = new Matrix4();
  function update(t: number, camera: Camera, size: { w: number; h: number }, px: (r: number, P: Vector3) => number) {
    const now = performance.now() / 1000, dt = Math.min(0.05, last ? now - last : 0);
    last = now;
    const vis = crawler.vis;
    root.visible = !hidden && vis > 0.004;
    key.intensity = root.visible ? L.key : 0;
    hit = null;
    if (ringEl && !root.visible) ringEl.style.opacity = "0";
    // gone, it hosts no pipeline: the shaft goes with it (as the ribbon is read, the crawler goes still deployed)
    if (!root.visible) { pl.pipe.host = 0; return; }
    const ctr = cv.copy(P0).project(camera);
    const cx = (ctr.x * 0.5 + 0.5) * size.w, cy = (-ctr.y * 0.5 + 0.5) * size.h;
    const discPx = px(Rl * scale, P0);
    clearPx = px(Rl * scale * (1 + crawler.open * F.open * 0.8), P0) + 8;
    if (vis > 0.3 && ctr.z < 1) hit = { kind: "disc", x: cx, y: cy, R: discPx * 0.85 };

    // drawn opaque once it's fully in, so what's hidden inside it isn't shaded (the GPU's early depth test skips it)
    for (const m of mats) fadeMaterial(m, vis);

    // the lensed shell only while a lens is open (it was aimed last frame) or a still shows it
    const still = t > tArrive && t < tOpen + 0.02 && tier === "still";
    lensShell(lens.r > 0.5 || still);
    lensU.uTime.value = now;
    frameT = t; frameDt = dt; frameSize = size;

    // the pipeline: folded in its gallery, then dropping out below it, each ring opening out once it's clear (placed
    // even while it's out of frame, as the shaft below may not be)
    const e = crawler.deploy, bottom = P0.y - F.clear * Rl * scale;
    lowest = P0.y;
    folds.forEach((f, k) => {
      const foldY = P0.y + f.fold * Rl * scale;
      const y = foldY + (f.full.y - foldY) * e;
      const rad = ringRadius((bottom - y) / (Rl * scale), W.shaft.R / (Rl * scale)) * Rl * scale;
      pl.place(k, p3.set(P0.x, y, P0.z), rad);
      radii[k] = rad;
      lowest = Math.min(lowest, y);
    });
    pl.pipe.deploy = e;
    // the pipeline inside it is drawn only where it can be seen: through the lens, or once it's opening
    pl.pipe.host = lens.on || still || crawler.open > 0.001 || e > 0.001 ? vis : 0;
    aimShadow(pl.pipe.vis > 0.004 ? pl.pipe.s : null);

    posed = false;
    args = { camera, size, px, cx, cy, now };
    // a still draws once, so it's posed now, in frame or not
    if (inFrame || tier !== "film") poseParts();
  }

  // ---------------------------------------------------------------- what moves, posed only while it's in frame
  let posed = false, lowest = 0;
  let args: { camera: Camera; size: { w: number; h: number }; px: (r: number, P: Vector3) => number; cx: number; cy: number; now: number } | null = null;
  const radii: number[] = [];
  function poseParts() {
    if (posed || !args) return;
    posed = true;
    const { camera, size, px, cx, cy, now } = args, t = frameT, e = crawler.deploy;
    // it turns with the scroll until it opens, then holds, its seam square to you
    spinner.quaternion.setFromAxisAngle(UP, spinOpen + 0.45 * Math.min(0, t - tOpen));
    halves.forEach((h, k) => {
      h.obj.position.copy(h.base).addScaledVector(h.dir, crawler.open * F.open * (k ? 1.04 : 1));
    });
    swingStruts(swingOf(crawler.open, (lowest - P0.y) / (Rl * scale)));
    const top = P0.y + F.boom * Rl * scale;
    // records falling through, ring to ring, each lying down, each what it is at the ring it's passing (`at`, how far
    // down the fall ring k is)
    falling.visible = e < 0.999;
    if (falling.visible) {
      const at = (k: number) => (top - (pl.ringAt(k)?.position.y ?? top)) / Math.max(1e-9, top - lowest), fP = at(press), fH = at(heaters);
      for (let i = 0; i < FALLING; i++) {
        const f = (i / FALLING + now * 0.12) % 1;
        fallingState.setXYZW(i, smooth(fP - 0.03, fP + 0.03, f), smooth(fH - 0.03, fH + 0.03, f), 1, i % 4);
        const y = top + (lowest - top) * f;
        const ringR = radii[Math.min(radii.length - 1, Math.floor(f * radii.length))] ?? Rl * 0.3;
        const a = i * 2.39 + now * 0.4;
        p3.set(P0.x + Math.cos(a) * ringR * 0.55, y, P0.z + Math.sin(a) * ringR * 0.55);
        look.lookAt(V(0, 0, 0), V(-Math.sin(a), 0, Math.cos(a)), UP);
        q.setFromRotationMatrix(look);
        m4.compose(p3, q, s3.setScalar(Math.max(1e-6, ringR * 0.16 * smooth(0, 0.06, f) * (1 - smooth(0.94, 1, f)) * (1 - e))));
        falling.setMatrixAt(i, m4);
      }
      falling.instanceMatrix.needsUpdate = true;
      fallingState.needsUpdate = true;
    }

    // its companions ride their orbits, turned to face it, fading under ~16 px as the blocks do
    moons.forEach((x, j) => {
      x.obj.position.copy(W.moonAt(x.m, x.ang));
      x.obj.lookAt(P0);
      const sp = cv.copy(x.obj.position).project(camera);
      moonPx[j] = [(sp.x * 0.5 + 0.5) * size.w, (-sp.y * 0.5 + 0.5) * size.h];
      // its label hangs beyond it, on the side away from the crawler, clear of them both
      const reachPx = px(x.m.r, x.obj.position);
      clearFor.set(`moon:${x.m.slug}`, Math.max(clearPx, Math.hypot(moonPx[j]![0] - cx, moonPx[j]![1] - cy) + reachPx * 0.9 + 4));
      if (x.model) {
        const v = x.vis * smooth(5, 16, px(x.m.r, x.obj.position) * 2);
        x.model.visible = v > 0.004;
        x.model.traverse((o) => {
          const mm = (o as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
          if (mm) for (const y of Array.isArray(mm) ? mm : [mm]) y.opacity = v;
        });
      }
    });
  }

  // ---------------------------------------------------------------- culling
  // The film poses its camera just before the frame draws, so what's in frame is decided then, in the scene's own hook
  // (it runs before three culls and gathers lights). Out of frame (its companions' orbits included) its bodies aren't
  // drawn, what moves isn't posed and its shadow isn't redrawn. Its star's light stays lit, so every other body keeps the
  // light it's had.
  const frustum = new Frustum(), viewProj = new Matrix4();
  const bound = new Sphere(P0.clone(), Math.max(Rl * 1.9, ...moons.map((x) => x.m.rad + x.m.r * 2)));
  let inFrame = true;
  const parts = [body, pipeRoot, ...moons.map((x) => x.obj)];
  // what the fall's shadow falls on: the shaft round the stage being passed (aimShadow), as far down as the report's deck,
  // nothing standing further out from its axis than the bars
  const fallBox = new Box3(), deckY = W.shaft.at(W.depth("report") + 0.004).y;
  const fallBoxInFrame = () => {
    const R = W.shaft.R, half = R * 3.2, out = R * 2.2, P = shadowAt.position;
    fallBox.min.set(P.x - out, Math.max(deckY, P.y - half), P.z - out);
    fallBox.max.set(P.x + out, P.y + half, P.z + out);
    return fallBox.max.y > fallBox.min.y && frustum.intersectsBox(fallBox);
  };
  const before = c.scene.onBeforeRender;
  c.scene.onBeforeRender = function (this: Scene, ...a: Parameters<Scene["onBeforeRender"]>) {
    before.apply(this, a);
    if (!root.visible) return;
    const cam = a[2] as PerspectiveCamera;
    inFrame = frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)).intersectsSphere(bound);
    for (const o of parts) o.visible = inFrame;
    // its shadow isn't redrawn while what it falls on is out of frame: the crawler, or while its pipeline is in, the box
    // round the stage being passed (out of frame below the shaft's foot as the ribbon is read); the stage's light rig
    // reads the flag. Coming back, it's redrawn this frame.
    const wasOff = !!key.userData.shadowOff;
    key.userData.shadowOff = pl.pipe.vis < 0.004 ? !inFrame : !fallBoxInFrame();
    if (wasOff && !key.userData.shadowOff) key.shadow.needsUpdate = true;
    if (inFrame) poseParts();
    else if (ringEl && lens.r > 0) { lens.r = 0; ringEl.style.opacity = "0"; }
  };

  return {
    root,
    /** the film's handle on its: `vis`, `open`, `deploy` */
    crawler,
    /** the film's handles on its companions: each `vis`, and its `ang` along its orbit (`speed` per screen of scroll) */
    moons,
    key,
    ready,
    /**
     * tells it when it arrives and when the scroll opens it (the lens is live in between), and where the camera
     * looks from as it opens, so its seam turns square to it
     */
    times(arrive: number, open: number, camDir: Vector3) {
      tArrive = arrive; tOpen = open;
      seamFor.copy(camDir);
      aimSeam();
    },
    update,
    dispose() {
      unregister();
      c.scene.onBeforeRender = before;
      ringEl?.remove();
    },
    /** how far from its centre (px) a label hangs: a moon's beyond the moon, anything else clear of the crawler */
    clearPx: (ref?: string) => (ref && clearFor.get(ref)) || clearPx,
    /** how far out it reaches, for its title's anchor: further as its halves part, so the title stays clear of them */
    reach: () => Rl * scale * (1 + crawler.open * F.open * 0.8),
    /** on a portrait screen it's drawn at 0.8 of its size, so its companions' labels clear it at a phone's width */
    pose(port: boolean) {
      scale = port ? 0.8 : 1;
      body.scale.setScalar(scale);
    },
  };
}

export type Crawler = ReturnType<typeof createCrawler>;

/** the first material in `o` named `name` (a part's copies are named `<name>.001` and on) */
function materialOf(o: Object3D, name: string): Material | undefined {
  let found: Material | undefined;
  o.traverse((x) => {
    const m = x as Mesh;
    if (found || !m.isMesh) return;
    for (const mt of Array.isArray(m.material) ? m.material : [m.material]) if (!found && mt.name.replace(/\.\d+$/, "") === name) found = mt;
  });
  return found;
}

/**
 * Takes the struts under its service ring out of the model's frame, as they're made in code to swing clear: every
 * triangle inside the ring and below its fittings. The model's offset and scale live in the frame's node, so the
 * geometry is read through its matrix.
 */
function stripStruts(frame: Object3D) {
  frame.updateMatrix();
  const p = new Vector3(), c = new Vector3();
  frame.traverse((o) => {
    const m = o as Mesh;
    const idx = m.isMesh ? m.geometry.index : null;
    if (!idx) return;
    const toModel = frame.matrix.clone().multiply(m === frame ? new Matrix4() : m.matrix);
    const pos = m.geometry.attributes.position!;
    const keep: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      c.set(0, 0, 0);
      for (let k = 0; k < 3; k++) c.add(p.fromBufferAttribute(pos, idx.getX(i + k)).applyMatrix4(toModel));
      c.multiplyScalar(1 / 3);
      if (Math.hypot(c.x, c.z) < SERVICE.r - 0.04 && c.y < SERVICE.y + 0.01) continue;
      keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    }
    if (keep.length < idx.count) m.geometry.setIndex(keep);
  });
}

/** draws it once, off screen, so its shaders (its shadow's too) compile and its textures upload before it's seen */
function warmUp(renderer: WebGLRenderer, scene: Scene, body: Object3D, P: Vector3, toStar: Vector3, r: number) {
  let top = body;
  while (top.parent) top = top.parent;
  if (top !== scene) return;
  const cam = new PerspectiveCamera(50, 1, r * 0.05, r * 40);
  cam.position.copy(P).addScaledVector(toStar, r * 5);
  cam.lookAt(P);
  const rt = new WebGLRenderTarget(4, 4), prev = renderer.getRenderTarget(), was = body.visible;
  body.visible = true;
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  renderer.setRenderTarget(prev);
  body.visible = was;
  rt.dispose();
}
