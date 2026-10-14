/**
 * Work's relay by home (work.ts), its intro, in Tycho's metal (finish.ts). One model (`public/voyage/relay/relay.glb`,
 * built by `scripts/models/build.sh relay`), in its finished form, the only relay there is: both rings, all six coils,
 * no scaffold. Its parts, from the back: a spine with radiators and a reactor, a yoke holding the gimbal (two rings
 * turning round a core of light), and the barrel of coils you're thrown down.
 *
 * The film sets its state: `vis`, `spin` (its gimbal's turn), `charge` (0..1: the core brightens, the rings' emitters
 * light, the gimbal spins up) and `coils` (0..1: how far the coils have lit, from the core out). One key light lights it
 * while it's in play, from behind the camera's shoulder, its shadow framed on it, and one point light sits in its core;
 * both stay in the scene all film (rig.ts), dark while it isn't.
 */
import {
  AdditiveBlending, CanvasTexture, Color, DirectionalLight, Matrix4, Object3D, PointLight, Sprite, SpriteMaterial, Vector3,
  type BufferGeometry, type Material, type Mesh, type MeshStandardMaterial, type Texture, type WebGLRenderer,
} from "three";
import { lightBy } from "./dark-lights";
import { finished, studio, surfaceOf } from "./finish";
import { uploadTextures, voyageLoader } from "./loading";
import { neutralOut } from "./lit";
import { occludeDirect } from "./ships";
import type { World } from "./world";

type Owned = Array<BufferGeometry | Material | Texture | { dispose(): void }>;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** where the gimbal turns at rest (radians a screen), and how much faster charged */
const SPIN = { a: 0.35, b: 0.6, charged: 9 };
const EMIT = new Color("#3d8fff");
/** the key's direction in the relay's own frame: behind and left of where the camera holds, and above */
const KEY_LOCAL = new Vector3(-0.62, -0.42, 0.62).normalize();

export type RelayBody = {
  r: World["relay"];
  obj: Object3D;
  ringA: Object3D | null;
  ringB: Object3D | null;
  coils: Array<{ obj: Object3D; mat: MeshStandardMaterial | null }>;
  rings: MeshStandardMaterial[];
  core: MeshStandardMaterial | null;
  glow: Sprite;
  halo: Sprite;
  vis: number;
  spin: number;
  charge: number;
  coilsLit: number;
};

export function createRelays(c: { W: World; owned: Owned; renderer: WebGLRenderer }) {
  const { W, owned } = c;
  const root = new Object3D();
  root.name = "relays";
  // the key: whichever relay is in play, from behind the camera's shoulder; its shadow framed on that relay
  const key = new DirectionalLight(new Color("#fff1dc"), 0);
  key.name = "relay key";
  key.castShadow = true;
  // (a relay is seen from no nearer than its hold, where a 1024 map is sharp enough; at 2048 its shadow alone cost
  // ~2.6 ms a frame at 1440)
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 2;
  const keyTarget = new Object3D();
  key.target = keyTarget;
  root.add(key, keyTarget);
  // the core's own light, blue, on the gimbal's inner faces and the coils
  const coreLight = new PointLight(new Color("#9fd0ff"), 0, 0, 2);
  coreLight.name = "relay core light";
  root.add(coreLight);
  // the relay's materials take only its key (and the fill), so home's key, which lights the whole film, doesn't
  // light them twice
  const ownKey = { value: new Vector3(0, 1, 0) };

  // the core's glow: two additive sprites
  const glowTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!, grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.12, "rgba(220,238,255,0.9)"); grd.addColorStop(0.35, "rgba(140,190,255,0.28)");
    grd.addColorStop(1, "rgba(80,140,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(cv);
  })();
  owned.push(glowTex);

  const bodies: RelayBody[] = [W.relay].map((r) => {
    const obj = new Object3D();
    obj.position.copy(r.P);
    // the model's frame: its x to the relay's right, its y (glTF's up) to the relay's up, its z back along the throw
    obj.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(r.side, r.up, r.axis.clone().negate()));
    obj.scale.setScalar(r.scale);
    obj.visible = false;
    root.add(obj);
    const mk = (opacity: number) => new Sprite(new SpriteMaterial({ map: glowTex, blending: AdditiveBlending, depthWrite: false, transparent: true, opacity }));
    const glow = mk(0.75), halo = mk(0.12);
    obj.add(glow, halo);
    return { r, obj, ringA: null, ringB: null, coils: [], rings: [], core: null, glow, halo, vis: 0, spin: 0, charge: 0, coilsLit: 0 };
  });

  // where the relays' key comes from, on the whole: the studio their metal reflects has its broad softbox there
  const keyDir = new Vector3();
  for (const b of bodies) keyDir.add(KEY_LOCAL.clone().applyQuaternion(b.obj.quaternion));
  keyDir.normalize();

  let done = () => {};
  const loaded = new Promise<void>((res) => (done = res));
  voyageLoader().load("/voyage/relay/relay.glb", (gltf) => {
    // every surface in the metal finish, reflecting a studio whose broad softbox is where the relays' key comes from
    const st = studio(c.renderer, keyDir);
    owned.push(st);
    const shared = new Map<Material, Material>();
    const prep = (m: Material) => {
      let out = shared.get(m);
      if (out) return out;
      const sf = surfaceOf("metal", m.name);
      out = sf ? finished(m as MeshStandardMaterial, sf, st.texture) : m;
      lightBy(occludeDirect(neutralOut(out as MeshStandardMaterial)), ownKey);
      shared.set(m, out);
      owned.push(out);
      return out;
    };
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      m.material = prep(m.material as Material);
      owned.push(m.geometry);
    });
    for (const b of bodies) {
      const model = gltf.scene.clone(true);
      // each relay's glowing parts its own, so each lights by itself
      model.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        const mat = m.material as MeshStandardMaterial;
        if (mat.name.startsWith("emitter") || mat.name === "core") {
          const own = mat.clone();
          own.onBeforeCompile = mat.onBeforeCompile;
          own.customProgramCacheKey = mat.customProgramCacheKey;
          own.emissive.copy(mat.name === "core" ? new Color("#d8ecff") : EMIT);
          m.material = own;
          owned.push(own);
          if (mat.name === "core") { b.core = own; m.castShadow = false; }
          else if (mat.name.startsWith("emitter ring")) b.rings.push(own);
        }
      });
      b.ringA = model.getObjectByName("ringA") ?? null;
      b.ringB = model.getObjectByName("ringB") ?? null;
      // finished: no scaffold
      const scaffold = model.getObjectByName("scaffold");
      if (scaffold) scaffold.visible = false;
      for (let k = 0; k < 6; k++) {
        // (three's loader writes a node's spaces as underscores)
        const co = model.getObjectByName(`coil_${k}`);
        if (!co) continue;
        let mat: MeshStandardMaterial | null = null;
        co.traverse((o) => { const mm = (o as Mesh).material as MeshStandardMaterial | undefined; if (mm?.name.startsWith("emitter coil")) mat = mm; });
        b.coils.push({ obj: co, mat });
      }
      b.obj.add(model);
    }
    done();
  }, undefined, (e) => { console.error("relay.glb", e); done(); });
  const ready = loaded.then(() => uploadTextures(c.renderer, root));

  return {
    root, key, coreLight, bodies, ready,
    /** the relay's key's direction (its materials take only that light), and where its studio's softbox is */
    ownKey, keyDir,
    /** Poses the relay as the film has set it: its gimbal, glow and emitters, and its key and core's light while it's
     *  in play (`play`: 0, or −1 for not). */
    update(play: number) {
      for (const b of bodies) {
        b.obj.visible = b.vis > 0.004;
        if (!b.obj.visible) continue;
        const ch = b.charge;
        if (b.ringA) b.ringA.rotation.x = SPIN.a * b.spin;
        if (b.ringB) b.ringB.rotation.y = SPIN.b * b.spin + 0.9;
        b.glow.scale.setScalar(0.55 + 1.6 * ch ** 1.3);
        b.halo.scale.setScalar(2.2 + 5 * ch ** 2);
        (b.glow.material as SpriteMaterial).opacity = (0.75 + 0.25 * ch) * b.vis;
        (b.halo.material as SpriteMaterial).opacity = (0.12 + 0.4 * ch) * b.vis;
        if (b.core) b.core.emissiveIntensity = 2 + 10 * ch;
        for (const m of b.rings) m.emissiveIntensity = 0.1 + 2.4 * ch;
        b.coils.forEach((co, k) => { if (co.mat) co.mat.emissiveIntensity = 3.2 * smooth(k / 6, (k + 0.7) / 6, b.coilsLit); });
      }
      const p = bodies[play];
      if (!p || !p.obj.visible) { key.intensity = 0; coreLight.intensity = 0; return; }
      // his star's light, from behind the camera's shoulder as it holds, framed on the relay
      const toKey = KEY_LOCAL.clone().applyQuaternion(p.obj.quaternion);
      const reach = p.r.scale * 4;
      keyTarget.position.copy(p.r.P);
      keyTarget.updateMatrixWorld();
      key.position.copy(p.r.P).addScaledVector(toKey, reach * 3);
      const s = key.shadow.camera;
      s.left = s.bottom = -reach; s.right = s.top = reach; s.near = reach * 1.5; s.far = reach * 4.5;
      s.updateProjectionMatrix();
      key.shadow.normalBias = p.r.scale * 0.004;
      key.intensity = 1.7 * Math.PI * p.vis;
      ownKey.value.copy(toKey);
      coreLight.position.copy(p.r.P);
      coreLight.intensity = (0.4 + 14 * p.charge ** 1.5) * p.r.scale * p.r.scale * p.vis;
    },
  };
}

export type Relays = ReturnType<typeof createRelays>;
