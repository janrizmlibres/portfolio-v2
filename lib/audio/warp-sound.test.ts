import { describe, expect, it } from "vitest";
import { planWarp, type WarpPlan } from "@/lib/film/warp-plan";
import { followWarp, WARP_PEAK, warpRise } from "./warp-sound";

type Ev = { phase: "start" | "travel" | "arrive" | "land" | "end" | "hurry"; plan: WarpPlan | null };

describe("warpRise: the warp's riser, timed so its swell peaks as the page jumps", () => {
  it("waits on a question's longer warp, so the swell still lands on the jump", () => {
    const p = planWarp({ kind: "question", fromHero: false, flare: true });
    const r = warpRise(p);
    expect(r.at + WARP_PEAK - r.from).toBeCloseTo(p.jump);
    expect(r.at).toBeGreaterThan(1);
    expect(r.from).toBe(0);
  });

  it("starts within a link's first second, so its swell lands on the jump", () => {
    const p = planWarp({ kind: "link", fromHero: false, flare: false });
    const r = warpRise(p);
    expect(r.at).toBeLessThan(1);
    expect(r.from).toBe(0);
    expect(r.at + WARP_PEAK - r.from).toBeCloseTo(p.jump);
  });

  it("starts part way in when the jump comes sooner than the swell (a warp tuned short)", () => {
    const p = planWarp({ kind: "link", fromHero: true, flare: false, seconds: 4 });
    const r = warpRise(p);
    expect(r.at).toBe(0);
    expect(r.from).toBeCloseTo(WARP_PEAK - p.jump);
  });
});

describe("followWarp: the warp's sound off its legs", () => {
  function rig() {
    const fns = new Set<(e: Ev) => void>();
    const calls: Array<{ name: string; at?: number; level?: number; from?: number; stopped: boolean }> = [];
    const sound = {
      voice: { ctx: { currentTime: 100 } },
      play(name: string, at?: number, level?: number, from?: number) {
        const c = { name, at, level, from, stopped: false };
        calls.push(c);
        return { stop: () => void (c.stopped = true) };
      },
    };
    const off = followWarp((fn) => (fns.add(fn as (e: Ev) => void), () => fns.delete(fn as (e: Ev) => void)), () => sound);
    const tell = (e: Ev) => fns.forEach((fn) => fn(e));
    return { calls, tell, off, fns };
  }

  it("schedules the riser as the warp sets out and plays the arrival as the destination opens", () => {
    const { calls, tell } = rig();
    const plan = planWarp({ kind: "question", fromHero: false, flare: true });
    tell({ phase: "start", plan });
    expect(calls[0]).toMatchObject({ name: "warp" });
    expect(calls[0]!.at).toBeCloseTo(100 + warpRise(plan).at);
    tell({ phase: "arrive", plan });
    expect(calls[1]).toMatchObject({ name: "warp-arrive" });
  });

  it("stops the riser when the warp is hurried", () => {
    const { calls, tell } = rig();
    tell({ phase: "start", plan: planWarp({ kind: "link", fromHero: false, flare: false }) });
    tell({ phase: "hurry", plan: null });
    expect(calls[0]!.stopped).toBe(true);
  });

  it("follows the crossfade under reduced motion: no riser, a softer arrival as the page changes", () => {
    const { calls, tell } = rig();
    tell({ phase: "start", plan: null });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.name).toBe("warp-arrive");
    expect(calls[0]!.level).toBeLessThan(1);
    expect(calls[0]!.at).toBeGreaterThan(100);
  });

  it("stops listening when torn down", () => {
    const { off, fns } = rig();
    off();
    expect(fns.size).toBe(0);
  });
});
