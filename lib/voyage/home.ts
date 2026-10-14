/**
 * Home and what's round it: the voyage's opening subject.
 * - Home: a ship (`ships.ts`), lit by his star through PBR Neutral, with a night side
 *   the region's light fills.
 * - The sun: his star seen close, a point that becomes a small disc with a corona as you dive at it. Its colour
 *   carries meaning, so it's drawn unlit.
 * His portrait isn't here: it's on the page, on a leader line from the ship (About's label).
 * Every state a scene changes is a plain number (`vis`, `spin`): the film's timeline tweens the discrete ones and its
 * drivers set the continuous ones from the scroll. The ship is drawn before the sky's light, writing depth, so the
 * stars behind it are hidden; the sun is light, drawn after it.
 */
import {
  AdditiveBlending, Mesh, Object3D, PlaneGeometry, ShaderMaterial,
  type BufferGeometry, type Color, type Material, type Matrix4, type Scene, type Texture, type Vector3, type WebGLRenderer,
} from "three";
import { raw } from "./lit";
import { studio, type FinishName } from "./finish";
import { createShip } from "./ships";
import type { World } from "./world";

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const sunVS = /* glsl */ `
  uniform float uSize; varying vec2 vQ;
  void main() {
    vQ = position.xy;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uSize * 6.0;
    gl_Position = projectionMatrix * mv;
  }`;
// a disc, darkened towards its limb so it reads as a sphere rather than a dot, and a corona round it
const sunFS = /* glsl */ `
  uniform vec3 uHot, uLimb, uCorona; uniform float uVis;
  varying vec2 vQ;
  void main() {
    float r = length(vQ) * 6.0;
    float disc = 1.0 - smoothstep(0.7, 1.0, r);
    float limb = smoothstep(0.2, 1.0, r) * disc;
    float corona = exp(-max(r - 0.85, 0.0) * 1.3) * 0.5 + exp(-r * 0.32) * 0.08;
    vec3 c = mix(uHot, uLimb * 0.85, limb * 0.6) * disc + uCorona * corona * (1.0 - disc * 0.6);
    gl_FragColor = vec4(c * uVis * (1.0 - smoothstep(0.8, 1.0, length(vQ))), 1.0);
  }`;

export function createHome({ W, fill, owned, renderer, scene, finish = "cloth" }: {
  W: World;
  /** the region's light on the night side, set by the film each frame */
  fill: Color;
  owned: Array<BufferGeometry | Material | Texture | { dispose(): void }>;
  /** the sky's renderer and scene, which the ship is drawn in (it warms itself up there) */
  renderer: WebGLRenderer;
  scene: Scene;
  /** its finish: cloth (finish.ts) */
  finish?: FinishName;
}) {
  const sunCol = raw("#fff1dc"); // his star's light: warm white
  const root = new Object3D();

  // ---------------------------------------------------------------- home: the ship
  // the studio its metals reflect: the broad softbox where his star is (finish.ts)
  const studioOf = () => {
    const st = studio(renderer, W.SUN.clone().sub(W.HOME.P));
    owned.push(st);
    return st.texture;
  };
  const ship = createShip({ W, sunCol, fill, renderer, scene, owned, finish, studio: studioOf });
  root.add(ship.obj, ...ship.lights);
  /** `spin` turns it with the scroll; `built`: how much of it is built (0 its core alone, 1 whole; Work's, work.ts);
   *  `visitor`: About's crew capsule shown (it's gone while Work goes back to before it) */
  const home = { vis: 0, spin: 0, built: 1, visitor: true };
  // the film waits for the ship, so no frame (nor a reduced-motion still) shows home empty; a model that fails to load
  // doesn't hold the film up
  const ready = ship.ready;

  // ---------------------------------------------------------------- the sun
  const sunU = { uSize: { value: 0.00036 }, uHot: { value: raw("#fff8ee") }, uLimb: { value: raw("#ffd7a8") }, uCorona: { value: raw("#ffe2bd") }, uVis: { value: 0 } };
  const sunMat = new ShaderMaterial({ uniforms: sunU, vertexShader: sunVS, fragmentShader: sunFS, transparent: true, depthTest: true, depthWrite: false, blending: AdditiveBlending });
  const sunGeo = new PlaneGeometry(2, 2);
  const sunMesh = new Mesh(sunGeo, sunMat);
  sunMesh.position.copy(W.SUN);
  sunMesh.frustumCulled = false;
  sunMesh.renderOrder = 4;
  root.add(sunMesh);
  const sun = { vis: 0 };

  owned.push(sunGeo, sunMat);

  return {
    root, home, sun, ready,
    /** stands the ship to About's camera, which looks at it from `toCam` */
    face(toCam: Vector3, up: Vector3) { ship.face(toCam, up); },
    /** the ship's axis as it's posed (the ring turns about it) */
    shipAxis: () => ship.axis(),
    /** where a label on the ship points, for a camera whose right and up are these (`short`: a phone held sideways) */
    edge: (camR: Vector3, camU: Vector3, short?: boolean) => ship.edge(camR, camU, short),
    /** where a label on the ship hangs, its leader reaching on to the edge */
    hang: (camR: Vector3, camU: Vector3, short?: boolean) => ship.hang(camR, camU, short),
    /** how far in the ring's visitor is, 0 far out to 1 docked */
    approach: (k: number) => ship.approach(k),
    /** the station's own frame (station.py's units), once loaded, and from it to the world with the ring turned by `a` */
    station: () => ship.station(),
    stationAt: (a: number, out: Matrix4) => ship.stationAt(a, out),
    /** the ship's pose (its axis the model's +y) */
    shipPose: () => ship.pose(),
    /** the ship's bounding radius, as it's drawn */
    shipR: ship.r,
    /** his star's light on the ship */
    key: ship.key,
    /** poses everything for a camera at `cam`; `k` is the camera's focal length in px */
    update(cam: Vector3, k: number) {
      ship.turn(home.spin);
      ship.build(home.built);
      ship.showVisitor(home.visitor);
      ship.update();
      // the ship fades as a whole, and below about 16 px on screen fades by its size: only stars are points
      const shipPx = (W.HOME.r / Math.max(cam.distanceTo(W.HOME.P), 1e-6)) * k;
      const sv = home.vis * smooth(5, 16, shipPx * 2);
      ship.fade(sv);
      ship.obj.visible = sv > 0.004;
      // the sun shows as a disc once you're near enough for it to be more than a point
      sunU.uVis.value = sun.vis * smooth(0.5, 0.18, cam.distanceTo(W.SUN));
      sunMesh.visible = sunU.uVis.value > 0.002;
    },
  };
}

export type Home = ReturnType<typeof createHome>;
