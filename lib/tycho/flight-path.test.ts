import { describe, expect, it } from "vitest";
import { eyeDist, LEAN_SWING, leanAround, nozzleTrail, orbit, path, project, quake, route } from "./flight-path";

const TAU = Math.PI * 2;

describe("the eye: a camera in front of the screen, the page at depth 0", () => {
  const c = { x: 720, y: 450 }, D = eyeDist(900);
  it("sits where a 45° view spans the screen's height", () => {
    expect(D).toBeCloseTo(450 / Math.tan((22.5 * Math.PI) / 180));
  });
  it("shows a point at depth 0 where it is, and one towards the eye bigger and further out", () => {
    expect(project({ x: 100, y: 200, z: 0 }, c, D)).toMatchObject({ x: 100, y: 200, k: 1 });
    const near = project({ x: 100, y: 200, z: D / 2 }, c, D);
    expect(near.k).toBeCloseTo(2);
    expect(near.x).toBeCloseTo(c.x + (100 - c.x) * 2);
    expect(project({ x: 100, y: 200, z: -D }, c, D).k).toBeCloseTo(0.5);
  });
});

describe("path: smooth through timed keys", () => {
  const p = path([
    { t: 0, x: 0, y: 0, z: 0, v: [0, 0, 0] },
    { t: 1, x: 300, y: -100, z: 50 },
    { t: 1.6, x: 500, y: 40, z: -200 },
    { t: 3, x: 520, y: 400, z: 0, v: [0, 0, 0] },
  ]);
  it("passes every key at its time", () => {
    for (const k of p.keys) expect(p.at(k.t)).toMatchObject({ x: expect.closeTo(k.x, 6), y: expect.closeTo(k.y, 6), z: expect.closeTo(k.z, 6) });
  });
  it("leaves and lands at rest where a key says so, and holds its ends outside its span", () => {
    expect(Math.hypot(p.at(0.0001).vx, p.at(0.0001).vy)).toBeLessThan(5);
    expect(Math.hypot(p.at(2.9999).vx, p.at(2.9999).vy)).toBeLessThan(5);
    expect(p.at(-1)).toMatchObject({ x: 0, y: 0, vx: 0 });
    expect(p.at(9)).toMatchObject({ x: 520, y: 400, vx: 0 });
  });
  it("keeps its velocity continuous through the keys between", () => {
    for (const t of [1, 1.6]) {
      const a = p.at(t - 1e-6), b = p.at(t + 1e-6);
      expect(b.vx).toBeCloseTo(a.vx, 1);
      expect(b.vy).toBeCloseTo(a.vy, 1);
      expect(b.vz).toBeCloseTo(a.vz, 1);
    }
  });
});

describe("route: paths back to back", () => {
  it("follows whichever path owns the time, and holds the nearest end between them", () => {
    const r = route(path([{ t: 0, x: 0, y: 0, z: 0 }, { t: 1, x: 10, y: 0, z: 0 }]));
    r.add(path([{ t: 2, x: 50, y: 0, z: 0 }, { t: 3, x: 60, y: 0, z: 0 }]));
    expect(r.at(0.5).x).toBeCloseTo(5);
    expect(r.at(1.5).x).toBeCloseTo(10);
    expect(r.at(2.5).x).toBeCloseTo(55);
  });
});

describe("orbit: his one clean circle, as the eye sees it", () => {
  const W = 1440, H = 900, c = { x: W / 2, y: H / 2 }, D = eyeDist(H), m = Math.min(W, H);
  const make = (from: { x: number; y: number }) =>
    orbit({ c, D, R: m * 0.3, e: 0.9, depth: (a) => (-0.28 + 0.26 * Math.sin(a)) * D, from: { ...from, z: 0 }, dir: from.x >= c.x ? -1 : 1, t0: 0.3, t1: 1.5, endZ: 0.24 * D });
  // his corner spots, and a few more round the frame's edges
  const starts = [{ x: W - 90, y: H - 90 }, { x: 90, y: H - 90 }, { x: W - 90, y: 90 }, { x: 90, y: 90 }, { x: W / 2, y: H - 80 }, { x: W - 80, y: H / 2 }];

  it("leaves from his spot at rest", () => {
    for (const s of starts) {
      const o = make(s);
      const a = project(o.at(0.3), c, D);
      expect(a.x).toBeCloseTo(s.x, 3);
      expect(a.y).toBeCloseTo(s.y, 3);
    }
  });

  it("never bends the other way on the screen: no S curves", () => {
    for (const s of starts) {
      const o = make(s);
      const pts: Array<{ x: number; y: number }> = [];
      for (let t = 0.3; t <= 1.5; t += 0.004) pts.push(project(o.at(t), c, D));
      let sign = 0;
      for (let i = 2; i < pts.length; i++) {
        const [a, b, d] = [pts[i - 2]!, pts[i - 1]!, pts[i]!];
        const cross = (b.x - a.x) * (d.y - b.y) - (b.y - a.y) * (d.x - b.x);
        const seg = Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(d.x - b.x, d.y - b.y);
        if (seg < 1e-3 || Math.abs(cross) < seg * 1e-3) continue; // straight enough to have no sign
        const sg = Math.sign(cross);
        if (!sign) sign = sg;
        expect(sg).toBe(sign);
      }
    }
  });

  it("takes his fire into the ring from when he's within 5% of the circle, not only once he's exactly on it", () => {
    for (const s of starts) {
      const o = make(s);
      const p = project(o.at(o.ringOn), c, D);
      // how far off the circle he is there, on the screen (its height squeezed by e)
      const off = Math.hypot(p.x - c.x, (p.y - c.y) / 0.9) / (m * 0.3) - 1;
      expect(off).toBeGreaterThan(0.04);
      expect(off).toBeLessThan(0.052);
      expect(o.ringOn).toBeLessThan(o.ringOff);
    }
  });

  it("goes round once and stops low on the circle, in front of where the hole will open", () => {
    for (const s of starts) {
      const o = make(s);
      expect(o.sweep).toBeGreaterThan(Math.PI * 1.5);
      const end = o.angleOf(o.end);
      const a = ((end % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      expect(a).toBeGreaterThan(Math.PI * 0.15);
      expect(a).toBeLessThan(Math.PI * 0.85);
      expect(o.end.z).toBeGreaterThan(0);
    }
  });
});

describe("nozzleTrail: the fire a jet leaves between two frames", () => {
  // he flies a circle once a second; a jet on his side turns with him, its nozzle 60 px out and 40 px back
  const along = (t: number) => ({ x: 720 + 270 * Math.cos(t * Math.PI * 2), y: 450 + 270 * Math.sin(t * Math.PI * 2), z: 0 });
  const nozzle = (t: number) => {
    const h = t * Math.PI * 2 + Math.PI / 2, ux = Math.cos(h), uy = Math.sin(h);
    return { x: -40 * ux - 60 * uy, y: -40 * uy + 60 * ux, z: 0 };
  };

  it("ends at the nozzle where it is now", () => {
    const pts = nozzleTrail(along, 0.1, 0.12, nozzle(0.1), nozzle(0.12), 3);
    expect(pts).toHaveLength(3);
    const end = pts.at(-1)!, n = nozzle(0.12), a = along(0.12);
    expect(end.x).toBeCloseTo(a.x + n.x, 6);
    expect(end.y).toBeCloseTo(a.y + n.y, 6);
  });

  it("leaves a smooth line from a jet that turns with him: no step at each frame's first point", () => {
    // 60 frames a second, two points a frame
    const pts: Array<{ x: number; y: number }> = [];
    for (let f = 1; f <= 60; f++) {
      const t0 = (f - 1) / 60, t1 = f / 60;
      pts.push(...nozzleTrail(along, t0, t1, nozzle(t0), nozzle(t1), 2));
    }
    let worst = 0;
    for (let i = 2; i < pts.length; i++) {
      const [a, b, d] = [pts[i - 2]!, pts[i - 1]!, pts[i]!];
      const turn = Math.abs(Math.atan2((b.x - a.x) * (d.y - b.y) - (b.y - a.y) * (d.x - b.x), (b.x - a.x) * (d.x - b.x) + (b.y - a.y) * (d.y - b.y)));
      worst = Math.max(worst, turn);
    }
    // a circle in 120 points turns 3° a point
    expect((worst * 180) / Math.PI).toBeLessThan(6);
  });
});

describe("leanAround: which way he leans in flight, round the vertical", () => {
  const deg = (d: number) => (d * Math.PI) / 180, full = 1.35, dt = 1 / 60;

  it("follows his push as it turns gently", () => {
    expect(leanAround(0.1, 0.15, deg(110), full, dt)).toBeCloseTo(0.15, 9);
    expect(leanAround(Number.NaN, 2, deg(110), full, dt)).toBe(2);
  });

  it("takes the short way round", () => {
    expect(leanAround(3, -3, deg(20), deg(20), dt)).toBeCloseTo(3 + (TAU - 6), 9);
  });

  it("swings round, never jumps, when his push swings past straight down (122° in one frame, as measured at 0.5 s)", () => {
    // full lean, his push past straight down; the way it leans goes from -141° to 95° (the short way: -124°)
    let phi = deg(-140.9);
    const want = deg(94.8), steps: number[] = [];
    for (let f = 0; f < 30; f++) {
      const next = leanAround(phi, want, deg(150), full, dt);
      steps.push(Math.abs(next - phi));
      phi = next;
    }
    // the tip of his up crosses the sky at no more than LEAN_SWING rad/s: under 12° a frame at full lean
    expect(Math.max(...steps) * Math.sin(full)).toBeLessThanOrEqual((LEAN_SWING * dt) + 1e-9);
    expect(Math.max(...steps)).toBeLessThan(deg(12));
    // and it gets there, the short way, within a fifth of a second
    const there = steps.findIndex((s) => s < 1e-9);
    expect(there).toBeGreaterThan(0);
    expect(there).toBeLessThanOrEqual(12);
    expect(Math.cos(phi - want)).toBeCloseTo(1, 9);
  });

  it("keeps leaning the way he was while his push points almost straight down, where its way says nothing", () => {
    expect(leanAround(0.4, 2.5, Math.PI - 0.01, full, dt)).toBe(0.4);
  });

  it("turns as fast as it likes with no lean to speak of", () => {
    expect(leanAround(0, 3, deg(0.5), deg(0.5), dt)).toBeCloseTo(3, 9);
  });
});

describe("quake: the camera's shake", () => {
  it("stays within about one unit each way", () => {
    for (let t = 0; t < 5; t += 0.013) {
      const q = quake(t);
      expect(Math.abs(q.x)).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(q.y)).toBeLessThanOrEqual(1.0001);
    }
  });
});
