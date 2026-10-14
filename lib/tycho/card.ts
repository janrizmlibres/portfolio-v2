/**
 * Where Tycho's bubble opens, from where he is (his canvas's rect). Clicking him to talk doesn't move him, so the card
 * comes to him:
 * - above him when there's room, as settled in his corner: lined up with his right side when he's in the right half of
 *   the frame (24 px from the edge there), with his left side otherwise, its bottom 26 px above his canvas;
 * - otherwise beside him, towards the frame's middle, its top level with his;
 * - otherwise below him.
 * On a phone it spans the width, 10 px in from each side, 6 px above him, or below him when he's been moved up.
 * It never grows past half the frame, nor past the frame's edge (16 px in); beyond that it scrolls inside.
 * It goes over the words being read if they're there: only Tycho keeps clear of them (roam.ts), and the card stays on him.
 */
export type Box = { l: number; t: number; r: number; b: number };
/** px from the frame's left; `top` for a card that grows down, `bottom` (from the frame's bottom) for one that grows up */
export type CardPlace = { side: "above" | "beside" | "below"; left: number; width: number; top?: number; bottom?: number; maxH: number };

const EDGE = 16;

export function placeCard({ me, w, h, vw, vh, phone }: { me: Box; w: number; h: number; vw: number; vh: number; phone: boolean }): CardPlace {
  const gap = phone ? 6 : 26, cap = vh * 0.5, need = Math.min(h, cap);
  const width = phone ? vw - 20 : Math.min(w, vw - 48);
  const clampX = (x: number) => (phone ? 10 : Math.min(vw - 24 - width, Math.max(24, x)));
  const onRight = (me.l + me.r) / 2 > vw / 2;
  const lined = clampX(onRight ? me.r - 6 - width : me.l + 6);
  const above = me.t - gap - EDGE;
  if (above >= need) return { side: "above", left: lined, width, bottom: vh - (me.t - gap), maxH: Math.min(cap, above) };
  if (!phone) {
    const left = onRight ? me.l - 12 - width : me.r + 12;
    if (left >= EDGE && left + width <= vw - EDGE) {
      const top = Math.min(vh - EDGE - need, Math.max(EDGE, me.t));
      return { side: "beside", left, width, top, maxH: Math.min(cap, vh - EDGE - top) };
    }
  }
  const top = me.b + gap;
  return { side: "below", left: lined, width, top, maxH: Math.min(cap, vh - EDGE - top) };
}
