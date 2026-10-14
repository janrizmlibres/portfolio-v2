import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { aboutHold, anglesOf, dirAt, HOLD, holdOut, ringFrame, ringSpin, spreadView } from "./about";

const UP = new Vector3(0, 1, 0);
const axis = new Vector3(0.1, 0.9, 0.4).normalize();
const ref = new Vector3(0.3, 0.7, 0.65).normalize();
const F = ringFrame(axis, ref);
const tanH = Math.tan((16 * Math.PI) / 180);

describe("the ring's own frame: where the camera is round the ship", () => {
  it("puts the reference direction at no turn round the axis", () => {
    const a = anglesOf(F, ref);
    expect(a.phi).toBeCloseTo(0, 9);
    expect(a.th).toBeCloseTo(Math.asin(ref.dot(axis)), 9);
  });

  it("turns a direction into angles and back", () => {
    const d = dirAt(F, 1.1, -0.4);
    const a = anglesOf(F, d);
    expect(a.phi).toBeCloseTo(1.1, 9);
    expect(a.th).toBeCloseTo(-0.4, 9);
    expect(dirAt(F, a.phi, a.th).distanceTo(d)).toBeLessThan(1e-9);
  });
});

describe("aboutHold: About's camera on the ring ship, panning down onto its modules and holding still", () => {
  const H = { P: new Vector3(1, 2, 3) };
  const rimR = 0.01;
  const hold: [number, number] = [2.75, 4.0];
  const aim = new Vector3(1.02, 2.01, 3.03);
  const make = (port = false) =>
    aboutHold({
      H, axis, ref, rimR, hold, port, aspect: port ? 0.46 : 1.6, tanH,
      from: { t: 1.65, dir: dirAt(F, -1.4, 0.5), dist: 0.05, cx: port ? 0.5 : 0.64, cy: 0.5 },
      to: { t: 5.05, dir: dirAt(F, 2.5, -0.85), dist: 0.5, cx: port ? 0.5 : 0.66, cy: 0.5, target: aim },
    });
  const keys = make();
  const pos = (k: (typeof keys)[number]) => new Vector3(...k.target).addScaledVector(new Vector3(...k.dir), k.dist);
  const within = (a: number, b: number, ks = keys) => ks.filter((k) => k.t >= a - 1e-9 && k.t <= b + 1e-9);

  it("fills the stretch between the dive's last key and Around home's frame, in order, a key at least every 0.06 screens", () => {
    expect(keys[0]!.t).toBeGreaterThan(1.65);
    expect(keys.at(-1)!.t).toBeLessThan(5.05);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i]!.t).toBeGreaterThan(keys[i - 1]!.t);
      expect(keys[i]!.t - keys[i - 1]!.t).toBeLessThanOrEqual(0.06 + 1e-9);
    }
  });

  it("picks the aim up where the dive left it, so the view doesn't jump from his star to the ship", () => {
    const fromDir = dirAt(F, -1.4, 0.5), fromCam = H.P.clone().addScaledVector(fromDir, 0.05), lookedAt = H.P.clone().addScaledVector(fromDir, 0.03).add(new Vector3(0, -0.01, 0));
    const ks = aboutHold({
      H, axis, ref, rimR, hold, port: false, aspect: 1.6, tanH,
      from: { t: 1.65, dir: fromDir, dist: 0.05, cx: 0.64, cy: 0.5, target: lookedAt },
      to: { t: 5.05, dir: dirAt(F, 2.5, -0.85), dist: 0.5, cx: 0.66, cy: 0.5, target: aim },
    });
    const was = lookedAt.clone().sub(fromCam).normalize(), first = ks[0]!, now = new Vector3(...first.dir).negate();
    // (a key every 0.05 screens: no more than a few degrees between them)
    expect((Math.acos(Math.min(1, was.dot(now))) * 180) / Math.PI).toBeLessThan(4);
  });

  it("holds perfectly still once settled, from About's words being in to their having gone", () => {
    const held = within(...hold);
    expect(held.length).toBeGreaterThan(10);
    const p0 = pos(held[0]!), t0 = new Vector3(...held[0]!.target);
    for (const k of held) {
      expect(pos(k).distanceTo(p0)).toBeLessThan(rimR * 1e-6);
      expect(new Vector3(...k.target).distanceTo(t0)).toBeLessThan(rimR * 1e-6);
      expect(k.cx).toBeCloseTo(held[0]!.cx, 9);
      expect(k.cy).toBeCloseTo(held[0]!.cy, 9);
    }
  });

  it("holds low over the ring's plane, close outside it, looking across the near modules at the hub on the frame's right", () => {
    const k = within(...hold)[0]!, p = pos(k), off = p.clone().sub(H.P);
    const th = Math.asin(off.clone().normalize().dot(F.n));
    expect(th).toBeGreaterThan(0.02);
    expect(th).toBeLessThan((10 * Math.PI) / 180);
    // just outside the rim
    expect(off.length()).toBeGreaterThan(rimR * 1.12);
    expect(off.length()).toBeCloseTo(rimR * holdOut({ F, aspect: 1.6, tanH }), 9);
    // the aim is the hub (its stem stays in the shot), a little above the ring's plane, and it sits on the right
    const tg = new Vector3(...k.target).sub(H.P);
    expect(tg.clone().addScaledVector(F.n, -tg.dot(F.n)).length()).toBeLessThan(rimR * 0.05);
    expect(tg.dot(F.n)).toBeGreaterThan(0);
    expect(k.cx).toBeGreaterThan(0.8);
  });

  it("pans in on the way: the camera comes down and in", () => {
    const arrive = keys.filter((k) => k.t < hold[0]);
    const th = (k: (typeof keys)[number]) => Math.asin(pos(k).sub(H.P).normalize().dot(F.n));
    const first = arrive[0]!, last = arrive.at(-1)!;
    expect(th(last)).toBeLessThan(th(first));
    expect(pos(last).distanceTo(H.P)).toBeLessThan(pos(first).distanceTo(H.P));
  });

  it("stays clear of the hull until it pulls out past the ring", () => {
    for (const k of keys) if (k.t <= hold[1]) expect(pos(k).distanceTo(H.P)).toBeGreaterThan(rimR * 1.12);
  });

  it("turns its aim to what Around home frames as it pulls out", () => {
    expect(new Vector3(...keys.at(-1)!.target).distanceTo(aim)).toBeLessThan(aim.distanceTo(H.P) * 0.05);
  });

  it("never looks straight down or up, so the frame never twists", () => {
    for (const k of [...keys, ...make(true)]) expect(Math.abs(new Vector3(...k.dir).dot(UP))).toBeLessThan(0.96);
  });

  it("keeps the shot centred across the frame on a phone", () => {
    for (const k of make(true)) expect(k.cx).toBeCloseTo(0.5, 6);
  });
});

describe("holdOut: how far out from the hub the hold stands, so the ring's near end stays just right of About's words", () => {
  const t16 = Math.tan((16 * Math.PI) / 180);
  // the ring's outline (its modules' outer edges) as the hold's camera sees it, in fractions of the frame's width
  const nearEnd = (aspect: number) => {
    const out = holdOut({ F, aspect, tanH: t16 }), cam = dirAt(F, HOLD.phi, HOLD.th).multiplyScalar(out), tg = F.n.clone().multiplyScalar(HOLD.aimUp);
    const f = tg.clone().sub(cam).normalize(), r = new Vector3().crossVectors(f, UP).normalize();
    let left = Infinity;
    for (let i = 0; i < 720; i++)
      for (const z of [-0.075, 0.075]) {
        const p = dirAt(F, (i / 720) * Math.PI * 2, 0).addScaledVector(F.n, z).sub(cam);
        if (p.dot(f) > 0) left = Math.min(left, HOLD.cx + p.dot(r) / p.dot(f) / (2 * t16 * aspect));
      }
    return left;
  };

  it("stands as close as it can with the ring's near end just right of About's words, on any width", () => {
    for (const a of [1.33, 1.6, 1800 / 990, 2.37]) {
      expect(nearEnd(a)).toBeGreaterThanOrEqual(0.34);
      expect(nearEnd(a)).toBeLessThan(0.38);
    }
  });

  it("stands further back on a narrower screen", () => {
    expect(holdOut({ F, aspect: 1.6, tanH: t16 })).toBeGreaterThan(holdOut({ F, aspect: 2.37, tanH: t16 }));
  });

  it("never comes in onto the hull", () => {
    for (const a of [1, 2, 4]) expect(holdOut({ F, aspect: a, tanH: t16 })).toBeGreaterThanOrEqual(1.3);
  });
});

describe("ringSpin: the ring's turn, with the scroll on the way in and on its own clock once settled", () => {
  const o = { settle: 2.75, scroll: 0.25, rate: 0.02 };

  it("turns with the scroll on the way in", () => {
    expect(ringSpin(2, 10, o) - ringSpin(1, 10, o)).toBeCloseTo(0.25, 9);
  });

  it("no longer answers the scroll once settled", () => {
    expect(ringSpin(3, 10, o)).toBeCloseTo(ringSpin(6, 10, o), 9);
    expect(ringSpin(2.75, 10, o)).toBeCloseTo(ringSpin(3, 10, o), 9);
  });

  it("turns steadily with the clock wherever the film is", () => {
    for (const t of [0.5, 3, 9]) expect(ringSpin(t, 12, o) - ringSpin(t, 2, o)).toBeCloseTo(0.2, 9);
  });
});

describe("spreadView: Around home's frame, the stars About lit spread across the right of it", () => {
  // a flat, wide cloud round home, thin along z
  const home = new Vector3(0, 0, 0);
  const pts = [[-1, 0.5, 0.05], [1, -0.4, -0.05], [0.6, 0.9, 0], [-0.7, -0.8, 0.04], [0.2, 0.1, -0.03]].map(([x, y, z]) => new Vector3(x, y, z));
  const box: [number, number, number, number] = [0.46, 0.08, 0.94, 0.92];
  const v = spreadView(pts, home, { prefer: new Vector3(0.2, 0, 1), aspect: 1.6, tanH, box });

  it("looks along the cloud's thinnest axis, from the side nearer the one preferred", () => {
    expect(Math.abs(v.dir.z)).toBeGreaterThan(0.99);
    expect(v.dir.z).toBeGreaterThan(0);
  });

  it("fits the cloud into the box, filling it one way", () => {
    const cam = v.target.clone().addScaledVector(v.dir, v.dist);
    const f = v.dir.clone().negate(), r = new Vector3().crossVectors(f, UP).normalize(), u = new Vector3().crossVectors(r, f);
    const sx = (p: Vector3) => { const q = p.clone().sub(cam), z = q.dot(f); return v.cx + q.dot(r) / z / (2 * tanH * 1.6); };
    const sy = (p: Vector3) => { const q = p.clone().sub(cam), z = q.dot(f); return v.cy - q.dot(u) / z / (2 * tanH); };
    const xs = [...pts, home].map(sx), ys = [...pts, home].map(sy);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(box[0] - 1e-3);
    expect(Math.max(...xs)).toBeLessThanOrEqual(box[2] + 1e-3);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(box[1] - 1e-3);
    expect(Math.max(...ys)).toBeLessThanOrEqual(box[3] + 1e-3);
    const fill = Math.max((Math.max(...xs) - Math.min(...xs)) / (box[2] - box[0]), (Math.max(...ys) - Math.min(...ys)) / (box[3] - box[1]));
    expect(fill).toBeGreaterThan(0.97);
  });

  it("never looks from straight above or below", () => {
    const flat = [[-1, 0.02, 0.5], [1, -0.02, -0.4], [0.6, 0, 0.9], [-0.7, 0.01, -0.8]].map(([x, y, z]) => new Vector3(x, y, z));
    const w = spreadView(flat, home, { prefer: UP, aspect: 1.6, tanH, box });
    expect(Math.abs(w.dir.y)).toBeLessThanOrEqual(Math.sin(0.6) + 1e-9);
  });
});
