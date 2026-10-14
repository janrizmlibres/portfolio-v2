import { describe, expect, it } from "vitest";
import { cullAthena, flungMoon, MOON_THROW, slabSize, staggered } from "./athena-cull";

const seen = { vis: 1, streamVis: 0, bodyPx: 160, bodyInFrame: true, ringInFrame: true, streamInFrame: false, moonsShown: true };

describe("what of Athena is drawn this frame", () => {
  it("draws her body, ring and shadow while she's read", () => {
    const c = cullAthena(seen);
    expect(c).toMatchObject({ any: true, body: true, ring: true, shadow: true, slabs: false });
    expect(c.fade).toBeCloseTo(1, 6);
  });

  it("skips her body, ring and shadow pass while she's out of frame, though her scene still holds her", () => {
    const c = cullAthena({ ...seen, bodyInFrame: false, ringInFrame: false, moonsShown: false });
    expect(c).toMatchObject({ any: false, body: false, ring: false, shadow: false });
  });

  it("keeps the ring when only the ring reaches into the frame, without her shadow pass", () => {
    const c = cullAthena({ ...seen, bodyInFrame: false });
    expect(c).toMatchObject({ body: false, ring: true, shadow: false, any: true });
  });

  it("fades her by her size on screen, as every body does under ~16 px, and drops her below 5", () => {
    expect(cullAthena({ ...seen, bodyPx: 20 }).fade).toBeCloseTo(1, 6);
    const small = cullAthena({ ...seen, bodyPx: 5 });
    expect(small.fade).toBeGreaterThan(0);
    expect(small.fade).toBeLessThan(1);
    expect(cullAthena({ ...seen, bodyPx: 2, moonsShown: false })).toMatchObject({ body: false, ring: false, any: false });
  });

  it("renders her shadow map only while her disc is big enough for its shading to read", () => {
    expect(cullAthena({ ...seen, bodyPx: 40 }).shadow).toBe(true);
    expect(cullAthena({ ...seen, bodyPx: 7 }).shadow).toBe(false);
  });

  it("draws the stream's records only while the stream shows and is in frame", () => {
    expect(cullAthena({ ...seen, streamVis: 1, streamInFrame: true }).slabs).toBe(true);
    expect(cullAthena({ ...seen, streamVis: 1, streamInFrame: false }).slabs).toBe(false);
    expect(cullAthena({ ...seen, streamVis: 0, streamInFrame: true }).slabs).toBe(false);
  });

  it("draws nothing once her scene has let her go", () => {
    expect(cullAthena({ ...seen, vis: 0, streamVis: 0, moonsShown: false }).any).toBe(false);
  });
});

describe("the fling, on her moons", () => {
  it("leaves a moon on its orbit at rest", () => {
    expect(flungMoon([0.03, 0, 0.01], 0)).toEqual([0.03, 0, 0.01]);
  });

  it("throws a moon straight outwards from her, further the harder the scroll", () => {
    const rel: [number, number, number] = [0.02, 0.01, -0.02];
    const half = flungMoon(rel, 0.5), full = flungMoon(rel, 1);
    const len = (v: number[]) => Math.hypot(...v);
    const dir = (v: number[]) => v.map((x) => x / len(v));
    expect(dir(full)[0]).toBeCloseTo(dir(rel)[0]!, 9);
    expect(dir(full)[2]).toBeCloseTo(dir(rel)[2]!, 9);
    expect(len(half)).toBeGreaterThan(len(rel));
    expect(len(full)).toBeCloseTo(len(rel) * (1 + MOON_THROW.out), 9);
  });

  it("reads the fling a moment late for each moon after the first, so they leave one after another", () => {
    const past = (d: number) => (d === 0 ? 0.9 : 0.2);
    const f = { feel: { lag: 0.2 }, at: past };
    expect(staggered(f, 0.9, 0, 2)).toBe(0.9);
    expect(staggered(f, 0.9, 1, 2)).toBe(0.2);
    // without a staggered feel, every moon reads it as it is
    expect(staggered(undefined, 0.7, 1, 2)).toBe(0.7);
    expect(staggered({ feel: {}, at: past }, 0.7, 1, 2)).toBe(0.7);
  });
});

describe("a record's size along the stream", () => {
  it("is drawn larger along the upstream reach, near the crawler's port, so it reads as a record there", () => {
    expect(slabSize(0.1)).toBeGreaterThan(1.8);
    expect(slabSize(0.4)).toBeGreaterThan(1);
  });

  it("is unchanged on the downstream reach where it joins her", () => {
    expect(slabSize(0.7)).toBe(1);
    expect(slabSize(0.95)).toBe(1);
  });
});
