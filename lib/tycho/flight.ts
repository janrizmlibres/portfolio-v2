/**
 * Tycho's flight through the warp. A second Tycho on a stage canvas of his own, laid exactly over the one in his
 * corner, takes that one's place, flies the journey in 3D and lands back on the same spot, where the corner one takes
 * over again (he leaves from his spot and lands back on it).
 * The warp sets where he is in the flight's world each frame (flight-path.ts: x, y on the screen, z towards the
 * visitor's eye), with his velocity and acceleration. This lays his canvas where the eye sees him, as big as his
 * depth makes him and under the warp's camera (its shake, roll and zoom), sizes its drawing buffer to that, has his
 * rig show him from where the eye is, leaning into his motion (rig.ts, flight mode), and leaves his fire at his
 * nozzles (`emit`, into lib/voyage/warp-trail.ts).
 * The corner rig waits undrawn while he's away. The stage rig is made ahead, drawn while hidden so its programs
 * compile then, and waits without drawing. In the warp it's drawn off the ticker, as each frame places him (`place`),
 * so the nozzles his fire is left at are where that frame draws them.
 */
import gsap from "gsap";
import type { TychoRig } from "./rig";
import { currentRig, currentRoam } from "./current";
import { nozzleTrail, project, type At, type P3 } from "./flight-path";
import { detail } from "@/lib/universe/tier";

// the canvas's laid-out size (CSS px; scaled on screen from there), and how many of his heights it frames, so his
// flames aren't cut off; his corner canvas frames 1.12 of them
const B = 512, FRAME = 2.3, CORNER_H = 1.12;
const BUCKETS = [256, 384, 512, 640, 768, 896, 1024, 1280];

export type View = { c: { x: number; y: number }; D: number; cam: { x: number; y: number; roll: number; zoom: number } };
export type TychoFlight = Awaited<ReturnType<typeof createTychoFlight>>;

export async function createTychoFlight() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "tycho-flight";
  Object.assign(canvas.style, {
    position: "fixed", left: "0", top: "0", width: `${B}px`, height: `${B}px`, zIndex: "41", pointerEvents: "none", visibility: "hidden", transformOrigin: "50% 50%",
  });
  document.body.append(canvas);
  const { createTychoRig } = await import("./rig");
  const rig: TychoRig = createTychoRig(canvas, { stage: true });
  await rig.ready;
  rig.setFlight(true);
  rig.boost.deploy = 1;
  rig.boost.thrust = 1;
  // drawn for a couple of frames while hidden, booster flames and all, so nothing compiles on the first warp; then
  // he waits undrawn
  await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
  rig.boost.deploy = rig.boost.thrust = 0;
  rig.setFlight(false);
  rig.drawing(false);

  const corner = () => document.querySelector<HTMLElement>("#tycho .tycho-body");
  /** where he is in the flight's world (CSS px; z towards the eye), and his height on screen at depth 0 (CSS px) */
  const pos = { x: 0, y: 0, z: 0, s: 100 };
  const motion = { vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0 };
  /** how far his view has turned from his corner's (0) to the eye's from where he is (1) */
  const look = { k: 0 };
  let screenK = 1;
  // each jet's nozzle, from him, when he last left fire (at warp time lastT): the next frame's fire turns on from there
  let lastOff: P3[] | null = null, lastT = NaN;

  return {
    rig,
    pos,
    look,
    /** where he sits in his corner now: his centre, and his height on screen */
    home(): (P3 & { s: number }) | null {
      const at = currentRoam()?.spot();
      if (!at) return null;
      return { x: at.x, y: at.y, z: 0, s: (at.size * at.scale) / CORNER_H };
    },
    /** takes the corner's place: holds the corner Tycho and lays the stage over him; false if he can't be flown */
    begin() {
      const from = this.home();
      if (!from) return false;
      Object.assign(pos, from);
      Object.assign(motion, { vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0 });
      look.k = 0;
      lastOff = null;
      currentRoam()?.hold(true);
      rig.setFlight(true);
      Object.assign(rig.flight, { w: 0, smooth: true, frame: FRAME });
      Object.assign(rig.fly, { yaw: 0, pitch: 0, roll: 0, rim: 0 });
      Object.assign(rig.boost, { deploy: 0, thrust: 0, kick: 0 });
      rig.drawing(false); // drawn as he's placed, below
      canvas.style.visibility = "visible";
      corner()?.style.setProperty("visibility", "hidden");
      currentRig()?.drawing(false);
      return true;
    },
    /** his place on his path at this time */
    follow(f: At) {
      pos.x = f.x; pos.y = f.y; pos.z = f.z;
      motion.vx = f.vx; motion.vy = f.vy; motion.vz = f.vz;
      motion.ax = f.ax; motion.ay = f.ay; motion.az = f.az;
    },
    /** lays his canvas where the eye sees him, turns him to be seen from there, and draws him */
    place({ c, D, cam }: View) {
      const pr = project(pos, c, D), cs = Math.cos(cam.roll), sn = Math.sin(cam.roll);
      const dx = (pr.x - c.x) * cam.zoom, dy = (pr.y - c.y) * cam.zoom;
      const sx = c.x + dx * cs - dy * sn + cam.x, sy = c.y + dx * sn + dy * cs + cam.y;
      const S = (pos.s * pr.k * cam.zoom) / (B / FRAME);
      screenK = pr.k;
      canvas.style.transform = `translate3d(${(sx - B / 2).toFixed(1)}px, ${(sy - B / 2).toFixed(1)}px, 0) rotate(${cam.roll.toFixed(4)}rad) scale(${S.toFixed(4)})`;
      // seen from where the eye is (three.js axes: y up, z towards the eye), turned from his corner's view as he sets out
      const F = rig.flight, ex = c.x - pos.x, ey = c.y - pos.y, ez = D - pos.z, el = Math.hypot(ex, ey, ez);
      const k = look.k;
      F.eye.set((ex / el) * k, (-ey / el) * k, 1 + (ez / el - 1) * k).normalize();
      const U = pos.s / rig.height; // world px per unit of him
      F.dist = U > 0.01 ? el / U : Infinity;
      F.vel.set(motion.vx, -motion.vy, motion.vz);
      F.acc.set(motion.ax, -motion.ay, motion.az);
      // his drawing buffer follows his size on screen: up to 1.5 device px per CSS px while he flies, 1.25 once big,
      // and no more than the visit's quality gives him
      const q = detail(), need = B * S * Math.min(devicePixelRatio, S > 1.3 ? 1.25 : 1.5, q.tycho.dpr), max = q.flight;
      rig.buffer(BUCKETS.find((b) => b >= need && b <= max) ?? max);
      // drawn now, posed as this frame places him, before his fire is left at his nozzles (the ticker's step, in ms)
      rig.draw(gsap.ticker.deltaRatio(1000));
    },
    /**
     * Leaves his fire: a point per jet at its nozzle, and between frames more along his path (`along`, from the last
     * time to this), so a fast curve leaves a smooth trail; each nozzle turns from where it was last frame to where
     * it is now along the way (`nozzleTrail`). `push` takes the jet, the point, its width, heat and life.
     */
    emit(along: (t: number) => P3, t0: number, t: number, push: (j: number, p: P3, w: number, h: number, life: number) => void, { life = 1, light = false } = {}) {
      const nz = pos.s < 4 ? [] : rig.nozzles();
      if (!nz.length) { lastOff = null; return; }
      const U = pos.s / rig.height;
      const off = nz.map((n) => ({ x: n.x * U, y: -n.y * U, z: n.z * U }));
      // the nozzles as they were when he last left fire, if that was the frame before this one
      const from = lastOff && lastT === t0 && lastOff.length === off.length ? lastOff : off;
      lastOff = off;
      lastT = t;
      const speed = Math.hypot(motion.vx, motion.vy, motion.vz) * screenK;
      const steps = Math.max(1, Math.min(5, Math.ceil((speed * Math.abs(t - t0)) / 18)));
      const rel = pos.s / 170; // his size against his usual size in flight
      nz.forEach(({ thrust }, j) => {
        if (thrust < 0.12 || (j && light)) return;
        const w = (j ? 7 : 15) * rel * (0.55 + 0.45 * Math.min(1.5, thrust)), h = Math.min(1, 0.35 + thrust * 0.6), l = (j ? 0.28 : 0.42) * life;
        for (const p of nozzleTrail(along, t0, t, from[j]!, off[j]!, steps)) push(j, p, w, h, l);
      });
    },
    /** gives the corner back: the corner Tycho shows and roams again, and the stage waits undrawn */
    end() {
      // drawn now, before he shows, so his first frame back isn't the one he left on
      const back = currentRig();
      back?.drawing(true);
      back?.draw(0);
      corner()?.style.removeProperty("visibility");
      canvas.style.visibility = "hidden";
      rig.boost.deploy = rig.boost.thrust = rig.boost.kick = 0;
      rig.setFlight(false);
      rig.drawing(false);
      currentRoam()?.hold(false);
    },
    dispose() {
      rig.destroy();
      canvas.remove();
    },
  };
}
