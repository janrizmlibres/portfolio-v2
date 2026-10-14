import { describe, expect, it } from "vitest";
import { voyageScript } from "@/lib/voyage/script";
import { SCENE_SHOTS, voyageCues } from "./cues";
import shotManifest from "./shots.json";

describe("the voyage's cues: each scene change's moment, from the script", () => {
  const script = voyageScript();
  const cues = voyageCues(script);
  const at = (shot: string) => cues.filter((c) => c.shot === shot).map((c) => c.at);
  const scene = (id: string) => script.scenes.find((s) => s.id === id)!;

  it("sounds every moment the plan names, in film order", () => {
    expect(new Set(cues.map((c) => c.shot))).toEqual(new Set(["dive", "dock", "open", "fairing", "climax", "ribbon", "pullout"]));
    // the engine holds these only near their moments
    expect(new Set(SCENE_SHOTS)).toEqual(new Set(cues.map((c) => c.shot)));
    for (let i = 1; i < cues.length; i++) expect(cues[i]!.at).toBeGreaterThanOrEqual(cues[i - 1]!.at);
  });

  it("thumps as the relay throws you back, and as each craft of a breakthrough he built with touches home's hub", () => {
    const docks = script.plan.quarters.flatMap((q) => q.calls).filter((c) => c.way === "dock");
    expect(at("dock")).toEqual([script.plan.flash, ...docks.map((c) => c.at[0] + 0.36 * (c.at[1] - c.at[0]))]);
  });

  it("has a recording for every scene change's sound, in the manifest the page loads", () => {
    for (const shot of SCENE_SHOTS) expect([shot, shot in shotManifest]).toEqual([shot, true]);
  });

  it("lets each breakthrough's card come in quietly (Janriz, 2026-10-11, of a radio blip: \"remove the blips\")", () => {
    expect(at("blip")).toEqual([]);
  });

  it("parts the fairing before the first stage is read; nothing slides", () => {
    expect(at("slide")).toEqual([]);
    const firstStage = script.blocks.find((b) => b.id.startsWith("stage-"))!;
    expect(at("fairing")[0]).toBeLessThan(firstStage.tIn[0]);
  });

  it("dives inside the hero, and pulls out as Contact starts; nothing peels any more (Around home goes straight to Work)", () => {
    const [dive] = at("dive");
    expect(dive).toBeGreaterThan(scene("hero").t0);
    expect(dive).toBeLessThan(scene("hero").t1);
    expect(at("peel")).toEqual([]);
    expect(at("pullout")).toEqual([scene("contact").t0]);
  });

  it("strikes the climax before its outcome is read, and opens Athena before her patterns are", () => {
    const outcome = script.blocks.find((b) => b.id === "outcome")!;
    const open = script.blocks.find((b) => b.id === "athena-open")!;
    expect(at("climax")[0]).toBeLessThan(outcome.tIn[0]);
    expect(at("open")[0]).toBeLessThan(open.tIn[0]);
  });
});
