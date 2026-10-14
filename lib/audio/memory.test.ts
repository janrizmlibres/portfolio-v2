import { describe, expect, it } from "vitest";
import { voyageScript } from "@/lib/voyage/script";
import { voyageCues } from "./cues";
import { AHEAD, BEHIND, heldScenes, peakDecoded, shotChannels } from "./memory";
import shotManifest from "./shots.json";
import stemManifest from "./stems.json";

describe("shotChannels: which file a one-shot decodes from", () => {
  it("is mono for the instrument's notes and the small sounds, on every tier", () => {
    for (const n of ["inst-celesta-74", "inst-bell-98", "chirp2", "emote-allGood", "ui-hover", "ui-open", "relay", "toggle"]) expect(shotChannels(n, false)).toBe("mono");
  });

  it("keeps the scene changes and the warp in stereo on a desktop, and makes everything mono on a phone", () => {
    for (const n of ["dive", "climax", "pullout", "warp", "warp-arrive"]) {
      expect(shotChannels(n, false)).toBe("stereo");
      expect(shotChannels(n, true)).toBe("mono");
    }
  });
});

describe("heldScenes: the scene changes' sounds to hold where the film is", () => {
  const cues = [
    { at: 10, span: 1, shot: "dock" },
    { at: 14, span: 0.5, shot: "dock" },
    { at: 16, span: 2, shot: "climax" },
  ];

  it("holds a sound from a few screens before its moment to just after its stretch", () => {
    expect(heldScenes(cues, 10 - AHEAD - 0.01)).toEqual([]);
    expect(heldScenes(cues, 10 - AHEAD)).toEqual(["dock"]);
    expect(heldScenes(cues, 14)).toEqual(["climax", "dock"]);
    expect(heldScenes(cues, 14 + 0.5 + BEHIND)).toEqual(["climax", "dock"]);
    expect(heldScenes(cues, 14 + 0.5 + BEHIND + 0.01)).toEqual(["climax"]);
    expect(heldScenes(cues, 16 + 2 + BEHIND + 0.01)).toEqual([]);
  });

  it("names a sound used at several moments once", () => {
    expect(heldScenes(cues, 11)).toEqual(["dock"]);
  });
});

describe("the budget: the most the sound ever holds decoded, from the manifests the page loads", () => {
  const cues = voyageCues(voyageScript());
  const MB = 1048576;

  it("adds up the score, the sounds held all along, the instrument's notes and the busiest stretch of scene changes", () => {
    const stems = { stems: { bed: { seconds: 10 }, thinking: { seconds: 5 } } };
    const shots = { relay: { seconds: 1 }, warp: { seconds: 2 }, "inst-bell-74": { seconds: 1 }, dive: { seconds: 3 }, peel: { seconds: 4 } };
    const two = [{ at: 1, span: 1, shot: "dive" }, { at: 2, span: 1, shot: "peel" }];
    const p = peakDecoded({ stems, shots, cues: two, phone: false, rate: 1000 });
    // 32-bit floats: the stems stereo, the relay and the note mono, the warp and the scene changes stereo
    expect(p.stems).toBe(15 * 2 * 4000);
    expect(p.thinking).toBe(5 * 2 * 4000);
    expect(p.always).toBe((1 + 2 * 2) * 4000);
    expect(p.notes).toBe(1 * 4000);
    expect(p.scenes).toBe((3 + 4) * 2 * 4000);
    expect(p.total).toBe(p.stems + p.always + p.notes + p.scenes);
    expect(peakDecoded({ stems, shots, cues: two, phone: true, rate: 1000 }).stems).toBe(15 * 4000);
  });

  it("keeps inside 72 MB on a desktop and 41 MB on a phone at 48 kHz, chatting at the busiest moment (ADR 0006 as amended)", () => {
    expect(peakDecoded({ stems: stemManifest, shots: shotManifest, cues, phone: false }).total / MB).toBeLessThanOrEqual(72);
    expect(peakDecoded({ stems: stemManifest, shots: shotManifest, cues, phone: true }).total / MB).toBeLessThanOrEqual(41);
  });

  it("holds the score inside its own 64 MB and 32 MB", () => {
    expect(peakDecoded({ stems: stemManifest, shots: shotManifest, cues, phone: false }).stems / MB).toBeLessThanOrEqual(64);
    expect(peakDecoded({ stems: stemManifest, shots: shotManifest, cues, phone: true }).stems / MB).toBeLessThanOrEqual(32);
  });
});
