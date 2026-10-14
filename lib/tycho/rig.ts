/**
 * Tycho, drawn on his own small canvas in his corner. three.js only draws; GSAP authors every motion. Each motion
 * layer owns a proxy (idle, emote, look, hover, talk, blink), and one ticker listener sums them onto the model's named
 * nodes and a pivot round the whole body, so an emote never fights the idle bob or the pointer look-at.
 *
 * Every body plan shares one node tree, and whatever a plan lacks is skipped:
 * - Body, Head (pitch and turn at the neck), EyeL/EyeR (one glyph shown per expression: Open, Wide, Happy, Squeeze,
 *   Spiral, Shut), Antenna with AntennaTip, Lights with Charge0..n (the charge band);
 * - the boosters: HatchL/R (hinged at the top edge), PodL/R travelling from PodStowL/R to PodOutL/R, JetL/R, JetMain;
 * - ArmL/R > ForearmL/R > HandL/R, EarL/R, and a tail Tail0..4 that is the antenna.
 * Lit surfaces go through PBR Neutral, as the sky's do; the colours that carry meaning (his eyes, the beacon, the
 * charge, a thruster's glow) are drawn unlit and not tone mapped, at the sky's energy colour.
 *
 * The warp flies a second rig on a stage canvas of its own (flight.ts), in flight mode (`flight`): he's seen from
 * where the visitor's eye is (a camera in front of the screen; flight-path.ts), so off to one side or flying at us he
 * shows the angle his place gives, and at rest he faces the eye in his corner's three-quarter view. In flight he
 * leans into his motion like a drone (his jets push along his body) and looks where he goes; `flight.w` blends the
 * two. His boosters (`boost`): the hatches flip open, the pods swing out, and his three jets fire flames, each with a
 * glow at its nozzle and their light on his underside; `nozzles()` is where each is, for the trails his fire leaves.
 * `fly` holds the turns, flips and rolls the warp authors, and the throat's warm light on him; `act` is his acting
 * through it (after *Warp or scroll*'s journey).
 *
 * Reached only by a dynamic import, after first paint.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import gsap from "gsap";
import { currentSound } from "@/lib/audio/current";
import { drawnMs, drawsNow } from "@/lib/film/pace";
import { emoteSound } from "@/lib/audio/hooks";
import { leanAround } from "./flight-path";
import { detail, onQuality, quality, shadowSize } from "@/lib/universe/tier";

export const EXPRESSIONS = ["Open", "Wide", "Happy", "Squeeze", "Spiral", "Shut"] as const;
export type Expression = (typeof EXPRESSIONS)[number];
export const EMOTES = ["greet", "anticipate", "settle", "notice", "apologise", "glance", "scoot", "allGood", "flinch", "point"] as const;
export type Emote = (typeof EMOTES)[number];

const ENERGY = "#ffa95a"; // warmth = energy, the sky's own
const DIM = "#2a2118"; // an unlit charge segment
const GLOW = "#ffd6a8";
const HIDE = 1e-4; // a hidden glyph is scaled away, so one draw list serves every face
const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0);
const UP = new THREE.Vector3(0, 1, 0), ORIGIN = new THREE.Vector3();
const FOV = 28.8;
const LEAN_MAX = 1.35; // rad: how far flight tips him over

// ---- the boosters' flames: an open cone from the nozzle, glowing through its middle and cooling to its tip, added to
// what's behind it (the canvas's alpha is left alone, so it glows over whatever is under his canvas)
const FLAME_VS = /* glsl */ `
  varying float vU; varying vec3 vN, vV;
  void main() {
    vU = clamp(-position.y, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const FLAME_FS = /* glsl */ `
  uniform float uT, uA, uSeed; uniform vec3 uHot, uMid, uEmber;
  varying float vU; varying vec3 vN, vV;
  void main() {
    float body = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
    float n = 0.5 + 0.5 * sin(uT * 47.0 + vU * 23.0 + uSeed) * sin(uT * 31.0 - vU * 13.0 + uSeed * 2.0);
    float along = pow(1.0 - vU, 1.25) * (0.8 + 0.4 * n);
    float heat = along * (0.45 + 0.55 * body);
    vec3 col = mix(uEmber, uMid, smoothstep(0.0, 0.35, heat));
    col = mix(col, uHot, smoothstep(0.42, 0.85, heat));
    gl_FragColor = vec4(col * body * along * uA, 0.0);
  }`;
const ADD = {
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  depthWrite: false, transparent: true,
} as const;
// written as given (display values), without a colour-space conversion
const raw = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
/** the glow at a nozzle: white-hot at its core, through `mid` to `ember` at its edge (CSS colours) */
function glowTexture(mid = "#FFC58A", ember = "#B8360E", t?: THREE.CanvasTexture) {
  const c = (t?.image as HTMLCanvasElement | undefined) ?? document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!, g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "#FFF6E8"); g.addColorStop(0.18, mid); g.addColorStop(0.45, ember); g.addColorStop(1, "#000");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  if (t) { t.needsUpdate = true; return t; }
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

// glTF axes: +Y up, the face looks down +Z towards the camera. A head's pitch > 0 dips the face, yaw > 0 turns it to
// screen-right. The pivot's roll < 0 tilts the top to screen-right.
const NEUTRAL = {
  lift: 0, x: 0, sx: 1, sy: 1, pitch: 0, roll: 0, yaw: 0, size: 1,
  hx: 0, hy: 0, hz: 0, // the head
  ax: 0, az: 0, // the antenna (or the tail's root)
  curl: 0, // the tail's curl beyond its rest
  ear: 0, // ears: > 0 pricked, < 0 flattened
  armL: 0, armR: 0, foreL: 0, foreR: 0, // arms raised out, forearms bent forward
  eyeX: 1, eyeY: 1, eyeDX: 0, eyeDY: 0, eyeSpin: 0,
  hatch: 0, pod: 0, glow: 0, // the boosters
};
type Pose = typeof NEUTRAL;

type Opts = { reduced?: boolean; stage?: boolean };

/**
 * His metal's reflections: three softboxes where his Blender renders had them (a broad one above and in front, a
 * tall strip off his right, a dimmer one behind his left), at the same angles and brightness, inside a dim dome, lighter
 * overhead, so his metal has a body that grows with the light: near black in the wake-up's low key, satin by day.
 */
function softboxes() {
  const scene = new THREE.Scene();
  const dome = new THREE.SphereGeometry(20, 32, 16);
  const pos = dome.getAttribute("position");
  const tone = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const up = pos.getY(i) / 20, k = 0.04 + 0.11 * THREE.MathUtils.smoothstep(up, -0.6, 0.1) + 0.2 * THREE.MathUtils.smoothstep(up, 0.1, 1);
    tone.set([k, k, k * 1.08], i * 3);
  }
  dome.setAttribute("color", new THREE.BufferAttribute(tone, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w: number, h: number, at: [number, number, number], k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(...at);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  box(2.8, 1.4, [0.2, 3.2, 1.6], 4.5);
  box(0.35, 2.6, [-3.0, 0.6, 1.2], 4);
  box(0.3, 2.6, [2.8, 0.5, -0.8], 2.5);
  return scene;
}

/** Frees the GPU side of everything under `root`: geometries, materials and their textures. */
function disposeAll(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    // a sprite's quad is three's own, shared by every sprite
    if (!(o as THREE.Sprite).isSprite) m.geometry?.dispose();
    for (const mat of m.material ? [m.material].flat() : []) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}

export function createTychoRig(canvas: HTMLCanvasElement, { reduced = false, stage = false }: Opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: detail().tycho.msaa, alpha: true });
  // the warp's stage is the whole frame, drawn while the sky draws its own heaviest frames: 1.5 is sharp enough for
  // him in flight, with half the pixels of 2
  const ratio = () => Math.min(devicePixelRatio, stage ? 1.5 : detail().tycho.dpr);
  renderer.setPixelRatio(ratio());
  renderer.toneMapping = THREE.NeutralToneMapping;
  // his own parts shade each other (the head on the collar, an arm across the torso), moving as he does: one filtered
  // shadow map (three's PCF; its "soft" variant is gone and falls back to it), sized to how big he's drawn (`size`)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  // his metal reflects softboxes on black, as his Blender renders were lit
  const boxes = softboxes();
  const env = pmrem.fromScene(boxes, 0.04);
  scene.environment = env.texture;
  disposeAll(boxes);
  const key = new THREE.DirectionalLight("#ffffff", 1.6);
  key.position.set(-2.5, 3, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  const rim = new THREE.DirectionalLight("#b9c8ff", 0.9); // the sky behind him, cool
  rim.position.set(2.5, 1.5, -3);
  const rim2 = new THREE.DirectionalLight("#b9c8ff", 0); // a second edge, from behind on his other side
  rim2.position.set(-3, 2.2, -2.5);
  // the warp's glow on him (the hole's disk, the throat): from behind and above, off while fly.rim is 0
  const fire = new THREE.DirectionalLight("#ff7a3d", 0);
  fire.position.set(0.6, 2.2, -3);
  // the band's own light, warm: when it's the only light on him, the charge is what shows him
  const bandLight = new THREE.PointLight(ENERGY, 0, 1.1, 2);
  scene.add(key, rim, rim2, fire);
  // the levels of each light, set by a look (`look`): studio is his everyday light
  // (softboxes on black give far less light than a room, so his metal takes a lot of them)
  const LOOKS = {
    studio: { key: 1.6, rim: 0.9, rim2: 0, env: 1.6, band: 0 },
    // low key, as a product is revealed: dark but for two cool edges from behind and the band's warm light
    lowkey: { key: 0.16, rim: 3.6, rim2: 2.8, env: 0.4, band: 0.65 },
    // backlit by the sky: the edges carry the sky's light, a faint fill, the band's light on his front
    backlit: { key: 0.35, rim: 2.8, rim2: 2.0, env: 0.6, band: 0.6 },
  };
  const lk = { ...LOOKS.studio };
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 80);
  const aim = new THREE.Vector3(0, 1.1, 0);
  let fitH = 2.2;
  // where the camera stands, relative to its everyday framing: turned (az) and raised (el) round his middle, and
  // nearer or further (dist, a multiple of the framing distance); `view` moves it
  const cam = { az: 0, el: 0, dist: 1 };
  // the pointer's sway on top of that (the wake-up's), kept apart so a `view` doesn't stop it; `sway` moves it
  const swayed = { az: 0, el: 0 };
  const BASE = new THREE.Vector3(-0.12, 0.13, 1).normalize();
  const baseAz = Math.atan2(BASE.x, BASE.z), baseEl = Math.asin(BASE.y);

  const place = () => {
    if (flight.on) return;
    camera.fov = FOV;
    const h = stage ? fitH * 4.2 : fitH * 1.12;
    const d = (h / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect)) * cam.dist;
    const az = baseAz + cam.az + swayed.az, el = baseEl + cam.el + swayed.el;
    camera.position.copy(aim).add(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d));
    camera.lookAt(aim);
    camera.updateProjectionMatrix();
  };
  // the sway drifts to where it's sent rather than tracking it
  const swayAz = gsap.quickTo(swayed, "az", { duration: 1.2, ease: "power3.out", onUpdate: place });
  const swayEl = gsap.quickTo(swayed, "el", { duration: 1.2, ease: "power3.out", onUpdate: place });
  // his shadow map's side at full quality: in his corner (a canvas a few hundred device px across) a 512 map is finer
  // than his pixels; filling the frame at the wake-up, 1024
  let fullShadow = 1024;
  const fitShadow = () => {
    const res = shadowSize(fullShadow, quality());
    if (key.shadow.mapSize.x !== res) {
      key.shadow.mapSize.set(res, res);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    }
  };
  const size = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    fullShadow = Math.max(r.width, r.height) * renderer.getPixelRatio() > 600 ? 1024 : 512;
    fitShadow();
    camera.aspect = r.width / Math.max(1, r.height);
    // frame his height (or, on the stage, a few of him) from in front, a little to his right and above
    place();
  };

  // his corner's canvas changes size with the page's layout (a phone's), not only with the window; the stage sizes
  // its own buffer (`buffer`)
  const resized = stage ? null : new ResizeObserver(() => size());
  resized?.observe(canvas);
  // a lower quality for the visit: his corner's pixel ratio and his shadow follow it; the stage sizes its own buffer
  const offQuality = onQuality(() => {
    if (stage) return fitShadow();
    renderer.setPixelRatio(ratio());
    size();
  });

  const idle = { bob: 0, sway: 0, tail: 0 };
  const em: Pose = { ...NEUTRAL };
  const look = { x: 0, y: 0 };
  const hov = { lift: 0, eye: 1, ax: 0 };
  // adrift (the wake-up's drift): a slow weightless roll, turn, nod and rise, each on its own long period
  const flt = { roll: 0, yaw: 0, pitch: 0, lift: 0 }, fltK = { k: 0 };
  const talk = { hx: 0, az: 0, arm: 0 };
  const blink = { y: 1 };
  // leaning into his travel across the frame: the top tips the way he's going
  const trv = { roll: 0, pitch: 0 };
  // the warp's flight (his stage only, flight.ts): which way the visitor's eye is from him (three.js axes, z towards
  // the eye) and how far (his units), how many of his heights his canvas frames, his motion (px/s and px/s², three.js
  // axes), how far he leans into it (w: 0 faces the eye, 1 flies), and whether his turns ease (in flight) or snap
  const flight = { on: false, eye: new THREE.Vector3(0, 0, 1), dist: Infinity, frame: 2.3, vel: new THREE.Vector3(), acc: new THREE.Vector3(), w: 0, smooth: false };
  // the turns, flips and rolls the warp authors, and the warp's warm light on him
  const fly = { yaw: 0, pitch: 0, roll: 0, rim: 0 };
  // his boosters: out (0 stowed, 1 out; back.out's overshoot past 1 knocks them home), and how hard his jets fire
  const boost = { deploy: 0, thrust: 0, kick: 0 };
  const charge = { p: 1, beacon: 1 };
  // how much of the idle plays: 0 holds him at rest, as the wake-up's flat drawing shows him, until it hands over
  const idleK = { k: 1 };

  type Rest = { node: THREE.Object3D; q: THREE.Quaternion; p: THREE.Vector3; s: THREE.Vector3 };
  const rest = (node: THREE.Object3D | undefined): Rest | null => (node ? { node, q: node.quaternion.clone(), p: node.position.clone(), s: node.scale.clone() } : null);
  let N: {
    head: Rest; antenna: Rest | null; eyes: { rest: Rest; glyphs: Map<string, Rest> }[];
    hatches: Rest[]; pods: { rest: Rest; stow: THREE.Object3D; out: THREE.Object3D }[];
    arms: { arm: Rest; fore: Rest | null; side: number }[]; ears: { rest: Rest; side: number }[]; tail: Rest[];
    charge: THREE.MeshBasicMaterial[]; beacon: THREE.MeshBasicMaterial[]; glow: THREE.MeshBasicMaterial[];
  } | null = null;
  let pivot: THREE.Group | null = null;
  // the whole of him, turned by flight mode round his middle
  const world = new THREE.Group();
  type Jet = { flame: THREE.Mesh; glow: THREE.Sprite; anchor: THREE.Object3D; u: Record<string, THREE.IUniform>; r: number; len: number; thrust: number };
  let jets: { all: Jet[]; light: THREE.PointLight; tex: THREE.CanvasTexture } | null = null;
  let expression: Expression = "Open";

  // a display hex through three's colour management, unlit and not tone mapped, reaches the screen as written
  const unlit = (hex: string) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), toneMapped: false });

  let dead = false;
  const ready = new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync("/voyage/tycho/explorer-metal.glb")
    .then((gltf) => {
      // destroyed while he loaded: never drawn, so nothing of his reached the GPU
      if (dead) return;
      const root = gltf.scene;
      const get = (n: string) => root.getObjectByName(n);
      // the meaningful colours, unlit; each charge segment its own, so the band fills one by one
      const chargeMats: THREE.MeshBasicMaterial[] = [], beacon: THREE.MeshBasicMaterial[] = [], glow: THREE.MeshBasicMaterial[] = [];
      const eyeMat = unlit(ENERGY);
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.castShadow = m.receiveShadow = true;
        const name = (m.material as THREE.Material).name;
        if (["Eye", "Beacon", "Charge", "Glow"].includes(name)) m.castShadow = m.receiveShadow = false;
        if (name === "Eye") m.material = eyeMat;
        else if (name === "Beacon") beacon.push((m.material = unlit(ENERGY)) as THREE.MeshBasicMaterial);
        else if (name === "Charge") chargeMats[Number(m.name.replace(/\D/g, ""))] = (m.material = unlit(DIM)) as THREE.MeshBasicMaterial;
        else if (name === "Glow") glow.push((m.material = unlit(GLOW)) as THREE.MeshBasicMaterial);
        else if (name === "Glass") {
          // the visor's glass: only its reflections, laid over the screen and his eyes behind it
          const g = m.material as THREE.MeshStandardMaterial;
          g.transparent = true;
          g.blending = THREE.AdditiveBlending;
          g.depthWrite = false;
          m.castShadow = m.receiveShadow = false;
        }
      });
      // his height and middle, with the hidden glyphs left out
      const box = new THREE.Box3();
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && !/^Eye[LR]_(?!Open)/.test(o.name)) box.expandByObject(o, true);
      });
      fitH = box.max.y - box.min.y;
      const mid = (box.min.y + box.max.y) / 2;
      aim.set(0, mid, 0);
      // the key's shadow covers him wherever an emote takes him
      key.target.position.copy(aim);
      key.position.copy(aim).add(new THREE.Vector3(-2.5, 3, 3));
      scene.add(key.target);
      const sc = key.shadow.camera;
      sc.left = sc.bottom = -fitH * 1.2;
      sc.right = sc.top = fitH * 1.2;
      sc.near = 0.5;
      sc.far = 12;
      sc.updateProjectionMatrix();
      pivot = new THREE.Group();
      pivot.rotation.order = "YXZ";
      world.position.y = mid;
      root.position.y = -mid;
      pivot.add(root);
      world.add(pivot);
      scene.add(world);
      if (stage) jets = buildJets(get);
      size();

      const eyes = ["EyeL", "EyeR"].map((n) => {
        const e = get(n)!;
        const glyphs = new Map<string, Rest>();
        for (const x of EXPRESSIONS) {
          const g = rest(get(`${n}_${x}`));
          if (g) glyphs.set(x, g);
        }
        return { rest: rest(e)!, glyphs };
      });
      N = {
        head: rest(get("Head"))!,
        antenna: rest(get("Antenna")),
        eyes,
        hatches: ["HatchL", "HatchR"].map((n) => rest(get(n))).filter((r): r is Rest => !!r),
        pods: (["L", "R"] as const)
          .map((s) => ({ rest: rest(get("Pod" + s)), stow: get("PodStow" + s), out: get("PodOut" + s) }))
          .filter((p): p is { rest: Rest; stow: THREE.Object3D; out: THREE.Object3D } => !!(p.rest && p.stow && p.out)),
        arms: (["L", "R"] as const)
          .map((s) => ({ arm: rest(get("Arm" + s)), fore: rest(get("Forearm" + s)), side: s === "L" ? -1 : 1 }))
          .filter((a): a is { arm: Rest; fore: Rest | null; side: number } => !!a.arm),
        ears: (["L", "R"] as const).map((s) => ({ rest: rest(get("Ear" + s)), side: s === "L" ? -1 : 1 })).filter((e): e is { rest: Rest; side: number } => !!e.rest),
        tail: [1, 2, 3, 4].map((i) => rest(get("Tail" + i))).filter((r): r is Rest => !!r),
        charge: chargeMats.filter(Boolean),
        beacon,
        glow,
      };
      const lights = get("Lights");
      const segs = lights?.children ?? [];
      if (lights && segs.length) {
        const mid = new THREE.Vector3();
        segs.forEach((c) => mid.add(c.position));
        // a little in front of the band, so it falls on his visor's rim and his chest
        bandLight.position.copy(mid.divideScalar(segs.length)).add(new THREE.Vector3(0, 0.02, 0.18));
        lights.add(bandLight);
      }
      show("Open");
      apply();
    });

  const q = new THREE.Quaternion();
  const at = (r: Rest, axis: THREE.Vector3, a: number, local = true) => {
    q.setFromAxisAngle(axis, a);
    if (local) r.node.quaternion.copy(r.q).multiply(q);
    else r.node.quaternion.copy(q).multiply(r.q);
  };
  const euler = new THREE.Euler();
  const pv = new THREE.Vector3(), pq = new THREE.Quaternion();
  const energy = new THREE.Color(ENERGY), dim = new THREE.Color(DIM), glowC = new THREE.Color(GLOW);
  let clock = 0;

  // --- the warp's boosters: a flame and a glow at each nozzle (Jet* empties, the exhaust along their local -y) ---------
  function buildJets(get: (n: string) => THREE.Object3D | undefined) {
    const geo = new THREE.ConeGeometry(1, 1, 28, 10, true).rotateX(Math.PI).translate(0, -0.5, 0);
    const tex = glowTexture();
    const jet = (anchor: THREE.Object3D | undefined, r: number, len: number, seed: number): Jet | null => {
      if (!anchor) return null;
      const u = { uT: { value: 0 }, uA: { value: 0 }, uSeed: { value: seed }, uHot: { value: raw("#FFF4E2") }, uMid: { value: raw("#FF8A3A") }, uEmber: { value: raw("#C2280A") } };
      const flame = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: FLAME_VS, fragmentShader: FLAME_FS, side: THREE.DoubleSide, ...ADD }));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, toneMapped: false, ...ADD }));
      flame.renderOrder = glow.renderOrder = 2;
      flame.visible = glow.visible = false;
      anchor.add(flame, glow);
      return { flame, glow, anchor, u, r, len, thrust: 0 };
    };
    const all = [jet(get("JetMain"), 0.14, 1.05, 1.7), jet(get("JetL"), 0.075, 0.75, -3.1), jet(get("JetR"), 0.075, 0.75, 3.1)].filter((j): j is Jet => !!j);
    const light = new THREE.PointLight("#FF7A3D", 0, 3.5, 1.4);
    light.position.set(0, -0.2, 0);
    world.add(light);
    return { all, light, tex };
  }
  /** fires the jets as `boost` says (plus a flare as he speeds up); returns how hard, 0.. */
  function applyJets() {
    if (!jets) return 0;
    const d = boost.deploy, auto = Math.min(1, flight.acc.length() / 7000) * 0.8 * Math.min(1, d * 2) * (flight.on ? 1 : 0);
    const T = Math.max(0, boost.thrust + boost.kick + auto);
    jets.all.forEach((j, i) => {
      // the pods' jets only fire once they're out
      const th = i === 0 ? T : T * Math.min(1, d);
      j.thrust = th;
      const on = th > 0.02;
      j.flame.visible = j.glow.visible = on;
      if (!on) return;
      const f = 1 + 0.1 * Math.sin(clock * 53 + i) + 0.06 * Math.sin(clock * 87 + i * 2), c = Math.min(th, 1.6);
      j.flame.scale.set(j.r * (0.8 + 0.3 * c), (0.2 + j.len * c) * f, j.r * (0.8 + 0.3 * c));
      j.u.uT!.value = clock;
      j.u.uA!.value = Math.min(1.4, 0.5 + th * 0.7);
      const gs = j.r * (2.6 + 3 * c) * (1 + 0.08 * Math.sin(clock * 71 + i));
      j.glow.scale.set(gs, gs, 1);
      (j.glow.material as THREE.SpriteMaterial).color.setScalar(Math.min(1, th * 0.9));
    });
    jets.light.intensity = Math.min(1.6, T) * 7;
    return Math.min(1, T);
  }

  // --- flight mode: seen from the visitor's eye, leaning into his motion ---------------------------------------------
  // the turn that takes his corner camera's direction to straight ahead, so facing the eye he shows that same view
  const Q_OFF_INV = new THREE.Quaternion().setFromEuler(new THREE.Euler(-baseEl, baseAz, 0, "YXZ")).invert();
  const m4 = new THREE.Matrix4(), qFace = new THREE.Quaternion(), qMove = new THREE.Quaternion(), qW = new THREE.Quaternion();
  const vUp = new THREE.Vector3(), vF = new THREE.Vector3(), vX = new THREE.Vector3(), vT = new THREE.Vector3();
  // which way round the vertical he leans in flight (flight-path.ts leanAround), NaN until he leans
  let leanPhi = NaN;
  function orient(dt: number) {
    const { eye, vel, acc, w } = flight;
    m4.lookAt(eye, ORIGIN, UP);
    qFace.setFromRotationMatrix(m4).multiply(Q_OFF_INV);
    if (w > 0) {
      const sp = vel.length();
      // his jets push along his body, so he tips towards where he's speeding up and into his speed (drag): as far as
      // that push is from straight up, up to LEAN_MAX, and the way it points round the vertical, which turns no faster
      // than he could swing round (his push can swing round in a frame)
      vUp.copy(UP).addScaledVector(acc, 1 / 6000).addScaledVector(vel, 1 / 1500);
      const fromUp = vUp.angleTo(UP), tilt = Math.min(fromUp, LEAN_MAX);
      leanPhi = leanAround(leanPhi, Math.atan2(vUp.z, vUp.x), fromUp, tilt, dt);
      vUp.set(Math.sin(tilt) * Math.cos(leanPhi), Math.cos(tilt), Math.sin(tilt) * Math.sin(leanPhi));
      // and looks where he's going once he's going fast; slower, he looks at us
      const wv = THREE.MathUtils.smoothstep(sp, 150, 700);
      vF.copy(eye).multiplyScalar(1 - wv);
      if (sp > 1) vF.addScaledVector(vel, wv / sp);
      vF.addScaledVector(vUp, -vF.dot(vUp));
      if (vF.lengthSq() < 1e-4) vF.copy(eye).addScaledVector(vUp, -eye.dot(vUp)).add(vT.set(0, 0, 1e-3));
      vF.normalize();
      vX.crossVectors(vUp, vF).normalize();
      m4.makeBasis(vX, vUp, vF);
      qMove.setFromRotationMatrix(m4).multiply(Q_OFF_INV);
      qFace.slerp(qMove, Math.min(1, w));
    } else leanPhi = NaN;
    if (flight.smooth && dt > 0) qW.slerp(qFace, 1 - Math.exp(-dt / 0.07));
    else qW.copy(qFace);
    world.quaternion.copy(qW);
  }
  // the camera where the eye is: framing `frame` of his heights, coming in (wider) once the eye is nearer than that
  function aimCamera() {
    const half = (flight.frame * fitH) / 2, L0 = half / Math.tan(THREE.MathUtils.degToRad(FOV / 2)), L = Math.max(fitH * 0.6, Math.min(L0, flight.dist));
    camera.position.copy(aim).addScaledVector(flight.eye, L);
    camera.lookAt(aim);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(half / L));
    camera.updateProjectionMatrix();
  }
  const tmpV = new THREE.Vector3(), sz = new THREE.Vector2();

  // his canvas's place for the pointer's look, read at most once a frame however often the pointer moves
  let rect: DOMRect | null = null;
  function apply(_time?: number, deltaMs = 0) {
    rect = null;
    const dt = Math.min(0.1, deltaMs / 1000);
    clock += dt;
    if (flight.on) aimCamera();
    if (N && pivot) {
      if (flight.on) orient(dt);
      else world.quaternion.identity();
      const f = fltK.k;
      pivot.position.set(em.x, idle.bob * idleK.k + em.lift + hov.lift + flt.lift * f, 0);
      pivot.rotation.set(em.pitch + trv.pitch + fly.pitch + flt.pitch * f, idle.sway * idleK.k + em.yaw + fly.yaw + flt.yaw * f, em.roll + trv.roll + fly.roll + flt.roll * f);
      pivot.scale.set(em.sx * em.size, em.sy * em.size, em.sx * em.size);
      // the head: its rest, then the emote, the pointer and a talk nod
      euler.set(em.hx + talk.hx + look.y, em.hy + look.x, em.hz, "YXZ");
      N.head.node.quaternion.copy(N.head.q).multiply(pq.setFromEuler(euler));
      if (N.antenna) {
        euler.set(em.ax + hov.ax, 0, em.az + talk.az + (N.tail.length ? idle.tail * 0.4 : 0), "XYZ");
        N.antenna.node.quaternion.copy(N.antenna.q).multiply(pq.setFromEuler(euler));
      }
      N.tail.forEach((t, i) => at(t, X, em.curl * (0.6 + i * 0.2) + idle.tail * 0.15 * (i + 1)));
      N.ears.forEach((e) => at(e.rest, X, -em.ear * 0.35 + hov.ax * 0.4));
      N.arms.forEach(({ arm, fore, side }) => {
        at(arm, Z, side * ((side < 0 ? em.armL : em.armR) + talk.arm * (side > 0 ? 1 : 0.4)), false);
        if (fore) at(fore, X, -(side < 0 ? em.foreL : em.foreR));
      });
      N.eyes.forEach(({ rest: r }, i) => {
        r.node.scale.set(r.s.x * em.eyeX * hov.eye, r.s.y * em.eyeY * blink.y * hov.eye, r.s.z);
        r.node.position.set(r.p.x + em.eyeDX, r.p.y + em.eyeDY, r.p.z);
        // dizzy spirals spin, each the way it winds
        at(r, Z, (i === 0 ? 1 : -1) * em.eyeSpin);
      });
      // the boosters: an emote's, or the warp's (the hatches flip open first; the pods come out of their bays and swing
      // out on their struts, a touch past out on back.out's overshoot, so they lock with a knock)
      const d = boost.deploy;
      const open = Math.max(em.hatch, THREE.MathUtils.smoothstep(d, 0, 0.32) + Math.max(0, d - 1) * 0.6);
      const out = Math.max(em.pod, Math.min(1.15, Math.max(0, (d - 0.16) / 0.84)));
      N.hatches.forEach((h) => at(h, X, -1.9 * Math.min(1.1, open)));
      N.pods.forEach(({ rest: r, stow, out: to }) => {
        const k = out;
        r.node.position.lerpVectors(stow.position, to.position, k);
        r.node.quaternion.slerpQuaternions(stow.quaternion, to.quaternion, Math.min(1, k));
        pv.copy(stow.scale).lerp(to.scale, Math.min(1, k));
        r.node.scale.copy(pv);
      });
      const T = applyJets();
      N.glow.forEach((m) => m.color.copy(dim).lerp(glowC, Math.min(1, Math.max(em.glow, T))));
      const lit = charge.p * N.charge.length;
      N.charge.forEach((m, i) => m.color.copy(dim).lerp(energy, Math.min(1, Math.max(0, lit - i))));
      N.beacon.forEach((m) => m.color.copy(dim).lerp(energy, charge.beacon));
    }
    key.intensity = lk.key;
    rim.intensity = lk.rim;
    rim2.intensity = lk.rim2;
    fire.intensity = fly.rim * 4;
    scene.environmentIntensity = lk.env;
    bandLight.intensity = lk.band * charge.p;
    if (timer) timed(() => renderer.render(scene, camera));
    else renderer.render(scene, camera);
  }
  // in development, his canvas's GPU ms a frame where the browser has the timer query (`perf.gpu`, read by the audits)
  const perf = { gpu: null as number | null };
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const timer = process.env.NODE_ENV !== "production" ? gl.getExtension("EXT_disjoint_timer_query_webgl2") : null;
  const queries: WebGLQuery[] = [];
  function timed(draw: () => void) {
    const q = gl.createQuery()!;
    gl.beginQuery(timer!.TIME_ELAPSED_EXT, q);
    draw();
    gl.endQuery(timer!.TIME_ELAPSED_EXT);
    queries.push(q);
    while (queries.length && gl.getQueryParameter(queries[0]!, gl.QUERY_RESULT_AVAILABLE)) {
      const done = queries.shift()!;
      if (!gl.getParameter(timer!.GPU_DISJOINT_EXT)) perf.gpu = gl.getQueryParameter(done, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(done);
    }
  }
  // on the ticker, drawn on the frames the film is drawn on (lib/film/pace.ts), with the time since the last of them
  const onTicker = () => { if (drawsNow()) apply(undefined, drawnMs()); };
  gsap.ticker.add(onTicker);
  let drawing = true;

  // --- the eyes ---------------------------------------------------------------------------------------------------
  function show(x: Expression) {
    expression = x;
    // a glyph's rest scale isn't 1: quantisation folds the mesh's own scale into it
    N?.eyes.forEach(({ glyphs }) => glyphs.forEach((g, k) => g.node.scale.copy(g.s).multiplyScalar(k === x ? 1 : HIDE)));
  }
  /** a blink that swaps the glyph while the eyes are shut, so the change reads as his, not a cut */
  function face(x: Expression, tl?: gsap.core.Timeline, at: number | string = 0) {
    const t = tl ?? gsap.timeline();
    if (x === expression && !tl) return t;
    if (reduced) return t.call(() => show(x), [], at);
    return t.to(blink, { y: 0.08, duration: 0.06, ease: "power2.in" }, at).call(() => show(x)).to(blink, { y: 1, duration: 0.12, ease: "back.out(2)" });
  }

  // --- idle ---------------------------------------------------------------------------------------------------------
  const loops: gsap.core.Animation[] = [];
  if (!reduced) {
    loops.push(gsap.to(idle, { bob: 0.05, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(idle, { sway: -0.06 }, { sway: 0.06, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(idle, { tail: -0.25 }, { tail: 0.25, duration: 1.9, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(flt, { roll: -0.06 }, { roll: 0.06, duration: 7.5, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(flt, { yaw: -0.09 }, { yaw: 0.09, duration: 11, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(flt, { pitch: -0.035 }, { pitch: 0.035, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    loops.push(gsap.fromTo(flt, { lift: -0.03 }, { lift: 0.03, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 }));
  }
  let blinkCall: gsap.core.Tween | null = null;
  const doBlink = () => {
    if (expression === "Open" && em.eyeY > 0.7 && !dozing) gsap.timeline().to(blink, { y: 0.1, duration: 0.07, ease: "power2.in" }).to(blink, { y: 1, duration: 0.1, ease: "power2.out" });
    blinkCall = gsap.delayedCall(gsap.utils.random(2.2, 5), doBlink);
  };
  blinkCall = gsap.delayedCall(1.5, doBlink);
  // the warp's stage idles only while it flies him; waiting unseen between warps, it costs nothing
  const idling = (on: boolean) => {
    loops.forEach((l) => l.paused(!on));
    blinkCall?.paused(!on);
  };
  if (stage) idling(false);

  // --- the pointer: his head follows it, as far as a head turns ----------------------------------------------------
  const lookX = gsap.quickTo(look, "x", { duration: 0.5, ease: "power3.out" });
  const lookY = gsap.quickTo(look, "y", { duration: 0.5, ease: "power3.out" });
  let lookStrength = 1;
  const lookTo = (x: number, y: number) => {
    const r = (rect ??= canvas.getBoundingClientRect());
    const dx = (x - (r.left + r.width / 2)) / innerWidth, dy = (y - (r.top + r.height / 2)) / innerHeight;
    lookX(gsap.utils.clamp(-0.55, 0.55, dx * 1.6) * lookStrength);
    lookY(gsap.utils.clamp(-0.35, 0.35, dy * 1.1) * lookStrength);
  };
  const onPointer = (e: PointerEvent) => {
    if (reduced || busy) return;
    lookTo(e.clientX, e.clientY);
  };
  // the warp's stage never looks at the pointer: in flight he looks where he goes
  if (!stage) addEventListener("pointermove", onPointer);

  // --- emotes: one at a time, each easing back from wherever the last left him ----------------------------------------
  let cur: gsap.core.Timeline | null = null;
  let busy = false;
  let dozing = false;
  // a face swap blinks inside its emote's timeline: an emote cut off mid-blink would leave the eyes shut until the
  // next idle blink, so cutting one off opens them
  const stop = () => {
    cur?.kill();
    blink.y = 1;
  };
  const run = (build: (tl: gsap.core.Timeline) => void, { hold = false } = {}) => {
    stop();
    const tl = gsap.timeline({ onComplete: () => void (!hold && relax()) });
    tl.to(em, { ...NEUTRAL, duration: 0.25, ease: "power1.out" }, 0);
    build(tl);
    cur = tl;
    return tl;
  };
  const relax = () => {
    stop();
    busy = false;
    cur = gsap.timeline().to(em, { ...NEUTRAL, duration: 0.4, ease: "power2.out" }, 0);
    if (expression !== "Open") face("Open", cur, 0);
    return cur;
  };
  const hasArms = () => !!N?.arms.length;

  const emotes: Record<Emote, () => gsap.core.Timeline> = {
    // a hop, a happy face and a wave (an antenna's wiggle, or his tail's, where there are no arms)
    greet: () =>
      run((tl) => {
        tl.to(em, { sy: 0.88, sx: 1.06, lift: -0.04, duration: 0.14, ease: "power2.in" }, 0)
          .to(em, { sy: 1.08, sx: 0.96, lift: 0.14, duration: 0.22, ease: "power2.out" })
          .to(em, { sy: 1, sx: 1, lift: 0.02, duration: 0.3, ease: "back.out(2)" });
        face("Happy", tl, 0.1);
        if (hasArms()) tl.to(em, { armR: 2.2, foreR: 0.2, duration: 0.3, ease: "back.out(1.6)" }, 0.15).to(em, { armR: 2.7, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0.45);
        tl.to(em, { hz: -0.16, curl: 0.6, ear: 1, duration: 0.3, ease: "back.out(2)" }, 0.15).to(em, { az: 0.3, duration: 0.12, ease: "sine.inOut", yoyo: true, repeat: 5 }, 0.3);
        tl.to({}, { duration: 0.5 });
      }),
    // a crouch before a move
    anticipate: () =>
      run(
        (tl) => {
          tl.to(em, { sy: 0.8, sx: 1.1, lift: -0.07, pitch: 0.12, eyeY: 0.7, ear: -0.4, curl: -0.3, armL: 0.25, armR: 0.25, duration: 0.32, ease: "power2.out" }, 0);
          face("Squeeze", tl, 0.05);
          tl.to(em, { sy: 1.18, sx: 0.92, lift: 0.1, pitch: -0.05, duration: 0.14, ease: "power3.in" }, 0.6);
        },
      ),
    // landing on a parking spot: squash, overshoot, a small settle of the head
    settle: () =>
      run((tl) => {
        tl.fromTo(em, { lift: 0.18 }, { lift: 0, duration: 0.22, ease: "power2.in" }, 0)
          .to(em, { sy: 0.86, sx: 1.08, duration: 0.09, ease: "power2.out" })
          .to(em, { sy: 1.03, sx: 0.98, duration: 0.16, ease: "power2.out" })
          .to(em, { sy: 1, sx: 1, hx: 0.12, duration: 0.3, ease: "sine.inOut" })
          .to(em, { hx: 0, duration: 0.4, ease: "sine.inOut" });
      }),
    // the shoo, one: he notices the shaking pointer
    notice: () =>
      run((tl) => {
        tl.to(em, { lift: 0.08, sy: 1.08, sx: 0.95, ear: 1, ax: -0.3, duration: 0.12, ease: "power3.out" }, 0);
        face("Wide", tl, 0);
        tl.to(em, { sy: 1, sx: 1, duration: 0.3, ease: "back.out(2)" }).to({}, { duration: 0.5 });
      }),
    // two: a bow, a sheepish squint, the antenna (or the tail, or the ears) drooping; a hand to the back of his head
    apologise: () =>
      run((tl) => {
        tl.to(em, { pitch: 0.2, hx: 0.16, ax: 0.6, ear: -1, curl: -0.6, eyeY: 0.55, duration: 0.4, ease: "power2.out" }, 0);
        face("Happy", tl, 0.05);
        if (hasArms()) tl.to(em, { armR: 2.4, foreR: -1.2, duration: 0.4, ease: "power2.out" }, 0.05);
        tl.to(em, { hz: 0.1, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0.4).to({}, { duration: 0.3 });
      }),
    // three: a glance towards where he'll go
    glance: () =>
      run((tl) => {
        tl.to(em, { hy: -0.55, eyeDX: -0.04, duration: 0.22, ease: "power2.out" }, 0).to({}, { duration: 0.5 });
        face("Open", tl, 0);
      }),
    // four: he scoots off sideways, leaning into it
    scoot: () =>
      run((tl) => {
        tl.to(em, { sy: 0.88, sx: 1.06, duration: 0.1, ease: "power2.in" }, 0)
          .to(em, { x: -0.35, roll: 0.25, sy: 1, sx: 1, glow: 1, duration: 0.35, ease: "power2.inOut" })
          .to(em, { roll: -0.12, duration: 0.15, ease: "power2.out" })
          .to(em, { x: 0, roll: 0, glow: 0, duration: 0.5, ease: "power2.inOut" }, "+=0.2");
      }),
    // five: all good, a nod and a happy face
    allGood: () =>
      run((tl) => {
        face("Happy", tl, 0);
        tl.to(em, { hx: 0.18, duration: 0.14, ease: "power2.out" }, 0.05).to(em, { hx: -0.04, duration: 0.18, ease: "power2.inOut" }).to(em, { hx: 0, duration: 0.2 });
        if (hasArms()) tl.to(em, { armR: 1.2, foreR: 1.2, duration: 0.25, ease: "back.out(2)" }, 0.05);
        tl.to(em, { curl: 0.5, ear: 0.6, duration: 0.3, ease: "back.out(2)" }, 0.05).to({}, { duration: 0.6 });
      }),
    // the hint flinch: a start back, wide eyes, then squeezed
    flinch: () =>
      run((tl) => {
        tl.to(em, { lift: 0.05, x: 0.08, pitch: -0.15, sy: 1.08, sx: 0.94, ear: -1, armL: 0.5, armR: 0.5, duration: 0.08, ease: "power3.out" }, 0);
        face("Wide", tl, 0);
        face("Squeeze", tl, 0.3);
        tl.to(em, { lift: 0, x: 0, pitch: 0, sy: 1, sx: 1, ear: 0, armL: 0, armR: 0, duration: 0.35, ease: "power2.out" }, 0.35).to({}, { duration: 0.3 });
      }),
    // pointing at what the reply is about (up and to his right, here)
    point: () =>
      run((tl) => {
        tl.to(em, { hy: 0.45, hx: -0.15, yaw: 0.2, duration: 0.3, ease: "power2.out" }, 0);
        if (hasArms()) tl.to(em, { armR: 1.9, foreR: 0.1, duration: 0.3, ease: "back.out(1.5)" }, 0.05);
        else tl.to(em, { roll: -0.25, ax: -0.4, curl: 0.5, duration: 0.3, ease: "back.out(1.5)" }, 0.05);
        tl.to({}, { duration: 1.2 });
      }),
  };

  // thinking: he looks up at the sky, and his eyes scan along it as if reading the stars he lights. Holds until `relax`.
  const think = () =>
    run(
      (tl) =>
        tl
          .to(em, { hx: -0.32, eyeDY: 0.035, eyeY: 0.9, duration: 0.5, ease: "power2.out" }, 0)
          .to(em, { hy: 0.18, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0.3)
          .fromTo(em, { eyeDX: -0.05 }, { eyeDX: 0.05, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0.3)
          .to(em, { curl: 0.3, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 }, 0.3),
      { hold: true },
    );

  // --- the warp's acting (the warp times these and owns his flight, his turns and his boosters) ------------------------
  // one property through a run of values: [value, seconds] each
  const kf = (prop: keyof Pose, steps: Array<[number, number]>) => ({ keyframes: steps.map(([v, d]) => ({ [prop]: v, duration: d })) });
  const act = {
    /** ignition: a crouch as the hatches open, eyes gone wide; then he springs as the jets fire, eyes squeezed > < */
    ignite: () =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { sy: 0.8, sx: 1.1, lift: -0.04, ax: 0.5, armL: 0.35, armR: 0.35, duration: 0.14, ease: "power2.out" }, 0)
          .to(em, { sy: 1.2, sx: 0.9, lift: 0.06, ax: -0.7, armL: 0.15, armR: 0.15, duration: 0.12, ease: "power3.out" }, 0.2)
          .to(em, { sy: 1, sx: 1, lift: 0, ax: -0.2, duration: 0.35, ease: "power2.out" }, 0.32);
        face("Squeeze", tl, 0.2);
        face("Open", tl, 0.6);
      }, { hold: true }),
    /** the wind-up: a crouch, leaning back, arms drawn back, eyes squeezed with the effort; then a shiver of held energy */
    windup: (dur = 0.45) =>
      run((tl) => {
        busy = true;
        face("Squeeze", tl, 0);
        tl.to(em, { sy: 0.8, sx: 1.12, lift: -0.05, pitch: -0.24, hx: -0.2, ax: -0.75, armL: 0.6, armR: 0.6, foreL: -0.6, foreR: -0.6, duration: dur * 0.8, ease: "power2.out" }, 0)
          .fromTo(em, { roll: -0.03 }, { roll: 0.03, duration: 0.035, ease: "none", yoyo: true, repeat: 2 * Math.ceil((dur * 0.5) / 0.07) + 1, immediateRender: false }, dur * 0.45);
      }, { hold: true }),
    /** the cast: he springs out of the crouch, stretched, head and arms thrown forward; then the blast knocks him back */
    cast: () =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { sy: 1.32, sx: 0.86, lift: 0.1, pitch: 0.5, hx: 0.35, ax: 0.95, roll: 0, armL: 1.2, armR: 1.2, foreL: 0.8, foreR: 0.8, duration: 0.08, ease: "power3.out" }, 0)
          .to(em, { sy: 0.82, sx: 1.12, pitch: -0.35, lift: 0.02, hx: -0.28, ax: -0.55, duration: 0.15, ease: "power2.out" }, 0.1)
          .to(em, { sy: 1, sx: 1, pitch: -0.12, lift: 0, hx: -0.12, duration: 0.4, ease: "back.out(2)" }, 0.27);
      }, { hold: true }),
    /** blown back by the blast: stretched, eyes gone to big round Os, arms flung out, then he wobbles back into shape */
    whoa: () =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { sy: 1.28, sx: 0.87, eyeX: 1.1, eyeY: 1.1, hx: -0.3, ax: 0.9, armL: 1.9, armR: 1.9, foreL: 0, foreR: 0, duration: 0.07, ease: "power3.out" }, 0)
          .to(em, { sy: 1, sx: 1, duration: 0.45, ease: "elastic.out(1, 0.4)" }, 0.1)
          .to(em, kf("az", [[0.5, 0.08], [-0.4, 0.1], [0.25, 0.1], [0, 0.15]]), 0.05);
      }, { hold: true }),
    /** straining against the pull, facing us: leaning our way, face up to us, eyes squeezed, arms out, a shiver */
    strain: () =>
      run((tl) => {
        busy = true;
        face("Squeeze", tl, 0);
        tl.to(em, { pitch: 0.5, hx: -0.42, sy: 1.05, sx: 0.97, eyeX: 1.1, eyeY: 1.1, ax: -0.75, armL: 1.1, armR: 1.1, foreL: 1.1, foreR: 1.1, duration: 0.35, ease: "power2.out" }, 0)
          .fromTo(em, { az: -0.22 }, { az: 0.22, duration: 0.075, ease: "sine.inOut", yoyo: true, repeat: -1, immediateRender: false }, 0.05)
          .fromTo(em, { roll: -0.05 }, { roll: 0.05, duration: 0.09, ease: "sine.inOut", yoyo: true, repeat: -1, immediateRender: false }, 0.1);
      }, { hold: true }),
    /** a look over his shoulder at the hole behind him (dir: which shoulder), eyes round, and back to us */
    glanceBack: (dir = 1) =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { hy: dir * 1.25, yaw: dir * 0.35, eyeDX: dir * 0.05, pitch: 0.3, hx: -0.1, ax: -0.5, armL: 0.6, armR: 0.6, duration: 0.16, ease: "power2.out" }, 0)
          .to(em, { hy: 0, yaw: 0, eyeDX: 0, hx: -0.35, duration: 0.16, ease: "power2.inOut" }, 0.36);
        face("Open", tl, 0.4);
      }, { hold: true }),
    /** a grin at us: happy ^ ^ eyes, head cocked, a thumbs-up arm, the antenna waggling */
    grin: () =>
      run((tl) => {
        busy = true;
        face("Happy", tl, 0);
        tl.to(em, { hz: 0.2, hx: 0, pitch: 0, lift: 0.05, ax: 0.2, armR: 1.3, foreR: 1.3, duration: 0.16, ease: "power2.out" }, 0)
          .to(em, kf("az", [[0.35, 0.1], [-0.3, 0.12], [0.2, 0.12], [0, 0.16]]), 0.1);
      }, { hold: true }),
    /** the dive: pulled long head first (the hole stretches him), arms out ahead of him, eyes squeezed */
    dive: () =>
      run((tl) => {
        busy = true;
        face("Squeeze", tl, 0);
        tl.to(em, { sy: 1.45, sx: 0.8, pitch: 0.15, hx: 0.25, ax: -0.9, hz: 0, lift: 0, armL: 2.9, armR: 2.9, foreL: 0, foreR: 0, duration: 0.3, ease: "power2.in" }, 0);
      }, { hold: true }),
    /** flying down the throat: leaning into it, a little stretched, one arm ahead, the antenna fluttering, a slow bob */
    soar: () =>
      run((tl) => {
        busy = true;
        face("Open", tl, 0);
        tl.to(em, { sy: 1.1, sx: 0.95, pitch: 0.1, ax: -0.7, hx: 0.1, hz: 0, armR: 2.8, foreR: 0, armL: 0.5, foreL: 0.4, duration: 0.3, ease: "power2.out" }, 0)
          .fromTo(em, { az: -0.14 }, { az: 0.14, duration: 0.12, ease: "sine.inOut", yoyo: true, repeat: -1, immediateRender: false }, 0)
          .fromTo(em, { lift: -0.03 }, { lift: 0.05, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: -1, immediateRender: false }, 0);
      }, { hold: true }),
    /** passing right by us down the throat: a grin and a wave */
    wave: () =>
      run((tl) => {
        busy = true;
        face("Happy", tl, 0);
        tl.to(em, { sy: 1, sx: 1, hz: -0.16, lift: 0.04, armR: 2.3, foreR: 0.25, armL: 0.4, duration: 0.18, ease: "back.out(1.6)" }, 0)
          .to(em, { armR: 2.75, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0.18)
          .to(em, kf("az", [[0.3, 0.1], [-0.3, 0.12], [0.2, 0.12], [0, 0.14]]), 0.1);
      }, { hold: true }),
    /** bursting out of the white hole at us: stretched, eyes wide, arms ahead */
    burst: () =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { sy: 1.35, sx: 0.84, pitch: -0.12, ax: -0.65, hx: 0, az: 0, lift: 0, armL: 2.6, armR: 2.6, foreL: 0, foreR: 0, duration: 0.12, ease: "power2.out" }, 0)
          .to(em, { sy: 1.08, sx: 0.96, armL: 1.2, armR: 1.2, duration: 0.5, ease: "power2.out" }, 0.2);
      }, { hold: true }),
    /** braking to land: leaning back against his speed, squashed, arms out in front */
    brake: () =>
      run((tl) => {
        busy = true;
        face("Wide", tl, 0);
        tl.to(em, { pitch: -0.3, sy: 0.86, sx: 1.08, ax: 0.6, armL: 1, armR: 1, foreL: 0.6, foreR: 0.6, duration: 0.16, ease: "power2.out" }, 0);
      }, { hold: true }),
    /** the landing: a squash, a hop, and he's dizzy (spiral eyes spinning, swaying); he shakes it off, then all good */
    land: () =>
      run((tl) => {
        busy = true;
        tl.to(em, { sy: 0.72, sx: 1.16, lift: -0.05, pitch: 0, ax: 0.55, armL: 0.5, armR: 0.5, foreL: 0, foreR: 0, duration: 0.09, ease: "power2.out" }, 0)
          .to(em, { sy: 1.14, sx: 0.93, lift: 0.14, ax: -0.3, duration: 0.16, ease: "power2.out" }, 0.09)
          .to(em, { sy: 1, sx: 1, lift: 0, armL: 0.25, armR: 0.25, duration: 0.34, ease: "bounce.out" }, 0.25);
        face("Spiral", tl, 0.22);
        tl.fromTo(em, { eyeSpin: 0 }, { eyeSpin: -Math.PI * 4, duration: 1.1, ease: "none", immediateRender: false }, 0.28)
          .to(em, kf("roll", [[0.07, 0.22], [-0.07, 0.3], [0.05, 0.3], [0, 0.2]]), 0.3)
          .to(em, kf("az", [[0.35, 0.1], [-0.25, 0.12], [0.12, 0.12], [0, 0.18]]), 0.22)
          .to(em, { ax: 0, duration: 0.3, ease: "power2.out" }, 0.3)
          .to(em, kf("hy", [[0.3, 0.07], [-0.3, 0.09], [0.18, 0.08], [0, 0.1]]), 1.28)
          .set(em, { eyeSpin: 0 }, 1.4);
        face("Happy", tl, 1.32);
        tl.to(em, kf("hz", [[-0.2, 0.2], [-0.2, 0.3], [0, 0.3]]), 1.45)
          .to(em, { armR: 1.2, foreR: 1.2, duration: 0.25, ease: "back.out(2)" }, 1.45)
          .to(em, { armR: 0, foreR: 0, armL: 0, duration: 0.3 }, 2.1);
        face("Open", tl, 2.2);
      }),
  };

  let lastBeat = 0;
  let chargeTween: gsap.core.Tween | null = null;
  let beaconLoop: gsap.core.Tween | null = null;
  return {
    ready,
    expressions: EXPRESSIONS,
    emotes: EMOTES,
    /** `quiet`: an emote he plays as he moves, which makes no sound (nothing sounds when he moves) */
    emote(name: Emote, { quiet = false }: { quiet?: boolean } = {}) {
      if (reduced) return;
      // each emote has its sound, by its own name (emote-allGood; a no-op while the sound is off)
      if (!quiet) currentSound()?.play(emoteSound(name));
      emotes[name]();
    },
    face(x: Expression) {
      face(x);
    },
    think() {
      if (!reduced) think();
    },
    relax() {
      relax();
    },
    /**
     * points at a place on the screen (CSS px of the viewport; the subject an answer is about): his head turns to it
     * and the arm on its side rises towards it, held for `hold` s, then he eases back. Under reduced motion he only
     * looks. Plays `emote-point`'s sound, as the point emote does.
     */
    pointAt(x: number, y: number, hold = 2.6) {
      const r = canvas.getBoundingClientRect();
      const dx = (x - (r.left + r.width / 2)) / innerWidth, dy = (y - (r.top + r.height / 2)) / innerHeight;
      const side = dx < 0 ? -1 : 1, up = gsap.utils.clamp(-1, 1, -dy * 2.5);
      const turn = side * gsap.utils.clamp(0.25, 0.6, 0.25 + Math.abs(dx) * 0.8), tilt = gsap.utils.clamp(-0.3, 0.25, -0.2 * up);
      if (reduced) {
        lookX(turn * lookStrength);
        lookY(tilt * lookStrength);
        return;
      }
      currentSound()?.play(emoteSound("point"));
      busy = true;
      run((tl) => {
        tl.to(em, { hy: turn, hx: tilt, yaw: side * 0.2, duration: 0.3, ease: "power2.out" }, 0);
        const arm = gsap.utils.clamp(1.1, 2.1, 1.6 + 0.45 * up);
        if (hasArms()) tl.to(em, side > 0 ? { armR: arm, foreR: 0.1, duration: 0.3, ease: "back.out(1.5)" } : { armL: arm, foreL: 0.1, duration: 0.3, ease: "back.out(1.5)" }, 0.05);
        else tl.to(em, { roll: -0.25 * side, ax: -0.4, curl: 0.5, duration: 0.3, ease: "back.out(1.5)" }, 0.05);
        tl.to({}, { duration: hold });
      });
    },
    /** the warp's flight (his stage only): see the header */
    flight,
    fly,
    boost,
    act,
    /**
     * the warp's colours on his boosters (his stage only; display values 0..1, lib/film/warp-palette.ts): his flames'
     * mid and ember round their white-hot cores, the glow at each nozzle, the light the jets throw on him, and the
     * hole's glow on him
     */
    warpColours(p: { flameMid: readonly number[]; flameEmber: readonly number[]; glowMid: readonly number[]; glowEmber: readonly number[]; light: readonly number[] }) {
      if (!jets) return;
      const css = (c: readonly number[]) => `rgb(${c.map((x) => Math.round(x * 255)).join(", ")})`;
      for (const j of jets.all) {
        (j.u.uMid!.value as THREE.Color).setRGB(p.flameMid[0]!, p.flameMid[1]!, p.flameMid[2]!, THREE.LinearSRGBColorSpace);
        (j.u.uEmber!.value as THREE.Color).setRGB(p.flameEmber[0]!, p.flameEmber[1]!, p.flameEmber[2]!, THREE.LinearSRGBColorSpace);
      }
      glowTexture(css(p.glowMid), css(p.glowEmber), jets.tex);
      jets.light.color.setRGB(p.light[0]!, p.light[1]!, p.light[2]!, THREE.SRGBColorSpace);
      fire.color.setRGB(p.light[0]!, p.light[1]!, p.light[2]!, THREE.SRGBColorSpace);
    },
    /** flight mode on (seen from the eye, leaning into his motion) or off (his everyday framing) */
    setFlight(on: boolean) {
      flight.on = on;
      if (stage) idling(on);
      leanPhi = NaN;
      lookStrength = on ? 0 : 1;
      if (on) { lookX(0); lookY(0); look.x = look.y = 0; }
      else { busy = false; world.quaternion.identity(); place(); }
    },
    /** his drawing buffer, in device px (the stage sizes it to how big he's drawn) */
    buffer(px: number) {
      const b = Math.max(64, Math.round(px));
      if (renderer.getPixelRatio() !== 1) renderer.setPixelRatio(1);
      if (renderer.getSize(sz).x !== b) renderer.setSize(b, b, false);
      camera.aspect = 1;
    },
    /** where each of his jets' nozzles is (his units from his middle, three.js axes, turned with him) and how hard it fires */
    nozzles() {
      if (!jets) return [];
      scene.updateMatrixWorld();
      return jets.all.map((j) => {
        j.anchor.getWorldPosition(tmpV);
        return { x: tmpV.x - aim.x, y: tmpV.y - aim.y, z: tmpV.z - aim.z, thrust: j.thrust };
      });
    },
    /** his height, in his own units (for the stage's scale) */
    get height() { return fitH; },
    /** draws him every frame (on), or not at all (off): a rig kept ready offscreen waits without drawing */
    drawing(on: boolean) {
      if (on === drawing) return;
      drawing = on;
      if (on) gsap.ticker.add(onTicker);
      else gsap.ticker.remove(onTicker);
    },
    /**
     * draws him once, now (`deltaMs` since the last time), for a rig drawn by whoever moves him rather than on the
     * ticker: the warp's stage places him each frame and then draws him, so his pose and his nozzles are that frame's
     * (on the ticker he'd be drawn after the warp had read them)
     */
    draw(deltaMs: number) {
      apply(undefined, deltaMs);
    },
    // a nod with a word, rate-limited so a fast reveal doesn't jitter him; his hand goes with it where he has one
    talkBeat() {
      if (reduced) return;
      const now = performance.now();
      if (now - lastBeat < 170) return;
      lastBeat = now;
      gsap
        .timeline()
        .to(talk, { hx: 0.06, az: gsap.utils.random(-0.08, 0.08), arm: gsap.utils.random(0.1, 0.35), duration: 0.07, ease: "power2.out", overwrite: "auto" })
        .to(talk, { hx: 0, az: 0, arm: 0, duration: 0.2, ease: "power2.inOut" });
    },
    /** leans into travel at screen velocity (px/s); 0, 0 eases him upright */
    lean(vx: number, vy: number) {
      if (reduced) return;
      gsap.to(trv, { roll: gsap.utils.clamp(-0.42, 0.42, -vx * 0.00035), pitch: gsap.utils.clamp(-0.2, 0.2, vy * 0.00015), duration: 0.25, ease: "power2.out", overwrite: "auto" });
    },
    perk(on: boolean) {
      if (reduced) return;
      gsap.to(hov, on ? { lift: 0.05, eye: 1.12, ax: -0.28, duration: 0.28, ease: "back.out(2)", overwrite: "auto" } : { lift: 0, eye: 1, ax: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
    },
    /** the wake-up's charge, 0 to 1: the band fills segment by segment; at 1 he dozes until `wake` */
    charge(p: number) {
      chargeTween?.kill();
      chargeTween = gsap.to(charge, { p, duration: reduced ? 0 : 0.35, ease: "power1.out" });
    },
    /** asleep: eyes shut, the beacon pulsing slowly; `pose` also dips his head and slackens him (the lab's doze), while
     * the wake-up keeps him exactly as he charged: no change of pose once the charge is up */
    doze(pose = true) {
      dozing = true;
      lookStrength = 0;
      if (pose) run((tl) => tl.to(em, { hx: 0.22, pitch: 0.06, eyeY: 0.9, ax: 0.35, ear: -0.5, curl: -0.4, armL: 0.08, armR: 0.08, duration: 0.8, ease: "sine.inOut" }, 0), { hold: true });
      face("Shut");
      beaconLoop?.kill();
      if (!reduced) beaconLoop = gsap.fromTo(charge, { beacon: 1 }, { beacon: 0.25, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    wake() {
      dozing = false;
      lookStrength = 1;
      beaconLoop?.kill();
      gsap.to(charge, { beacon: 1, duration: 0.2 });
      run((tl) => {
        face("Wide", tl, 0);
        tl.to(em, { sy: 1.14, sx: 0.93, lift: 0.08, ear: 1, ax: -0.3, duration: 0.18, ease: "power3.out" }, 0).to(em, { sy: 1, sx: 1, lift: 0, duration: 0.4, ease: "back.out(2)" });
        face("Open", tl, 0.7);
      });
    },
    /** adrift: on eases in a slow weightless roll, turn, nod and rise (the wake-up's drift); off steadies him */
    float(on: boolean) {
      gsap.to(fltK, { k: on && !reduced ? 1 : 0, duration: reduced ? 0 : on ? 2.5 : 1.2, ease: "sine.inOut", overwrite: true });
    },
    /** the idle bob and sway, and the pointer look-at: off holds him at rest (the wake-up's first frame); on eases them in */
    idle(on: boolean) {
      gsap.to(idleK, { k: on ? 1 : 0, duration: on && !reduced ? 1.2 : 0, ease: "sine.inOut", overwrite: true });
      lookStrength = on ? 1 : 0;
      if (!on) { lookX(0); lookY(0); look.x = look.y = 0; }
    },
    /** his light: studio (everyday), lowkey (dark but for his edges and the band's own light) or backlit */
    look(name: keyof typeof LOOKS, duration = 0) {
      gsap.to(lk, { ...LOOKS[name], duration: reduced ? 0 : duration, ease: "power2.inOut", overwrite: true });
    },
    /** move the camera round his middle: turned (az), raised (el), nearer or further (dist); all relative */
    view(to: Partial<typeof cam>, duration = 0, ease = "power2.inOut") {
      gsap.to(cam, { ...to, duration: reduced ? 0 : duration, ease, overwrite: true, onUpdate: place, onComplete: place });
    },
    /** sway the camera round him by the pointer (radians, on top of `view`); none under reduced motion */
    sway(az: number, el: number) {
      if (reduced) return;
      swayAz(az);
      swayEl(el);
    },
    resize: size,
    perf,
    destroy() {
      dead = true;
      offQuality();
      gsap.ticker.remove(onTicker);
      removeEventListener("pointermove", onPointer);
      resized?.disconnect();
      loops.forEach((l) => l.kill());
      blinkCall?.kill();
      cur?.kill();
      chargeTween?.kill();
      beaconLoop?.kill();
      disposeAll(scene);
      env.dispose();
      key.shadow.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export type TychoRig = ReturnType<typeof createTychoRig>;
