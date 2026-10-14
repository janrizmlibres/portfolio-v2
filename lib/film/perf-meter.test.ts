import { describe, expect, it } from "vitest";
import { createPerfMeter, type Sample } from "./perf-meter";

const base: Sample = { at: 0, t: 0, phase: "film", calls: 100, tris: 1000, programs: 40, textures: 10, geometries: 50, dpr: 2, quality: "high", idle: 0 };
/** `n` steady frames `every` ms apart from `from`, then the frame given */
function feedSteady(meter: ReturnType<typeof createPerfMeter>, n: number, every: number, from = 0) {
  for (let i = 1; i <= n; i++) meter.feed({ ...base, at: from + i * every });
  return from + n * every;
}

describe("the perf meter", () => {
  it("counts a frame 1.5 display intervals late as a hitch, with the intervals it missed", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 16.67);
    expect(m.feed({ ...base, at: at + 50, t: 2.4 })).toEqual({ at: at + 50, t: 2.4, dt: 50, missed: 2, phase: "film", flags: [] });
    expect(m.feed({ ...base, at: at + 50 + 16.67 })).toBeNull();
    expect(m.totals()).toEqual({ frames: 61, missed: 2, cadence: 16.67 });
  });

  it("reads the display's own interval, so a 120 Hz screen's 16 ms frame is a hitch", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 8.33);
    expect(m.feed({ ...base, at: at + 16.66 })?.missed).toBe(1);
  });

  it("flags what changed in the late frame: a shader compiled, a texture and geometry uploaded, the pixel ratio and the level", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 16.67);
    const h = m.feed({ ...base, at: at + 70, programs: 42, textures: 11, geometries: 53, dpr: 1.5, quality: "mid", idle: 31.4 });
    expect(h?.flags).toEqual(["shader+2", "texture+1", "geometry+3", "dpr 2→1.5", "quality high→mid", "idle 31ms"]);
  });

  it("names what loaded in the late frame: a file arriving, audio decoding", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 16.67);
    expect(m.feed({ ...base, at: at + 40, io: ["fetch glb", "fetch glb", "decode audio"] })?.flags).toEqual(["fetch glb", "decode audio"]);
  });

  it("leaves a stall out (a hidden tab's first frame back)", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 16.67);
    expect(m.feed({ ...base, at: at + 5000 })).toBeNull();
    expect(m.totals().missed).toBe(0);
  });

  it("attaches a long animation frame's scripts to the hitch it overlaps", () => {
    const m = createPerfMeter();
    const at = feedSteady(m, 60, 16.67);
    const h = m.feed({ ...base, at: at + 80 })!;
    m.long({ start: at + 5, duration: 70, scripts: ["idle-callback warmUp 52ms"] });
    expect(h.flags).toEqual(["long 70ms: idle-callback warmUp 52ms"]);
  });

  it("keeps the latest hitches, newest last", () => {
    const m = createPerfMeter({ keep: 2 });
    let at = feedSteady(m, 60, 16.67);
    for (const t of [1, 2, 3]) {
      at += 60;
      m.feed({ ...base, at, t });
      at = feedSteady(m, 5, 16.67, at);
    }
    expect(m.hitches().map((h) => h.t)).toEqual([2, 3]);
  });
});
