/**
 * The traffic round home while Work builds it, busy as a construction timelapse: drones blazing in and out, workers in
 * EVA suits, and a craft for each breakthrough, from one model (`public/voyage/craft/traffic.glb`, built by
 * `scripts/models/build.sh traffic`). Every pose is a pure function of the scroll, so scrolling back plays it backwards.
 * - Drones (26, drawn instanced) make trip after trip: in from a staging point round the ring, a launch from the hub or
 *   off the frame, to a point on the build's front (the spoke, the skeleton, the hull, the wings as each goes), a hover
 *   welding (sparks flicker at the torch), and away. How many are at work follows the beat (work.ts `busyAt`). Their
 *   lights are bright points trailing short streaks, never longer than `TRAIL_LEN`, so a fast one leaves a streak.
 * - Workers in EVA suits: four hold a spot on the newest quarter for a shift, then are gone and on at another, as a
 *   timelapse's people are; two jet between spots on their packs, trailing their lamps.
 * - The breakthroughs' craft (work.ts `callsAt`): those he built with come down the ring's axis to the hub's forward
 *   port, hold docked and leave; the rest pass close, under the ship, over it, diving past the camera, or far behind.
 * Points on the station are in its own frame (station.py's: glTF's up, the ring's radius 1) and reach the world through
 * the ship's pose and the ring's turn at that moment (`stationAt`).
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Object3D, Points, PointsMaterial,
  Quaternion, Vector3, type Material, type Mesh, type MeshStandardMaterial, type Texture, type WebGLRenderer,
} from "three";
import { lightBy } from "./dark-lights";
import { uploadTextures, voyageLoader } from "./loading";
import { neutralOut } from "./lit";
import { occludeDirect } from "./ships";
import { builtAt, busyAt, callsAt, type CraftKind, type Way, type WorkPlan } from "./work";

type Owned = Array<Material | Texture | BufferGeometry | { dispose(): void }>;
type V = readonly [number, number, number];
const SPAN = Math.PI / 6, R = 1, MR = 0.078, NR = 0.064, HUB = 0.15;
/** the hub's forward port's face, on the axis, in the station's frame */
const DOCK_Y = 0.372;
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeIn = (x: number) => x ** 3;
const Y = new Vector3(0, 1, 0);
const DRONES = 26, STANDING = 4, JETTING = 2, TRAIL = 5, TRAIL_DT = 0.005, TRAIL_LEN = 0.22;

/**
 * A point on the build's front with `built` quarters built (the station's frame), picked by `r1` and `r2`; where each
 * part is built follows station.py's `build_time`: a quarter's spoke runs out over its first 0.28, its skeleton along the
 * ring both ways from where the spoke meets it over 0.34–0.56, its hull over 0.5–0.78, its wings over 0.86–1.
 */
export function frontPoint(built: number, r1: number, r2: number, out = new Vector3()) {
  const done = built >= 4;
  const i = Math.min(3, Math.floor(built)), u = done ? 1 : built - i;
  const ts = SPAN * (3 * i + 1.5), side = r1 < 0.5 ? 1 : -1, span = side > 0 ? SPAN * 1.1 : SPAN * 2;
  let th: number, r: number, z: number;
  if (done) { th = r1 * 2 * Math.PI; r = R + 0.12 + 0.1 * r2; z = (r2 - 0.5) * 0.2; }
  else if (u < 0.34) { r = HUB + 0.01 + (R - NR - HUB - 0.01) * Math.min(1, u / 0.28); th = ts + (r1 - 0.5) * 0.12; z = (r2 < 0.5 ? 1 : -1) * (0.05 + 0.03 * r2); }
  else if (u < 0.86) {
    const f = u < 0.56 ? (u - 0.34) / 0.22 : Math.min(1, (u - 0.5) / 0.28);
    th = ts + side * f * span; r = R + 0.1 + 0.08 * r2; z = (r2 - 0.5) * 0.14;
  } else { th = SPAN * (3 * i + 2); r = R + 0.06; z = (r1 < 0.5 ? 1 : -1) * (0.1 + 0.3 * Math.min(1, (u - 0.86) / 0.14)); }
  return out.set(r * Math.cos(th), z, -r * Math.sin(th));
}

/**
 * Where each of a company's stack hangs its label, on its quarter `i` (the station's frame), in order: its middle bay's
 * top, its first bay's, its last bay's, its spoke's middle, the last bay's upper solar wing.
 */
export function stackPoint(i: number, k: number, out = new Vector3()) {
  const bay = (n: number) => { const a = SPAN * n, r = R * Math.cos(SPAN / 2); return out.set(r * Math.cos(a), MR, -r * Math.sin(a)); };
  switch (k % 5) {
    case 0: return bay(3 * i + 1);
    case 1: return bay(3 * i);
    case 2: return bay(3 * i + 2);
    case 3: { const a = SPAN * (3 * i + 1.5); return out.set(0.55 * Math.cos(a), 0.03, -0.55 * Math.sin(a)); }
    default: { const a = SPAN * (3 * i + 2), r = R * Math.cos(SPAN / 2); return out.set(r * Math.cos(a), 0.3, -r * Math.sin(a)); }
  }
}

/** each craft's length (the station's units: a pass is flown further off the bigger it is), how far its docking face
 *  stands from its origin, and whether it turns over to dock (its docking ring at its front, not a collar on its back) */
const KINDS: Record<CraftKind, { len: number; dockAt: number; flip: boolean }> = {
  craft: { len: 0.3, dockAt: 0, flip: true }, hauler: { len: 0.47, dockAt: 0, flip: true }, crane: { len: 0.6, dockAt: 0, flip: true },
  pod: { len: 0.12, dockAt: 0.0543, flip: false }, shuttle: { len: 0.4, dockAt: 0, flip: true },
};
/**
 * The ways a craft passes, each from `a` to `b`: across the frame (−1..1) and out from the camera, in station radii. On
 * a phone the words fill the frame's lower half, so they pass through its upper half, round the ship.
 */
const PATHS: Record<"land" | "port", Record<Exclude<Way, "dock">, { a: V; b: V }>> = {
  land: {
    near: { a: [-1.6, -0.82, 1.35], b: [1.6, -0.62, 1.6] }, high: { a: [1.6, 0.78, 1.5], b: [-1.6, 0.62, 1.35] },
    dive: { a: [0.25, 0.3, 7], b: [1.45, -0.6, 0.95] }, far: { a: [-1.5, 0.3, 6.5], b: [1.5, 0.15, 6] },
  },
  port: {
    near: { a: [-1.6, 0.02, 1.35], b: [1.6, 0.18, 1.6] }, high: { a: [1.6, 0.88, 1.5], b: [-1.6, 0.74, 1.35] },
    dive: { a: [0.1, 0.4, 7], b: [1.45, 0.2, 0.95] }, far: { a: [-1.5, 0.45, 6.5], b: [1.5, 0.35, 6] },
  },
};

/** a model's meshes drawn instanced, each instance at a matrix in the world */
function instanced(tpl: Object3D, n: number, parent: Object3D) {
  tpl.updateMatrixWorld(true);
  const inv = tpl.matrixWorld.clone().invert(), parts: Array<{ mesh: InstancedMesh; local: Matrix4 }> = [];
  tpl.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const im = new InstancedMesh(m.geometry, m.material, n);
    im.count = 0;
    // (its instances spread round the station and move each frame: it's never culled, so it's drawn only while it has
    // any, not as an empty draw)
    im.visible = false;
    im.frustumCulled = false;
    im.renderOrder = -1;
    im.receiveShadow = true;
    parent.add(im);
    parts.push({ mesh: im, local: inv.clone().multiply(m.matrixWorld) });
  });
  const tmp = new Matrix4();
  /** the first `n` of `list` */
  return (list: readonly Matrix4[], n: number) => {
    for (const p of parts) {
      for (let i = 0; i < n; i++) p.mesh.setMatrixAt(i, tmp.multiplyMatrices(list[i]!, p.local));
      p.mesh.count = n;
      p.mesh.visible = n > 0;
      p.mesh.instanceMatrix.needsUpdate = true;
    }
  };
}

export function createTraffic(c: {
  owned: Owned; renderer: WebGLRenderer; plan: WorkPlan;
  /** the ring's turn (radians) at film time `t` */
  turnAt: (t: number) => number;
  /** from the station's frame to the world with the ring turned by `a`, or null before the ship has loaded */
  stationAt: (a: number, out: Matrix4) => Matrix4 | null;
  /** the station's own node, which a docking craft rides */
  station: () => Object3D | null;
}) {
  const { plan } = c;
  const root = new Object3D();
  root.name = "traffic";
  root.visible = false;
  let tpl: Record<string, Object3D> | null = null;
  let setDrones: ReturnType<typeof instanced> | null = null, setWorkers: ReturnType<typeof instanced> | null = null;
  const flyers: Partial<Record<CraftKind, Object3D[]>> = {}, dockers: Partial<Record<CraftKind, Object3D>> = {};

  // the drones' and jetting workers' streaks, their lights, and the welds' sparks
  const trails = new BufferGeometry();
  const tPos = new Float32Array((DRONES + JETTING) * TRAIL * 6), tCol = new Float32Array(tPos.length);
  trails.setAttribute("position", new BufferAttribute(tPos, 3));
  trails.setAttribute("color", new BufferAttribute(tCol, 3));
  const lineMat = new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending, transparent: true, depthWrite: false });
  const lines = new LineSegments(trails, lineMat);
  const pts = (n: number, color: number) => {
    const g = new BufferGeometry(), a = new Float32Array(n * 3);
    g.setAttribute("position", new BufferAttribute(a, 3));
    const m = new PointsMaterial({ color, sizeAttenuation: false, blending: AdditiveBlending, transparent: true, depthWrite: false });
    const p = new Points(g, m);
    p.frustumCulled = false;
    c.owned.push(g, m);
    return { g, a, m, p };
  };
  const heads = pts(DRONES + JETTING, 0xffe6c4), sparks = pts(DRONES, 0xe4ecff);
  lines.frustumCulled = false;
  root.add(lines, heads.p, sparks.p);
  c.owned.push(trails, lineMat);

  let done = () => {};
  const loaded = new Promise<void>((res) => (done = res));
  voyageLoader().load("/voyage/craft/traffic.glb", (gltf) => {
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      // home's key lights them, as it does the ship, and they skip the other bodies' (dark) keys
      const mat = m.material as MeshStandardMaterial;
      if (!mat.userData.lit) { lightBy(occludeDirect(neutralOut(mat)), null); mat.userData.lit = true; c.owned.push(mat); }
      m.castShadow = false;
      m.receiveShadow = true;
      m.renderOrder = -1;
      c.owned.push(m.geometry);
    });
    // (three's loader writes a node's spaces as underscores: "drone root" arrives as "drone_root")
    tpl = Object.fromEntries(gltf.scene.children.map((o) => [o.name.replace(/[ _]root$/, ""), o]));
    setDrones = instanced(tpl.drone!, DRONES, root);
    setWorkers = instanced(tpl.worker!, STANDING + JETTING, root);
    for (const kind of Object.keys(KINDS) as CraftKind[]) {
      flyers[kind] = [0, 1].map(() => { const f = tpl![kind]!.clone(true); f.visible = false; root.add(f); return f; });
      const d = tpl[kind]!.clone(true);
      // turned over, its docking ring towards the port, for those whose ring is at their front
      if (KINDS[kind].flip) d.rotation.x = Math.PI;
      d.visible = false;
      dockers[kind] = d;
    }
    done();
  }, undefined, (e) => { console.error("traffic.glb", e); done(); });
  const ready = loaded.then(() => uploadTextures(c.renderer, root));

  // ---------------------------------------------------------------- the moment's frames
  const M = new Matrix4(), M2 = new Matrix4(), M3 = new Matrix4(), q = new Quaternion(), sc = new Vector3(), basis = new Matrix4();
  const droneMs = Array.from({ length: DRONES }, () => new Matrix4()), workerMs = Array.from({ length: STANDING + JETTING }, () => new Matrix4());
  const local = new Matrix4(), centre = new Vector3(), face = new Vector3(), spot = new Vector3();
  const at = (t: number, out: Matrix4) => c.stationAt(c.turnAt(t), out);
  const cam = { P: new Vector3(), F: new Vector3(), Rt: new Vector3(), U: new Vector3(), tanH: 0.29, aspect: 1.6 };
  /** a point across the frame (x, y in −1..1) and `d` out from the camera */
  const onFrame = (x: number, y: number, d: number) =>
    cam.P.clone().addScaledVector(cam.F, d).addScaledVector(cam.Rt, x * d * cam.tanH * cam.aspect).addScaledVector(cam.U, y * d * cam.tanH);
  let unit = 1;
  /** where a trip starts or ends: mostly just off the ring or the hub (a launch from its ports), a few off the frame */
  const end = (seed: number, t: number) => {
    const h = hash(seed), a = hash(seed + 1) * Math.PI * 2;
    if (h < 0.8 && at(t, M2)) {
      const r = h < 0.35 ? HUB + 0.04 : R + 0.3 + 0.35 * hash(seed + 2), y = (hash(seed + 3) - 0.5) * (h < 0.35 ? 0.4 : 0.6);
      return new Vector3(r * Math.cos(a), y, -r * Math.sin(a)).applyMatrix4(M2);
    }
    return onFrame((hash(seed + 3) < 0.5 ? -1 : 1) * 1.3, (hash(seed + 4) - 0.5) * 1.6, (1.6 + 1.6 * hash(seed + 5)) * unit);
  };
  /** a drone's (or jetting worker's) trip at `t`: where it is, and whether it's at work */
  const trip = (j: number, t: number, period: number) => {
    const phase = hash(j + 50), x = t / period + phase, n = Math.floor(x), k = x - n, t0 = (n - phase) * period;
    if (hash(j * 7.3 + n * 3.1) > busyAt(plan, t0 + period / 2) || !at(t, M2)) return null;
    const W = frontPoint(builtAt(plan, t0 + period * 0.3), hash(j * 11 + n * 1.7), hash(j * 5 + n * 2.9)).applyMatrix4(M2);
    if (k < 0.25) return { p: end(j * 31 + n * 17, t).lerp(W, easeOut(k / 0.25)), at: false, W };
    if (k < 0.75) return { p: W.clone().add(new Vector3(Math.sin(t * 90 + j), Math.sin(t * 70 + j * 2), Math.cos(t * 80 + j)).multiplyScalar(0.004 * unit)), at: true, W };
    return { p: W.clone().lerp(end(j * 37 + n * 19 + 5, t), easeIn((k - 0.75) / 0.25)), at: false, W };
  };
  const heroes = new Map<string, Vector3>();

  return {
    root, ready,
    /** where the craft of the breakthrough `id` is, while it's in play */
    heroAt: (id: string) => heroes.get(id) ?? null,
    /** its models as loaded, by name (drone, worker and each craft's kind), or null before they're in */
    models: (): Readonly<Record<string, Object3D>> | null => tpl,
    /** where a company's stack item `k` hangs from, on its quarter `i`, at `t` */
    stackAt(i: number, k: number, t: number) {
      return at(t, M3) ? stackPoint(i, k).applyMatrix4(M3) : null;
    },
    /**
     * Poses everything for film time `t`, seen from a camera at `pos` looking at `target` (`tanH`, `aspect`: its frame),
     * `px` the renderer's pixel ratio.
     */
    update(t: number, view: { pos: Vector3; target: Vector3; tanH: number; aspect: number }, px: number) {
      heroes.clear();
      // they ride the station, not this root, so they're hidden here or a docked one stays in the scenes after a jump
      for (const k of Object.keys(dockers) as CraftKind[]) dockers[k]!.visible = false;
      const on = t > plan.flash && t < plan.total + 0.3 && !!tpl && !!at(t, M);
      root.visible = on;
      if (!on) return;
      cam.P.copy(view.pos); cam.F.copy(view.target).sub(view.pos).normalize();
      cam.Rt.crossVectors(cam.F, Y).normalize(); cam.U.crossVectors(cam.Rt, cam.F);
      cam.tanH = view.tanH; cam.aspect = view.aspect;
      unit = sc.setFromMatrixScale(M).x;
      const station = c.station();
      for (const kind of Object.keys(dockers) as CraftKind[]) if (station && dockers[kind]!.parent !== station) station.add(dockers[kind]!);

      // ---------------------------------------------------------------- the drones
      let nT = 0, nH = 0, nS = 0, left = TRAIL_LEN * unit;
      const seg = (a: Vector3, b: Vector3, col: V, f: number) => {
        if (left <= 0) return;
        const d = a.distanceTo(b);
        if (d > left) b = a.clone().lerp(b, left / d);
        left -= d;
        tPos.set([a.x, a.y, a.z, b.x, b.y, b.z], nT * 6);
        tCol.set([col[0] * f, col[1] * f, col[2] * f, col[0] * f * 0.8, col[1] * f * 0.8, col[2] * f * 0.8], nT * 6);
        nT++;
      };
      const trailOf = (j: number, P: number, now: Vector3, col: V, gain: number) => {
        left = TRAIL_LEN * unit;
        let prev = now;
        for (let k = 1; k <= TRAIL; k++) {
          const back = trip(j, t - k * TRAIL_DT, P);
          if (!back) break;
          seg(prev, back.p, col, gain * (1 - (k - 1) / TRAIL) ** 2);
          prev = back.p;
        }
      };
      const head = (p: Vector3) => { heads.a.set([p.x, p.y, p.z], nH++ * 3); };
      let nD = 0;
      centre.set(0, 0, 0).applyMatrix4(M);
      for (let j = 0; j < DRONES; j++) {
        const P = 0.3 + 0.22 * hash(j), cur = trip(j, t, P);
        if (!cur) continue;
        // facing its way, or in towards the ring while it works
        if (cur.at) face.copy(centre).sub(cur.W);
        else face.copy(cur.p).sub(trip(j, t - 0.004, P)?.p ?? cur.p);
        q.identity();
        if (face.lengthSq() > 1e-16) q.setFromUnitVectors(Y, face.normalize());
        droneMs[nD++]!.compose(cur.p, q, sc.setScalar(unit));
        head(cur.p);
        if (cur.at) { if (hash(Math.floor(t * 300) + j * 13) > 0.55) sparks.a.set([cur.p.x, cur.p.y, cur.p.z], nS++ * 3); }
        else trailOf(j, P, cur.p, [1, 0.9, 0.75], 1);
      }
      setDrones?.(droneMs, nD);

      // ---------------------------------------------------------------- the workers
      const built = builtAt(plan, t), busy = busyAt(plan, t);
      let nW = 0;
      const i = Math.min(3, Math.floor(built)), u = built >= 4 ? 1 : built - i;
      for (let j = 0; j < STANDING; j++) {
        const Q = 0.22 + 0.1 * hash(j + 200), n = Math.floor(t / Q + hash(j + 210));
        if (!(busy > 0.9 && u > 0.6 && hash(j * 3 + n * 7) < 0.85)) continue;
        const side = hash(j + n * 5) < 0.5 ? 1 : -1, span = side > 0 ? SPAN * 1.1 : SPAN * 2;
        const f = Math.min(1, (u - 0.5) / 0.28) * (0.1 + 0.8 * hash(j * 9 + n * 3));
        const th = SPAN * (3 * i + 1.5) + side * f * span, r = R * Math.cos(SPAN / 2);
        // standing on a module's top, facing along the ring
        workerMs[nW++]!.multiplyMatrices(M, local.compose(spot.set(r * Math.cos(th), MR, -r * Math.sin(th)), q.setFromAxisAngle(Y, th + Math.PI / 2), sc.setScalar(1)));
      }
      for (let jj = 0; jj < JETTING; jj++) {
        const j = 100 + jj, P = 0.55, cur = busy > 0.9 ? trip(j, t, P) : null;
        if (!cur) continue;
        workerMs[nW++]!.compose(cur.p, q.identity(), sc.setScalar(unit));
        head(cur.p);
        if (!cur.at) trailOf(j, P, cur.p, [1, 0.82, 0.6], 0.8);
      }
      setWorkers?.(workerMs, nW);

      // ---------------------------------------------------------------- the breakthroughs' craft
      for (const k of Object.keys(KINDS) as CraftKind[]) for (const f of flyers[k] ?? []) f.visible = false;
      const used: Partial<Record<CraftKind, number>> = {};
      for (const call of callsAt(plan, t)) {
        const K = KINDS[call.kind];
        if (call.way === "dock") {
          // down the axis, a hold docked, then away again
          const d = dockers[call.kind];
          if (!d || d.parent !== station) continue;
          const off = Math.max(0, Math.abs(call.k - 0.5) - 0.14) / 0.36;
          d.position.set(0, DOCK_Y + K.dockAt + (1.2 + K.len) * off * off, 0);
          d.visible = true;
          heroes.set(call.mark.id, d.getWorldPosition(new Vector3()));
          continue;
        }
        const f = flyers[call.kind]?.[(used[call.kind] = (used[call.kind] ?? -1) + 1)];
        if (!f) continue;
        const path = PATHS[cam.aspect < 0.8 ? "port" : "land"][call.way], far = Math.min(2, Math.max(0.6, K.len / 0.3)) * unit;
        const A = onFrame(path.a[0], path.a[1], path.a[2] * far), B = onFrame(path.b[0], path.b[1], path.b[2] * far);
        f.position.lerpVectors(A, B, call.k);
        // its front along its way, its top (−z) up the frame
        const F = B.clone().sub(A).normalize(), T = cam.U.clone().addScaledVector(F, -cam.U.dot(F)).normalize();
        basis.makeBasis(F.clone().cross(T.clone().negate()), F, T.clone().negate());
        f.quaternion.setFromRotationMatrix(basis);
        f.scale.setScalar(unit);
        f.visible = true;
        heroes.set(call.mark.id, f.position.clone());
      }

      trails.setDrawRange(0, nT * 2);
      trails.attributes.position!.needsUpdate = true;
      trails.attributes.color!.needsUpdate = true;
      heads.g.setDrawRange(0, nH);
      heads.g.attributes.position!.needsUpdate = true;
      heads.m.size = 3.5 * px;
      sparks.g.setDrawRange(0, nS);
      sparks.g.attributes.position!.needsUpdate = true;
      sparks.m.size = 9 * px;
    },
  };
}

export type Traffic = ReturnType<typeof createTraffic>;
