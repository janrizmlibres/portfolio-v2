import { describe, expect, it } from "vitest";
import { createCount, FIRST_SCENE, MILESTONES, statusAt } from "./count";

describe("the loader's count: the real load, never backwards", () => {
  it("starts with the page itself loaded, and nothing more", () => {
    const c = createCount();
    expect(c.target()).toBeCloseTo(1 / MILESTONES.length);
    expect(c.shown()).toBe(0);
  });

  it("moves toward what has really loaded and never past it", () => {
    const c = createCount();
    for (let i = 0; i < 100; i++) c.step(0.1);
    expect(c.shown()).toBeCloseTo(1 / MILESTONES.length);
    c.mark("start");
    c.mark("stars");
    for (let i = 0; i < 100; i++) c.step(0.1);
    expect(c.shown()).toBeCloseTo(3 / MILESTONES.length);
    expect(c.loaded()).toBe(false);
  });

  it("goes at most a full count in 0.8 s, however fast the load is", () => {
    const c = createCount();
    MILESTONES.forEach((m) => c.mark(m));
    c.step(0.4);
    expect(c.shown()).toBeCloseTo(0.5);
    c.step(0.2);
    expect(c.shown()).toBeCloseTo(0.75);
    c.step(0.4);
    expect(c.shown()).toBe(1);
    expect(c.loaded()).toBe(true);
  });

  it("never goes backwards: a milestone marked twice, or a long frame, counts once", () => {
    const c = createCount();
    c.mark("stars");
    c.mark("stars");
    const seen: number[] = [];
    for (const dt of [0.05, 2, 0.01, 0, -1, 0.3]) seen.push(c.step(dt));
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]!);
    expect(c.shown()).toBeCloseTo(2 / MILESTONES.length);
  });

  it("ignores a name that isn't a milestone", () => {
    const c = createCount();
    c.mark("nonsense" as never);
    expect(c.target()).toBeCloseTo(1 / MILESTONES.length);
  });

  it("is loaded only once every milestone is in and the count has reached it", () => {
    const c = createCount();
    MILESTONES.slice(0, -1).forEach((m) => c.mark(m));
    for (let i = 0; i < 20; i++) c.step(0.1);
    expect(c.loaded()).toBe(false);
    c.mark(MILESTONES[MILESTONES.length - 1]!);
    expect(c.loaded()).toBe(false);
    c.step(1);
    expect(c.loaded()).toBe(true);
  });
});

describe("what a screen reader hears: a polite status every 25 %", () => {
  it("speaks at 0, 25, 50 and 75, and says Loaded at 100", () => {
    let q = -1;
    const said: string[] = [];
    for (let n = 0; n <= 100; n++) {
      const s = statusAt(n, q);
      if (s) {
        said.push(s.say);
        q = s.quarter;
      }
    }
    expect(said).toEqual(["Loading, 0 percent", "Loading, 25 percent", "Loading, 50 percent", "Loading, 75 percent", "Loaded"]);
  });
});

describe("the loader waits on the whole voyage", () => {
  it("holds the count short of 100 until every scene past the first, and the warp, is built and warmed", () => {
    const later = ["relay", "traffic", "athena", "crawler", "pipeline", "ribbon", "warp"] as const;
    expect(MILESTONES).toEqual(expect.arrayContaining([...later]));
    for (const skip of later) {
      const c = createCount();
      MILESTONES.filter((m) => m !== skip).forEach((m) => c.mark(m));
      for (let i = 0; i < 20; i++) c.step(0.1);
      expect([skip, c.loaded()]).toEqual([skip, false]);
    }
  });
});

describe("the loader's cap: the button shows at 15 s of the loader once the first scene is in", () => {
  // the loader's time is frame time in steps; quarters add up exactly
  const run = (c: ReturnType<typeof createCount>, s: number) => {
    for (let i = 0; i < s * 4; i++) c.step(0.25);
  };

  it("waits on the score's hero layers once the 3D is all in, so none decodes after the loader", () => {
    const c = createCount();
    MILESTONES.filter((m) => m !== "sound").forEach((m) => c.mark(m));
    run(c, 14);
    expect(c.loaded()).toBe(false);
    c.mark("sound");
    c.step(1);
    expect(c.loaded()).toBe(true);
  });

  it("counts in whatever past the first scene is still missing at 15 s (it's built after the wake), and not before", () => {
    const c = createCount();
    FIRST_SCENE.forEach((m) => c.mark(m));
    c.mark("relay");
    run(c, 14.75);
    expect(c.missing()).toEqual(["traffic", "athena", "crawler", "pipeline", "ribbon", "warp", "sound"]);
    expect(c.loaded()).toBe(false);
    run(c, 0.25);
    expect(c.missing()).toEqual([]);
    c.step(0.8);
    expect(c.loaded()).toBe(true);
  });

  it("never with the first scene still missing: that gives way to the plain page instead (gate.ts)", () => {
    const c = createCount();
    FIRST_SCENE.filter((m) => m !== "warm").forEach((m) => c.mark(m));
    run(c, 60);
    expect(c.missing()).toEqual(["warm", "relay", "traffic", "athena", "crawler", "pipeline", "ribbon", "warp", "sound"]);
    expect(c.loaded()).toBe(false);
  });
});
