import { describe, expect, it } from "vitest";
import { pinCard, placeCard, placeLabels, placeTitle, ROUTE_MAP_CLEAR } from "./place";

const view = { vw: 1440, vh: 900 };
const box = { x: 0.07, y: 0.56, w: 0.31 };

describe("placeTitle", () => {
  const size = { tw: 300, th: 60 };

  it("heads its lines in the column when it doesn't ride a subject", () => {
    expect(placeTitle({ side: "column", anchor: { x: 900, y: 300, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 0.07 * 1440, y: 0.56 * 900 - 60 - 18 });
  });

  it("rides its subject above-left", () => {
    const p = placeTitle({ side: "above-left", anchor: { x: 900, y: 400, z: 0.5 }, box, ...size, ...view });
    expect(p).toEqual({ x: 900 - 300 * 0.85, y: 400 - 60 - 12 });
  });

  it("rides left and right of its subject, centred on it", () => {
    expect(placeTitle({ side: "left", anchor: { x: 900, y: 400, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 900 - 300 - 12, y: 370 });
    expect(placeTitle({ side: "right", anchor: { x: 900, y: 400, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 900 + 26.4, y: 370 });
  });

  it("rides a star off its spikes: above and right of it, the title's near corner 18 px off the star on both axes", () => {
    expect(placeTitle({ side: "star", anchor: { x: 900, y: 400, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 918, y: 400 - 60 - 18 });
  });

  it("rides a star above and left of it where the frame's right side can't hold it, never pushed back over the star", () => {
    // 1120 + 18 + 300 would cross the 16 px margin
    expect(placeTitle({ side: "star", anchor: { x: 1120, y: 400, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 1120 - 18 - 300, y: 322 });
    // on a phone the same, inside the route map's pill
    const phone = { vw: 390, vh: 844 }, clear = ROUTE_MAP_CLEAR.port;
    expect(placeTitle({ side: "star", anchor: { x: 247, y: 400, z: 0.5 }, box, tw: 118, th: 40, ...phone, clear })).toEqual({ x: 247 - 18 - 118, y: 342 });
  });

  it("falls back to the column while its subject is behind the camera or not there yet", () => {
    const col = { x: 0.07 * 1440, y: 0.56 * 900 - 78 };
    expect(placeTitle({ side: "above-left", anchor: { x: 900, y: 400, z: 1.2 }, box, ...size, ...view })).toEqual(col);
    expect(placeTitle({ side: "above-left", anchor: null, box, ...size, ...view })).toEqual(col);
  });

  it("stays 16 px inside the frame", () => {
    expect(placeTitle({ side: "above-left", anchor: { x: 50, y: 20, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 16, y: 16 });
    expect(placeTitle({ side: "right", anchor: { x: 1400, y: 890, z: 0.5 }, box, ...size, ...view })).toEqual({ x: 1440 - 300 - 16, y: 900 - 60 - 16 });
  });

  it("keeps clear of the route map's corner: its margin from the frame's right edge, and from its top", () => {
    const clear = { top: 24, right: 150 };
    expect(placeTitle({ side: "above-left", anchor: { x: 1400, y: 30, z: 0.5 }, box, ...size, ...view, clear })).toEqual({ x: 1440 - 300 - 150, y: 24 });
    // the column is clear already, and a title clear of the corner stays where it is
    expect(placeTitle({ side: "above-left", anchor: { x: 900, y: 400, z: 0.5 }, box, ...size, ...view, clear })).toEqual({ x: 900 - 300 * 0.85, y: 400 - 60 - 12 });
  });

  it("keeps the route map's corner clear on a phone, where it folds into a pill across the top", () => {
    expect(ROUTE_MAP_CLEAR.port.top).toBeGreaterThan(ROUTE_MAP_CLEAR.land.top);
    expect(ROUTE_MAP_CLEAR.land.right).toBeGreaterThan(ROUTE_MAP_CLEAR.port.right);
  });
});

describe("placeLabels", () => {
  const parent = { x: 700, y: 450 };

  it("sets each label out along the line from its parent's centre through its object, at the end of a leader", () => {
    const [right, left] = placeLabels(
      [
        { at: { x: 800, y: 450, z: 0.5 }, of: parent, w: 120, h: 18 },
        { at: { x: 600, y: 450, z: 0.5 }, of: parent, w: 120, h: 18 },
      ],
      view,
    );
    expect(right!.x).toBeGreaterThan(800);
    expect(left!.x + 120).toBeLessThan(600);
    // the leader starts on the object and ends at the label's near edge
    expect(right!.line!.slice(0, 2)).toEqual([800, 450]);
    expect(right!.line![2]).toBeCloseTo(right!.x - 3, 9);
    expect(left!.line![2]).toBeCloseTo(left!.x + 120 + 3, 9);
  });

  it("pushes labels that would overlap apart, top to bottom", () => {
    const ls = placeLabels(
      [
        { at: { x: 800, y: 400, z: 0.5 }, of: parent, w: 140, h: 18 },
        { at: { x: 805, y: 404, z: 0.5 }, of: parent, w: 140, h: 18 },
      ],
      view,
    );
    const [a, b] = [ls[0]!, ls[1]!].sort((p, q) => p.y - q.y);
    expect(b!.y - a!.y).toBeGreaterThanOrEqual(18 + 6);
  });

  it("keeps clear of what another block has already placed, moving away from its parent", () => {
    // another block's label (or a title) where this one would land; this one hangs above its parent, so it moves up
    const [l] = placeLabels([{ at: { x: 800, y: 400, z: 0.5 }, of: parent, w: 140, h: 18 }], { ...view, avoid: [{ x: 820, y: 360, w: 200, h: 40 }] });
    expect(l!.y + 18 + 6).toBeLessThanOrEqual(360);
  });

  it("moves a label below its parent down past what's placed", () => {
    const [l] = placeLabels([{ at: { x: 800, y: 500, z: 0.5 }, of: parent, w: 140, h: 18 }], { ...view, avoid: [{ x: 820, y: 500, w: 200, h: 40 }] });
    expect(l!.y).toBeGreaterThanOrEqual(500 + 40 + 6);
  });

  it("keeps a label clear of every earlier one it overlaps, not only the one before it", () => {
    const ls = placeLabels(
      [
        { at: { x: 800, y: 400, z: 0.5 }, of: parent, w: 300, h: 18 },
        { at: { x: 1300, y: 396, z: 0.5 }, of: parent, w: 100, h: 18 },
        { at: { x: 805, y: 410, z: 0.5 }, of: parent, w: 300, h: 18 },
      ],
      view,
    );
    const [a, , c] = ls;
    expect(Math.abs(c!.y - a!.y)).toBeGreaterThanOrEqual(18 + 6);
  });

  it("hangs a label clear of its parent's disc when it has one, its leader still starting on its object", () => {
    // an object just right of its parent's centre, on a parent 150 px across
    const [l] = placeLabels([{ at: { x: 720, y: 450, z: 0.5 }, of: parent, w: 140, h: 18, clear: 150 }], view);
    expect(l!.x).toBeGreaterThanOrEqual(700 + 150);
    expect(l!.line!.slice(0, 2)).toEqual([720, 450]);
  });

  it("hides a label whose object is behind the camera", () => {
    expect(placeLabels([{ at: { x: 800, y: 400, z: 1.1 }, of: parent, w: 100, h: 18 }], view)).toEqual([null]);
  });

  it("keeps labels 8 px inside the frame", () => {
    const [l] = placeLabels([{ at: { x: 1430, y: 5, z: 0.5 }, of: parent, w: 100, h: 18 }], view);
    expect(l!.x).toBeLessThanOrEqual(1440 - 100 - 8);
    expect(l!.y).toBeGreaterThanOrEqual(8);
  });

  it("hangs a label from its object's rest while the object is thrown, the leader stretching to where it is", () => {
    const rest = { x: 800, y: 450, z: 0.5 }, thrown = { x: 860, y: 420, z: 0.5 };
    const [still] = placeLabels([{ at: rest, of: parent, w: 120, h: 18 }], view);
    const [held] = placeLabels([{ at: thrown, rest, of: parent, w: 120, h: 18 }], view);
    expect([held!.x, held!.y]).toEqual([still!.x, still!.y]);
    expect(held!.line!.slice(0, 2)).toEqual([860, 420]);
    expect(held!.line!.slice(2)).toEqual(still!.line!.slice(2));
  });
});

describe("placeCard", () => {
  const card = { w: 300, h: 160 };
  const inFrame = (p: { x: number; y: number }, vw: number, vh: number) => p.x >= 16 && p.y >= 16 && p.x + card.w <= vw - 16 && p.y + card.h <= vh - 16;

  it("hangs above its object, reaching left from over it (clear of what's further down the lane), on a leader straight up", () => {
    const p = placeCard({ at: { x: 480, y: 600, z: 0.5 }, ...card, ...view })!;
    expect(p.y + card.h).toBeLessThan(600);
    expect(p.x + card.w * 0.8).toBe(480);
    expect(p.line).toEqual([480, 600, 480, p.y + card.h + 6]);
  });

  it("hangs left of it, level with it, where above can't hold it, and right where neither can", () => {
    const left = placeCard({ at: { x: 700, y: 120, z: 0.5 }, ...card, ...view })!;
    expect(left.x + card.w).toBeLessThan(700);
    expect(left.line[2]).toBeCloseTo(left.x + card.w + 6, 6);
    const right = placeCard({ at: { x: 200, y: 120, z: 0.5 }, ...card, ...view })!;
    expect(right.x).toBeGreaterThan(200);
    expect(right.line[2]).toBeCloseTo(right.x - 6, 6);
    expect(inFrame(right, view.vw, view.vh)).toBe(true);
  });

  it("hangs clear of a wide object, its leader running out past the object's edge", () => {
    const p = placeCard({ at: { x: 480, y: 600, z: 0.5 }, ...card, ...view, reach: 90 })!;
    // (an object stands about as high as it reaches out)
    expect(p.y + card.h).toBeLessThan(600 - 90 * 0.7);
    const left = placeCard({ at: { x: 700, y: 120, z: 0.5 }, ...card, ...view, reach: 90 })!;
    expect(left.x + card.w).toBeLessThan(700 - 90);
  });

  it("keeps clear of the route map's corner", () => {
    const p = placeCard({ at: { x: 200, y: 60, z: 0.5 }, ...card, ...view, clear: ROUTE_MAP_CLEAR.land })!;
    expect(p.y).toBeGreaterThanOrEqual(ROUTE_MAP_CLEAR.land.top);
  });

  it("hangs above it on a phone, and below it near the frame's top, where nothing else can hold it", () => {
    const phone = { vw: 390, vh: 844 };
    const above = placeCard({ at: { x: 150, y: 500, z: 0.5 }, ...card, ...phone, clear: ROUTE_MAP_CLEAR.port })!;
    expect(above.y + card.h).toBeLessThan(500);
    expect(inFrame(above, phone.vw, phone.vh)).toBe(true);
    const below = placeCard({ at: { x: 150, y: 150, z: 0.5 }, ...card, ...phone, clear: ROUTE_MAP_CLEAR.port })!;
    expect(below.y).toBeGreaterThan(150);
    expect(below.line.slice(0, 2)).toEqual([150, 150]);
    expect(inFrame(below, phone.vw, phone.vh)).toBe(true);
  });

  it("stays inside the frame however its object sits, and hangs nothing while the object is behind the camera", () => {
    for (const at of [{ x: -40, y: 20 }, { x: 1500, y: 950 }, { x: 720, y: 450 }]) {
      const p = placeCard({ at: { ...at, z: 0.5 }, ...card, ...view })!;
      expect(inFrame(p, view.vw, view.vh)).toBe(true);
    }
    expect(placeCard({ at: { x: 480, y: 380, z: 1.2 }, ...card, ...view })).toBeNull();
  });
});

describe("pinCard: a card that holds its place while its object passes (a breakthrough's craft)", () => {
  const card = { w: 300, h: 160 }, spot = { x: 0.065, y: 0.55 };

  it("stays where it's pinned wherever its object is, its leader running from the object into its nearest side", () => {
    const a = pinCard({ at: { x: 1100, y: 300, z: 0.5 }, spot, ...card, ...view }), b = pinCard({ at: { x: 900, y: 820, z: 0.5 }, spot, ...card, ...view });
    expect([a.x, a.y]).toEqual([0.065 * 1440, 0.55 * 900]);
    expect([b.x, b.y]).toEqual([a.x, a.y]);
    // right of the card: into its right side, level with the object as far as the card reaches
    expect(a.line).toEqual([1100, 300, a.x + card.w + 6, a.y + 8]);
    // right of it and below: into its right side, as low as the side reaches
    expect(b.line).toEqual([900, 820, a.x + card.w + 6, a.y + card.h - 8]);
    // under it: up into its foot
    const c = pinCard({ at: { x: 250, y: 850, z: 0.5 }, spot, ...card, ...view });
    expect(c.line).toEqual([250, 850, 250, a.y + card.h + 6]);
  });

  it("draws no leader while its object is behind the camera or off the frame", () => {
    expect(pinCard({ at: { x: 700, y: 300, z: 1.2 }, spot, ...card, ...view }).line).toBeNull();
    expect(pinCard({ at: { x: -400, y: 300, z: 0.5 }, spot, ...card, ...view }).line).toBeNull();
    expect(pinCard({ at: null, spot, ...card, ...view }).line).toBeNull();
  });

  it("keeps 16 px inside the frame", () => {
    const p = pinCard({ at: null, spot: { x: 0.95, y: 0.95 }, ...card, ...view });
    expect([p.x + card.w, p.y + card.h]).toEqual([view.vw - 16, view.vh - 16]);
  });
});
