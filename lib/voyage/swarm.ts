/**
 * The pipeline's records: the swarm you fall with, the queries leaving Start, the search's hairlines, and the
 * climax's rush. One slate for all of them (record.ts), posed each frame from where the fall has come (`s`), so a still
 * finds every stage as it is. A record keeps its size and shape all the way down: its face tells the story.
 * - The swarm (44): web pages tumble in from all round at Search, a hairline from the dish nearest each while it's
 *   fetched; at Extract each is squared into the bore and its face wiped into a record from its leading edge as it
 *   passes the die; at each Dedup a duplicate's screen goes dark and it slides into its twin and is gone; at Enrich its
 *   missing fields light warm in the heaters; at Save it dims as it sinks into the magazine. The first is the record
 *   you fall with: dead centre, nearest.
 * - The queries (5): smaller slates leaving Start's magazine, going out at the search.
 * - The rush (90): records falling behind the climax's front, each stretched along its fall by the front's speed and
 *   trailing warm light, like a long exposure.
 * The rings' shadows fall across them. Each part is drawn only while it has something on screen (`pipeline-cull.ts`).
 */
import {
  Euler, InstancedBufferAttribute, InstancedMesh, Matrix4, Quaternion, Vector3,
  type IUniform, type MeshStandardMaterial, type Object3D, type Vector2,
} from "three";
import { hairlines } from "./hairlines";
import { neutralOut, raw } from "./lit";
import { swarmParts } from "./pipeline-cull";
import { slateState, type RecordSlate } from "./record";
import { UP, type World } from "./world";

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (k: number, s: number) => { const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/** the swarm, the queries and the climax's rush; a record's size (world units, its width) */
const RN = 44, QN = 5, RUSH = 90;
export const REC = 0.0011;

type Shader = { vertexShader: string; fragmentShader: string; uniforms: Record<string, IUniform> };
/** how the pipeline shades what it owns: its finish, the burning rings' light, and the text zone */
export type Shade = {
  finish: <M extends MeshStandardMaterial>(m: M) => M;
  ringLit: (m: MeshStandardMaterial, key: string, extra?: (sh: Shader) => void) => MeshStandardMaterial;
  zoned: <M extends MeshStandardMaterial>(m: M) => M;
};

export function createSwarm(c: {
  W: World;
  parent: Object3D;
  owned: Array<{ dispose(): void }>;
  shade: Shade;
  rec: RecordSlate;
  px: { res: IUniform<Vector2>; dpr: IUniform<number> };
}) {
  const { W, shade, rec } = c, SH = W.shaft;
  const depths = new Map(SH.levels.map((l) => [l.id, l.d]));
  const dk = (id: string) => depths.get(id)!;

  // the slate's own shading, lit by the burning rings; the rush's are smeared along their fall by the front's speed
  // (`aSmear`), fading up their trail (a long exposure)
  const slateMat = (key: string, smear: boolean) => {
    const m = shade.finish(rec.mat.clone());
    m.transparent = smear;
    m.depthWrite = !smear;
    return shade.ringLit(neutralOut(m), key, (sh) => {
      rec.patch(sh);
      if (!smear) return;
      sh.vertexShader = sh.vertexShader
        .replace("void main() {", "attribute float aSmear; varying float vSmear; varying float vAlong;\nvoid main() {")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSmear = aSmear;\nvAlong = position.y / 0.06 + 0.5;");
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "varying float vSmear; varying float vAlong;\nvoid main() {")
        .replace("#include <dithering_fragment>", `#include <dithering_fragment>
          gl_FragColor.rgb += vec3(1.0, 0.86, 0.66) * 0.24 * (1.0 - vAlong) * vSmear;
          gl_FragColor.a *= (1.0 - smoothstep(0.0, 0.85, vAlong) * vSmear) * (1.0 - 0.55 * vSmear);`);
    });
  };
  const swarm = new InstancedMesh(rec.geo, shade.zoned(slateMat("swarm", false)), RN + QN);
  const rush = new InstancedMesh(rec.geo, shade.zoned(slateMat("rush", true)), RUSH);
  for (const m of [swarm, rush]) {
    m.frustumCulled = false;
    m.geometry = rec.geo.clone();
    c.owned.push(m.geometry);
    slateState(m, () => [1, 1, 1]);
    c.parent.add(m);
  }
  // the swarm takes the rings' shadows as it falls through them (the rush, a smear of light, doesn't)
  swarm.receiveShadow = true;
  rush.geometry.setAttribute("aSmear", new InstancedBufferAttribute(new Float32Array(RUSH), 1));
  rush.renderOrder = 2;
  const recs = Array.from({ length: RN }, (_, i) => ({
    i, lag: i === 0 ? 0 : (rnd(i, 1) - 0.35) * 0.012, rho: i === 0 ? 0.0006 : 0.0013 + rnd(i, 2) * 0.0032, phi: rnd(i, 3) * Math.PI * 2,
    scatter: V(rnd(i, 4) - 0.5, (rnd(i, 5) - 0.5) * 0.6, rnd(i, 6) - 0.5).normalize().multiplyScalar(0.02 + rnd(i, 7) * 0.035),
    tilt: [rnd(i, 8) - 0.5, rnd(i, 9) - 0.5, rnd(i, 10) - 0.5].map((x) => x * 1.4) as [number, number, number],
    dup1: i > 0 && rnd(i, 12) < 0.4 ? Math.floor(rnd(i, 13) * i) : -1, dup2: i > 0 && rnd(i, 14) < 0.16 ? Math.floor(rnd(i, 15) * i) : -1,
  }));
  const rushes = Array.from({ length: RUSH }, (_, j) => ({ lag: rnd(j, 21) * 0.024, phi: rnd(j, 22) * Math.PI * 2, rho: 0.0011 + rnd(j, 23) * 0.0042 }));
  const lags = recs.map((r) => r.lag);
  const lagSpan = { lo: Math.min(...lags), hi: Math.max(...lags) };

  // the search: a hairline from a dish to each page
  const beams = hairlines(RN, { ...c.px, colour: raw("#c9d2ee"), far: 1 });
  beams.mesh.renderOrder = 4;
  c.parent.add(beams.mesh);

  const m4 = new Matrix4(), q = new Quaternion(), qt = new Quaternion(), s3 = new Vector3(), e3 = new Euler();
  const aS = (mesh: InstancedMesh) => mesh.geometry.getAttribute("aS") as InstancedBufferAttribute;
  const lying = (ang: number) => q.setFromAxisAngle(UP, -ang);
  /** a point in the shaft (depth, angle round it, radius), into `out`, so posing allocates nothing */
  const at = (out: Vector3, d: number, ang: number, rad: number) => out.set(SH.top.x + Math.cos(ang) * rad, SH.top.y - d, SH.top.z + Math.sin(ang) * rad);
  const p3 = new Vector3(), c0 = new Vector3();
  const pos: Vector3[] = recs.map(() => new Vector3());
  const crawl = dk("crawl");

  /**
   * poses them for the fall at `s` (the pipeline shown by `v`): `fl` throws them outward on a hard scroll; `lead`
   * keeps the record you fell with (gone once it flies out); `front` is the climax's (where it is, how fast, and its
   * depth in the shaft)
   */
  function update(o: { s: number; v: number; fl: number; lead: number; front: { at: number; crest: number }; fDepth: number }) {
    const { s, v, fl } = o;
    const show = swarmParts({ v, s, lag: lagSpan, crawl, save: dk("save"), front: o.front.at });
    swarm.visible = show.swarm;
    rush.visible = show.rush;
    beams.mesh.visible = show.beams;

    if (show.swarm) {
      const S = aS(swarm);
      for (const r of recs) {
        const si = s - r.lag, ang = r.phi + si * 160;
        const gather = smooth(crawl - 0.004, crawl + 0.0015, si);
        at(pos[r.i]!, crawl, 0, 0).add(r.scatter).lerp(at(p3, si, ang, r.rho * fl), gather);
      }
      let beam = 0;
      for (const r of recs) {
        const si = s - r.lag, P = pos[r.i]!, ang = r.phi + si * 160;
        let vis = v * smooth(crawl - 0.03, crawl - 0.01, si);
        if (r.i === 0) vis *= o.lead;
        const ext = smooth(dk("extract") - 0.0018, dk("extract") + 0.0018, si);
        // a page tumbles; a record lies square
        q.copy(lying(ang)).multiply(qt.setFromEuler(e3.set(r.tilt[0] * (1 - ext) * 2, r.tilt[1] * (1 - ext) * 2, r.tilt[2] * (1 - ext) * 2)));
        // the die squares it into the bore as it passes
        if (ext > 0 && ext < 1) {
          at(c0, si, 0, 0);
          P.x = c0.x + (P.x - c0.x) * (1 - 0.25 * Math.sin(ext * Math.PI));
          P.z = c0.z + (P.z - c0.z) * (1 - 0.25 * Math.sin(ext * Math.PI));
        }
        // dedup: a duplicate's screen goes dark, and it slides into its twin and is gone
        let on = 1;
        for (const [key, lv] of [["dup1", "dedup1"], ["dup2", "dedup2"]] as const) {
          if (r[key] < 0) continue;
          const mm = smooth(dk(lv) - 0.0026, dk(lv) + 0.0006, si);
          if (mm > 0) { P.lerp(pos[r[key]]!, mm); vis *= 1 - smooth(0.6, 1, mm); on *= 1 - smooth(0.1, 0.5, mm); }
        }
        // enrich: its missing fields fill in, in the heaters' warm light
        const en = smooth(dk("enrich") - 0.0018, dk("enrich") + 0.0018, si);
        // save: down into the magazine's stack, dimming, and gone into it
        const sv = smooth(dk("save") - 0.004, dk("save") - 0.0005, si);
        if (sv > 0) { P.lerp(at(p3, dk("save"), 0, 0), sv); vis *= 1 - smooth(0.75, 1, sv); on *= 1 - 0.8 * smooth(0.1, 0.8, sv); }
        S.setXYZW(r.i, ext, en, on, r.i % 4);
        m4.compose(P, q, s3.setScalar(REC * Math.max(1e-6, vis)));
        swarm.setMatrixAt(r.i, m4);
        // the search: a hairline from the dish nearest it to each page while it's out on the web and being fetched
        if (show.beams) {
          const bm = smooth(crawl - 0.012, crawl - 0.004, si) * (1 - smooth(crawl - 0.001, crawl + 0.002, si));
          const da = Math.atan2(P.z - SH.top.z, P.x - SH.top.x);
          beams.set(beam++, at(p3, crawl, da, SH.R * 1.15), P, bm * 0.45 * v, 0.6);
        }
      }
      // the queries: smaller slates leaving Start's magazine, their screens low, going out at the search
      for (let k = 0; k < QN; k++) {
        const sq = s + 0.003 - k * 0.0014, ang = (k / QN) * Math.PI * 2 + s * 120;
        const P = at(p3, sq, ang, k === 0 ? 0.0004 : 0.0022);
        const vis = v * smooth(-0.002, 0.002, sq) * (1 - smooth(crawl - 0.002, crawl + 0.0008, sq));
        m4.compose(P, lying(ang), s3.setScalar(REC * 0.8 * Math.max(1e-6, vis)));
        swarm.setMatrixAt(RN + k, m4);
        S.setXYZW(RN + k, 0, 0, 0.6, (RN + k) % 4);
      }
      swarm.instanceMatrix.needsUpdate = true;
      S.needsUpdate = true;
      if (show.beams) beams.commit();
    }

    // the rush, behind the front
    if (show.rush) {
      const SM = rush.geometry.getAttribute("aSmear") as InstancedBufferAttribute, smear = o.front.crest;
      for (let j = 0; j < RUSH; j++) {
        const r = rushes[j]!, dj = o.fDepth - r.lag, ang = r.phi + dj * 220;
        const vis = v * smooth(-0.004, 0.002, dj) * (1 - smooth(dk("save") - 0.003, dk("save"), dj));
        const P = at(p3, dj, ang, r.rho * fl);
        // stretched up along its fall by the front's speed, its trail fading (a long exposure)
        const st = 1 + 120 * smear;
        m4.compose(P.addScaledVector(UP, (REC * 0.6 * 0.06 * st) / 2), lying(ang), s3.set(REC * 0.6 * Math.max(1e-6, vis), REC * 0.6 * st * Math.max(1e-6, vis), REC * 0.6 * Math.max(1e-6, vis)));
        rush.setMatrixAt(j, m4);
        SM.setX(j, smooth(0, 0.08, smear));
      }
      rush.instanceMatrix.needsUpdate = true;
      SM.needsUpdate = true;
    }
  }

  return {
    update,
    /** the search's hairlines, to keep them off the text being read */
    beams,
    /** the parts the scene draws, for its warm-up */
    meshes: [swarm, rush, beams.mesh],
    /** the rush, streaks of light behind the front */
    rush,
  };
}
