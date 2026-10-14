import { describe, expect, it } from "vitest";
import { EMOTES } from "@/lib/tycho/rig";
import { SCENE_SHOTS } from "./cues";
import { SCALE } from "./hand-sound";
import { emoteSound } from "./hooks";
import shots from "./shots.json";

describe("every sound the page plays by name has a file", () => {
  const have = new Set(Object.keys(shots));

  it("each of Tycho's emotes, by its own name (emote-allGood, not emote-allgood)", () => {
    for (const e of EMOTES) expect(have, emoteSound(e)).toContain(emoteSound(e));
    expect(emoteSound("allGood")).toBe("emote-allGood");
  });

  it("the UI's ticks, the toggle, the wake's relay, the warp and every scene change", () => {
    for (const n of ["ui-hover", "ui-click", "ui-open", "ui-fold", "toggle", "relay", "warp", "warp-arrive", ...SCENE_SHOTS]) expect(have, n).toContain(n);
  });

  it("the instrument's notes in both voices, and Tycho's chirp grains", () => {
    for (const n of SCALE) for (const v of ["celesta", "bell"]) expect(have).toContain(`inst-${v}-${n}`);
    for (const g of [1, 2, 3, 4]) expect(have).toContain(`chirp${g}`);
  });
});
