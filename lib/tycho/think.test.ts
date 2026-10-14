import { describe, expect, it } from "vitest";
import { think, type Mind, type Seen } from "./think";
import { edgeCandidates, type Pt, type Rect } from "./spots";

const vw = 1440, vh = 900, size = 128;
const cands = edgeCandidates(vw, vh, size);
const near = (to: Pt) => cands.reduce((b, c) => (Math.hypot(c.x - to.x, c.y - to.y) < Math.hypot(b.x - to.x, b.y - to.y) ? c : b));
const corner = near({ x: vw, y: vh });
const over = (c: Pt, w = 70): Rect => ({ l: c.x - w, t: c.y - w, r: c.x + w, b: c.y + w });

const mind = (o: Partial<Mind> = {}): Mind => ({
  here: corner, home: corner, chosen: false, small: false, offLimits: [], now: 100_000,
  graceUntil: 0, lastScroll: 0, settledBack: true, nextHop: 200_000, still: false, ...o,
});
const seen = (o: Partial<Seen> = {}): Seen => ({ cands, size, vw, vh, page: [], bodies: [], rand: () => 0.5, ...o });

describe("think: keeping clear", () => {
  it("stays put on a clear spot", () => {
    expect(think(mind(), seen()).act).toEqual({ do: "stay", small: false });
  });
  it("text coming under him sends him, hurried, to the free spot nearest home", () => {
    const home = near({ x: vw, y: vh / 2 });
    const { act } = think(mind({ home }), seen({ page: [over(corner)] }));
    expect(act).toMatchObject({ do: "go", hurry: true, small: false });
    if (act.do !== "go") throw 0;
    expect(act.to).toEqual(home);
  });
  it("a subject sliding under him moves him on too", () => {
    const { act } = think(mind(), seen({ bodies: [over(corner)] }));
    expect(act).toMatchObject({ do: "go", hurry: true, small: false });
  });
  it("with no clear spot anywhere he shrinks where he is, rather than hop to one barely better", () => {
    const all = cands.map((c) => over(c, 40));
    expect(think(mind(), seen({ bodies: all })).act).toEqual({ do: "stay", small: true });
  });
  it("with no clear spot, a title over him sends him to a spot off the words, though a body covers it as much", () => {
    // every spot partly under a body; a title comes over him in his corner; elsewhere is only bodies
    const all = cands.map((c) => over(c, 40));
    const r = think(mind(), seen({ bodies: all, page: [over(corner, 30)] }));
    expect(r.act).toMatchObject({ do: "go", small: true, hurry: true });
  });
  it("small, he grows back once his spot clears", () => {
    expect(think(mind({ small: true }), seen()).act).toEqual({ do: "stay", small: false });
  });
});

describe("think: home base", () => {
  const away = near({ x: 0, y: vh });
  it("once a scroll settles, he goes back home when it's free", () => {
    const r = think(mind({ here: away, home: corner, settledBack: false, lastScroll: 100_000 - 500 }), seen());
    expect(r.act).toMatchObject({ do: "go", to: corner, why: "home", hurry: false });
    expect(r.mind.settledBack).toBe(true);
  });
  it("not while the scroll is still moving", () => {
    const r = think(mind({ here: away, home: corner, settledBack: false, lastScroll: 100_000 - 100 }), seen());
    expect(r.act.do).toBe("stay");
    expect(r.mind.settledBack).toBeUndefined();
  });
  it("not when home is taken: he stays where he is", () => {
    const r = think(mind({ here: away, home: corner, settledBack: false, lastScroll: 0 }), seen({ bodies: [over(corner)] }));
    expect(r.act.do).toBe("stay");
  });
  it("never back to a spot he was shooed from", () => {
    const r = think(mind({ here: away, home: corner, offLimits: [corner], settledBack: false, lastScroll: 0 }), seen());
    expect(r.act.do).toBe("stay");
  });
});

describe("think: the wander", () => {
  const due = { nextHop: 100_000 - 1 };
  it("hops when it's time, 240–900 px, to a spot clear of text and subjects, along a clear arc", () => {
    const blocked = cands.filter((c) => c.x < vw / 2).map((c) => over(c, 30));
    const r = think(mind(due), seen({ bodies: blocked }));
    expect(r.act).toMatchObject({ do: "go", why: "wander", hurry: false });
    if (r.act.do !== "go") throw 0;
    const d = Math.hypot(r.act.to.x - corner.x, r.act.to.y - corner.y);
    expect(d).toBeGreaterThan(240);
    expect(d).toBeLessThan(900);
    expect(r.act.to.x).toBeGreaterThan(vw / 2);
    expect(r.mind.nextHop).toBeGreaterThan(100_000 + 7000 - 1);
    expect(r.mind.nextHop).toBeLessThan(100_000 + 12000 + 1);
  });
  it("until the visitor picks a spot, where he wanders to is home", () => {
    const r = think(mind(due), seen());
    if (r.act.do !== "go") throw 0;
    expect(r.mind.home).toEqual(r.act.to);
    const picked = think(mind({ ...due, chosen: true }), seen());
    expect(picked.mind.home).toBeUndefined();
  });
  it("not before it's time, nor when he's held still (a phone, reduced motion, the pointer on him), nor while a picked spot holds him", () => {
    expect(think(mind(), seen()).act.do).toBe("stay");
    expect(think(mind({ ...due, still: true }), seen()).act.do).toBe("stay");
    expect(think(mind({ ...due, graceUntil: 100_001 }), seen()).act.do).toBe("stay");
  });
  it("first time round only sets when the first hop falls", () => {
    const r = think(mind({ nextHop: 0 }), seen());
    expect(r.act.do).toBe("stay");
    expect(r.mind.nextHop).toBeGreaterThan(100_000);
  });
});
