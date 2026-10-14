import type { BufferGeometry, Mesh, Scene, WebGLRenderer } from "three";
import { describe, expect, it } from "vitest";
import { eyeDist, type P3 } from "@/lib/tycho/flight-path";
import { createWarpTrail, ringSpot } from "./warp-trail";

const TAU = Math.PI * 2;

describe("the ring closed from his circle's fire", () => {
  it("runs the whole way round, its two ends overlapping, so it never shows a gap", () => {
    const n = 90;
    const last = ringSpot(n - 1, n);
    expect(ringSpot(0, n).to).toBe(0);
    expect(last.to).toBeGreaterThan(TAU);
  });

  it("crossfades where its ends overlap, so the join is as bright as the rest", () => {
    const n = 90;
    const step = ringSpot(1, n).to - ringSpot(0, n).to;
    for (let i = 0; i < 3; i++) {
      // the newest's i-th point and the oldest's that lies on it a turn on
      const newer = ringSpot(i, n), older = ringSpot(n - 4 + i, n);
      expect(older.to - TAU).toBeCloseTo(newer.to, 6);
      expect(newer.fade + older.fade).toBeCloseTo(1, 6);
      expect(step).toBeGreaterThan(0);
    }
    expect(ringSpot(Math.floor(n / 2), n).fade).toBe(1);
  });

  it("keeps a ring too short to overlap whole", () => {
    expect(ringSpot(0, 1)).toEqual({ to: 0, fade: 1 });
    expect(ringSpot(1, 3).fade).toBeGreaterThan(0);
  });
});

// his fire as the warp feeds it: a jet's points, drawn by a renderer that only keeps what it was given
const H = 900, W = 1440, view = { res: { w: W, h: H }, c: { x: W / 2, y: H / 2 }, D: eyeDist(H) };
function drawn(trail: ReturnType<typeof createWarpTrail>) {
  let scene: Scene | null = null;
  const renderer = { render: (s: Scene) => { scene = s; } } as unknown as WebGLRenderer;
  trail.draw(renderer, view.res, view.c, view.D);
  const geo = scene ? ((scene as Scene).children[0] as Mesh).geometry as BufferGeometry : null;
  return { count: trail.count, alpha: geo ? (geo.attributes.aA!.array as Float32Array) : null, pos: geo ? (geo.attributes.position!.array as Float32Array) : null };
}
// a point on the circle he flies round the middle, i of them a few degrees apart
const onCircle = (i: number): P3 => ({ x: W / 2 + 270 * Math.cos(i * 0.06), y: H / 2 + 240 * Math.sin(i * 0.06), z: -200 });
const perch: P3 = { x: W / 2 + 60, y: H / 2 + 250, z: 200 };

describe("his fire", () => {
  it("keeps the whole ring while he waits in front of it, firing on the spot", () => {
    const trail = createWarpTrail();
    // his circle leaves 42 points of ring on each jet
    for (let i = 0; i < 42; i++) {
      for (let j = 0; j < 3; j++) trail.push(j, onCircle(i), 10, 1, 0.42, true);
      trail.step(1 / 60);
    }
    // then he waits in front of it (a question's flare and the wind-up), his jets still firing, at 120 fps
    for (let f = 0; f < 240; f++) {
      for (let j = 0; j < 3; j++) trail.push(j, perch, 10, 1, 0.42);
      trail.step(1 / 120);
    }
    // and once that fire has burnt out, the ring is all that's left, whole
    for (let f = 0; f < 60; f++) trail.step(1 / 60);
    expect(drawn(trail).count).toBe(3 * 42);
  });

  it("makes room for new fire from the oldest loose fire, never from the ring", () => {
    const trail = createWarpTrail({ jets: 1, max: 60 });
    for (let i = 0; i < 42; i++) trail.push(0, onCircle(i), 10, 1, 0.42, true);
    // long-lived fire, more of it than there's room for
    for (let f = 0; f < 100; f++) {
      trail.push(0, { ...perch, x: perch.x + f }, 10, 1, 5);
      trail.step(1 / 120);
    }
    for (let f = 0; f < 400; f++) trail.step(1 / 60);
    expect(drawn(trail).count).toBe(42);
  });

  it("fades the ring in from its first point while he's still flying it, rather than cutting it off square", () => {
    const trail = createWarpTrail({ jets: 1 });
    // the fire before the circle (still alight), then 20 points of ring, the newest
    for (let i = 0; i < 10; i++) trail.push(0, onCircle(i), 10, 1, 5);
    for (let i = 10; i < 30; i++) trail.push(0, onCircle(i), 10, 1, 0.42, true);
    const { alpha } = drawn(trail);
    // drawn newest first: the ring is points 0..19, its first (oldest) point 19, then the break
    const a = (i: number) => alpha![i * 2]!;
    expect(a(10)).toBeGreaterThan(0.5);
    expect(a(19)).toBeLessThan(a(10) * 0.5);
    expect(a(18)).toBeLessThan(a(10));
  });

  it("fades the ring out at its last point too once he has left the circle, until it closes", () => {
    const trail = createWarpTrail({ jets: 1 });
    // 20 points of ring, then the fire he leaves as he brakes off the circle, the newest
    for (let i = 0; i < 20; i++) trail.push(0, onCircle(i), 10, 1, 0.42, true);
    for (let i = 20; i < 30; i++) trail.push(0, onCircle(i), 10, 1, 5);
    const { alpha } = drawn(trail);
    // drawn newest first: the loose fire is points 0..9, the break 10 and 11, the ring 12..31, its last point 12
    const a = (i: number) => alpha![i * 2]!;
    expect(a(20)).toBeGreaterThan(0.5);
    expect(a(12)).toBeLessThan(a(20) * 0.5);
    expect(a(13)).toBeLessThan(a(20));
  });

  it("keeps drawing the fire behind a stretch that has streamed past the eye (he swoops by us in the throat)", () => {
    const trail = createWarpTrail({ jets: 1 });
    const at = (i: number, z: number): P3 => ({ ...onCircle(i), z });
    // older fire, well in front of the eye; then a stretch he left right by us, now past it; then the newest
    for (let i = 0; i < 10; i++) trail.push(0, at(i, 0.2 * view.D), 10, 1, 5);
    for (let i = 10; i < 15; i++) trail.push(0, at(i, 0.9 * view.D), 10, 1, 5);
    for (let i = 15; i < 25; i++) trail.push(0, at(i, 0), 10, 1, 5);
    const { count, alpha } = drawn(trail);
    // the newest 10 and the older 10, with the two unlit points of a break where the stretch past the eye was
    expect(count).toBe(22);
    expect(alpha![10 * 2]).toBe(0);
    expect(alpha![11 * 2]).toBe(0);
    expect(alpha![16 * 2]).toBeGreaterThan(0.3);
  });

  it("closes into a ring as bright at its join as all round, its first points pulled in off his spiral", () => {
    const trail = createWarpTrail({ jets: 1 });
    const cx = W / 2, cy = H / 2, R = 270, n = 50, span = Math.PI * 1.2;
    // 50 points round 216° of the circle, the oldest few still coming in off the spiral (up to 5% out)
    for (let i = 0; i < n; i++) {
      const a = (span * i) / (n - 1), r = R * (1 + 0.05 * Math.max(0, 1 - i / 6));
      trail.push(0, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z: 0 }, 10, 1, 0.42, true);
    }
    Object.assign(trail.fx, {
      ringAt: (a: number, o: P3 = { x: 0, y: 0, z: 0 }) => Object.assign(o, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), z: 0 }),
      ringAngle: (p: P3) => Math.atan2(p.y - cy, p.x - cx), ringA1: span, ringDir: 1, close: 1,
    });
    const { count, alpha, pos } = drawn(trail);
    // each drawn point's angle round the middle and its alpha, and how bright the line is at each degree round
    const pts = Array.from({ length: count }, (_, k) => ({
      a: Math.atan2((pos![k * 6 + 1]! + pos![k * 6 + 4]!) / 2 - cy, (pos![k * 6]! + pos![k * 6 + 3]!) / 2 - cx),
      r: Math.hypot((pos![k * 6]! + pos![k * 6 + 3]!) / 2 - cx, (pos![k * 6 + 1]! + pos![k * 6 + 4]!) / 2 - cy),
      alpha: alpha![k * 2]!,
    }));
    for (const p of pts) expect(p.r).toBeCloseTo(R, 3);
    const wrap = (x: number) => x - TAU * Math.round(x / TAU);
    const bright: number[] = [];
    for (let d = 0; d < 360; d++) {
      const th = (d * Math.PI) / 180;
      let sum = 0;
      for (let k = 0; k + 1 < pts.length; k++) {
        const p = pts[k]!, q = pts[k + 1]!, seg = wrap(q.a - p.a), u = wrap(th - p.a) / seg;
        if (u >= 0 && u <= 1) sum += p.alpha + (q.alpha - p.alpha) * u;
      }
      bright.push(sum);
    }
    expect(Math.min(...bright)).toBeGreaterThan(0.85);
    expect(Math.max(...bright)).toBeLessThan(1.15);
  });

  it("drops fire that has burnt out wherever it is, and the line breaks there rather than bridging the gap", () => {
    const trail = createWarpTrail({ jets: 1 });
    // long-lived fire, then a stretch that burns out quickly, then long-lived fire again (his fire's life changes)
    for (let i = 0; i < 10; i++) trail.push(0, onCircle(i), 10, 1, 5);
    for (let i = 10; i < 20; i++) trail.push(0, onCircle(i), 10, 1, 0.1);
    for (let i = 20; i < 30; i++) trail.push(0, onCircle(i), 10, 1, 5);
    trail.step(0.2);
    const { count, alpha } = drawn(trail);
    // 10 new and 10 old, with the two unlit points of a break between them
    expect(count).toBe(22);
    expect(alpha![10 * 2]).toBe(0);
    expect(alpha![11 * 2]).toBe(0);
  });
});
