/**
 * The section left behind, in the warp's throat (after *Warp or scroll*'s journey; real objects, since words no longer
 * fit a page that isn't flat): a few real pieces of the scene the warp sets out from tumble past us at different depths as we surge down
 * the throat, so the section left goes by, and the throat has things at several distances to judge its speed by:
 * - from Work, its traffic: drones, a worker in his suit, a breakthrough's craft (traffic.ts);
 * - from Projects, records (record.ts's slate, its screen lit), and from the ribbon a frame or two showing its
 *   screenshot (ribbon.ts);
 * - from About, his portrait on a Slab: a plate 1 by 1.6 with softly rounded corners and a metal edge;
 * - from the hero and Contact, nothing: the gas alone.
 * Each piece is drawn from the scene's own geometry and maps (shared, never copied), in materials of its own: lit by
 * the throat (its walls' light in the destination's hue, lib/film/warp-palette.ts, and the light at its end, whiter as
 * that brightens), with a rim in that light, its metal reflecting the throat (its glowing walls all round, the light at
 * its end ahead), a lit screen drawn as a lit screen, then through PBR Neutral as every lit surface here (lit.ts), and
 * fogged into the gas with distance.
 * - `library(r, cargo)` once the later scenes' models are in (the stage's `cargo`): every kind of piece made and
 *   compiled ahead, its materials kept so their programs are;
 * - `measure(roots, o)` as the warp sets out: what it carries (the stage's `cargo.at`, or his portrait if it's on screen);
 * - `plan(o)` at the peak, once his way out is known: when and where each piece passes us;
 * - `draw(r, …)` each frame of the throat, by the sky's renderer, over the hole and under his fire.
 * Where a piece is comes from one number, `state.travel` (0 → 1 down the throat, tweened by the warp, so a hurried
 * warp carries it): piece i passes the eye at travel = u_i and is L·D px further down for each unit of travel before
 * that. World space is the flight's (lib/tycho/flight-path.ts); a perspective camera with the same 45° view
 * reproduces its projection.
 */
import {
  Box3, BufferAttribute, Color, DataTexture, DirectionalLight, ExtrudeGeometry, Fog, HemisphereLight, LinearSRGBColorSpace, Matrix4, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Quaternion, Euler, RGBAFormat, Scene, Shape, ShapeGeometry, SRGBColorSpace,
  Texture, Vector3,
  type BufferGeometry, type IUniform, type Material, type MeshStandardMaterialParameters, type WebGLRenderer,
} from "three";
import type { Cargo } from "@/lib/film/stage";
import { PORTRAIT } from "@/lib/content/voyage";
import { NEUTRAL_GLSL, raw } from "./lit";
import { recordAtlas, recordFace, recordSlate } from "./record";

const TAU = Math.PI * 2;
const L = 6; // throat length per unit of travel, in eye distances
const PASS = 0.75; // depth (× D) at which a piece counts as passing us
const SPIN = 1.4; // rad the throat turns the pieces about its axis per unit of travel
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

type Kind = "craft" | "record" | "frame" | "slab";
type Sh = { vertexShader: string; fragmentShader: string; uniforms: Record<string, IUniform> };
/** a part of a piece: its geometry (the scene's, shared), where it sits in the piece, and how to make its material */
type Part = { geo: BufferGeometry; at: Matrix4; mat: () => Material };
/** a kind of piece: its parts, its size across (its own units), the turn that shows us its face, and whether it can go */
type Model = { kind: Kind; name: string; parts: Part[]; ext: number; face: Quaternion; ok: () => boolean };
type Piece = { model: Model; obj: Object3D; mats: Material[]; ext: number; u: number; r: number; th0: number; spin: number; fixed?: { x: number; y: number }; axis: Vector3; q0: Quaternion; rate: number };

// a record's face is its top (+y): turned to us (+z)
const FACE_UP = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);

/** a rectangle `w` by `h`, centred, its corners rounded to `r` */
function roundRect(w: number, h: number, r: number) {
  const s = new Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export type WarpDebris = ReturnType<typeof createWarpDebris>;

export function createWarpDebris() {
  const scene = new Scene(), camera = new PerspectiveCamera(45, 1, 1, 1e5);
  const fog = new Fog(0x000000, 1, 2);
  scene.fog = fog;
  // the throat's light: its walls all round, and the light at its end, ahead of us and a little above
  const walls = new HemisphereLight(0xffffff, 0x000000, 1), end = new DirectionalLight(0xffffff, 1);
  end.position.set(0, 0.5, -1);
  scene.add(walls, end, end.target);
  // the throat as the pieces' metal reflects it, and its light at their edges (linear)
  const rim = { value: new Color() }, wallC = { value: new Color() }, endC = { value: new Color() };
  // the destination's light (display values) and the gas the pieces fade into
  const tint = [1, 0.77, 0.6], gas = [0.165, 0.059, 0.027];
  const lightC = new Color(), white = new Color(1, 1, 1);
  const state = { travel: 0, inside: 0, glow: 0 };

  // ---------- how a piece is drawn ----------
  const blank = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
  blank.needsUpdate = true;
  /**
   * A surface lit in the throat: three's standard lighting by the throat's lights, the throat reflected (its glowing
   * walls all round, the light at its end ahead, down the view's -z; blurred as the surface is rough), a rim in its
   * light, then PBR Neutral and the encode (lit.ts); `more` chains a patch of its own (a record's screen) ahead of it.
   */
  const throatLit = (p: () => MeshStandardMaterialParameters, key: string, more?: (sh: Sh) => void) => () => {
    const m = new MeshStandardMaterial({ ...p(), transparent: true });
    m.onBeforeCompile = (sh) => {
      more?.(sh as unknown as Sh);
      Object.assign(sh.uniforms, { uRim: rim, uWall: wallC, uEnd: endC });
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", `uniform vec3 uRim, uWall, uEnd;\n${NEUTRAL_GLSL}\nvoid main() {`)
        .replace("#include <lights_fragment_end>", `{
            vec3 rv = reflect(-geometryViewDir, geometryNormal);
            radiance += uWall * (0.25 + 0.75 * (1.0 - abs(rv.z))) + uEnd * pow(max(-rv.z, 0.0), mix(48.0, 3.0, material.roughness));
            irradiance += uWall * 1.2;
          }
          #include <lights_fragment_end>
          reflectedLight.directSpecular += uRim * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);`)
        .replace("#include <colorspace_fragment>", "gl_FragColor.rgb = encode(neutral(gl_FragColor.rgb));");
    };
    m.customProgramCacheKey = () => `warp-${key}`;
    return m;
  };
  /** a model's own material, as the throat lights it: its colours and maps (shared), its front faces only (closed hulls) */
  const asLoaded = (s: MeshStandardMaterial): MeshStandardMaterialParameters => ({
    color: s.color, map: s.map, emissive: s.emissive, emissiveMap: s.emissiveMap, emissiveIntensity: s.emissiveIntensity,
    metalness: s.metalness, roughness: s.roughness, metalnessMap: s.metalnessMap, roughnessMap: s.roughnessMap, normalMap: s.normalMap,
    normalScale: s.normalScale, aoMap: s.aoMap, vertexColors: s.vertexColors,
  });
  /** a lit screen: its screenshot as it is (display values), cropped at its sides to the frame as the ribbon crops it */
  const screenOf = (u: { uMap?: IUniform<Texture | null>; uCrop?: IUniform<number> }) => () => {
    const crop = { value: u.uCrop?.value ?? 1 };
    const m = new MeshBasicMaterial({ map: u.uMap?.value ?? blank, color: new Color().setRGB(0.92, 0.92, 0.92, LinearSRGBColorSpace), transparent: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uCrop = crop;
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "uniform float uCrop;\nvoid main() {")
        .replace("#include <map_fragment>", "diffuseColor *= texture2D(map, vec2(0.5 + (vMapUv.x - 0.5) * uCrop, vMapUv.y));");
    };
    m.customProgramCacheKey = () => "warp-screen";
    return m;
  };

  // ---------- the kinds of piece ----------
  const models = new Map<Object3D, Model>();
  let records: Model[] | null = null, slab: Model | null = null, photo: Texture | null = null;
  const owned: Array<{ dispose(): void }> = [blank];
  /** a craft or a frame, from the scene's own object: its meshes' geometry and maps, centred */
  function modelOf(obj: Object3D, kind: "craft" | "frame"): Model | null {
    obj.updateMatrixWorld(true);
    const inv = obj.matrixWorld.clone().invert(), parts: Part[] = [], box = new Box3();
    let screen: { uMap?: IUniform<Texture | null> } | null = null;
    obj.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || (o as { isInstancedMesh?: boolean }).isInstancedMesh) return;
      const at = inv.clone().multiply(m.matrixWorld), src = (Array.isArray(m.material) ? m.material[0] : m.material) as Material & { uniforms?: Record<string, IUniform> };
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      box.union(m.geometry.boundingBox!.clone().applyMatrix4(at));
      let mat: () => Material;
      if (kind === "craft") mat = throatLit(() => asLoaded(src as MeshStandardMaterial), "craft");
      else if (src.uniforms?.uMap) { screen = src.uniforms; mat = screenOf(src.uniforms); }
      else if (m.geometry.type === "ExtrudeGeometry") {
        // the frame's anodised body
        const s = src as MeshStandardMaterial;
        mat = throatLit(() => ({ color: s.color, metalness: s.metalness, roughness: s.roughness }), "frame-body");
      } else {
        // its back: the face of the record it was, its screen kept low as Save stored it
        mat = () => {
          const b = throatLit(() => ({ color: raw("#ffffff") }), "frame-back")() as MeshStandardMaterial;
          Object.assign(b, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
          return recordFace(b, recordAtlas(), { on: 0.35, cell: 0 });
        };
      }
      parts.push({ geo: m.geometry, at, mat });
    });
    if (!parts.length || box.isEmpty()) return null;
    const mid = box.getCenter(new Vector3()), back = new Matrix4().makeTranslation(-mid.x, -mid.y, -mid.z);
    for (const p of parts) p.at.premultiply(back);
    const sc = screen as { uMap?: IUniform<Texture | null> } | null;
    return { kind, name: obj.name, parts, ext: box.getSize(new Vector3()).length(), face: new Quaternion(), ok: () => kind === "craft" || !!sc?.uMap?.value };
  }
  /** the four records (one a layout of the atlas's four), their screens lit */
  function recordModels(): Model[] {
    const rec = recordSlate();
    rec.mat.dispose();
    const out = [0, 1, 2, 3].map((cell): Model => {
      const g = rec.geo.clone(), n = g.attributes.position!.count, a = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) a.set([1, 1, 1, cell], i * 4);
      g.setAttribute("aS", new BufferAttribute(a, 4));
      g.computeBoundingBox();
      owned.push(g);
      const mat = throatLit(() => ({ color: raw("#ffffff"), metalness: 0.9, roughness: 0.3 }), "record", rec.patch);
      return { kind: "record", name: `record-${cell}`, parts: [{ geo: g, at: new Matrix4(), mat }], ext: g.boundingBox!.getSize(new Vector3()).length(), face: FACE_UP, ok: () => true };
    });
    rec.geo.dispose();
    return out;
  }
  /** his portrait's Slab: a plate 1 by 1.6, its corners softly rounded, its edge metal, his portrait on its face */
  function slabModel(): Model {
    const W = 1, H = 1.6, T = 0.07, bev = 0.016;
    const body = new ExtrudeGeometry(roundRect(W - 2 * bev, H - 2 * bev, 0.1 - bev), { depth: T - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
    body.translate(0, 0, -(T - 2 * bev) / 2);
    const fw = W - 0.09, fh = H - 0.09, face = new ShapeGeometry(roundRect(fw, fh, 0.06), 10);
    // the photo covers the face, cropped at its sides (or top and bottom) to the face's shape
    const pa = PORTRAIT.width / PORTRAIT.height, fa = fw / fh, kx = Math.min(1, fa / pa), ky = Math.min(1, pa / fa);
    const pos = face.attributes.position!, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = 0.5 + (pos.getX(i) / fw) * kx; uv[i * 2 + 1] = 0.5 + (pos.getY(i) / fh) * ky; }
    face.setAttribute("uv", new BufferAttribute(uv, 2));
    face.translate(0, 0, T / 2 + 0.0004);
    owned.push(body, face);
    const edge = throatLit(() => ({ color: raw("#c6cad2"), metalness: 1, roughness: 0.3 }), "slab-edge");
    const print = throatLit(() => ({ map: photo ?? blank, emissiveMap: photo ?? blank, emissive: new Color(1, 1, 1), emissiveIntensity: 0.35, metalness: 0, roughness: 0.5 }), "slab-face");
    return { kind: "slab", name: "slab", parts: [{ geo: body, at: new Matrix4(), mat: edge }, { geo: face, at: new Matrix4(), mat: print }], ext: Math.hypot(W, H, T), face: new Quaternion(), ok: () => !!photo };
  }
  /**
   * His portrait, as the page has it loaded (the label's image, at the size it's drawn): taken as a bitmap of its
   * own pixels, since the image's own size is scaled to the density it was picked for and the upload would overrun it.
   */
  let photoOf = "";
  function portrait(img: HTMLImageElement) {
    if (photoOf === img.currentSrc) return;
    photoOf = img.currentSrc;
    void createImageBitmap(img, { imageOrientation: "flipY" }).then((bm) => {
      if (photoOf !== img.currentSrc) return bm.close();
      photo?.dispose();
      photo = new Texture(bm);
      photo.flipY = false;
      photo.colorSpace = SRGBColorSpace;
      photo.anisotropy = 4;
      photo.needsUpdate = true;
    }).catch(() => {});
  }

  /** a piece of `model`, its materials its own (put in `mats`) */
  function build(model: Model, mats: Material[]) {
    const obj = new Object3D();
    for (const p of model.parts) {
      const mt = p.mat(), mesh = new Mesh(p.geo, mt);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(p.at);
      mesh.frustumCulled = false;
      obj.add(mesh);
      mats.push(mt);
    }
    return obj;
  }

  // what's kept so each kind's programs stay compiled (three lets a program go once no material uses it): one of each
  // material drawn see-through (fading) and one drawn solid (whole)
  const keep: Material[] = [];
  /**
   * Every kind of piece the scenes give (`cargo`: the stage's `cargo.all()`, once its later scenes' models are in), made
   * and compiled ahead, so the first warp out of any scene compiles nothing.
   */
  async function library(r: WebGLRenderer, cargo: Cargo[]) {
    for (const c of cargo) if ((c.kind === "craft" || c.kind === "frame") && !models.has(c.obj)) { const m = modelOf(c.obj, c.kind); if (m) models.set(c.obj, m); }
    records ??= recordModels();
    slab ??= slabModel();
    const all = [...models.values(), ...records, slab];
    const objs = [...all, ...all].map((m, i) => {
      const mats: Material[] = [], o = build(m, mats);
      if (i >= all.length) mats.forEach((mt) => (mt.transparent = false));
      keep.push(...mats);
      return o;
    });
    // their textures up to the GPU now too: a craft that hasn't flown yet hasn't had its maps uploaded
    const maps = new Set<Texture>();
    for (const mt of keep) for (const k of ["map", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap", "aoMap"] as const) {
      const t = (mt as MeshStandardMaterial)[k];
      if (t) maps.add(t);
    }
    maps.forEach((t) => r.initTexture(t));
    objs.forEach((o, i) => { o.position.set((i % 6) * 2, 0, -10); scene.add(o); });
    camera.position.set(5, 0, 5);
    camera.lookAt(5, 0, -10);
    camera.updateProjectionMatrix();
    await r.compileAsync(scene, camera).catch(() => {});
    objs.forEach((o) => scene.remove(o));
  }

  // ---------- what to take ----------
  let chosen: Model[] = [], pieces: Piece[] = [], active = false;
  const pick = <T,>(xs: T[], n: number) => [...xs].sort(() => Math.random() - 0.5).slice(0, n);
  /**
   * What the warp setting out carries: the pieces the stage gives for where the film is (`cargo`), his portrait's Slab
   * from About if the page has the portrait loaded (`roots`, the text layers, hold it; a phone never shows it, so
   * there's nothing to face it with); `light` (mid and low quality), fewer.
   */
  function measure(roots: Element[], { light = false, cargo = [] as Cargo[] } = {}) {
    clear();
    if (cargo.some((c) => c.kind === "slab")) {
      const img = roots.flatMap((r) => [...r.querySelectorAll<HTMLImageElement>(".label img")]).find((i) => i.complete && i.naturalWidth > 0);
      if (img && slab) { portrait(img); chosen = [slab]; }
      return chosen.length;
    }
    const of = (kind: "craft" | "frame") => cargo.flatMap((c) => (c.kind === kind ? [models.get(c.obj)] : [])).filter((m): m is Model => !!m && m.ok());
    const crafts = of("craft"), frames = of("frame"), recs = cargo.some((c) => c.kind === "record") ? records ?? [] : [];
    if (crafts.length) {
      // drones and a worker mostly, as the traffic is, and a craft or two
      const drone = crafts.find((m) => /^drone/.test(m.name)), worker = crafts.find((m) => /^worker/.test(m.name));
      const craft = pick(crafts.filter((m) => m !== drone && m !== worker), 1);
      chosen = [drone, worker, ...craft, ...(light ? [] : [drone])].filter((m): m is Model => !!m);
    } else if (frames.length) chosen = [...pick(frames, light ? 1 : 2), ...pick([...recs, ...recs], light ? 2 : 3)];
    else chosen = pick([...recs, ...recs], light ? 4 : 5);
    return chosen.length;
  }

  // ---------- where they go ----------
  // o: { c, D, m, dir (the throat's turn), avoid: { from, to, side } (a window of travel in which he goes by on `side`
  // of the axis, so passes then keep to the other side), near: { x, y, z, travel } (a piece passes him here, close) }
  function plan(o: { c: { x: number; y: number }; D: number; m: number; dir: number; avoid?: { from: number; to: number; side: number }; near?: { x: number; y: number; z: number; travel: number } }) {
    for (const pc of pieces) { scene.remove(pc.obj); pc.mats.forEach((mt) => mt.dispose()); }
    pieces = [];
    const { D, m, dir } = o;
    // passes spread over the throat, the biggest piece in the middle, the near miss on its own
    const order = chosen.map((model, i) => ({ model, i, big: model.kind === "slab" ? 2 : model.kind === "frame" ? 1 : 0 })).sort((a, b) => b.big - a.big || a.i - b.i);
    const nearIt = o.near && order.length >= 3 ? (order.find((p) => p.big === 0) ?? null) : null;
    const rest = order.filter((p) => p !== nearIt);
    const slots = rest.map((_, i) => 0.3 + (0.66 * (i + 0.5)) / rest.length).sort(() => Math.random() - 0.5);
    if (rest[0] && rest[0].big > 0) {
      const mid = slots.reduce((b, s) => (Math.abs(s - 0.55) < Math.abs(b - 0.55) ? s : b));
      slots.splice(slots.indexOf(mid), 1);
      slots.unshift(mid);
    }
    let golden = Math.random() * TAU;
    rest.forEach((p, k) => {
      const u = slots[k]! + (Math.random() - 0.5) * 0.04;
      golden += 2.39996;
      let phi = golden;
      if (o.avoid && u > o.avoid.from && u < o.avoid.to) phi = (o.avoid.side > 0 ? Math.PI : 0) + (Math.random() - 0.5) * 1.8; // away from him
      const r = (0.2 + 0.26 * Math.random() + (p.big ? 0.08 : 0)) * m;
      add(p.model, { u, r, th0: phi - dir * SPIN * u, spin: dir * SPIN, m });
    });
    if (nearIt && o.near) {
      const nr = o.near, u = nr.travel - (nr.z - PASS * D) / (L * D);
      add(nearIt.model, { u, r: 0, th0: 0, fixed: { x: nr.x, y: nr.y }, m, fast: true });
    }
    active = pieces.length > 0;
    return pieces.length;
  }
  // how big each kind passes, across (its box's diagonal, × the screen's shorter side)
  const SIZE: Record<Kind, [number, number]> = { craft: [0.28, 0.38], record: [0.26, 0.32], frame: [0.42, 0.48], slab: [0.46, 0.5] };
  function add(model: Model, p: { u: number; r: number; th0: number; spin?: number; fixed?: { x: number; y: number }; m: number; fast?: boolean }) {
    const [lo, hi] = SIZE[model.kind], ext = (lo + (hi - lo) * Math.random()) * p.m;
    const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.4).normalize();
    const q0 = new Quaternion().setFromEuler(new Euler((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.8));
    const mats: Material[] = [], obj = build(model, mats);
    obj.scale.setScalar(ext / model.ext);
    obj.visible = false;
    scene.add(obj);
    pieces.push({ model, obj, mats, ext, u: p.u, r: p.r, th0: p.th0, spin: p.spin ?? 0, fixed: p.fixed, axis, q0, rate: (p.fast ? 9 : 3 + Math.random() * 5) * (Math.random() < 0.5 ? -1 : 1) });
  }

  // ---------- drawing ----------
  const qT = new Quaternion();
  function place(pc: Piece, travel: number, c: { x: number; y: number }, D: number) {
    const z = PASS * D + (travel - pc.u) * L * D;
    let x: number, y: number;
    if (pc.fixed) ({ x, y } = pc.fixed);
    else { const th = pc.th0 + pc.spin * travel; x = c.x + pc.r * Math.cos(th); y = c.y + pc.r * Math.sin(th); }
    pc.obj.position.set(x, -y, z);
    pc.obj.quaternion.copy(pc.q0).multiply(qT.setFromAxisAngle(pc.axis, pc.rate * (travel - pc.u))).multiply(pc.model.face);
    return z;
  }
  /** each frame of the throat: the frame is `res` CSS px, the eye at `c`, `D` in front of it */
  function draw(renderer: WebGLRenderer, res: { w: number; h: number }, c: { x: number; y: number }, D: number) {
    if (!active || state.inside < 0.01) return;
    camera.aspect = res.w / res.h;
    camera.fov = 45;
    camera.near = D * 0.05;
    camera.far = D * 20;
    camera.position.set(c.x, -c.y, D);
    camera.lookAt(c.x, -c.y, 0);
    camera.updateProjectionMatrix();
    // the throat's light, whiter as the light at its end brightens; the pieces fade into its gas with distance
    const g = state.glow;
    lightC.setRGB(tint[0]!, tint[1]!, tint[2]!, SRGBColorSpace).lerp(white, Math.min(1, Math.max(0, 0.3 + 0.3 * g)));
    walls.color.copy(lightC);
    walls.groundColor.setRGB(gas[0]!, gas[1]!, gas[2]!, SRGBColorSpace).multiplyScalar(3);
    walls.intensity = 3 * (1 + 0.25 * g);
    end.color.copy(lightC);
    end.intensity = 4 * (1 + 0.25 * g);
    wallC.value.copy(lightC).multiplyScalar(0.8 * (1 + 0.25 * g));
    endC.value.copy(lightC).lerp(white, 0.6).multiplyScalar(3 + 2 * g);
    rim.value.setRGB(tint[0]!, tint[1]!, tint[2]!, SRGBColorSpace).multiplyScalar(0.6 + 0.5 * g);
    fog.color.setRGB(gas[0]!, gas[1]!, gas[2]!, LinearSRGBColorSpace);
    fog.near = 2.2 * D;
    fog.far = 6.5 * D;
    const T = state.travel, m = Math.min(res.w, res.h);
    let n = 0;
    for (const pc of pieces) {
      const z = place(pc, T, c, D);
      // it comes out of the depth, and fades as it nears us or grows past half the screen
      const big = (pc.ext * D) / Math.max(D * 0.05, D - z) / m;
      const a = sstep(-6.5 * D, -4.2 * D, z) * (1 - sstep(0.5 * D, 0.82 * D, z)) * (1 - sstep(0.45, 0.8, big)) * state.inside;
      pc.obj.visible = a > 0.003;
      // drawn solid once it's whole, see-through only as it fades (a see-through surface is drawn far to near with
      // nothing hidden skipped); both kinds of program compile in `library`
      const solid = a > 0.999;
      for (const mt of pc.mats) {
        if (mt.transparent === solid) { mt.transparent = !solid; mt.needsUpdate = true; }
        mt.opacity = a;
      }
      if (pc.obj.visible) n++;
    }
    if (!n) return;
    // depth of its own (the sky's frame under it is another camera's)
    renderer.clearDepth();
    renderer.render(scene, camera);
  }

  function clear() {
    active = false;
    for (const pc of pieces) { scene.remove(pc.obj); pc.mats.forEach((mt) => mt.dispose()); }
    pieces = [];
    chosen = [];
    state.travel = 0;
    state.inside = 0;
  }

  return {
    state, measure, plan, draw, clear, library,
    /** the destination's light (lib/film/warp-palette.ts): what the throat lights the pieces with, and its gas */
    palette(p: { tint: readonly number[]; fog: readonly number[] }) {
      tint.splice(0, 3, p.tint[0]!, p.tint[1]!, p.tint[2]!);
      gas.splice(0, 3, p.fog[0]!, p.fog[1]!, p.fog[2]!);
    },
    get count() { return chosen.length; },
    /** what it's carrying, by kind */
    get kinds() { return chosen.map((m) => m.kind); },
    get active() { return active; },
    dispose() {
      clear();
      keep.forEach((mt) => mt.dispose());
      owned.forEach((o) => o.dispose());
      photo?.dispose();
    },
  };
}

/**
 * The throat's speed down its length, at the journey's own pace (1.25 s of it), as the warp tweens it, integrated and
 * normalised: an ease for `travel`, so the pieces move with the throat's walls.
 */
export function throatEase() {
  const expoOut = (x: number) => 1 - 2 ** (-10 * x), in2 = (x: number) => x * x, inOut2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
  const speed = (u: number) => (u < 0.3 ? 3.2 * expoOut(u / 0.3) : u < 0.75 ? 3.2 - 2.1 * inOut2(Math.min(1, (u - 0.3) / 0.5)) : 1.1 + 1.7 * in2(Math.min(1, (u - 0.75) / 0.5)));
  const N = 128, F = [0];
  for (let i = 1; i <= N; i++) { const u0 = ((i - 1) / N) * 1.25, u1 = (i / N) * 1.25; F.push(F[i - 1]! + (0.4 + (speed(u0) + speed(u1)) / 2) * (u1 - u0)); }
  const tot = F[N]!;
  return (p: number) => { const x = Math.min(N, Math.max(0, p * N)), i = Math.min(N - 1, Math.floor(x)); return (F[i]! + (F[i + 1]! - F[i]!) * (x - i)) / tot; };
}
