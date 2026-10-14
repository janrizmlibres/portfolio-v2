/**
 * The AI Web Crawler's pipeline, the film's main highlight: a shaft of stages the camera falls down with one record.
 * - Its rings (`scripts/models/pipeline.py`, made to the station's standard): one bulkhead per stage, the same frame,
 *   lips, bolts and longeron fittings on each (the shaft is one machine), clad and fitted out for its stage's work
 *   (the database's storage modules, the antenna's waveguides, the press's hydraulics, the dedups' processors, Enrich's
 *   radiators and power, the report's recorders), each carrying its stage's fixture. Each lights its stage's colour in
 *   the channel of diffusers round its outer face, and burns as the swarm passes: it flares, turns glossier and cools,
 *   and its light falls on the records passing through it.
 * - Its mast: a deployable truss as NuSTAR's on the rings' outer edge (longerons hinged at mid-bay, batten frames,
 *   X-braced cable with turnbuckles), so the bore stays clear for the fall. It's folded inside the crawler until it
 *   drops out.
 * - The swarm: records falling with you, each a slate whose face shows what it is (record.ts). Web pages tumble in from
 *   all round at Search; at Extract each is squared into the bore and its face wiped into a record as it passes the
 *   die; at each Dedup a duplicate goes dark and slides into its twin and is gone; at Enrich its missing fields light
 *   warm in the heaters; at Save they sink into the magazine, which fills.
 * - The report: four bars telescoping up from the deck round Save's magazine (Found, Merged, Enriched, Saved).
 * - The climax (`climax.ts`): a crest of warm white runs down the longerons, launching fast and slowing; each ring
 *   flares a moment after it passes and stays lit; a rush of records falls behind it, smeared by its speed like a long
 *   exposure; the bars shoot up as it lands, and a hairline shows what enriching would have cost without the dedups.
 * The crawler places the rings while they're folded and dropping (`place`); everything else is set by the film as
 * plain numbers on `pipe`. Nothing here moves by the clock but the folded pulse, so a still finds every stage as it is.
 */
import {
  BufferGeometry, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Quaternion,
  Vector3, Vector4, WebGLRenderTarget, type Camera, type IUniform, type Material, type Scene, type Texture, type Vector2,
  type WebGLRenderer,
} from "three";
import { fadeMaterial } from "./fade";
import { voyageLoader } from "./loading";
import { PIPELINE } from "@/lib/content/voyage";
import { front, held } from "./climax";
import { neutralOut, raw } from "./lit";
import { recordSlate, slateState } from "./record";
import { createReport } from "./report";
import { occludeDirect } from "./ships";
import { createSwarm, REC, type Shade } from "./swarm";
import { UP, type World } from "./world";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x: number, w: number) => Math.exp(-((x / w) ** 2));

/** In a ring's own units (its outer radius 1): where the longerons meet it (as authored) */
const LONG = [90, 210, 330].map((a) => (a * Math.PI) / 180);
/** a magazine's stack: how many slates it holds, from how low, how far apart */
const MAG = { n: 12, y0: -0.27, dy: 0.046 };
/** the queries Start's magazine gives up */
const QN = 5;


// ---------------------------------------------------------------- the light a burning ring (and the front) gives
// Two point lights only these surfaces see, so lighting the records costs the rest of the film nothing: each a
// position in view space and a colour times its strength, falling off over `uRR`.
const RING_LIGHT_DECL = /* glsl */ `
  uniform vec3 uRLp[2]; uniform vec3 uRLc[2]; uniform float uRR;`;
const RING_LIGHT = /* glsl */ `
  for (int i = 0; i < 2; i++) {
    vec3 lv = uRLp[i] + vViewPosition; float d = length(lv); vec3 L = lv / max(d, 1e-7);
    float att = 1.0 / (1.0 + (d * d) / (uRR * uRR));
    float nl = clamp(dot(normal, L), 0.0, 1.0);
    vec3 irr = uRLc[i] * att * nl;
    reflectedLight.directDiffuse += irr * BRDF_Lambert(material.diffuseColor);
    vec3 hv = normalize(L + normalize(vViewPosition));
    float sh = 2.0 / max(0.002, pow(material.roughness, 4.0));
    reflectedLight.directSpecular += irr * material.specularColor * pow(clamp(dot(normal, hv), 0.0, 1.0), min(sh, 400.0)) * 0.15;
  }`;

export function createPipeline(c: {
  W: World;
  owned: Owned;
  /** the space the hardware's metal reflects */
  env: Texture;
  /** the sky's resolution and pixel ratio, for the search's hairlines */
  px: { res: IUniform<Vector2>; dpr: IUniform<number> };
}) {
  const { W, owned } = c;
  const SH = W.shaft, levels = SH.levels, N = levels.length;
  const root = new Object3D();
  const dk = (id: string) => W.depth(id);

  /**
   * What the film sets: `vis` (the full-size shaft and its swarm), `s` (how far down the fall has come), `fill` (the
   * Save magazine), `bars` (the report's bars, 0..1), `cut` (the hairline of what enriching would have cost), `glow`
   * (the rings held lit after the front), `lead` (the record you fell with, gone once it comes out as the ribbon's first)
   */
  const pipe = { vis: 0, s: -0.01, fill: 0, bars: 0, cut: 0, glow: 0, deploy: 0, host: 0, lead: 1 };
  let T = { t0: 1e9, dur: 0.85 };
  let fling = 0, hidden = false;

  // ---------------------------------------------------------------- the ring light
  const RL = { uRLp: { value: [new Vector3(), new Vector3()] }, uRLc: { value: [new Vector3(), new Vector3()] }, uRR: { value: SH.R * 1.6 } };
  const ringLit = (m: MeshStandardMaterial, key: string, extra?: (sh: { vertexShader: string; fragmentShader: string; uniforms: Record<string, IUniform> }) => void) => {
    const before = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      Object.assign(sh.uniforms, RL);
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", `${RING_LIGHT_DECL}\nvoid main() {`)
        .replace("#include <lights_fragment_end>", `${RING_LIGHT}\n#include <lights_fragment_end>`);
      extra?.(sh);
      before.call(m, sh, r);
    };
    m.customProgramCacheKey = () => `pipe-${key}`;
    return m;
  };
  // ---------------------------------------------------------------- the text zone
  // While the fall is on, its bodies dim where the stage's text is read (the left column on a landscape screen, the
  // bottom band on a portrait one), so the shaft never sits bright behind words: on a phone it falls away into the dark
  // below the top half. `uTZ`: the mode (0 off, 1 across x, 2 up y), where the dimming ends and the frame is whole
  // (device px), and how dim it gets.
  const TZ = { uTZ: { value: new Vector4(0, 0, 1, 1) } };
  const zoned = <M extends Material>(m: M) => {
    const before = m.onBeforeCompile, key = m.customProgramCacheKey();
    m.onBeforeCompile = (sh, r) => {
      before.call(m, sh, r);
      Object.assign(sh.uniforms, TZ);
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "uniform vec4 uTZ;\nvoid main() {")
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
          if (uTZ.x > 0.5) {
            float zf = smoothstep(uTZ.y, uTZ.z, uTZ.x < 1.5 ? gl_FragCoord.x : gl_FragCoord.y);
            gl_FragColor.rgb *= mix(uTZ.w, 1.0, zf);
          }`);
    };
    m.customProgramCacheKey = () => `zone-${key}`;
    return m;
  };
  const finish = <M extends MeshStandardMaterial>(m: M) => {
    m.envMap = c.env;
    m.envMapIntensity = m.metalness > 0.2 ? 1 : 0.25;
    m.transparent = true;
    owned.push(m);
    return m;
  };

  // ---------------------------------------------------------------- the rings, each in a holder the crawler places
  type Ring = {
    k: number; holder: Object3D; hue: Vector3; glow: { value: number }; heat: { value: number };
    bodies: MeshStandardMaterial[]; rough: number[]; burn: number; mats: MeshStandardMaterial[];
  };
  const rings: Ring[] = levels.map((l, k) => {
    const holder = new Object3D();
    holder.position.copy(SH.at(l.d));
    holder.scale.setScalar(SH.R);
    root.add(holder);
    const hex = PIPELINE[k]?.hue ?? l.hue;
    const h = raw(hex);
    return { k, holder, hue: V(h.r, h.g, h.b), glow: { value: 0.6 }, heat: { value: 0 }, bodies: [], rough: [], burn: 0, mats: [] };
  });
  /** the pipeline's turn about its axis, so the report's bars face the camera as they shoot up */
  let turn = 0;
  const loader = voyageLoader();
  const named = (s: Material) => s.name.replace(/\.\d+$/, "");
  // Each stage's ring is fitted out for its work (pipeline.py), and wears its stage's fixture and name. A part two stages
  // share (the dedups' ring and comparator, Start's and Save's store) is the same geometry, each its own copy dressed
  // in its own stage's light.
  const RING_OF = [0, 1, 2, 3, 4, 3, 6, 7];
  const FIX_OF = ["store", "search", "press", "comparator", "heaters", "comparator", "store", "deck"];
  let hookFn: ((camera: Camera) => void) | null = null;
  const ready = new Promise<void>((res) => loader.load("/voyage/pipeline/pipeline.glb", (g) => {
    g.scene.updateMatrixWorld(true);
    rings.forEach((r) => {
      for (const part of [`ring${RING_OF[r.k]}`, `fix_${FIX_OF[r.k]}`, `tag${r.k}`]) {
        const o = g.scene.getObjectByName(part)?.clone();
        if (!o) continue;
        // its node keeps its own transform (the compressor stores each part's offset and scale there)
        r.holder.add(o);
        dress(r, o);
      }
    });
    mast = {
      longeron: piece(g.scene, "mast_longeron", BAYS * 3), hinge: piece(g.scene, "mast_hinge", BAYS * 3),
      batten: piece(g.scene, "mast_batten", BAYS), cable: piece(g.scene, "mast_cable", BAYS * 12),
      turnbuckle: piece(g.scene, "mast_turnbuckle", BAYS * 12),
    };
    const first = mast.longeron.meshes[0];
    if (first && hookFn) { const fn = hookFn; first.onBeforeRender = (_r, _s, cam) => fn(cam); }
    report.fit(g.scene);
    res();
  }, undefined, () => res()));
  /** dresses a part of ring `r` as loaded: its materials as the film lights them */
  function dress(r: Ring, o: Object3D) {
        o.traverse((x) => {
          const m = x as Mesh;
          if (!m.isMesh) return;
          m.castShadow = m.receiveShadow = true;
          owned.push(m.geometry);
          const list = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
          const out = list.map((s) => {
            const kind = named(s);
            // (a part drawn see-through as authored, the heaters' quartz, keeps its own opacity under the host's)
            const alpha = s.transparent ? s.opacity : 1;
            for (const t of [s.map, s.aoMap, s.normalMap, s.roughnessMap, s.metalnessMap]) if (t) owned.push(t);
            const mm = finish(occludeDirect(neutralOut(s.clone())));
            mm.userData.alpha = alpha;
            if (alpha < 1) mm.depthWrite = false;
            if (kind === "reflector") {
              // a heater's reflector catches its filament's glow
              const before = mm.onBeforeCompile;
              mm.onBeforeCompile = (sh, rr) => {
                Object.assign(sh.uniforms, { uHeat: r.heat });
                sh.fragmentShader = sh.fragmentShader
                  .replace("void main() {", "uniform float uHeat;\nvoid main() {")
                  .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.5, 0.18) * uHeat * 0.16;");
                before.call(mm, sh, rr);
              };
              mm.customProgramCacheKey = () => "pipe-reflector";
            } else if (kind === "channel") {
              // the channel: its stage's colour, as bright as the ring burns
              const before = mm.onBeforeCompile;
              mm.onBeforeCompile = (sh, rr) => {
                Object.assign(sh.uniforms, { uHue: { value: r.hue }, uGlow: r.glow });
                sh.fragmentShader = sh.fragmentShader
                  .replace("void main() {", "uniform vec3 uHue; uniform float uGlow;\nvoid main() {")
                  .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHue * uGlow;");
                before.call(mm, sh, rr);
              };
              mm.customProgramCacheKey = () => "pipe-channel";
            } else if (kind === "heater") {
              // a heater element glows a real warm orange while it's on
              const before = mm.onBeforeCompile;
              mm.onBeforeCompile = (sh, rr) => {
                Object.assign(sh.uniforms, { uHeat: r.heat });
                sh.fragmentShader = sh.fragmentShader
                  .replace("void main() {", "uniform float uHeat;\nvoid main() {")
                  .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.08) * uHeat;");
                before.call(mm, sh, rr);
              };
              mm.customProgramCacheKey = () => "pipe-heater";
            } else if (kind === "machined") {
              r.bodies.push(mm);
              r.rough.push(mm.roughness);
            }
            zoned(mm);
            r.mats.push(mm);
            return mm;
          });
          m.material = Array.isArray(m.material) ? out : out[0]!;
        });
  }

  // ---------------------------------------------------------------- the mast: longerons and diagonal cables
  const crest = { uFrontY: { value: 1e9 }, uCrest: { value: 0 }, uTrail: { value: 0 }, uW: { value: SH.SP * 0.7 } };
  /** the front's crest running down a longeron (instanced): warm white, as bright as the front is fast; the stretch
   *  it has passed glows on behind it, fading */
  const crested = (m: MeshStandardMaterial) => {
    const before = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      Object.assign(sh.uniforms, crest);
      sh.vertexShader = sh.vertexShader
        .replace("void main() {", "varying float vWY;\nvoid main() {")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWY = (modelMatrix * instanceMatrix * vec4(position, 1.0)).y;");
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "varying float vWY; uniform float uFrontY, uCrest, uTrail, uW;\nvoid main() {")
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          float dy = vWY - uFrontY;
          totalEmissiveRadiance += vec3(1.0, 0.95, 0.86) * uCrest * 24.0 * exp(-dy * dy / (uW * uW));
          totalEmissiveRadiance += vec3(1.0, 0.72, 0.38) * uTrail * 2.0 * step(0.0, dy) * exp(-dy / (uW * 4.0));`);
      before.call(m, sh, r);
    };
    m.customProgramCacheKey = () => "pipe-mast";
    return m;
  };
  // a hinged truss as NuSTAR's, from the authored pieces (pipeline.py), each instanced along every bay: the longerons
  // hinged at mid-bay, a batten frame there, X-braced faces of tensioned cable, a turnbuckle on each cable. Each piece
  // keeps its node's own transform (the compressor's offset and scale), under where it's placed.
  const BAYS = N - 1;
  type Piece = { meshes: InstancedMesh[]; local: Matrix4[] };
  let mast: { longeron: Piece; hinge: Piece; batten: Piece; cable: Piece; turnbuckle: Piece } | null = null;
  const mastMats: MeshStandardMaterial[] = [];
  function piece(scene: Object3D, name: string, count: number): Piece {
    const out: Piece = { meshes: [], local: [] };
    scene.getObjectByName(name)?.traverse((x) => {
      const m = x as Mesh;
      if (!m.isMesh) return;
      const list = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
      const mats = list.map((s) => {
        const mm = finish(neutralOut(s));
        if (named(s) === "longeron") crested(mm);
        mastMats.push(zoned(mm));
        return mm;
      });
      const im = new InstancedMesh(m.geometry, Array.isArray(m.material) ? mats : mats[0]!, count);
      // a longeron hosts the crawler's lens aim (`hook`), which has to run on every frame the pipeline is drawn
      im.frustumCulled = name !== "mast_longeron";
      // (only the longerons and battens cast a shadow: a cable's, a hinge's or a turnbuckle's is too thin to see, and
      // each piece is drawn whole into the shadow map, every bay of it)
      im.castShadow = name === "mast_longeron" || name === "mast_batten";
      im.receiveShadow = true;
      im.count = 0;
      owned.push(m.geometry);
      root.add(im);
      out.meshes.push(im);
      out.local.push(m.matrixWorld.clone());
    });
    return out;
  }

  // ---------------------------------------------------------------- the records: pages, records, queries, and the rush
  const shade: Shade = { finish, ringLit, zoned };
  const rec = recordSlate();
  owned.push(rec.geo, rec.mat, rec.atlas);
  const swarm = createSwarm({ W, parent: root, owned, shade, rec, px: c.px });

  // ---------------------------------------------------------------- the magazines (Start's empties, Save's fills)
  // Start's hold the queries, their screens low; Save's the stored records, dimmed
  const magMat = zoned(ringLit(neutralOut(finish(rec.mat.clone())), "mag", rec.patch));
  const mags = [0, levels.findIndex((l) => l.id === "save")].map((k) => {
    const m = new InstancedMesh(rec.geo.clone(), magMat, MAG.n);
    owned.push(m.geometry);
    slateState(m, () => (k === 0 ? [0, 0, 0.5] : [1, 1, 0.2]));
    m.castShadow = m.receiveShadow = true;
    rings[k]!.holder.add(m);
    return m;
  });

  // ---------------------------------------------------------------- the report's bars, and the cost without the dedups
  const report = createReport({ deck: rings[N - 1]!.holder, shade, owned });


  // ---------------------------------------------------------------- placing
  const m4 = new Matrix4(), q = new Quaternion(), qt = new Quaternion(), s3 = new Vector3(), p3 = new Vector3(), tmp = new Vector3();

  /** where ring `k` is and how big (the crawler places them folded and dropping; at full size they're at their level) */
  function place(k: number, at: Vector3, rad: number) {
    const r = rings[k];
    if (!r) return;
    r.holder.position.copy(at);
    r.holder.scale.setScalar(rad);
  }

  // the truss, bay by bay: where each longeron meets ring k (`edge`), and the batten frame at mid-bay
  const TA = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], TB = TA.map(() => V(0, 0, 0)), TM = TA.map(() => V(0, 0, 0));
  const ti = new Matrix4(), tc = new Vector3();
  function truss(R: NonNullable<typeof mast>, edge: (k: number, j: number, out: Vector3) => Vector3) {
    const at = { l: 0, b: 0, c: 0 };
    const set = (p: Piece, i: number) => p.meshes.forEach((im, j) => im.setMatrixAt(i, ti.multiplyMatrices(m4, p.local[j]!)));
    // `a` to `b`: stretched along it (a longeron, a cable), or at `a` along it (a hinge, a turnbuckle)
    const along = (a: Vector3, b: Vector3, rr: number, stretch: boolean) => {
      tmp.copy(b).sub(a);
      const len = tmp.length();
      qt.setFromUnitVectors(UP, len > 1e-9 ? tmp.divideScalar(len) : UP);
      m4.compose(a, qt, stretch ? s3.set(rr, Math.max(1e-7, len), rr) : s3.setScalar(rr));
    };
    for (let k = 0; k < BAYS; k++) {
      const h0 = rings[k]!.holder, h1 = rings[k + 1]!.holder, rr = h0.scale.x;
      for (let j = 0; j < 3; j++) { edge(k, j, TA[j]!); edge(k + 1, j, TB[j]!); TM[j]!.copy(TA[j]!).add(TB[j]!).multiplyScalar(0.5); }
      for (let j = 0; j < 3; j++) {
        along(TA[j]!, TB[j]!, rr, true); set(R.longeron, at.l);
        along(TM[j]!, TB[j]!, rr, false); set(R.hinge, at.l++);
        const j1 = (j + 1) % 3;
        for (const [a, b] of [[TA[j]!, TM[j1]!], [TA[j1]!, TM[j]!], [TM[j]!, TB[j1]!], [TM[j1]!, TB[j]!]] as const) {
          along(a, b, rr, true); set(R.cable, at.c);
          along(tc.copy(a).add(b).multiplyScalar(0.5), b, rr, false); set(R.turnbuckle, at.c++);
        }
      }
      // the batten frame, turned with the rings
      m4.compose(tc.copy(h0.position).add(h1.position).multiplyScalar(0.5), q.setFromAxisAngle(UP, h0.rotation.y), s3.setScalar(rr));
      set(R.batten, at.b++);
    }
    const done = (p: Piece, n: number) => p.meshes.forEach((im) => { im.count = n; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); });
    done(R.longeron, at.l); done(R.hinge, at.l); done(R.batten, at.b); done(R.cable, at.c); done(R.turnbuckle, at.c);
  }

  const hostOf = (v: number) => {
    for (const r of rings) for (const m of r.mats) fadeMaterial(m, v * (m.userData.alpha ?? 1));
    for (const m of [...mastMats, magMat, ...report.mats]) fadeMaterial(m, v);
  };

  function update(t: number, camera: Camera, now: number, size: { w: number; h: number }, dpr: number) {
    const host = Math.max(pipe.host, pipe.vis);
    root.visible = !hidden && host > 0.004;
    if (!root.visible) return;
    hostOf(host);
    // the text zone, on while the fall is on: landscape, the left column; portrait, the bottom band
    const port = size.w / size.h < 0.8;
    if (pipe.vis < 0.05) TZ.uTZ.value.set(0, 0, 1, 1);
    else if (port) TZ.uTZ.value.set(2, size.h * 0.3 * dpr, size.h * 0.44 * dpr, 0.12);
    else TZ.uTZ.value.set(1, size.w * 0.3 * dpr, size.w * 0.4 * dpr, 0.08);
    // the search's hairlines all but go where the text is (their own occlusion box, in NDC)
    const beams = swarm.beams;
    if (pipe.vis < 0.05) beams.u.uOcc.value.set(2, 2, -2, -2);
    else if (port) beams.u.uOcc.value.set(-2, -2, 2, -0.2);
    else beams.u.uOcc.value.set(-2, -2, -0.3, 2);
    beams.u.uOccW.value = 1e9;
    for (const r of rings) r.holder.rotation.y = turn * pipe.deploy;
    const s = pipe.s, v = pipe.vis, fl = 1 + 1.6 * fling;
    // the front runs from just above Start to just past the report's deck, so it lights every ring on its way
    const F = front(t, T), span = dk("report") + 0.012, fDepth = F.at * span - 0.006, fAt = (d: number) => (d + 0.006) / span;

    // the rings: the folded pulse while it's inside; then each burns as the swarm passes, and the front's held light
    const pulse = ((now / 2.4) % 1) * (N + 2) - 1;
    const view = (camera as Camera & { matrixWorldInverse: Matrix4 }).matrixWorldInverse;
    let hot = -1, hotB = 0;
    rings.forEach((r) => {
      const d = levels[r.k]!.d;
      const folded = (1 - pipe.deploy) * 1.6 * gauss(r.k - pulse, 0.7);
      r.burn = v * gauss(s - d, 0.004);
      const lit = held(fAt(d), F.at) * pipe.glow;
      r.glow.value = 0.45 + folded + 2.4 * r.burn + 5 * lit;
      r.heat.value = (levels[r.k]!.id === "enrich" ? 1 : 0) * (0.3 + 3 * r.burn + 1.5 * lit);
      // burning, its metal turns glossier, and cools back
      // and as the front's crest reaches it, it flashes warm white (Edolus's nodes flaring as its front passes); held
      // lit, its colour is its diffusers' alone (the metal tinted with it read as painted plastic from below)
      const flash = Math.min(1.4, 1.4 * F.crest) * gauss(fAt(d) - F.at, 0.055);
      r.bodies.forEach((m, j) => { m.roughness = r.rough[j]! * (1 - 0.45 * Math.max(r.burn, lit)); m.emissive.setRGB(0.9 * flash, 0.77 * flash, 0.6 * flash); });
      if (r.burn > hotB) { hotB = r.burn; hot = r.k; }
    });
    // the ring light: from the ring burning hardest, in its colour; and from the front, warm white
    if (hot >= 0) {
      const r = rings[hot]!;
      RL.uRLp.value[0]!.copy(r.holder.position).applyMatrix4(view);
      RL.uRLc.value[0]!.copy(r.hue).multiplyScalar(hotB * 1.3);
    } else RL.uRLc.value[0]!.set(0, 0, 0);
    RL.uRLp.value[1]!.copy(SH.at(fDepth)).applyMatrix4(view);
    RL.uRLc.value[1]!.set(1, 0.92, 0.8).multiplyScalar(F.crest * 5);
    crest.uFrontY.value = SH.top.y - fDepth;
    crest.uCrest.value = F.crest;
    crest.uTrail.value = F.at > 0 && F.at < 1 ? 0.35 * (0.3 + F.crest) : 0;

    // the mast: three longerons on the rings' outer edge, X-braced with cable on each face of each bay
    const edge = (k: number, j: number, out: Vector3) => {
      const r = rings[k]!.holder, a = LONG[j]! + r.rotation.y;
      return out.set(r.position.x + Math.cos(a) * r.scale.x * 1.04, r.position.y, r.position.z - Math.sin(a) * r.scale.x * 1.04);
    };
    if (mast) truss(mast, edge);

    // the magazines: Start's holds the queries until they leave; Save's fills slate by slate
    const sentQ = smooth(-0.002, dk("crawl"), s + 0.003) * QN;
    const stack = (m: InstancedMesh, count: number) => {
      for (let j = 0; j < MAG.n; j++) {
        const sc = Math.min(1, Math.max(0, count - j)) * (REC / SH.R);
        m4.compose(p3.set(0, MAG.y0 + j * MAG.dy, 0), q.setFromAxisAngle(UP, j * 2.4), s3.setScalar(Math.max(1e-6, sc)));
        m.setMatrixAt(j, m4);
      }
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    };
    stack(mags[0]!, 6 - sentQ);
    stack(mags[1]!, pipe.fill * MAG.n);

    // the report's bars, and the hairline of what enriching would have cost without the dedups
    report.update({ bars: pipe.bars, cut: pipe.cut, v });
    // the records: the swarm, the queries, the search's hairlines and the rush behind the front
    swarm.update({ s, v, fl, lead: pipe.lead, front: F, fDepth });
  }

  if (process.env.NODE_ENV !== "production") (globalThis as unknown as { __pipeline: unknown }).__pipeline = { root, rings, get mast() { return mast; }, records: swarm.meshes, bars: report.bars, pipe, hide: () => { hidden = true; } };

  return {
    root,
    pipe,
    ready,
    place,
    /** where ring `k` is and how big, as placed */
    ringAt: (k: number) => rings[k]?.holder ?? null,
    /** what it draws that isn't a subject to keep clear of: the search's hairlines and the rush's streaks of light */
    notSubjects: [swarm.beams.mesh, swarm.rush],
    count: N,
    /**
     * the climax's start and length (film time), and where the camera looks from as the bars shoot up, so the report's
     * deck turns to face it
     */
    times(t0: number, dur: number, camDir: Vector3) {
      T = { t0, dur };
      turn = Math.atan2(-camDir.z, camDir.x);
    },
    fling(v: number) { fling = v; },
    /** runs `fn` as the pipeline draws, once its mast does (the crawler aims its lens from the camera then) */
    hook(fn: (camera: Camera) => void) {
      hookFn = fn;
      const first = mast?.longeron.meshes[0];
      if (first) first.onBeforeRender = (_r, _s, cam) => fn(cam);
    },
    /** the top of bar `i` (world), or with `cut` the top of the hairline of what enriching would have cost */
    barTop: (i: number, cut = false) => report.barTop(i, cut, pipe.bars),
    update,
    /**
     * draws it off screen, every part shown (its host's light too), so its shaders compile and its textures
     * upload before the shaft is first seen
     */
    warm(renderer: WebGLRenderer, scene: Scene, also: Object3D[]) {
      const shown = [root, ...also].map((o) => o.visible);
      const was = { ...pipe };
      [root, ...also].forEach((o) => { o.visible = true; });
      Object.assign(pipe, { vis: 1, bars: 1, cut: 1, glow: 1 });
      const cam = new PerspectiveCamera(50, 1, SH.R * 0.05, SH.R * 400);
      cam.position.copy(SH.at(dk("enrich"))).add(V(SH.R * 30, SH.R * 10, 0));
      cam.lookAt(SH.at(dk("enrich")));
      cam.updateMatrixWorld();
      const rt = new WebGLRenderTarget(4, 4), prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      // fading and whole, so neither kind of program compiles the first time it's seen, every part drawn, in frame or not
      const culled: Object3D[] = [];
      for (const v of [0.5, 1]) {
        Object.assign(pipe, { vis: v, host: 0 });
        update(T.t0 + 0.2, cam, 0, { w: 4, h: 4 }, 1);
        // every record too, whatever stretch of the fall they're culled to
        for (const m of swarm.meshes) m.visible = true;
        root.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
        renderer.render(scene, cam);
      }
      for (const o of culled) o.frustumCulled = true;
      renderer.setRenderTarget(prev);
      rt.dispose();
      Object.assign(pipe, was);
      [root, ...also].forEach((o, j) => { o.visible = shown[j]!; });
    },
  };
}

export type Pipeline = ReturnType<typeof createPipeline>;
