import { describe, expect, it } from "vitest";
import stars from "@/public/sky/stars-pca.json";
import { ATHENA, CRAWLER, HIS_STAR } from "@/lib/content/voyage";
import { HERO_DIR, type V3 } from "@/lib/voyage/route";
import { voyageScript } from "@/lib/voyage/script";
import { layWorld } from "@/lib/voyage/world";
import { arc, layChart, projector, spotNear } from "./chart";

const script = voyageScript();
const chart = layChart(script, stars.stars);
const starAt = (id: string): V3 => { const s = stars.stars.find((x) => x.id === id)!; return [s.x, s.y, s.z]; };
const near = (a: readonly number[], b: readonly number[], d = 1e-9) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!) < d;
const T = script.times;

describe("projector", () => {
  const project = projector(HERO_DIR);

  it("looks from the hero's side: what lies along the line of sight lands on the centre", () => {
    expect(near(project([0, 0, 0]), [0, 0])).toBe(true);
    expect(near(project(HERO_DIR), [0, 0])).toBe(true);
  });

  it("keeps the sky upright: up in the sky is up on the chart (screen y grows downwards)", () => {
    expect(project([0, 1, 0])[1]).toBeLessThan(0);
    expect(Math.abs(project([0, 1, 0])[0])).toBeLessThan(1e-9);
  });

  it("is a chart, not a perspective: a step along the line of sight moves nothing", () => {
    const p: V3 = [0.2, -0.1, 0.3];
    const q: V3 = [p[0] + HERO_DIR[0] * 0.5, p[1] + HERO_DIR[1] * 0.5, p[2] + HERO_DIR[2] * 0.5];
    expect(near(project(p), project(q))).toBe(true);
  });
});

describe("layChart", () => {
  it("frames the voyage: it fills the chart, so its sections can be told apart", () => {
    const r = chart.track.map((p) => Math.hypot(p[0], p[1]));
    expect(Math.max(...r)).toBeCloseTo(0.86, 9);
  });

  it("draws the stars inside the frame, fading towards its edge, and leaves out the rest", () => {
    // (15 since the ribbon came in under the crawler's shaft, ADR 0016: the voyage is more compact, so framed on it
    // the chart is closer in than it was)
    expect(chart.stars.length).toBeGreaterThan(12);
    expect(chart.stars.length).toBeLessThan(stars.stars.length + 1);
    for (const s of chart.stars) {
      const r = Math.hypot(s.at[0], s.at[1]);
      expect(r).toBeLessThanOrEqual(1.1);
      expect(s.fade).toBeGreaterThan(0);
      expect(s.fade).toBeLessThanOrEqual(1);
      if (r < 0.8) expect(s.fade).toBe(1);
    }
  });

  it("marks each section where it sits: About at home, Work at its relay by home, Projects at Athena with the crawler and the ribbon, Contact at his star", () => {
    const P = chart.project;
    expect(near(chart.marks["sec-hero"].at, P([0, 0, 0]))).toBe(true);
    expect(chart.marks["sec-about"].at[0]).toBeCloseTo(P(starAt(HIS_STAR))[0], 1);
    expect(near(chart.marks["sec-projects"].at, P(starAt(ATHENA.star)), 0.15)).toBe(true);
    expect(chart.marks["sec-projects"].more!.some((p) => near(p, P(starAt(CRAWLER.star)), 0.15))).toBe(true);
    expect(near(chart.marks["sec-contact"].at, P(starAt(HIS_STAR)))).toBe(true);
    // Work's line: from its relay back to home, where it's built
    expect(near(chart.marks["sec-work"].at, P(script.relay.P))).toBe(true);
    expect(chart.marks["sec-work"].line!.at(-1)).toEqual(chart.marks["sec-about"].at);
  });

  it("puts Projects' marks where the world builds Athena, the crawler and the ribbon (hung under the crawler's shaft)", () => {
    const W = layWorld(script, starAt);
    const P = (v: { x: number; y: number; z: number }) => chart.project([v.x, v.y, v.z]);
    expect(near(chart.marks["sec-projects"].at, P(W.ATH.P))).toBe(true);
    expect(near(chart.marks["sec-projects"].more![0]!, P(W.CRW.P))).toBe(true);
    expect(near(chart.marks["sec-projects"].more![1]!, P(W.RIB.C))).toBe(true);
  });
});

describe("where you are", () => {
  it("starts at the sky's centre and ends at his star, out at Contact", () => {
    expect(near(chart.hereAt(0), chart.project([0, 0, 0]))).toBe(true);
    expect(near(chart.hereAt(script.total), chart.marks["sec-contact"].at)).toBe(true);
  });

  it("goes to Work's relay with the camera, and back to home once it's thrown you back in time, while home is built", () => {
    expect(near(chart.hereAt(script.plan.depart.at.hold[0]), chart.project(script.relay.P), 1e-3)).toBe(true);
    for (const q of script.plan.quarters) expect(near(chart.hereAt(q.build[0]), chart.marks["sec-about"].at, 1e-3)).toBe(true);
  });

  it("goes straight on from home to Athena once home's built (never back by the relay), and is at her while she's read", () => {
    const home = chart.marks["sec-about"].at, ath = chart.marks["sec-projects"].at;
    const dx = ath[0] - home[0], dy = ath[1] - home[1], l = Math.hypot(dx, dy);
    for (let t = T.RIDE_END; t <= T.A0; t += 0.1) {
      const [x, y] = chart.hereAt(t);
      // on the line between them, and between its ends
      expect(Math.abs((x - home[0]) * dy - (y - home[1]) * dx) / l).toBeLessThan(1e-9);
      expect(((x - home[0]) * dx + (y - home[1]) * dy) / (l * l)).toBeGreaterThanOrEqual(-1e-9);
      expect(((x - home[0]) * dx + (y - home[1]) * dy) / (l * l)).toBeLessThanOrEqual(1 + 1e-9);
    }
    expect(near(chart.hereAt(T.A0 + 1), ath)).toBe(true);
  });

  it("is at the crawler through its pipeline, and at the ribbon under its shaft while it turns", () => {
    const [crw, rib] = chart.marks["sec-projects"].more!;
    for (const t of [T.C0, T.PIPE_END]) expect(near(chart.hereAt(t), crw!)).toBe(true);
    for (const t of [T.F1, (T.F1 + T.G1) / 2, T.G1]) expect(near(chart.hereAt(t), rib!)).toBe(true);
  });

  it("travels only forwards: the part travelled grows with the film and is all of it at the end", () => {
    let last = -1;
    for (let t = 0; t <= script.total; t += 0.25) {
      const f = chart.travelled(t);
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
    expect(chart.travelled(0)).toBe(0);
    expect(chart.travelled(script.total)).toBeCloseTo(1, 9);
  });

  it("names the section you're in from the scenes", () => {
    expect(chart.sectionAt(0)).toBe("sec-hero");
    expect(chart.sectionAt(3)).toBe("sec-about");
    expect(chart.sectionAt(script.plan.quarters[1]!.build[0])).toBe("sec-work");
    expect(chart.sectionAt(T.A0)).toBe("sec-projects");
    expect(chart.sectionAt(script.total)).toBe("sec-contact");
  });

});

describe("spotNear", () => {
  it("under reduced motion, holds the reading spot whose still is shown: the nearer one, handing over half-way", () => {
    expect(spotNear(5.2, [0, 3.1, 5.1, 9])).toBe(5.1);
    expect(spotNear(6.9, [0, 3.1, 5.1, 9])).toBe(5.1);
    expect(spotNear(7.1, [0, 3.1, 5.1, 9])).toBe(9);
    expect(spotNear(-1, [0.5, 3.1])).toBe(0.5);
  });

  it("lands on a spot scrolled to a hair short of it", () => {
    expect(spotNear(9 - 1e-4, [0, 3.1, 5.1, 9])).toBe(9);
  });
});

describe("arc", () => {
  it("leaves from here and lands there, bowed off the straight line", () => {
    const a: [number, number] = [0, 0], b: [number, number] = [1, 0];
    const pts = arc(a, b);
    expect(near(pts[0]!, a)).toBe(true);
    expect(near(pts.at(-1)!, b)).toBe(true);
    expect(Math.max(...pts.map((p) => Math.abs(p[1])))).toBeGreaterThan(0.1);
  });
});
