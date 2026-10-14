/**
 * Where text sits in the frame. Screen points are CSS px with `z` from the camera's projection (z > 1 is behind it).
 * - A title rides its subject (above-left of it, or left or right of it), or heads its lines in the column. While
 *   its subject is behind the camera or not loaded yet, it heads the column. It stays 16 px inside the frame, and
 *   clear of the route map's corner: off the right edge on a wide screen, below the top on a phone, where the map
 *   folds into a pill.
 * - A label hangs on a leader line: a line from its object out along the direction from its parent's centre, the
 *   label at its end. While its object is thrown outwards (a hard scroll), the label holds where the object rests
 *   and the line stretches.
 *   Labels that would overlap are pushed apart top to bottom, 8 px inside the frame.
 * - A card hangs over its object on a leader line, or level with it, left or right, where the frame's top can't hold
 *   it, or under it where nothing else can.
 */
export type ScreenPoint = { x: number; y: number; z: number };
/** A text box as fractions of the frame: its left, its top (or its middle, `mid`) and its width. */
export type Box = { x: number; y: number; w: number; mid?: boolean };
/**
 * `star`: rides a star, off its spikes (a burning star's flare crosses it level and upright): above and right of it,
 * or above and left where the frame's right side can't hold it, so it's never pushed back over the star.
 */
export type TitleSide = "column" | "above-left" | "left" | "right" | "above" | "star";

const GAP = 12;
/** how far a title riding a star keeps its near corner off the star, on both axes */
const STAR_GAP = 18;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** How far, in px, a riding title keeps from the frame's top and right edges, clear of the route map. */
export type Clear = { top: number; right: number };
/**
 * The route map's corner as measured at every reading spot: at rest on a wide screen it reaches 209 px in from the
 * right edge (the map, its ticks and the longest name, "Projects"), so titles keep 222; on a phone the pill reaches
 * 52 px down, so titles keep 70 from the top.
 */
export const ROUTE_MAP_CLEAR: { land: Clear; port: Clear } = { land: { top: 24, right: 222 }, port: { top: 70, right: 16 } };

export function placeTitle({ side, anchor, box, tw, th, vw, vh, clear = { top: 16, right: 16 } }: { side: TitleSide; anchor: ScreenPoint | null; box: Box; tw: number; th: number; vw: number; vh: number; clear?: Clear }) {
  let x: number, y: number;
  if (side === "column" || !anchor || anchor.z > 1) {
    x = box.x * vw;
    y = box.y * vh - th - 18;
  } else if (side === "left") {
    x = anchor.x - tw - GAP;
    y = anchor.y - th / 2;
  } else if (side === "right") {
    x = anchor.x + GAP * 2.2;
    y = anchor.y - th / 2;
  } else if (side === "star") {
    const right = anchor.x + STAR_GAP;
    x = right + tw <= vw - clear.right ? right : anchor.x - STAR_GAP - tw;
    y = anchor.y - th - STAR_GAP;
  } else if (side === "above") {
    x = anchor.x - tw / 2;
    y = anchor.y - th - GAP;
  } else {
    x = anchor.x - tw * 0.85;
    y = anchor.y - th - GAP;
  }
  return { x: clamp(x, 16, vw - tw - clear.right), y: clamp(y, clear.top, vh - th - 16) };
}

export type LabelInput = {
  at: ScreenPoint;
  of: { x: number; y: number } | null;
  w: number;
  h: number;
  /**
   * where its object rests while it's thrown (a hard scroll flings it), or a spot clear of its object's body: the label
   * holds there and its line stretches to the object
   */
  rest?: ScreenPoint | null;
  /**
   * how far from its parent's centre (px) the label keeps, so it hangs outside the parent's disc while its leader still
   * starts on its object (a pattern riding one of Athena's wedges)
   */
  clear?: number;
};
/** `line`: the leader, from the object to the label's near edge */
export type PlacedLabel = { x: number; y: number; line: [number, number, number, number] };

/** a rect already placed in the frame (another block's label, a title), which labels keep clear of */
export type Rect = { x: number; y: number; w: number; h: number };

export function placeLabels(labels: readonly LabelInput[], { vw, vh, avoid = [] }: { vw: number; vh: number; avoid?: readonly Rect[] }): Array<PlacedLabel | null> {
  const ls = labels.map((l) => {
    if (l.at.z > 1) return null;
    const s = l.rest && l.rest.z <= 1 ? l.rest : l.at, c = l.of ?? { x: s.x - 1, y: s.y };
    let dx = s.x - c.x, dy = s.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const right = dx >= -0.15;
    // whether it hangs above its parent, and so gives way upwards
    const up = dy < -0.2;
    let ax = s.x + dx * 30, ay = s.y + dy * 22;
    if (l.clear && l.of && Math.hypot(ax - c.x, ay - c.y) < l.clear) { ax = c.x + dx * l.clear; ay = c.y + dy * l.clear; }
    return { at: l.at, right, up, w: l.w, h: l.h, x: right ? ax + 6 : ax - 6 - l.w, y: ay - 9 };
  });
  // each label moves away from its parent past anything it overlaps: the labels below their parents downwards, top to
  // bottom, then those above their parents upwards, bottom to top, each against what's placed already and the labels
  // settled before it
  const live = ls.filter((l): l is NonNullable<typeof l> => !!l);
  const placed: Rect[] = [...avoid];
  const hits = (q: Rect, p: Rect) => q.x < p.x + p.w && p.x < q.x + q.w && q.y < p.y + p.h + 6 && p.y < q.y + q.h + 6;
  const settle = (q: (typeof live)[number], up: boolean) => {
    for (let moved = true, n = 0; moved && n < 12; n++) {
      moved = false;
      for (const p of placed) if (hits(q, p)) { q.y = up ? p.y - q.h - 6 : p.y + p.h + 6; moved = true; }
    }
    placed.push(q);
  };
  for (const q of live.filter((l) => !l.up).sort((p, q) => p.y - q.y)) settle(q, false);
  for (const q of live.filter((l) => l.up).sort((p, q) => q.y - p.y)) settle(q, true);
  return ls.map((L) => {
    if (!L) return null;
    const x = clamp(L.x, 8, vw - L.w - 8), y = clamp(L.y, 8, vh - L.h - 8);
    return { x, y, line: [L.at.x, L.at.y, L.right ? x - 3 : x + L.w + 3, y + 9] };
  });
}

/** how far a card hangs past its object's edge: across, beside it, and down or up, under or over it */
const CARD_GAP = { x: 22, y: 18 };

/**
 * Where a card of `w` × `h` px hangs from its object at `at`, and its leader (from the object to the card's near
 * edge), or null while the object is behind the camera. It hangs past the object's edge (`reach` px from its middle
 * across, 0.7 of that up and down: an object stands about as high as it reaches out), where it fits whole,
 * 16 px inside the frame and clear of the route map's corner, trying above, left, right and below in turn; where
 * nothing fits, the side with the most room, held inside the frame. Above, it reaches left from over the object, clear
 * of what stands further down a lane (towards the frame's middle).
 */
/**
 * A card pinned in the frame (`spot`: its left and top, as fractions of it) while its object passes, too fast for a
 * card hung beside it to be read (a breakthrough's craft): its leader runs from the object into the card's nearest
 * side, a side one where the object is beyond its left or right edge, its top or foot where it's over or under it; none
 * while the object is behind the camera or off the frame.
 */
export function pinCard({ at, spot, w, h, vw, vh }: { at: ScreenPoint | null; spot: { x: number; y: number }; w: number; h: number; vw: number; vh: number }) {
  const x = clamp(spot.x * vw, 16, vw - 16 - w), y = clamp(spot.y * vh, 16, vh - 16 - h);
  let line: [number, number, number, number] | null = null;
  if (at && at.z <= 1 && at.x >= 0 && at.x <= vw && at.y >= 0 && at.y <= vh) {
    const sideY = clamp(at.y, y + 8, y + h - 8), sideX = clamp(at.x, x + 8, x + w - 8);
    line = at.x > x + w ? [at.x, at.y, x + w + 6, sideY] : at.x < x ? [at.x, at.y, x - 6, sideY] : at.y > y + h ? [at.x, at.y, sideX, y + h + 6] : [at.x, at.y, sideX, y - 6];
  }
  return { x, y, line };
}

export function placeCard({ at, w, h, vw, vh, reach = 0, clear = { top: 16, right: 16 } }: { at: ScreenPoint; w: number; h: number; vw: number; vh: number; reach?: number; clear?: Clear }): PlacedLabel | null {
  if (at.z > 1) return null;
  const gx = reach + CARD_GAP.x, gy = reach * 0.7 + CARD_GAP.y;
  const top = Math.max(16, clear.top), x0 = 16, x1 = vw - 16, x1r = vw - Math.max(16, clear.right), y1 = vh - 16;
  const level = clamp(at.y - h / 2, top, y1 - h), under = clamp(at.x - w / 2, x0, x1 - w), over = clamp(at.x - w * 0.8, x0, x1 - w);
  const tries = {
    above: { x: over, y: at.y - gy - h, fits: (_: number, y: number) => y >= top && over + w <= x1r },
    left: { x: at.x - gx - w, y: level, fits: (x: number) => x >= x0 },
    right: { x: at.x + gx, y: level, fits: (x: number) => x + w <= x1r },
    below: { x: under, y: at.y + gy, fits: (_: number, y: number) => y + h <= y1 },
  };
  type Side = keyof typeof tries;
  let side = (Object.keys(tries) as Side[]).find((k) => tries[k].fits(tries[k].x, tries[k].y));
  side ??= at.x - x0 >= x1 - at.x ? "left" : "right";
  const c = tries[side], x = clamp(c.x, x0, (side === "left" || side === "below" ? x1 : x1r) - w), y = clamp(c.y, top, y1 - h);
  // the leader runs straight up or down into the card's near edge, or level into its near side
  const line: [number, number, number, number] = side === "above" ? [at.x, at.y, clamp(at.x, x + 8, x + w - 8), y + h + 6]
    : side === "below" ? [at.x, at.y, clamp(at.x, x + 8, x + w - 8), y - 6]
    : side === "left" ? [at.x, at.y, x + w + 6, clamp(at.y, y + 8, y + h - 8)]
    : [at.x, at.y, x - 6, clamp(at.y, y + 8, y + h - 8)];
  return { x, y, line };
}
