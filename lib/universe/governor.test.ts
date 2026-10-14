import { describe, expect, it } from "vitest";
import { createGovernor } from "./governor";

type Cost = number | null | ((scale: number) => number);

// a frame whose cost is per pixel: `full` ms at full resolution
const perPixel = (full: number) => (scale: number) => full * scale * scale;

// feeds `n` frames a vsync apart (or `dt` apart), each costing `gpu` ms on the GPU (null: no timer query; a function:
// the cost at the governor's scale)
function run(g: ReturnType<typeof createGovernor>, n: number, gpu: Cost, dt = 16.7, from = { now: 0 }) {
  const changes: number[] = [];
  for (let i = 0; i < n; i++) {
    from.now += dt;
    const s = g.feed({ gpu: typeof gpu === "function" ? gpu(g.scale) : gpu, dt, now: from.now });
    if (s !== null) changes.push(s);
  }
  return changes;
}

describe("the sky's resolution follows what the GPU can hold (a mid-range laptop at 60 fps)", () => {
  it("keeps full resolution while the frame is cheap", () => {
    const g = createGovernor({ dpr: 1.8 });
    expect(run(g, 600, 8)).toEqual([]);
    expect(g.scale).toBe(1);
  });

  it("drops a step within about half a second of the GPU going over budget, and goes on dropping while it stays over", () => {
    const g = createGovernor({ dpr: 1.8 });
    const t = { now: 0 };
    const first = run(g, 40, perPixel(30), 16.7, t);
    expect(first).toHaveLength(1);
    expect(first[0]).toBeLessThan(1);
    const more = run(g, 200, perPixel(30), 16.7, t);
    expect(more.length).toBeGreaterThan(0);
    expect(g.scale).toBeLessThan(first[0]!);
  });

  it("never draws below one device pixel per CSS pixel", () => {
    const g = createGovernor({ dpr: 1.8 });
    run(g, 2000, perPixel(40));
    expect(1.8 * g.scale).toBeCloseTo(1, 9);
    const one = createGovernor({ dpr: 1 });
    expect(run(one, 2000, 40)).toEqual([]);
  });

  it("comes back up once the frame would fit at the finer step, and doesn't see-saw", () => {
    const g = createGovernor({ dpr: 2 });
    const t = { now: 0 };
    run(g, 40, perPixel(16), 16.7, t);
    const low = g.scale;
    expect(low).toBeLessThan(1);
    // costing 16 ms at full, so 16 * low^2 at this step: it fits here, would go over again at full, so it stays
    const cost = 16 * low * low;
    expect(run(g, 1200, cost, 16.7, t)).toEqual([]);
    // the film moves on to something cheap: back up
    expect(run(g, 1200, 4, 16.7, t).at(-1)).toBe(1);
  });

  it("without a GPU timer, reads missed frames instead", () => {
    const g = createGovernor({ dpr: 2 });
    const t = { now: 0 };
    expect(run(g, 600, null, 16.7, t)).toEqual([]);
    expect(run(g, 60, null, 33.4, t).length).toBeGreaterThan(0);
    expect(g.scale).toBeLessThan(1);
  });

  it("without a GPU timer, on a 120 Hz display drawn at 60 fps (lib/film/pace.ts), a frame on its turn isn't missed and one a display frame late is", () => {
    const g = createGovernor({ dpr: 2 });
    const t = { now: 0 };
    // its first half second drawn every display frame, before the display was measured
    run(g, 30, null, 1000 / 120, t);
    expect(run(g, 600, null, 1000 / 60, t)).toEqual([]);
    expect(run(g, 60, null, 25, t)).toEqual([0.85]);
  });

  it("without a GPU timer, a display that only runs at 30 fps (Low Power Mode) isn't read as missing frames", () => {
    const g = createGovernor({ dpr: 2 });
    expect(run(g, 600, null, 33.4)).toEqual([]);
    expect(g.scale).toBe(1);
  });

  it("without a GPU timer, comes back up through a run of windows that each miss one frame", () => {
    const g = createGovernor({ dpr: 2 });
    const t = { now: 0 };
    run(g, 600, null, 16.7, t);
    expect(run(g, 40, null, 33.4, t)).toEqual([0.85]);
    const changes: number[] = [];
    for (let i = 0; i < 40; i++) changes.push(...run(g, 29, null, 16.7, t), ...run(g, 1, null, 25, t));
    expect(changes).toEqual([1]);
  });

  it("takes back a step down that didn't make the frame cheaper, and doesn't try it again", () => {
    const g = createGovernor({ dpr: 2 });
    const t = { now: 0 };
    // the cost isn't in the pixels (a vertex-bound scene): fewer of them only soften the sky
    expect(run(g, 40, 22, 16.7, t)).toEqual([0.85]);
    expect(run(g, 1200, 22, 16.7, t)).toEqual([1]);
    expect(g.scale).toBe(1);
  });

  it("changes nothing while held (a warp is drawing from the frame's own pixels)", () => {
    const g = createGovernor({ dpr: 2 });
    g.hold(0, 3000);
    expect(run(g, 150, 30)).toEqual([]);
  });

  it("ignores a stall (a hidden tab, a long task) rather than reading it as a slow GPU", () => {
    const g = createGovernor({ dpr: 2 });
    expect(run(g, 50, null, 400)).toEqual([]);
  });
});

describe("at its floor and still missing frames, the governor lowers the visit's quality", () => {
  // a ladder of `n` levels below the start: `lower` takes one while there is one
  const ladder = (n: number) => {
    const at: number[] = [];
    return { at, lower: () => (at.length < n ? (at.push(at.length), true) : false) };
  };

  it("not while a coarser pixel ratio can still help", () => {
    const l = ladder(2);
    const g = createGovernor({ dpr: 2, lower: l.lower });
    const t = { now: 0 };
    run(g, 600, null, 16.7, t);
    run(g, 40, null, 33.4, t);
    expect(g.scale).toBeLessThan(1);
    expect(l.at).toEqual([]);
  });

  it("once a second or two of missed frames at the floor says pixels aren't the cost, one level at a time, then no more", () => {
    const l = ladder(2);
    const g = createGovernor({ dpr: 1, lower: l.lower });
    const t = { now: 0 };
    run(g, 600, null, 16.7, t);
    expect(run(g, 90, null, 33.4, t)).toEqual([]);
    expect(l.at).toEqual([]);
    run(g, 60, null, 33.4, t);
    expect(l.at).toEqual([0]);
    run(g, 2000, null, 33.4, t);
    expect(l.at).toEqual([0, 1]);
  });

  it("with the GPU timer, only when the GPU is over budget and frames are missed too", () => {
    const keeping = ladder(2);
    const g = createGovernor({ dpr: 1, lower: keeping.lower });
    run(g, 2000, 30, 16.7);
    expect(keeping.at).toEqual([]);
    const missing = ladder(2);
    const h = createGovernor({ dpr: 1, lower: missing.lower });
    const t = { now: 0 };
    run(h, 600, 8, 16.7, t);
    run(h, 2000, 30, 33.4, t);
    expect(missing.at).toEqual([0, 1]);
  });

  it("never while held, nor through a stall", () => {
    const l = ladder(2);
    const g = createGovernor({ dpr: 1, lower: l.lower });
    g.hold(0, 60_000);
    run(g, 1000, null, 33.4);
    run(g, 200, null, 400, { now: 60_000 });
    expect(l.at).toEqual([]);
  });

  it("a frame rate that recovers between bad patches doesn't add up to a step", () => {
    const l = ladder(2);
    const g = createGovernor({ dpr: 1, lower: l.lower });
    const t = { now: 0 };
    run(g, 600, null, 16.7, t);
    for (let i = 0; i < 20; i++) { run(g, 90, null, 33.4, t); run(g, 60, null, 16.7, t); }
    expect(l.at).toEqual([]);
  });
});
