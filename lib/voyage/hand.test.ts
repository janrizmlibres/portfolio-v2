import { describe, expect, it } from "vitest";
import { within } from "@/lib/film/hand";
import { MOONS } from "@/lib/content/voyage";
import { askables } from "./hand";
import { voyageScript } from "./script";

const script = voyageScript();
const scene = (id: string) => script.scenes.find((s) => s.id === id)!;
const block = (id: string) => script.blocks.find((b) => b.id === id)!;
const { G1, END } = script.times;

describe("where the sky answers the hand (the script's sky windows)", () => {
  const { stars, contact, drag } = script.sky;

  it("lets the stars be hovered where the sky is the subject: the hero, round home, Contact", () => {
    expect(within(stars, 0)).toBe(true);
    expect(within(stars, 0.3)).toBe(true);
    expect(within(stars, (scene("home").t0 + scene("around").t1) / 2)).toBe(true);
    expect(within(stars, END)).toBe(true);
  });

  it("keeps them out where a body is the subject: the dive, home being built, Athena, the crawler, the ribbon", () => {
    expect(within(stars, 1.5)).toBe(false);
    expect(within(stars, (block("tail").tIn[1] + block("tail").tOut[0]) / 2)).toBe(false);
    expect(within(stars, (scene("ride").t0 + scene("ride").t1) / 2)).toBe(false);
    for (const id of ["athena", "crawler", "own-mercado"]) expect(within(stars, block(id).tIn[1])).toBe(false);
    expect(within(stars, G1 + 0.5)).toBe(false);
  });

  it("holds the stars back at Contact until the pull-out has opened the whole sky", () => {
    expect(within(contact, G1 + 0.5)).toBe(false);
    expect(within(contact, END)).toBe(true);
    for (const [a] of contact) expect(within(stars, a + 0.01)).toBe(true);
  });

  it("lets the sky be turned only where it's seen whole: the hero's first frame and Contact's last", () => {
    expect(within(drag, 0)).toBe(true);
    expect(within(drag, 0.3)).toBe(false);
    expect(within(drag, END - 0.5)).toBe(false);
    expect(within(drag, END)).toBe(true);
  });
});

describe("what the hand can ask about", () => {
  const list = askables(script.blocks);
  const byId = new Map(list.map((a) => [a.id, a]));

  it("asks about Janriz over home", () => {
    expect(byId.get("home")).toMatchObject({ label: "Janriz", q: "Who is Janriz?", at: { ref: "home" } });
  });

  it("asks each block's own question, over its title's subject or the craft its card follows", () => {
    for (const b of script.blocks) {
      if (!b.ask) continue;
      if (!b.sign && !b.anchor) continue;
      const a = byId.get(b.id)!;
      expect(a).toMatchObject({ label: b.ask.label, q: b.ask.q });
      expect(a.at).toEqual({ ref: b.kind === "sign" && b.sign ? b.sign : b.anchor!.ref });
    }
  });

  it("asks about each moon by its name, only while the block naming it is in play", () => {
    for (const m of MOONS) {
      const a = byId.get(`moon:${m.slug}`)!;
      expect(a.label).toBe(`the ${m.title}`);
      expect(a.q).toBe(`Tell me about the ${m.title}.`);
      expect(a.at).toEqual({ ref: `moon:${m.slug}`, small: true });
      const named = script.blocks.find((b) => b.labels?.some((l) => l.ref === `moon:${m.slug}`))!;
      expect(a.live).toEqual([named.tIn[0], named.tOut[1]]);
    }
  });
});
