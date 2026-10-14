import { describe, expect, it } from "vitest";
import { MAX_PIXELS, qualityLadder, shadowSize, skyTier, startQuality, type Signals } from "./tier";

const laptop = { width: 1440, height: 900, devicePixelRatio: 2, coarsePointer: false };
const phone = { width: 390, height: 844, devicePixelRatio: 3, coarsePointer: true };
const M5 = "ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)";
const at = (s: Partial<Signals>): Signals => ({ width: 1440, height: 900, coarsePointer: false, gpu: M5, ...s });

describe("the level a visit starts at, from what the browser says about the device", () => {
  it("a laptop starts high", () => {
    expect(startQuality(at({}))).toBe("high");
    expect(startQuality(at({ memory: 8, cores: 10 }))).toBe("high");
  });

  it("a phone starts no higher than mid, by its coarse pointer or its small screen", () => {
    expect(startQuality(at({ width: 390, height: 844, coarsePointer: true, memory: 8, cores: 8 }))).toBe("mid");
    expect(startQuality(at({ width: 390, height: 844 }))).toBe("mid");
    expect(startQuality(at({ width: 1024, height: 1366, coarsePointer: true }))).toBe("mid");
  });

  it("little memory and few cores, both reported, take a level off", () => {
    expect(startQuality(at({ memory: 4, cores: 4 }))).toBe("mid");
    expect(startQuality(at({ width: 390, height: 844, coarsePointer: true, memory: 2, cores: 4 }))).toBe("low");
  });

  it("either one alone, or neither reported (Safari, Firefox), takes nothing off", () => {
    expect(startQuality(at({ memory: 4, cores: 8 }))).toBe("high");
    expect(startQuality(at({ memory: 8, cores: 4 }))).toBe("high");
    expect(startQuality(at({ cores: 2 }))).toBe("high");
  });

  it("a GPU from a well-known weak family takes a level off", () => {
    expect(startQuality(at({ gpu: "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)" }))).toBe("mid");
    expect(startQuality(at({ width: 360, height: 760, coarsePointer: true, gpu: "Mali-T830" }))).toBe("low");
    expect(startQuality(at({ width: 360, height: 760, coarsePointer: true, gpu: "Adreno (TM) 506" }))).toBe("low");
    expect(startQuality(at({ width: 360, height: 760, coarsePointer: true, gpu: "PowerVR Rogue GE8320" }))).toBe("low");
  });

  it("a GPU outside that list takes nothing off", () => {
    expect(startQuality(at({ gpu: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)" }))).toBe("high");
    expect(startQuality(at({ width: 390, height: 844, coarsePointer: true, gpu: "Adreno (TM) 740" }))).toBe("mid");
    expect(startQuality(at({ gpu: undefined }))).toBe("high");
  });

  it("never starts below low", () => {
    expect(startQuality(at({ width: 360, height: 760, coarsePointer: true, memory: 2, cores: 4, gpu: "Mali-400 MP" }))).toBe("low");
  });
});

describe("a visit's level only ever steps down", () => {
  it("one level at a time, to low and no further", () => {
    const v = qualityLadder("high", false);
    const seen: string[] = [];
    v.on((q) => seen.push(q));
    expect([v.lower(), v.lower(), v.lower()]).toEqual([true, true, false]);
    expect(v.level).toBe("low");
    expect(seen).toEqual(["mid", "low"]);
  });

  it("a level forced for testing holds", () => {
    const v = qualityLadder("high", true);
    expect(v.lower()).toBe(false);
    expect(v.level).toBe("high");
  });
});

describe("the sky at each level", () => {
  it("high: a laptop's sky as it always was, DPR up to 2 and every far galaxy", () => {
    expect(skyTier({ width: 1280, height: 800, devicePixelRatio: 2 }, "high")).toEqual({ dpr: 2, galaxies: 24000 });
  });

  it("mid: what phones always had, DPR up to 1.5 and a third of the galaxies", () => {
    expect(skyTier(phone, "mid")).toEqual({ dpr: 1.5, galaxies: 8000 });
  });

  it("low: one device pixel per CSS pixel and a sixth of the galaxies", () => {
    expect(skyTier(phone, "low")).toEqual({ dpr: 1, galaxies: 4000 });
  });

  it("never draws above the device's own DPR", () => {
    expect(skyTier({ ...laptop, devicePixelRatio: 1 }, "high").dpr).toBe(1);
  });

  it("keeps the drawn pixels within the budget, and never below DPR 1, even on a big screen", () => {
    const t = skyTier({ ...laptop, width: 2560, height: 1600, devicePixelRatio: 3 }, "high");
    expect(2560 * 1600 * t.dpr ** 2).toBeLessThanOrEqual(MAX_PIXELS + 1);
    expect(skyTier({ width: 3840, height: 2160, devicePixelRatio: 1 }, "high").dpr).toBe(1);
  });
});

describe("a shadow map at each level", () => {
  it("halves its side a level, and never goes under 256", () => {
    expect([shadowSize(2048, "high"), shadowSize(2048, "mid"), shadowSize(2048, "low")]).toEqual([2048, 1024, 512]);
    expect([shadowSize(1024, "high"), shadowSize(1024, "mid"), shadowSize(1024, "low")]).toEqual([1024, 512, 256]);
    expect(shadowSize(512, "low")).toBe(256);
  });
});
