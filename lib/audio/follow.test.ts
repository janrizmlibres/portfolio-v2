import { describe, expect, it } from "vitest";
import { createCuePlayer, createSceneHolder, createSpeedGauge, cuesCrossed, sceneAt } from "./follow";

const SCENES = [
  { id: "hero", sec: "sec-hero", t0: 0, t1: 2.2 },
  { id: "home", sec: "sec-about", t0: 2.2, t1: 3.4 },
  { id: "athena", sec: "sec-projects", t0: 20, t1: 23 },
  { id: "recap", sec: "sec-projects", t0: 19, t1: 20.5 },
].sort((a, b) => a.t0 - b.t0);

describe("sceneAt: the scene the film is in", () => {
  it("is the last scene to have started", () => {
    expect(sceneAt(SCENES, 0)!.id).toBe("hero");
    expect(sceneAt(SCENES, 2.2)!.id).toBe("home");
    expect(sceneAt(SCENES, 19.5)!.id).toBe("recap");
    expect(sceneAt(SCENES, 20.2)!.id).toBe("athena");
  });

  it("is the first scene before the film starts", () => {
    expect(sceneAt(SCENES, -1)!.id).toBe("hero");
  });
});

describe("the speed gauge: how fast the film moves, 0–1, sent only when it has moved enough", () => {
  /** steps the gauge at 60 fps for `secs` at `rate` screens a second, returning what it sent */
  function run(g: ReturnType<typeof createSpeedGauge>, from: number, rate: number, secs: number, at: number) {
    const out: number[] = [];
    let t = from;
    for (let i = 0; i < secs * 60; i++) {
      t += rate / 60;
      at += 1000 / 60;
      const v = g.step(t, at);
      if (v !== null) out.push(v);
    }
    return { out, t, at };
  }

  it("reads still as 0 and sends nothing", () => {
    const g = createSpeedGauge();
    expect(run(g, 0, 0, 1, 0).out).toEqual([]);
  });

  it("reads 2.5 screens a second or more as full speed, in either direction", () => {
    expect(run(createSpeedGauge(), 0, 2.5, 1, 0).out.at(-1)).toBeCloseTo(1, 1);
    expect(run(createSpeedGauge(), 10, -4, 1, 0).out.at(-1)).toBe(1);
  });

  it("reads a steady pace as a steady speed, sent once it settles", () => {
    const g = createSpeedGauge();
    const { out } = run(g, 0, 1, 2, 0);
    expect(out.at(-1)).toBeCloseTo(0.4, 1);
    // nothing more is sent while the pace holds
    expect(run(g, 2, 1, 1, 2000).out).toEqual([]);
  });

  it("sends a return to stillness", () => {
    const g = createSpeedGauge();
    const a = run(g, 0, 2.5, 1, 0);
    const b = run(g, a.t, 0, 1, a.at);
    expect(b.out.at(-1)).toBe(0);
  });
});

describe("cues: a scene change sounds as the film crosses its moment", () => {
  const CUES = [
    { at: 1.4, shot: "dive" },
    { at: 6.2, shot: "peel" },
    { at: 9.1, shot: "dock" },
    { at: 9.6, shot: "dock" },
  ];

  it("fires each cue the film crosses going forward, in order", () => {
    expect(cuesCrossed(CUES, 1.0, 1.5).map((c) => c.shot)).toEqual(["dive"]);
    expect(cuesCrossed(CUES, 9.0, 9.7).map((c) => c.shot)).toEqual(["dock", "dock"]);
  });

  it("fires nothing while the film holds, or before it reaches a cue", () => {
    expect(cuesCrossed(CUES, 1.5, 1.5).map((c) => c.shot)).toEqual([]);
    expect(cuesCrossed(CUES, 2, 6.1).map((c) => c.shot)).toEqual([]);
  });

  it("fires on the frame that lands on a cue, and not again on the next", () => {
    expect(cuesCrossed(CUES, 6.1, 6.2).map((c) => c.shot)).toEqual(["peel"]);
    expect(cuesCrossed(CUES, 6.2, 6.3).map((c) => c.shot)).toEqual([]);
  });

  it("stays quiet going back: an arrival sounds when it's arrived at", () => {
    expect(cuesCrossed(CUES, 7, 5).map((c) => c.shot)).toEqual([]);
  });

  it("stays quiet through a jump (a deep link, a replay), which crosses moments it never shows", () => {
    expect(cuesCrossed(CUES, 0, 9.7).map((c) => c.shot)).toEqual([]);
  });
});

describe("a scene change's sound belongs to its stretch of the film", () => {
  const CUES = [
    { at: 2, span: 1, shot: "dive" },
    { at: 5, span: 0.5, shot: "dock" },
  ];
  function setup() {
    const log: string[] = [];
    const play = (shot: string) => {
      log.push(`play ${shot}`);
      return { stop: () => log.push(`stop ${shot}`) };
    };
    return { log, player: createCuePlayer(CUES, play) };
  }

  it("plays as its moment is reached, and lets it ring while the film stays in its stretch", () => {
    const { log, player } = setup();
    player.step(1.9, 2.1);
    player.step(2.1, 2.8);
    expect(log).toEqual(["play dive"]);
  });

  it("stops it once the film moves past its stretch, so a fast scroll cuts it short", () => {
    const { log, player } = setup();
    player.step(1.9, 2.1);
    player.step(2.1, 3.2);
    expect(log).toEqual(["play dive", "stop dive"]);
  });

  it("stops it when the film goes back before its moment", () => {
    const { log, player } = setup();
    player.step(1.9, 2.1);
    player.step(2.1, 1.7);
    expect(log).toEqual(["play dive", "stop dive"]);
  });

  it("cuts the last one as the next plays when a fast scroll crosses both", () => {
    const { log, player } = setup();
    player.step(1.9, 2.1);
    player.step(2.1, 4.0);
    player.step(4.0, 5.1);
    expect(log).toEqual(["play dive", "stop dive", "play dock"]);
  });

  it("stops everything on a jump", () => {
    const { log, player } = setup();
    player.step(1.9, 2.1);
    player.step(2.1, 40);
    expect(log).toEqual(["play dive", "stop dive"]);
  });
});

describe("the scene holder: which scene changes' sounds the engine holds, sent only when that changes", () => {
  const cues = [
    { at: 10, span: 1, shot: "dock" },
    { at: 30, span: 2, shot: "climax" },
  ];

  it("sends the first set, then only changes", () => {
    const h = createSceneHolder(cues);
    expect(h.step(0)).toEqual([]);
    expect(h.step(0.5)).toBeNull();
    expect(h.step(9)).toEqual(["dock"]);
    expect(h.step(10.5)).toBeNull();
    expect(h.step(13)).toEqual([]);
    expect(h.step(29)).toEqual(["climax"]);
  });

  it("sends again for an engine that has just arrived", () => {
    const h = createSceneHolder(cues);
    expect(h.step(9)).toEqual(["dock"]);
    h.reset();
    expect(h.step(9)).toEqual(["dock"]);
  });
});
