import { describe, expect, it } from "vitest";
import { diffTargets, HERO_LAYERS, mixTargets, partOf } from "./mix";

const LAYERS = ["bed", "keys", "pulse", "lead", "drone", "thinking"];
const scene = (id: string, sec: string) => ({ id, sec });

describe("the score's mix: each layer's level from where the film is, how fast it moves, and the chat", () => {
  it("opens on the bed alone, so the hero's layers are the only ones loaded under the wake-up's charge", () => {
    const t = mixTargets(LAYERS, scene("hero", "sec-hero"), 0, "ready");
    expect(t.bed).toBeGreaterThan(0);
    for (const n of ["keys", "pulse", "lead", "drone", "thinking"]) expect(t[n]).toBe(0);
    expect(HERO_LAYERS).toEqual(["bed"]);
  });

  it("gives every scene a part, falling back to its section's when it has none of its own", () => {
    expect(partOf(scene("home", "sec-about"))).toBe("home");
    expect(partOf(scene("around", "sec-about"))).toBe("home");
    expect(partOf(scene("role-logolife", "sec-work"))).toBe("road");
    expect(partOf(scene("recap", "sec-projects"))).toBe("road");
    expect(partOf(scene("athena", "sec-projects"))).toBe("athena");
    expect(partOf(scene("crawler", "sec-projects"))).toBe("crawler");
    expect(partOf(scene("contact", "sec-contact"))).toBe("contact");
    expect(partOf(scene("something-new", "sec-projects"))).toBe("athena");
  });

  it("adds the keys at home, the pulse on the road, the lead over a lower pulse at Athena, and everything at the crawler", () => {
    const home = mixTargets(LAYERS, scene("home", "sec-about"), 0, "ready");
    expect(home.keys).toBeGreaterThan(0);
    expect(home.pulse).toBe(0);
    const road = mixTargets(LAYERS, scene("ride", "sec-work"), 0, "ready");
    expect(road.pulse).toBeGreaterThan(0);
    const athena = mixTargets(LAYERS, scene("athena", "sec-projects"), 0, "ready");
    expect(athena.keys).toBeGreaterThan(0);
    expect(athena.lead).toBeGreaterThan(0);
    expect(athena.pulse).toBeGreaterThan(0);
    expect(athena.pulse).toBeLessThan(road.pulse!);
    const crawler = mixTargets(LAYERS, scene("crawler", "sec-projects"), 0, "ready");
    for (const n of ["bed", "keys", "pulse", "lead", "drone"]) expect(crawler[n]).toBeGreaterThan(0);
  });

  it("thins after the climax, and leaves Contact a thin bed under the instrument", () => {
    const crawler = mixTargets(LAYERS, scene("crawler", "sec-projects"), 0, "ready");
    const own = mixTargets(LAYERS, scene("own", "sec-projects"), 0, "ready");
    const sum = (t: Record<string, number>) => LAYERS.reduce((a, n) => a + (t[n] ?? 0), 0);
    expect(sum(own)).toBeLessThan(sum(crawler));
    const hero = mixTargets(LAYERS, scene("hero", "sec-hero"), 0, "ready");
    const contact = mixTargets(LAYERS, scene("contact", "sec-contact"), 0, "ready");
    expect(contact.bed).toBeGreaterThan(0);
    expect(contact.bed).toBeLessThan(hero.bed!);
    for (const n of ["keys", "pulse", "lead", "drone"]) expect(contact[n]).toBe(0);
  });

  it("raises the drone and its pitch, the pulse and the brightness with scroll speed on the road", () => {
    const slow = mixTargets(LAYERS, scene("ride", "sec-work"), 0, "ready");
    const fast = mixTargets(LAYERS, scene("ride", "sec-work"), 1, "ready");
    expect(fast.drone).toBeGreaterThan(slow.drone!);
    expect(fast.pulse).toBeGreaterThan(slow.pulse!);
    expect(fast.bright).toBeGreaterThan(slow.bright!);
    expect(slow.rate).toBe(1);
    expect(fast.rate).toBeCloseTo(1.5);
  });

  it("leaves the mix alone at speed where a part has no speed reaction", () => {
    const slow = mixTargets(LAYERS, scene("home", "sec-about"), 0, "ready");
    const fast = mixTargets(LAYERS, scene("home", "sec-about"), 1, "ready");
    expect(fast).toEqual(slow);
  });

  it("keeps every level within 1.2 and the brightness within 1", () => {
    const t = mixTargets(LAYERS, scene("ride", "sec-work"), 5, "ready");
    for (const n of LAYERS) expect(t[n]).toBeLessThanOrEqual(1.2);
    expect(t.bright).toBeLessThanOrEqual(1);
  });

  it("brings the thinking layer in and ducks the score while Tycho thinks, ducks it less while he answers", () => {
    const at = scene("home", "sec-about");
    const ready = mixTargets(LAYERS, at, 0, "ready");
    const thinking = mixTargets(LAYERS, at, 0, "submitted");
    const answering = mixTargets(LAYERS, at, 0, "streaming");
    expect(ready.duck).toBe(1);
    expect(ready.thinking).toBe(0);
    expect(thinking.thinking).toBe(1);
    expect(thinking.duck).toBeLessThan(answering.duck!);
    expect(answering.duck).toBeLessThan(1);
    expect(answering.thinking).toBe(0);
  });

  it("only mixes the layers the score has", () => {
    const t = mixTargets(["bed", "keys"], scene("crawler", "sec-projects"), 0, "ready");
    expect(Object.keys(t).sort()).toEqual(["bed", "bright", "duck", "keys", "rate"]);
  });
});

describe("only changes are sent to the audio thread", () => {
  it("sends every target the first time", () => {
    const t = { pad: 0.9, bass: 0, rate: 1 };
    expect(diffTargets({}, t)).toEqual(t);
  });

  it("sends nothing when nothing changed, or when a change is too small to hear", () => {
    const sent = { pad: 0.9, bass: 0, rate: 1 };
    expect(diffTargets(sent, { pad: 0.9, bass: 0, rate: 1 })).toEqual({});
    expect(diffTargets(sent, { pad: 0.902, bass: 0.001, rate: 1.001 })).toEqual({});
  });

  it("sends only what changed", () => {
    const sent = { pad: 0.9, bass: 0, rate: 1 };
    expect(diffTargets(sent, { pad: 0.9, bass: 0.55, rate: 1 })).toEqual({ bass: 0.55 });
  });
});
