import { describe, expect, it } from "vitest";
import { placeCard } from "./card";

const vw = 1440, vh = 900;
// his canvas, 128 px, in his corner: right 18, bottom 14
const corner = { l: vw - 18 - 128, t: vh - 14 - 128, r: vw - 18, b: vh - 14 };

describe("placeCard on a wide screen", () => {
  it("sits above him in his corner, as settled: 24 px from the right, its bottom 168 px up", () => {
    const p = placeCard({ me: corner, w: 416, h: 300, vw, vh, phone: false });
    expect(p.side).toBe("above");
    expect(p.left + p.width).toBe(vw - 24);
    expect(p.bottom).toBe(168);
    expect(p.maxH).toBe(vh * 0.5);
  });
  it("lines up with his left side when he's on the left", () => {
    const me = { l: 18, t: vh - 14 - 128, r: 146, b: vh - 14 };
    const p = placeCard({ me, w: 416, h: 300, vw, vh, phone: false });
    expect(p.side).toBe("above");
    expect(p.left).toBe(24);
  });
  it("opens beside him, towards the middle, when there's no room above", () => {
    const me = { l: 18, t: 24, r: 146, b: 152 };
    const p = placeCard({ me, w: 416, h: 300, vw, vh, phone: false });
    expect(p.side).toBe("beside");
    expect(p.left).toBeGreaterThan(me.r);
    expect(p.top).toBe(me.t);
    const right = { l: vw - 146, t: 24, r: vw - 18, b: 152 };
    const q = placeCard({ me: right, w: 416, h: 300, vw, vh, phone: false });
    expect(q.left + q.width).toBeLessThan(right.l);
  });
  it("keeps its height inside the frame", () => {
    const me = { l: 18, t: 400, r: 146, b: 528 };
    const p = placeCard({ me, w: 416, h: 600, vw, vh, phone: false });
    expect((p.top ?? vh - p.bottom! - p.maxH) + p.maxH).toBeLessThanOrEqual(vh - 16);
    expect(p.maxH).toBeLessThanOrEqual(vh * 0.5);
  });
});

describe("placeCard on a phone", () => {
  const pw = 390, ph = 844;
  it("spans the width above him in his corner: 10 px in, its bottom 104 px up", () => {
    const me = { l: pw - 6 - 92, t: ph - 6 - 92, r: pw - 6, b: ph - 6 };
    const p = placeCard({ me, w: 370, h: 260, vw: pw, vh: ph, phone: true });
    expect(p).toMatchObject({ side: "above", left: 10, width: pw - 20, bottom: 104 });
  });
  it("hangs below him when he's been moved to the top", () => {
    const me = { l: pw - 6 - 92, t: 6, r: pw - 6, b: 98 };
    const p = placeCard({ me, w: 370, h: 260, vw: pw, vh: ph, phone: true });
    expect(p.side).toBe("below");
    expect(p.top).toBe(98 + 6);
  });
});
