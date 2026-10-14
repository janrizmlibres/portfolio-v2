/**
 * Athena (*Finalize Athena*: Janriz picked Haumea), in the ship's family (documentary-real, lit by her own star through
 * PBR Neutral, casting shadows):
 * - She's the real ringed dwarf planet Haumea. An egg of crystalline ice (2322 × 1704 × 1026 km) spinning fast about
 *   her short axis, rock beneath, a narrow ring in her equator's plane. She opens as a cutaway: three wedges slide
 *   straight out from her rock core, their cut faces showing her layers as NASA's interior diagrams draw them (bright
 *   crust, ice mantle, the rock's warm edge).
 * - Her core is hot rock: dark, with seams of heat in its own light (no bloom).
 * - Her two moons are small icy moons. They ride the world's moon orbits (`world.ts`), turned to face her.
 * - The pointer's peek: before the scroll opens her, the wedge nearest the pointer opens a little towards it (6% of
 *   her radius over 1.5 s, resealing over 2 s), and follows the pointer as it slides. On a touch screen the wedge
 *   facing you breathes once as she arrives instead. Never under reduced motion.
 * - The stream of records: slates lying down (record.ts), finished records, every field filled and their screens lit,
 *   flowing from the crawler's mouth along the stream into her; each joins her ring.
 * Every state a scene changes is a plain number the film sets: `vis`, `spin`, `open` (0..1), the moons' `ang`.
 */
import gsap from "gsap";
import {
  DirectionalLight, DoubleSide, FrontSide, Frustum, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, NormalBlending,
  Object3D, PerspectiveCamera, Quaternion, RingGeometry, ShaderMaterial, Sphere, Vector3, WebGLRenderTarget,
  type BufferGeometry, type Camera, type Material, type Scene, type Texture, type WebGLRenderer,
} from "three";
import { voyageLoader, warmInTurn } from "./loading";
import type { Fling } from "@/lib/film/fling";
import { pointer as pt, registerSubject } from "@/lib/film/pointer";
import { getTier } from "@/lib/film/tier";
import { cullAthena, flungMoon, MOON_THROW, slabSize, staggered } from "./athena-cull";
import { lightBy } from "./dark-lights";
import { matchLights, NEUTRAL_GLSL, neutralOut, raw } from "./lit";
import { recordSlate, slateState } from "./record";
import { UP, type World } from "./world";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Haumea's semi-axes, her long one 1 (the 2017 occultation's 2322 × 1704 × 1026 km) */
const AXES = V(1, 1704 / 2322, 1026 / 2322);
/**
 * Her size, in the storyboard's radii (`W.ATH.r`, the size it framed): how big her model is drawn (her long radius),
 * and how far a wedge slides when she opens and when the pointer peeks (in her long radii).
 */
const F = { size: 1.35, open: 0.42, peek: 0.06 };
/**
 * her ring, in the storyboard's radii (`W.ATH.r`): where its narrow band sits, how wide it's drawn, and its
 * faint wings. It's at 1.75 of her long radius where the real one is at 1.97, so she isn't lost inside it at a third
 * of the frame.
 */
const RING = { r: 1.35 * 1.75, w: 0.09, wing: 0.25 };
const SLABS = 44;


// ---------------------------------------------------------------- her ring: a narrow band of dark ice, in code
const ringVS = /* glsl */ `
  varying vec3 vW;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// lit by her star, brighter seen towards it (ice scatters forwards), in her shadow where she stands between it and her
// star; a band too thin for its pixels is drawn as the light it would add, not as aliasing
const ringFS = /* glsl */ `
  uniform vec3 uC, uN, uLight, uCol; uniform float uR, uW, uWing, uVis; uniform mat4 uEll;
  varying vec3 vW;
  ${NEUTRAL_GLSL}
  void main() {
    vec3 d = vW - uC;
    float r = length(d - uN * dot(d, uN));
    float x = (r - uR) / uW;
    float core = exp(-x * x * 4.0) * 0.85, wing = exp(-pow((r - uR) / uWing, 2.0)) * 0.12;
    float a = core + wing;
    if (a < 0.003) discard;
    vec3 L = normalize(uLight - vW), V = normalize(cameraPosition - vW);
    // her shadow: the ray to her star, in the space where her ice is the unit sphere
    vec3 o = (uEll * vec4(vW, 1.0)).xyz, dir = normalize((uEll * vec4(L, 0.0)).xyz);
    float b = dot(o, dir), c = dot(o, o) - 1.0, h = b * b - c;
    // her star is near and wide, so her shadow has a soft edge: a ray passing just outside her is partly shaded
    float lit = b > 0.0 ? 1.0 : h > 0.0 ? 0.0 : smoothstep(0.0, 0.3, -h);
    float fwd = pow(max(dot(-L, V), 0.0), 6.0) * 2.5;
    vec3 c3 = encode(neutral(uCol * (0.11 + 0.22 * abs(dot(uN, L)) + fwd * 0.4) * lit * 1.8 + uCol * 0.0216));
    // premultiplied: the band is dark ice that covers what's behind it (unlit, it all but vanishes against black space
    // rather than blotting out the sky's glow); the faint wings round it are fine dust that only adds the light it
    // scatters, so in her shadow they simply go, never darkening the sky past the band
    // the dust is thin, so it shows mostly seen at a slant (a longer path through it) and barely face on, close by
    float slant = mix(0.3, 1.0, 1.0 - abs(dot(uN, V)));
    float cover = core * uVis * mix(0.1, 1.0, lit);
    gl_FragColor = vec4(c3 * (cover + wing * slant * uVis * lit), cover);
  }`;

// ---------------------------------------------------------------- the cut faces: her layers, by depth, in code
// `s` is how deep a point is, as a fraction of the way out to her surface along its own direction: 1 at the surface,
// 0.62 where the hollow round her core begins. Bright crust, then ice that darkens and blues with depth, then the
// rock's edge, warmed by her core.
const CUT_DECL = /* glsl */ `
  varying vec3 vObj;
  uniform vec3 uAxes; uniform float uGap;`;
const CUT_COLOUR = /* glsl */ `
  float s = length(vObj / uAxes);
  vec3 crust = vec3(0.78, 0.81, 0.84), mantle = vec3(0.30, 0.40, 0.50), deep = vec3(0.09, 0.13, 0.19), edge = vec3(0.05, 0.04, 0.035);
  vec3 cutCol = mix(deep, mantle, smoothstep(0.68, 0.92, s));
  cutCol = mix(cutCol, crust, smoothstep(0.95, 0.975, s));
  cutCol *= 1.0 + 0.06 * sin(s * 140.0 + vObj.y * 9.0);
  cutCol = mix(edge, cutCol, smoothstep(0.635, 0.665, s));
  // a cut face lies inside the gap between two wedges: light reaches it only as the gap opens, so a closing (or barely
  // peeking) wedge's faces darken instead of reading as pale bands seen edge-on
  diffuseColor.rgb = cutCol * mix(0.1, 1.0, smoothstep(0.0, 0.2, uGap));`;
const CUT_HEAT = /* glsl */ `
  totalEmissiveRadiance += vec3(1.0, 0.36, 0.08) * (1.0 - smoothstep(0.625, 0.66, length(vObj / uAxes))) * 0.35;`;

// ---------------------------------------------------------------- her ring's shadow on her ice
const RING_SHADOW_DECL = /* glsl */ `
  varying vec3 vWorld;
  uniform vec3 uRingC, uRingN, uKeyP; uniform float uRingR, uRingW;`;
const RING_SHADOW = /* glsl */ `
  {
    vec3 L = normalize(uKeyP - vWorld);
    float dn = dot(L, uRingN);
    if (abs(dn) > 1e-4) {
      float t = dot(uRingC - vWorld, uRingN) / dn;
      if (t > 0.0) {
        float r = length(vWorld + L * t - uRingC), x = (r - uRingR) / uRingW;
        float sh = exp(-x * x * 4.0) * 0.45;
        reflectedLight.directDiffuse *= 1.0 - sh;
        reflectedLight.directSpecular *= 1.0 - sh;
      }
    }
  }`;

export function createAthena(c: {
  W: World;
  owned: Owned;
  renderer: WebGLRenderer;
  scene: Scene;
  /** the space the hardware's metal reflects */
  env: Texture;
}) {
  const { W, owned } = c;
  const R = W.ATH.r * F.size; // the model's bounding radius, drawn
  let scale = 1; // her size on this screen (pose)
  const root = new Object3D();

  /** `vis` fades her in and out, `spin` turns her with the scroll, `open` parts her wedges (0..1) */
  const athena = { obj: root, vis: 0, spin: 0, open: 0 };

  // ---------------------------------------------------------------- her pose: her pole tilted across the frame
  // outer: at her place, her pole (the model's +y) tilted as the storyboard's ring was; inner: turns about the pole
  const outer = new Object3D(), inner = new Object3D();
  outer.position.copy(W.ATH.P);
  const pole = V(0, 0, 1).applyEuler(new Object3D().rotation.set(Math.PI / 2 - 0.35, 0.2, 0)).normalize();
  outer.quaternion.setFromUnitVectors(V(0, 1, 0), pole);
  outer.add(inner);
  root.add(outer);

  // ---------------------------------------------------------------- her star's light, with shadows
  const L = matchLights(), starCol = raw("#fff1dc");
  const key = new DirectionalLight(starCol, 0);
  const toStar = W.ATH.lightP.clone().sub(W.ATH.P).normalize();
  const reach = W.ATH.r * 3.6; // as far as her moons ride
  key.position.copy(W.ATH.P).addScaledVector(toStar, reach * 2);
  key.target = outer;
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -reach; sc.right = sc.top = reach; sc.near = reach * 0.5; sc.far = reach * 3.5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = R * 0.004;
  key.shadow.intensity = 0.85;
  key.shadow.radius = 2;
  root.add(key);

  // her surfaces take her own star's key alone
  const ownKey = { value: toStar.clone() };
  const mats: MeshStandardMaterial[] = [];
  /** her body's own materials (not her moons' or the records'), which fade with her */
  const bodyMats: MeshStandardMaterial[] = [];
  const ringU = {
    uRingC: { value: W.ATH.P.clone() }, uRingN: { value: pole.clone() }, uKeyP: { value: key.position.clone() },
    uRingR: { value: W.ATH.r * RING.r }, uRingW: { value: W.ATH.r * RING.w },
  };
  // each material ends through PBR Neutral first; a wrapper for her ice or her cut faces then chains onto that
  const finish = (m: MeshStandardMaterial, own: { value: Vector3 } | null = ownKey) => {
    lightBy(m, own);
    m.transparent = true;
    // every part is a closed shell: one pass of front faces (a transparent two-sided material draws twice)
    m.side = FrontSide;
    m.envMap = c.env;
    m.envMapIntensity = m.metalness > 0.2 ? 1 : 0.25;
    mats.push(m);
    owned.push(m);
    for (const t of Object.values(m)) if ((t as Texture)?.isTexture && t !== c.env) owned.push(t as Texture);
    return m;
  };
  /** her ice, with her ring's shadow on it */
  const ringShadowed = (m: MeshStandardMaterial) => {
    const before = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      Object.assign(sh.uniforms, ringU);
      sh.vertexShader = sh.vertexShader
        .replace("void main() {", "varying vec3 vWorld;\nvoid main() {")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", `${RING_SHADOW_DECL}\nvoid main() {`)
        .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>\n${RING_SHADOW}`);
      before.call(m, sh, r);
    };
    m.customProgramCacheKey = () => "athena-ice";
    return m;
  };
  /** her cut faces, shaded by depth */
  const layered = (m: MeshStandardMaterial) => {
    const before = m.onBeforeCompile;
    m.map = null;
    m.onBeforeCompile = (sh, r) => {
      sh.uniforms.uAxes = { value: AXES.clone().multiplyScalar(modelR) };
      sh.uniforms.uGap = gapU;
      sh.vertexShader = sh.vertexShader
        .replace("void main() {", "varying vec3 vObj;\nvoid main() {")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", `${CUT_DECL}\nvoid main() {`)
        .replace("#include <color_fragment>", `#include <color_fragment>\n${CUT_COLOUR}`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${CUT_HEAT}`);
      before.call(m, sh, r);
    };
    m.customProgramCacheKey = () => "athena-cut";
    return m;
  };
  // her ice's long radius in the model's units (it's built to a bounding radius of 1, which her bumps reach past)
  const modelR = 1 / 0.9966;
  /** how far the wedges have parted (her long radii), the widest of the three: it lights their cut faces */
  const gapU = { value: 0 };

  // ---------------------------------------------------------------- her wedges and core
  type Wedge = { obj: Object3D; dir: Vector3; rim: number; top: number; peek: number; peekTo: number };
  const wedges: Wedge[] = [];
  const loader = voyageLoader();
  const load = (url: string) => new Promise<Object3D | null>((res) => loader.load(url, (g) => res(g.scene), undefined, () => res(null)));
  const prep = (model: Object3D, ice: boolean) => {
    model.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      m.renderOrder = -1;
      owned.push(m.geometry);
      const list = Array.isArray(m.material) ? m.material : [m.material];
      const out = list.map((x) => {
        const s = x as MeshStandardMaterial;
        if (mats.includes(s)) return s;
        neutralOut(s);
        if (s.name === "cut" && ice) return finish(layered(s));
        // her ice reflects most of the light reaching it; drawn a little under that, so its relief reads in her star's light
        if (s.name === "ice" && ice) { s.color.multiplyScalar(0.8); return finish(ringShadowed(s)); }
        if (s.name === "rock") { s.emissiveIntensity = 2.6; }
        return finish(s);
      });
      m.material = Array.isArray(m.material) ? out : out[0]!;
      if (ice) for (const x of out) if (!bodyMats.includes(x)) bodyMats.push(x);
    });
  };

  const body = load("/voyage/athena/haumea.glb").then((model) => {
    if (!model) return;
    model.scale.setScalar(R);
    inner.add(model);
    prep(model, true);
    for (let k = 0; k < 3; k++) {
      const w = model.getObjectByName(`wedge${k}`);
      if (!w) continue;
      // its direction: from her axis through its middle, flat to her equator; its rim: how far out it reaches that way.
      // Compression keeps each part's offset and scale in its node, so the geometry is read through the node's matrix.
      w.updateMatrix();
      const mesh = ((w as Mesh).isMesh ? w : w.children.find((x) => (x as Mesh).isMesh)) as Mesh | undefined;
      const toModel = w.matrix.clone().multiply(mesh && mesh !== w ? mesh.matrix : new Matrix4());
      const pos = mesh?.geometry.attributes.position, p = new Vector3(), mid = new Vector3();
      if (pos) for (let i = 0; i < pos.count; i += 7) mid.add(p.fromBufferAttribute(pos, i).applyMatrix4(toModel));
      const dir = V(mid.x, 0, mid.z).normalize();
      let rim = 0;
      if (pos) for (let i = 0; i < pos.count; i += 3) rim = Math.max(rim, p.fromBufferAttribute(pos, i).applyMatrix4(toModel).dot(dir));
      let top = 0;
      if (pos) for (let i = 0; i < pos.count; i += 3) top = Math.max(top, p.fromBufferAttribute(pos, i).applyMatrix4(toModel).y);
      w.userData.base = w.position.clone();
      wedges.push({ obj: w, dir, rim: rim || 1, top, peek: 0, peekTo: 0 });
    }
  });

  // ---------------------------------------------------------------- her ring
  const ringMat = new ShaderMaterial({
    uniforms: {
      uC: { value: W.ATH.P.clone() }, uN: { value: pole.clone() }, uLight: { value: W.ATH.lightP.clone() }, uCol: { value: starCol },
      uR: { value: W.ATH.r * RING.r }, uW: { value: W.ATH.r * RING.w }, uWing: { value: W.ATH.r * RING.wing }, uVis: { value: 0 },
      uEll: { value: new Matrix4() },
    },
    vertexShader: ringVS, fragmentShader: ringFS, transparent: true, depthWrite: false, side: DoubleSide, blending: NormalBlending, premultipliedAlpha: true,
  });
  const ringGeo = new RingGeometry(W.ATH.r * (RING.r - 0.5), W.ATH.r * (RING.r + 0.5), 256, 4);
  owned.push(ringMat, ringGeo);
  const ring = new Mesh(ringGeo, ringMat);
  ring.renderOrder = 3;
  // the ring geometry lies in xy; its plane is her equator's
  const ringHolder = new Object3D();
  ringHolder.quaternion.setFromUnitVectors(V(0, 0, 1), pole);
  ringHolder.position.copy(W.ATH.P);
  ringHolder.add(ring);
  root.add(ringHolder);
  // her ice as the unit sphere, for the ring's shadow test: inverse of her place, pole and turn, and her axes
  const ellInv = new Matrix4(), tmpM = new Matrix4();

  // ---------------------------------------------------------------- her moons
  type Moon = { obj: Object3D; m: World["moons"][number]; ang: number; vis: number; model: Object3D | null };
  const moons: Moon[] = W.moons.filter((m) => m.of === "athena").map((m) => {
    const obj = new Object3D();
    obj.position.copy(W.moonAt(m, m.phase));
    root.add(obj);
    return { obj, m, ang: m.phase, vis: 0, model: null };
  });
  const moonsReady = load("/voyage/athena/moons.glb").then((model) => {
    if (!model) return;
    moons.forEach((x, k) => {
      const one = model.getObjectByName(`moon${k}`);
      if (!one) return;
      one.removeFromParent();
      one.position.set(0, 0, 0);
      one.scale.setScalar(x.m.r);
      prep(one, false);
      x.obj.add(one);
      x.model = one;
    });
  });

  // ---------------------------------------------------------------- the stream of records: slates lying down
  // finished records (record.ts), every field filled, their screens lit
  const rec = recordSlate();
  // the records travel between two stars, so they take every key
  const slabMat = finish(rec.mat, null);
  slabMat.envMapIntensity = 1;
  const slabGeo = rec.geo;
  owned.push(slabGeo);
  const slabs = new InstancedMesh(slabGeo, slabMat, SLABS);
  slateState(slabs, () => [1, 1, 1]);
  owned.push(rec.atlas);
  slabs.castShadow = false;
  slabs.frustumCulled = false;
  slabs.visible = false;
  root.add(slabs);
  const stream = { vis: 0 };
  const SLAB = W.ATH.r * 0.07;
  // where a record joins her ring: in her ring's plane, angles from where the stream comes in (`dIn`) towards `side`.
  // It joins on her lit side, gliding round towards the point of the ring nearest her star, so it's seen catching her
  // star's light as it goes in rather than as a dark speck in her shadow.
  const streamEnd = W.stream.getPointAt(0.86);
  const dIn = streamEnd.clone().sub(W.ATH.P);
  dIn.addScaledVector(pole, -dIn.dot(pole)).normalize();
  const side = new Vector3().crossVectors(pole, dIn).normalize();
  const starIn = toStar.clone().addScaledVector(pole, -toStar.dot(pole)).normalize();
  const aStar = Math.atan2(starIn.dot(side), starIn.dot(dIn));
  const JOIN = { from: aStar * 0.45, sweep: 0.7 * Math.sign(aStar || 1) };
  const onRing = new Vector3();
  const joinAt = (u: number, out: Vector3) => {
    const rr = W.ATH.r * RING.r * scale, a = JOIN.from + u * JOIN.sweep;
    onRing.copy(W.ATH.P).addScaledVector(dIn, Math.cos(a) * rr).addScaledVector(side, Math.sin(a) * rr);
    return out.copy(streamEnd).lerp(onRing, smooth(0, 0.35, u)).lerp(onRing, smooth(0.3, 1, u));
  };
  // a hard scroll throws the records off the stream, each its own way across it
  const slabOff = Array.from({ length: SLABS }, (_, i) => { const a = i * 2.39996; return [Math.cos(a), Math.sin(a)] as const; });
  const across = new Vector3(), across2 = new Vector3(), half = new Vector3(), face = new Vector3(), Z = V(0, 0, 1), ORIGIN = V(0, 0, 0);
  const bx = new Vector3(), by = new Vector3(), bz = new Vector3(), toEye = new Vector3();
  const qT = new Quaternion(), qG = new Quaternion();
  const m4 = new Matrix4(), q = new Quaternion(), sc3 = new Vector3(), p3 = new Vector3(), a3 = new Vector3(), look = new Matrix4();

  // ---------------------------------------------------------------- the peek
  const tier = getTier();
  const cv = new Vector3();
  /** the film's times: her arrival, and when the scroll opens her */
  let tArrive = 0, tOpen = 0;
  // what the hand can ask about: her disc on screen, her ring included, while she's there
  let hit: { kind: "disc"; x: number; y: number; R: number } | null = null;
  // how far out she reaches on screen (px), opened as she is, for the labels that hang outside her
  let clearPx = 0;
  const unregister = registerSubject({ id: "athena", label: "Athena", q: "Tell me about Athena.", hit: () => hit });

  /** development only: measuring what her shadow map costs */
  const dev = { noShadow: false };
  // in development, a handle for measuring what she costs (`__athena.hide()` draws the frame without her, `hide(false)`
  // brings her back)
  if (process.env.NODE_ENV !== "production") (globalThis as unknown as { __athena: unknown }).__athena = { hide: (on = true) => { hidden = on; if (on) root.visible = false; }, get sight() { return sight; }, ring, root, dev };
  // warm her up once she's in, so her first frame doesn't hitch
  const ready = Promise.all([body, moonsReady]).then(() => warmInTurn(c.renderer, (r) => warmUp(r, c.scene, root, W.ATH.P, toStar, R)));

  let hidden = false;
  // the fling: how hard the scroll is, the fling itself (for a staggered feel), and how far things have tumbled
  let fling = 0, flung: Fling | undefined, tumble = 0, lastT = -1;
  // culling: her body, her ring and the stream's reach as spheres, tested against the camera's frustum. The camera is
  // posed for this frame only when it next draws, so they're tested a little larger than they are.
  const frustum = new Frustum(), pv = new Matrix4(), sphere = new Sphere();
  const streamBox = new Sphere().setFromPoints(W.stream.getPoints(24));
  const inFrame = (C: Vector3, r: number) => frustum.intersectsSphere(sphere.set(C, r * 1.4));
  /** what was drawn last frame (development: `__athena.sight`) */
  let sight: ReturnType<typeof cullAthena> & { bodyPx: number } = { ...cullAthena({ vis: 0, streamVis: 0, bodyPx: 0, bodyInFrame: false, ringInFrame: false, streamInFrame: false, moonsShown: false }), bodyPx: 0 };
  const rel = new Vector3();

  function update(t: number, cam: Vector3, camera: Camera, size: { w: number; h: number }, px: (r: number, P: Vector3) => number) {
    const vis = athena.vis;
    hit = null;
    const dt = lastT < 0 ? 0 : Math.abs(t - lastT);
    lastT = t;
    tumble = fling > 0.001 ? tumble + dt * MOON_THROW.tumble * fling : 0;
    if (hidden || (vis <= 0.004 && stream.vis <= 0.004)) {
      root.visible = false;
      key.intensity = 0;
      key.userData.shadowOff = true;
      return;
    }
    key.intensity = vis > 0.004 ? L.key : 0;

    // her moons ride their orbits (thrown outwards by a hard scroll, one after the other), turned to face her, fading
    // under ~16 px as the blocks do
    let moonsShown = false;
    moons.forEach((x, k) => {
      const fm = staggered(flung, fling, k, moons.length);
      rel.copy(W.moonAt(x.m, x.ang)).sub(W.ATH.P);
      const [rx, ry, rz] = flungMoon([rel.x, rel.y, rel.z], fm);
      x.obj.position.set(W.ATH.P.x + rx, W.ATH.P.y + ry, W.ATH.P.z + rz);
      x.obj.lookAt(W.ATH.P);
      if (fm > 0.001) x.obj.rotateOnAxis(rel.set(0.3 + 0.4 * k, 1, 0.5 - k).normalize(), fm * (1.2 + tumble));
      if (!x.model) return;
      const v = x.vis * smooth(5, 16, px(x.m.r, x.obj.position) * 2);
      x.model.visible = v > 0.004;
      if (!x.model.visible) return;
      moonsShown = true;
      x.model.traverse((o) => {
        const mm = (o as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
        if (mm) for (const y of Array.isArray(mm) ? mm : [mm]) y.opacity = v;
      });
    });

    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const bodyPx = px(R * scale, W.ATH.P);
    const s = cullAthena({
      vis, streamVis: stream.vis, bodyPx, moonsShown,
      bodyInFrame: inFrame(W.ATH.P, R * scale * (1 + F.open)),
      ringInFrame: inFrame(W.ATH.P, W.ATH.r * (RING.r + 0.5) * scale),
      streamInFrame: inFrame(streamBox.center, streamBox.radius + W.ATH.r * RING.r),
    });
    sight = { ...s, bodyPx };
    root.visible = s.any;
    outer.visible = s.body;
    ringHolder.visible = s.ring;
    slabs.visible = s.slabs;
    // her star's shadow map is redrawn only while her body is drawn and big enough for its shading to read (the light
    // rig reads this flag; the light itself stays, dark or not, so nothing recompiles)
    key.userData.shadowOff = !s.shadow || dev.noShadow;
    if (!s.any) return;

    clearPx = px(R * scale * (1 + athena.open * 0.45), W.ATH.P) + 8;
    if (vis > 0.3 && s.body) {
      const c0 = cv.copy(W.ATH.P).project(camera);
      if (c0.z < 1) hit = { kind: "disc", x: (c0.x * 0.5 + 0.5) * size.w, y: (-c0.y * 0.5 + 0.5) * size.h, R: px(W.ATH.r * RING.r * scale, W.ATH.P) };
    }
    if (s.body || s.ring) {
      inner.quaternion.setFromAxisAngle(V(0, 1, 0), athena.spin);
      // her wedges: open with the scroll, peek towards the pointer
      const live = tier === "film" && t > tArrive - 0.35 && t < tOpen + 0.05 && vis > 0.5;
      let near = -1;
      if (live && pt.fine && pt.in && !pt.overUI) {
        const ctr = cv.copy(W.ATH.P).project(camera);
        const cx = (ctr.x * 0.5 + 0.5) * size.w, cy = (-ctr.y * 0.5 + 0.5) * size.h;
        if (Math.hypot(pt.x - cx, pt.y - cy) < bodyPx / scale * 1.25) {
          let best = Infinity;
          wedges.forEach((w, k) => {
            const p = wedgePoint(k, 0.7, cv).project(camera);
            const d = Math.hypot((p.x * 0.5 + 0.5) * size.w - pt.x, (-p.y * 0.5 + 0.5) * size.h - pt.y);
            if (d < best) { best = d; near = k; }
          });
        }
      }
      wedges.forEach((w, k) => {
        const to = k === near ? 1 : 0;
        if (to !== w.peekTo) {
          w.peekTo = to;
          gsap.to(w, { peek: to, duration: to ? 1.5 : 2, ease: to ? "power2.out" : "power2.inOut", overwrite: true });
        }
      });
      // on a touch screen, the wedge facing you breathes once as she arrives
      let facing = -1;
      if (tier === "film" && !pt.fine) {
        let best = -Infinity;
        const toCam = cv.copy(cam).sub(W.ATH.P).normalize();
        wedges.forEach((w, k) => { const d = worldDir(k, a3).dot(toCam); if (d > best) { best = d; facing = k; } });
      }
      const breath = Math.exp(-(((t - (tArrive + 0.25)) / 0.18) ** 2));
      let gap = 0;
      wedges.forEach((w, k) => {
        const off = athena.open * F.open + ((k === facing ? breath : 0) + w.peek * (1 - athena.open)) * F.peek;
        gap = Math.max(gap, off);
        w.obj.position.copy(w.obj.userData.base as Vector3).addScaledVector(w.dir, off);
      });
      gapU.value = gap;
      const v = s.fade;
      for (const m of bodyMats) m.opacity = v;
      // her ring, and the inverse that tests its shadow
      ringMat.uniforms.uVis!.value = v;
      outer.updateMatrixWorld(true);
      tmpM.copy(inner.matrixWorld).multiply(pv.makeScale(R * AXES.x * modelR, R * AXES.y * modelR, R * AXES.z * modelR));
      ellInv.copy(tmpM).invert();
      ringMat.uniforms.uEll!.value.copy(ellInv);
      ringU.uKeyP.value.copy(key.getWorldPosition(cv));
    }
    // the stream: records flowing in with the scroll, each joining her ring; a hard scroll throws them off it
    if (s.slabs) {
      for (let i = 0; i < SLABS; i++) {
        const u = (i / SLABS + t * 0.09 + 0.37 * Math.sin(i * 12.9898) * 0.04) % 1;
        let sz = SLAB * (0.8 + 0.4 * ((i * 0.618) % 1)) * stream.vis, glint = 0;
        if (u < 0.86) {
          W.stream.getPointAt(u, p3);
          W.stream.getTangentAt(u, a3);
          sz *= slabSize(u / 0.86);
        } else {
          const j = (u - 0.86) / 0.14;
          joinAt(j, p3);
          joinAt(Math.min(1, j + 0.02), a3).sub(p3).normalize();
          sz *= 1 - smooth(0.7, 1, j);
          glint = Math.exp(-(((j - 0.55) / 0.16) ** 2));
        }
        sz *= smooth(0, 0.04, u);
        const fi = staggered(flung, fling, i, SLABS);
        if (fi > 0.001) {
          across.crossVectors(a3, UP).normalize();
          across2.crossVectors(across, a3).normalize();
          const [ca, sa] = slabOff[i]!;
          p3.addScaledVector(across, ca * fi * W.ATH.r * 0.5).addScaledVector(across2, sa * fi * W.ATH.r * 0.5);
        }
        // its long side along the flow, rolled about it so its screen faces you (flat, it's seen edge on from beside the
        // stream, a grey slab), a little tumble of its own (more when thrown)
        look.lookAt(ORIGIN, a3, UP).extractBasis(bx, by, bz);
        toEye.copy(cam).sub(p3);
        const roll = Math.atan2(-toEye.dot(bx), toEye.dot(by));
        q.setFromRotationMatrix(look).multiply(qT.setFromAxisAngle(Z, roll + Math.sin(i * 7.3 + t * 0.6) * 0.25 + fi * (1.5 + tumble) * (i % 2 ? 1 : -1)));
        // as it joins her ring it tips its face to her star and you, one after another: its plate catches her star's
        // light as a glint
        if (glint > 0.01) {
          half.copy(cam).sub(p3).normalize().add(toStar).normalize();
          qG.setFromUnitVectors(face.set(0, 1, 0).applyQuaternion(q), half).multiply(q);
          q.slerp(qG, glint * 0.9);
        }
        m4.compose(p3, q, sc3.setScalar(Math.max(sz, 1e-7)));
        slabs.setMatrixAt(i, m4);
      }
      slabs.instanceMatrix.needsUpdate = true;
    }
  }

  /** wedge k's direction, in the world, as she turns */
  function worldDir(k: number, out: Vector3) {
    return out.copy(wedges[k]?.dir ?? V(1, 0, 0)).applyQuaternion(inner.getWorldQuaternion(q));
  }
  /** a point on wedge k's middle, `f` of the way out to its rim, `up` of the way up to its top, where it is now */
  function wedgePoint(k: number, f: number, out: Vector3, up = 0) {
    const w = wedges[k];
    if (!w) return out.copy(W.ATH.P);
    inner.updateMatrixWorld(true);
    return out.copy(w.dir).multiplyScalar(w.rim * f).addScaledVector(V(0, 1, 0), w.top * up).add(w.obj.position).sub(w.obj.userData.base as Vector3).multiplyScalar(R * scale).applyMatrix4(new Matrix4().makeRotationFromQuaternion(inner.getWorldQuaternion(q))).add(W.ATH.P);
  }

  return {
    root,
    /** the film's handle on her: `vis`, `spin`, `open` */
    athena,
    /** the film's handles on her moons: each `vis`, and its `ang` along its orbit */
    moons,
    /** the film's handle on the stream of records */
    stream,
    key,
    ready,
    /** tells her when she arrives and when the scroll opens her, so the peek is live only in between */
    times(arrive: number, open: number) { tArrive = arrive; tOpen = open; },
    /** how hard the scroll is this frame, and the fling itself, for a feel that throws things one after another */
    fling(v: number, f?: Fling) { fling = v; flung = f; },
    update,
    dispose: unregister,
    clearPx: () => clearPx,
    /** where pattern k's label hangs from: on top of wedge k, so it shows however the wedge is turned */
    wedgeAt: (k: number) => wedgePoint(k, 0.6, new Vector3(), 0.8),
    /** how far out she reaches, for her label's anchor */
    reach: () => R * scale,
    /**
     * on a portrait screen she's drawn at 0.8 of her size (her ring too), so her moons' labels clear her ice at a
     * phone's width; her moons keep their orbits
     */
    pose(port: boolean) {
      scale = port ? 0.8 : 1;
      outer.scale.setScalar(scale);
      ringHolder.scale.setScalar(scale);
      ringMat.uniforms.uR!.value = W.ATH.r * RING.r * scale;
      ringMat.uniforms.uW!.value = W.ATH.r * RING.w * scale;
      ringMat.uniforms.uWing!.value = W.ATH.r * RING.wing * scale;
      ringU.uRingR.value = W.ATH.r * RING.r * scale;
      ringU.uRingW.value = W.ATH.r * RING.w * scale;
    },
  };
}

export type Athena = ReturnType<typeof createAthena>;

/** draws her once, off screen, so her shaders (her shadow's too) compile and her textures upload before she's seen */
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
