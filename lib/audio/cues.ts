/**
 * The voyage's scene changes, as moments in film time, each with the one-shot it plays and the stretch after it (in
 * screens) the sound belongs to: leave it and the sound stops. They're read off the script, so a retimed scene
 * carries its sound with it.
 */
import type { VoyageScript } from "@/lib/voyage/script";
import type { Cue } from "./follow";

/** Every scene change's one-shot: the engine holds each only while the film is near one of its moments. */
export const SCENE_SHOTS = ["dive", "dock", "open", "fairing", "climax", "ribbon", "pullout"];

export function voyageCues(script: Pick<VoyageScript, "scenes" | "blocks" | "plan">): Cue[] {
  const scene = (id: string) => script.scenes.find((s) => s.id === id)!;
  const block = (id: string) => script.blocks.find((b) => b.id === id)!;
  const hero = scene("hero");
  const firstOwn = script.blocks.find((b) => b.id.startsWith("own-"))!;
  const firstStage = script.blocks.find((b) => b.id.startsWith("stage-"))!;
  const cues: Cue[] = [
    // passing his star, late in the dive
    { at: hero.t0 + (hero.t1 - hero.t0) * 0.8, span: 1.2, shot: "dive" },
    // a thump as the relay throws you back to August 2023, at its flash, and as each craft of a breakthrough he built
    // with touches home's hub (a docking call's first 0.36: work.ts, traffic.ts)
    { at: script.plan.flash, span: 0.5, shot: "dock" },
    ...script.plan.quarters.flatMap((q) => q.calls).filter((c) => c.way === "dock").map((c) => ({ at: c.at[0] + 0.36 * (c.at[1] - c.at[0]), span: 0.5, shot: "dock" })),
    // Athena opens a little before her patterns are written
    { at: block("athena-open").tIn[0] - 0.4, span: 1, shot: "open" },
    // the crawler's fairing parts, and the pipeline drops out, before its first stage is read
    { at: firstStage.tIn[0] - 0.3, span: 0.8, shot: "fairing" },
    // the climax lands on the line, before its outcome is read
    { at: block("outcome").tIn[0] - 0.45, span: 1.2, shot: "climax" },
    // the record flips into the ribbon as the ribbon begins
    { at: firstOwn.tIn[0] - 0.35, span: 1.5, shot: "ribbon" },
    { at: scene("contact").t0, span: 2, shot: "pullout" },
  ];
  return cues.sort((a, b) => a.at - b.at);
}
