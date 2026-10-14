/**
 * The ship where home was: the voyage's single body, which the dive arrives at and About rides. Modelled in Blender
 * at a bounding radius of 1 and placed at home, sized in its radii.
 * It's the ring made real, as a real station looks: pressurised cylinders in
 * quilted MMOD blankets, berthing rings, handrails, foil, lattice spokes and solar wings round a docking hub, lit as
 * space lights things: his star, a faint fill, and shadows at full strength, as he picked over a pre-render; built by
 * `scripts/models/build.sh station`, in its cloth finish (ADR 0013). It turns on its own clock once About is settled
 * (about.ts). A crew capsule (the model's "visitor" node) flies in to dock at the hub, rolling to match the ring's turn
 * as it closes, its strobe flashing.
 * It's lit as the rest of the film is: his star's light, the region's light on its night side, then PBR Neutral.
 * Its own lights (windows, running lights, a drive's glow) are emissive. It casts shadows on itself, and the occlusion
 * baked in Blender (the model's own map, on its second uv) darkens where its parts crowd each other.
 */
import {
  Color, DirectionalLight, HemisphereLight, Matrix4, MeshDepthMaterial, Object3D, PCFShadowMap, PerspectiveCamera, Quaternion, RGBADepthPacking, Vector3,
  WebGLRenderTarget,
  type BufferGeometry, type Material, type Mesh, type MeshStandardMaterial, type Scene, type Texture, type WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { lightBy } from "./dark-lights";
import { fadePair } from "./fade";
import { finished, panelToneTexture, surfaceOf, weave, type FinishName } from "./finish";
import { matchLights, neutralOut } from "./lit";
import type { World } from "./world";

type Ctx = {
  W: World;
  sunCol: Color;
  /** the region's light on the night side (linear), set by the film each frame */
  fill: Color;
  renderer: WebGLRenderer;
  /** the sky's scene, which the ship is drawn in */
  scene: Scene;
  owned: Array<BufferGeometry | Material | Texture | { dispose(): void }>;
  /** its finish (finish.ts; none keeps the model's own), and the studio its metals reflect, built only if it's used */
  finish?: FinishName;
  studio?: () => Texture;
};

/**
 * How the ship stands to the camera at About, in that camera's frame (`f` towards the camera, `r` to the frame's right,
 * `u` up it): its axis (the model's +y) seen from 50° above its plane, tipped a little to the right, so the ring reads as
 * a wide ellipse round its hub, and its nose (the model's −z).
 */
const axisOf = (f: Vector3, r: Vector3, u: Vector3): [Vector3, Vector3] => [u.clone().multiplyScalar(0.64).addScaledVector(f, 0.77).addScaledVector(r, -0.12), r];
/** its bounding radius in home's radii, so its rim stands where the world it replaced did */
const SIZE = 1.316;
/**
 * How far its shadows' edges are blurred, in shadow-map texels. His star is near a point, so a real station's shadows
 * are sharp: blurred three texels, the lattice spokes cast speckled clouds on the radiators and the hub.
 */
const SOFT = 1;

/** where the ring's rim (its modules' outer faces) is, in its bounding radii, as its build prints it */
export const RIM = 0.958;
/**
 * A circle the real ring's modules always cover, in its bounding radii: they sit on the chords between nodes a radius
 * out, their middles cos 15° of it, 0.078 thick and 0.05 at their docking rings (scripts/models/station.py), so a circle
 * 0.983 of the radius out stays inside them however far the ring has turned.
 */
const CORE = 0.902;
/**
 * how far round to the camera's left the near modules a label points at are, as tan of the angle: on a phone held
 * sideways there's no dark under the ring clear of About's words, so its label hangs nearer the camera, over the ship's
 * foot
 */
const NEAR_LEFT = { wide: 0.84, short: 0.44 };
/**
 * The way in the real ring's plane (axis `n`) to the near modules a label points at, for a camera whose right and up
 * are `camR` and `camU`: towards the camera and round to its left, where the ring's near arc rises clear of the frame's
 * foot, just right of About's words.
 */
function nearLeft(camR: Vector3, camU: Vector3, n: Vector3, short: boolean) {
  const d = new Vector3().crossVectors(camR, camU).addScaledVector(camR, -NEAR_LEFT[short ? "short" : "wide"]);
  d.addScaledVector(n, -d.dot(n));
  return d.lengthSq() > 1e-12 ? d.normalize() : null;
}
/** how far ahead of its dock the visitor starts, in the model's own units (the ring's radius is 1) */
const VISITOR_OUT = 1.2;
const Y_AXIS = new Vector3(0, 1, 0);

type FadePair = ReturnType<typeof fadePair<MeshStandardMaterial>>;

/**
 * Work's build (work.ts): each of the real ship's vertices carries the moment it's built (`_build`, 0 its core to 1
 * whole; scripts/models/station.py), and only what's built by `uBuilt` is drawn, so a quarter grows in place: its spoke
 * running out from the hub, its skeleton along the ring, the hull closing over that, its fittings, its solar masts.
 * Times run along each part, so a long face reveals as the build passes along it.
 */
const BUILD_VS = "attribute float _build;\nvarying float vBuild;\nvoid main() {\n  vBuild = _build;";
const BUILD_FS = "uniform float uBuilt;\nvarying float vBuild;\nvoid main() {\n  if (vBuild > uBuilt) discard;";
function revealBuilt<M extends Material>(m: M, built: { value: number }): M {
  const before = m.onBeforeCompile, key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    before.call(m, sh, r);
    sh.uniforms.uBuilt = built;
    sh.vertexShader = sh.vertexShader.replace("void main() {", BUILD_VS);
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", BUILD_FS);
  };
  m.customProgramCacheKey = () => `${key}+built`;
  return m;
}

export function createShip(c: Ctx) {
  const r = c.W.HOME.r * SIZE;
  const { W } = c;
  // outer: at home, posed for About's camera; inner: turns; model: the loaded ship at its size
  const outer = new Object3D(), inner = new Object3D();
  outer.position.copy(W.HOME.P);
  outer.add(inner);
  // each of the model's materials as a pair, opaque while the ship is whole and see-through while it fades
  // (fade.ts): a see-through ship filling the frame was drawn back to front with nothing hidden, its two-sided
  // parts twice over
  const pairs = new Map<Material, FadePair>();
  const parts: Array<{ mesh: Mesh; src: Material[] }> = [];
  // how much of it is built (0..1, work.ts), and its shadow, drawn only where it's built; its skeleton, seen only while
  // it's built (inside the hull once it's whole)
  const built = { value: 1 };
  const buildDepth = revealBuilt(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }), built);
  c.owned.push(buildDepth);
  let skeleton: readonly Material[] = [];
  let station: Object3D | null = null;
  const stationM = new Matrix4(), turnM = new Matrix4();

  // his star's light and the region's, for three's materials
  const L = matchLights();
  const toSun = W.SUN.clone().sub(W.HOME.P).normalize();
  const key = new DirectionalLight(c.sunCol, L.key);
  key.position.copy(W.HOME.P).addScaledVector(toSun, r * 6);
  key.target = outer;
  c.renderer.shadowMap.enabled = true;
  c.renderer.shadowMap.type = PCFShadowMap;
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const s = key.shadow.camera;
  s.left = s.bottom = -r * 1.15; s.right = s.top = r * 1.15; s.near = r * 4; s.far = r * 8;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = r * 0.004;
  key.shadow.radius = SOFT;
  // three takes a hemisphere light's up from where it sits: straight up, as it's made
  const hemi = new HemisphereLight(0, 0, 1);

  // the visitor (the crew capsule): where it rests docked, in the model's frame, and its strobe
  let visitor: Object3D | null = null;
  const dock = new Vector3(), dockQ = new Quaternion();
  let strobes: readonly MeshStandardMaterial[] = [];
  const steady = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let approach = 1, spun = 0;

  let done = () => {};
  let whole: boolean | null = null;
  /** the ship's fade (0..1): opaque materials while it's whole, see-through ones at `v` while it fades */
  function fade(v: number) {
    for (const p of pairs.values()) p.at(v);
    const w = v >= 0.999;
    if (w === whole) return;
    whole = w;
    for (const { mesh, src } of parts) {
      const list = src.map((x) => pairs.get(x)!.at(v));
      mesh.material = list.length === 1 ? list[0]! : list;
    }
  }
  const ready = new Promise<void>((res) => (done = res));
  // the studio, once, and each material in its finish, once (parts that shared one still share one)
  let env: Texture | undefined, tones: Texture | undefined;
  const finishedOf = new Map<Material, Material>();
  /** the cloth's panel tones, once, if anything is woven (finish.ts) */
  const tonesOf = () => {
    if (!tones) { tones = panelToneTexture(); c.owned.push(tones); }
    return tones;
  };
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("/voyage/ship/real.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(r);
    model.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.renderOrder = -1;
      m.castShadow = m.receiveShadow = true;
      // the finish: each surface it lists becomes its metal, reflecting the studio (finish.ts)
      const fin = (x: Material) => {
        const sf = c.finish ? surfaceOf(c.finish, x.name) : null;
        if (!sf || !c.studio) return x;
        const f = finished(x as MeshStandardMaterial, sf, (env ??= c.studio()));
        // the original goes, and with it the maps the finish dropped (a panel's quilting)
        c.owned.push(x);
        for (const t of Object.values(x)) if ((t as Texture)?.isTexture) c.owned.push(t as Texture);
        return f;
      };
      const src = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => (finishedOf.get(x) ?? finishedOf.set(x, fin(x)).get(x))!);
      parts.push({ mesh: m, src });
      for (const mat of src) {
        if (pairs.has(mat)) continue;
        // still writing depth while see-through, so it fades as a whole
        mat.transparent = true;
        // the other bodies' keys stay in the scene, dark while they're away: the ship skips them, shadow maps and all
        // (the cloth's weave after the film's own patches, which would otherwise replace it)
        const lit = occludeDirect(neutralOut(mat as MeshStandardMaterial));
        const woven = lightBy(mat.userData.weave ? weave(lit, tonesOf()) : lit, null) as MeshStandardMaterial;
        const pair = fadePair(m.geometry.getAttribute("_build") ? revealBuilt(woven, built) : woven);
        // see-through, in one pass rather than its back faces and then its front: a third fewer draws while it fades,
        // with no difference to the eye
        pair.both[1].forceSinglePass = true;
        if (mat.name === "cage") skeleton = pair.both;
        pairs.set(mat, pair);
        c.owned.push(mat, ...pair.both);
        for (const t of Object.values(mat)) if ((t as Texture)?.isTexture) c.owned.push(t as Texture);
      }
      c.owned.push(m.geometry);
      if (m.geometry.getAttribute("_build")) m.customDepthMaterial = buildDepth;
    });
    inner.add(model);
    station = model.getObjectByName("real") ?? null;
    if (station) {
      station.parent!.updateMatrix();
      station.updateMatrix();
      stationM.copy(station.parent!.matrix).multiply(station.matrix);
    }
    visitor = model.getObjectByName("visitor") ?? null;
    if (visitor) {
      dock.copy(visitor.position);
      dockQ.copy(visitor.quaternion);
      visitor.traverse((o) => {
        const m = (o as Mesh).material as MeshStandardMaterial | undefined;
        if (m?.name === "visitor strobe") strobes = pairs.get(m)?.both ?? [m];
      });
      // it's small and moves on its own; the ring's shadow map is framed for the ring
      visitor.traverse((o) => { o.castShadow = false; });
    }
    // both of each pair compiled now, the see-through ones first (it fades in)
    fade(1);
    warmUp(c, outer);
    fade(0.5);
    warmUp(c, outer);
    done();
  }, undefined, () => done());

  const q = new Quaternion(), m4 = new Matrix4(), shade = new Color();
  return {
    obj: outer,
    /** its bounding radius, as drawn */
    r,
    lights: [key, hemi] as Object3D[],
    /** his star's light on it */
    key,
    ready,
    /** stands it to a camera looking at it from `toCam` (from the ship towards the camera), with `up` the world's up */
    face(toCam: Vector3, up: Vector3) {
      // the camera's own frame, as three's lookAt builds it: right is up × f, and up is f × right
      const f = toCam.clone().normalize(), rt = new Vector3().crossVectors(up, f).normalize(), u = new Vector3().crossVectors(f, rt).normalize();
      // the ship's basis, from its axis (the model's +y) and its nose (the model's −z)
      const [yAx, nose] = axisOf(f, rt, u);
      const y = yAx.normalize(), z = nose.clone().negate().addScaledVector(y, -nose.clone().negate().dot(y)).normalize(), x = new Vector3().crossVectors(y, z);
      outer.quaternion.setFromRotationMatrix(m4.makeBasis(x, y, z));
    },
    /** turns it by `a` radians about its axis */
    turn(a: number) {
      spun = a;
      inner.quaternion.copy(q.setFromAxisAngle(Y_AXIS, spun));
    },
    /**
     * How far in the visitor is (0 far out ahead of the hub, 1 docked): it closes along the axis and rolls to match the
     * ring's turn as it does, so it docks turning with it.
     */
    approach(k: number) { approach = Math.min(1, Math.max(0, k)); },
    /** How much of it is built (0 its core alone, 1 whole: work.ts); its skeleton is drawn only while it isn't whole. */
    build(b: number) {
      built.value = b;
      for (const m of skeleton) m.visible = b < 1;
    },
    /** Shows the visitor (About's crew capsule) or hides it (home before it was built). */
    showVisitor(v: boolean) { if (visitor) visitor.visible = v; },
    /** The station's own frame (station.py's units, glTF's up: the ring's radius 1, its axis +y), once it's loaded. */
    station: () => station,
    /** From the station's frame to the world with the ring turned by `a` (its turn's radians), into `out`. */
    stationAt(a: number, out: Matrix4) {
      if (!station) return null;
      // outer alone: Work asks this a few hundred times a frame, and the model under it is still
      outer.updateWorldMatrix(false, false);
      return out.copy(outer.matrixWorld).multiply(turnM.makeRotationAxis(Y_AXIS, a)).multiply(stationM);
    },
    /** The ship's pose (its axis the model's +y). */
    pose: () => outer.quaternion,
    /** The ship's axis in the world as it's posed (the model's +y). */
    axis() { return new Vector3(0, 1, 0).applyQuaternion(outer.quaternion); },
    /**
     * Where a label on the ship points, for a camera whose right and up are `camR` and `camU`: inside the hull of one of
     * the near modules on the camera's lower left, which stay in the frame while the ring runs off its right edge
     * (About's settle).
     */
    edge(camR: Vector3, camU: Vector3, short = false) {
      const n = new Vector3(0, 1, 0).applyQuaternion(outer.quaternion);
      // on the line its modules sit on, a little under it: inside a module, or the docking rings between, however far
      // the ring has turned
      const d = nearLeft(camR, camU, n, short);
      if (d) return outer.position.clone().addScaledVector(d, r * CORE).addScaledVector(n, -r * 0.03);
      const w = camR.clone().multiplyScalar(-0.75).addScaledVector(camU, -0.65);
      w.addScaledVector(n, -w.dot(n));
      if (w.lengthSq() < 1e-12) return outer.position.clone().addScaledVector(camR, r * 0.8);
      return outer.position.clone().addScaledVector(w.normalize(), r * RIM);
    },
    /**
     * Where a label on the ship hangs, its leader reaching on to `edge`: just under that module's belly in the dark below
     * the ring, so the label hangs clear of the hull and up off the frame's foot. `short`: on a phone held sideways.
     */
    hang(camR: Vector3, camU: Vector3, short = false) {
      const n = new Vector3(0, 1, 0).applyQuaternion(outer.quaternion);
      const d = nearLeft(camR, camU, n, short);
      return d ? outer.position.clone().addScaledVector(d, r * CORE).addScaledVector(n, -r * 0.085) : this.edge(camR, camU, short);
    },
    fade,
    /**
     * once a frame: the fill follows the region's light, most of the way to grey, so a white hull's shadowed side reads
     * as dark slate touched by the region's hue rather than painted in it
     */
    update() {
      // his star's light, set afresh each frame as every body's key is: the film dims it by a share for a frame (while
      // the ribbon is read only the crawler's star lights it), and a dimming kept from frame to frame would compound to dark
      key.intensity = L.key;
      if (visitor) {
        // in along the axis from 1.2 of the ring's radius ahead of its dock, slowing as it closes
        const k = 1 - approach;
        visitor.position.copy(dock).setY(dock.y + VISITOR_OUT * k * k);
        visitor.quaternion.copy(q.setFromAxisAngle(Y_AXIS, -spun * k)).multiply(dockQ);
      }
      // a crew craft's strobe: a short white flash every 1.4 s (steady under reduced motion)
      const flash = steady ? 4 : (performance.now() / 1000) % 1.4 < 0.07 ? 14 : 0.6;
      for (const m of strobes) m.emissiveIntensity = flash;
      const g = c.fill.r * 0.2126 + c.fill.g * 0.7152 + c.fill.b * 0.0722;
      shade.setRGB(g, g, g).lerp(c.fill, 0.35);
      hemi.color.copy(shade).multiplyScalar(L.sky);
      hemi.groundColor.copy(shade).multiplyScalar(L.ground);
    },
  };
}

/**
 * three's occlusion map darkens only the light that isn't direct; a ship in space is lit almost all by his star's, so
 * the baked occlusion softens that too, by part (the shadow map does the rest), where the map is there.
 */
export function occludeDirect(m: MeshStandardMaterial) {
  if (!m.aoMap) return m;
  const before = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    before.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <aomap_fragment>",
      `#include <aomap_fragment>
      #ifdef USE_AOMAP
        reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, 0.6);
        reflectedLight.directSpecular *= mix(1.0, ambientOcclusion, 0.4);
      #endif`,
    );
  };
  m.customProgramCacheKey = () => "neutral-out-ao";
  return m;
}

/**
 * Draws the ship once, off screen, from beside it, as soon as it has loaded: its shaders (its shadow's too) compile
 * and its textures upload then, so the frame it first comes into view doesn't hitch.
 */
function warmUp(c: Ctx, body: Object3D) {
  let top = body;
  while (top.parent) top = top.parent;
  if (top !== c.scene) return;
  const r = c.W.HOME.r, was = body.visible;
  const cam = new PerspectiveCamera(50, 1, r * 0.05, r * 40);
  cam.position.copy(c.W.HOME.P).addScaledVector(c.W.SUN.clone().sub(c.W.HOME.P).normalize(), r * 4);
  cam.lookAt(c.W.HOME.P);
  const rt = new WebGLRenderTarget(4, 4), prev = c.renderer.getRenderTarget();
  body.visible = true;
  c.renderer.setRenderTarget(rt);
  c.renderer.render(c.scene, cam);
  c.renderer.setRenderTarget(prev);
  body.visible = was;
  rt.dispose();
}
