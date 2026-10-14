/**
 * The warp's sound, played off its legs (`onWarp` in lib/film/warp.ts): a riser as he sets out, timed so its swell
 * peaks as the page jumps under the light (a question's warp runs 7 s against a link's 4.8, so its riser waits), cut
 * short if the warp is hurried; and the white hole's boom and chord as the destination opens. Under reduced motion the
 * warp is a crossfade, and its sound follows it: no riser, a softer arrival as the page changes.
 */
import type { WarpEvent } from "@/lib/film/warp";
import type { WarpPlan } from "@/lib/film/warp-plan";

/** How far into the riser (`warp`) its swell peaks, in seconds. */
export const WARP_PEAK = 3.3;
/** Under the crossfade: when the page changes, and how soft the arrival is. */
const CROSSFADE_JUMP = 0.25;
const CROSSFADE_LEVEL = 0.5;

/** When the riser starts (seconds after the warp sets out) and how far into it, so its peak lands on the jump. */
export function warpRise(plan: WarpPlan) {
  return { at: Math.max(0, plan.jump - WARP_PEAK), from: Math.max(0, WARP_PEAK - plan.jump) };
}

type Engine = {
  play: (name: string, at?: number, level?: number, from?: number) => { stop: () => void } | undefined;
  voice: { ctx: { currentTime: number } };
};

/** Plays every warp's sound; returns the teardown. */
export function followWarp(onWarp: (fn: (e: Pick<WarpEvent, "phase" | "plan">) => void) => () => void, sound: () => Engine | null) {
  let riser: { stop: () => void } | undefined;
  return onWarp(({ phase, plan }) => {
    const s = sound();
    if (!s) return;
    const now = s.voice.ctx.currentTime;
    if (phase === "start") {
      if (!plan) return void s.play("warp-arrive", now + CROSSFADE_JUMP, CROSSFADE_LEVEL);
      const r = warpRise(plan);
      riser = s.play("warp", now + r.at, 1, r.from);
    } else if (phase === "hurry") {
      riser?.stop();
      riser = undefined;
    } else if (phase === "arrive") {
      s.play("warp-arrive");
    } else if (phase === "end") {
      riser = undefined;
    }
  });
}
