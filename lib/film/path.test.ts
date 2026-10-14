import { describe, expect, it } from "vitest";
import { bridge, buildPath, look, keyFrom, travel, type Vec3 } from "./path";
import { oklchToOklab, REGION_LIGHT } from "@/lib/universe/light";

const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

describe("buildPath", () => {
  const keys = [
    look(0, [0, 0, 0], [0, 0, 1], 4, { region: "hero" }),
    look(2, [1, 0, 0], [1, 0, 1], 0.04, { region: "about", cx: 0.64 }),
    look(3, [1, 0.2, 0], [0, 1, 1], 0.08, { region: "about" }),
  ];
  const path = buildPath(keys);

  it("passes through every key's pose", () => {
    const p = path.at(2);
    expect(p.target).toEqual([1, 0, 0].map((x) => expect.closeTo(x, 9)));
    expect(len(sub(p.pos, p.target))).toBeCloseTo(0.04, 9);
    expect(p.cx).toBeCloseTo(0.64, 9);
  });

  it("runs distance in log space, so a dive is one steady speed: halfway in time is the geometric mean", () => {
    const two = buildPath([look(0, [0, 0, 0], [0, 0, 1], 4), look(1, [0, 0, 0], [0, 0, 1], 0.04)]);
    const mid = two.at(0.5);
    expect(len(sub(mid.pos, mid.target))).toBeCloseTo(Math.sqrt(4 * 0.04), 9);
    // equal ratios in equal times
    const d = (t: number) => { const p = two.at(t); return len(sub(p.pos, p.target)); };
    expect(d(0.25) / d(0)).toBeCloseTo(d(0.5) / d(0.25), 9);
  });

  it("keeps the direction a unit vector between keys that turn", () => {
    for (let t = 0; t <= 3; t += 0.1) {
      const p = path.at(t), dist = len(sub(p.pos, p.target));
      expect(dist).toBeGreaterThan(0);
      expect(Number.isFinite(dist)).toBe(true);
    }
  });

  it("never overshoots a key's distance", () => {
    for (let t = 2; t <= 3; t += 0.01) {
      const p = path.at(t), dist = len(sub(p.pos, p.target));
      expect(dist).toBeGreaterThanOrEqual(0.04 - 1e-12);
      expect(dist).toBeLessThanOrEqual(0.08 + 1e-12);
    }
  });

  it("blends each region's light in OKLab", () => {
    const two = buildPath([look(0, [0, 0, 0], [0, 0, 1], 1, { region: "hero" }), look(1, [0, 0, 0], [0, 0, 1], 1, { region: "work" })]);
    const A = oklchToOklab(REGION_LIGHT.hero.tint), B = oklchToOklab(REGION_LIGHT.work.tint);
    const mid = two.at(0.5).light.tint;
    mid.forEach((c, i) => expect(c).toBeCloseTo((A[i]! + B[i]!) / 2, 9));
    expect(two.at(0).light.space).toEqual(oklchToOklab(REGION_LIGHT.hero.space).map((x) => expect.closeTo(x, 9)));
  });

  it("orders its keys, and pulls keys at the same time a hair apart instead of dividing by zero", () => {
    const p = buildPath([look(1, [0, 0, 0], [0, 0, 1], 2), look(0, [0, 0, 0], [0, 0, 1], 1), look(1, [0, 0, 0], [0, 0, 1], 3)]);
    expect(p.start).toBe(0);
    for (let t = -1; t <= 2; t += 0.05) expect(Number.isFinite(p.at(t).pos[2])).toBe(true);
  });

  it("makes a key from a camera position and a target", () => {
    const k = keyFrom(1, [0, 0, 5], [0, 0, 1]);
    expect(k.dist).toBeCloseTo(4, 12);
    expect(k.dir).toEqual([0, 0, 1]);
  });
});

describe("bridge", () => {
  // two shots looking from nearly opposite sides (159° apart), a screen apart, the second far closer in
  const a = look(5.3, [0, 0, 0], [0.645, 0.076, 0.761], 1.37, { cx: 0.57, region: "about" });
  const b = look(6.3, [0.05, 0, 0.02], [-0.327, -0.061, -0.943], 0.037, { cx: 0.63, region: "work" });
  const dirAt = (p: ReturnType<typeof buildPath>, t: number) => {
    const q = p.at(t), d = [q.target[0] - q.pos[0], q.target[1] - q.pos[1], q.target[2] - q.pos[2]], l = Math.hypot(d[0]!, d[1]!, d[2]!);
    return d.map((x) => x / l);
  };
  const peakTurn = (p: ReturnType<typeof buildPath>) => {
    let peak = 0, prev = dirAt(p, a.t);
    for (let t = a.t + 0.005; t <= b.t; t += 0.005) {
      const d = dirAt(p, t), c = Math.min(1, prev[0]! * d[0]! + prev[1]! * d[1]! + prev[2]! * d[2]!);
      peak = Math.max(peak, (Math.acos(c) * 180) / Math.PI / 0.005);
      prev = d;
    }
    return peak;
  };

  it("turns the view evenly between two shots, round a great circle, never faster than half again its average", () => {
    // without it the film eases each component of the direction apart, and between opposite sides it whips round
    expect(peakTurn(buildPath([a, b]))).toBeGreaterThan(500);
    expect(peakTurn(buildPath([a, ...bridge(a, b), b]))).toBeLessThan((159 / 1) * 1.6);
  });

  it("fills only the stretch between them, a key every 0.05 screens, starting and ending on them", () => {
    const ks = bridge(a, b);
    expect(ks[0]!.t).toBeGreaterThan(a.t);
    expect(ks.at(-1)!.t).toBeLessThan(b.t);
    for (let i = 1; i < ks.length; i++) expect(ks[i]!.t - ks[i - 1]!.t).toBeCloseTo(0.05, 6);
    const p = buildPath([a, ...ks, b]), end = p.at(b.t), start = p.at(a.t);
    expect(end.cx).toBeCloseTo(0.63, 6);
    expect(start.cx).toBeCloseTo(0.57, 6);
  });

  it("eases the light from one region's to the other's across the whole stretch, not in a step", () => {
    const p = buildPath([a, ...bridge(a, b), b]), from = oklchToOklab(REGION_LIGHT.about.tint), to = oklchToOklab(REGION_LIGHT.work.tint);
    // how far along from the one's colour to the other's
    const k = (t: number) => {
      const c = p.at(t).light.tint, d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
      return ((c[0] - from[0]) * d[0]! + (c[1] - from[1]) * d[1]! + (c[2] - from[2]) * d[2]!) / (d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2);
    };
    expect(k(a.t + 0.25)).toBeGreaterThan(0.05);
    expect(k(a.t + 0.25)).toBeLessThan(0.4);
    expect(k(a.t + 0.5)).toBeCloseTo(0.5, 1);
    expect(k(a.t + 0.75)).toBeGreaterThan(0.6);
  });
});

describe("travel", () => {
  // from close on one subject to a shot of another far off, two screens later: the camera starts at rest, and arrives
  // moving the way the next shot carries it on
  const a = look(10, [0, 0, 0], [0, 0, 1], 0.03, { cx: 0.64, region: "work" });
  const b = look(12, [0.1, 0.05, -0.1], [0, 0.3, -1], 0.16, { cx: 0.6, region: "projects" });
  const posOf = (k: { target: Vec3; dir: Vec3; dist: number }): Vec3 => [0, 1, 2].map((i) => k.target[i]! + k.dir[i]! * k.dist) as Vec3;
  const arrive: Vec3 = [0.02, 0, 0.01];
  const ks = travel(a, b, { leave: [0, 0, 0], arrive, look: [0.3, 0.8] });
  // the next shot, carrying the camera on as it arrived
  const c = keyFrom(13, posOf(b).map((x, i) => x + arrive[i]!) as Vec3, b.target, { cx: 0.6, region: "projects" });
  const path = buildPath([a, ...ks, b, c]);

  it("fills only the stretch between them, a key every 0.05 screens", () => {
    expect(ks[0]!.t).toBeCloseTo(10.05, 6);
    expect(ks.at(-1)!.t).toBeCloseTo(11.95, 6);
    for (let i = 1; i < ks.length; i++) expect(ks[i]!.t - ks[i - 1]!.t).toBeCloseTo(0.05, 6);
  });

  it("starts from rest, pulling away slowly, and arrives at the speed it's given", () => {
    const from = posOf(a);
    expect(len(sub(path.at(10.05).pos, from))).toBeLessThan(0.002);
    // (the film's speed at a key is about its last stretch's, and here the camera slows hard into the arrival, so the
    // arrival's speed is read off keys closer together)
    const fine = buildPath([a, ...travel(a, b, { leave: [0, 0, 0], arrive, look: [0.3, 0.8], step: 0.01 }), b, c]);
    const v = sub(fine.at(12.001).pos, fine.at(11.999).pos).map((x) => x / 0.002) as Vec3;
    expect(len(sub(v, arrive))).toBeLessThan(0.15 * len(arrive));
  });

  it("travels from where the one shot puts the camera to where the other does, by a smooth curve", () => {
    // halfway in time, a Hermite curve from rest is halfway along the chord, bowed back by a quarter of the arrival's pull
    const mid = path.at(11).pos, A = posOf(a), B = posOf(b);
    const expected = [0, 1, 2].map((i) => 0.5 * A[i]! + 0.5 * B[i]! - 0.125 * arrive[i]! * 2) as Vec3;
    expect(len(sub(mid, expected))).toBeLessThan(1e-3);
  });

  it("keeps its eye on the one subject until the look begins, and on the other once it's done, sweeping between", () => {
    expect(len(sub(path.at(10.5).target, a.target))).toBeLessThan(1e-9);
    expect(len(sub(path.at(11.7).target, b.target))).toBeLessThan(1e-9);
    // halfway through the look (0.55 of the way), halfway from the one to the other
    const half = path.at(11.1).target;
    expect(len(sub(half, [0.05, 0.025, -0.05]))).toBeLessThan(1e-3);
    // and the subject's spot on screen goes with the eye
    expect(path.at(10.5).cx).toBeCloseTo(0.64, 6);
    expect(path.at(11.7).cx).toBeCloseTo(0.6, 6);
  });

  it("eases the light from the one's region to the other's with the eye", () => {
    expect(ks.find((k) => Math.abs(k.t - 10.5) < 1e-6)!.blend).toBeUndefined();
    const half = ks.find((k) => Math.abs(k.t - 11.1) < 1e-6)!;
    expect(half.region).toBe("work");
    expect(half.blend!.region).toBe("projects");
    expect(half.blend!.k).toBeCloseTo(0.5, 6);
    expect(ks.at(-1)!.region).toBe("projects");
  });
});
