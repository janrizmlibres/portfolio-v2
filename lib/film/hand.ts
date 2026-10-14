/**
 * The hand: what the pointer, touch and keyboard can do across the film. Where the sky is the subject, hovering a
 * star shows its topic and clicking it asks Tycho; where it's seen whole, a drag turns it on both axes and it coasts
 * when let go (that arithmetic is `turn.ts`). Over any subject a chip names it, and a click asks Tycho about it. This
 * is the rest of the hand's arithmetic, kept apart from the page so it can be tested: what the pointer is over, and
 * where the chip and a star's label sit. Every length is in CSS px, every time in seconds, and nothing depends on the frame rate.
 */

type Pt = { x: number; y: number };
/** a point on screen and its depth (`z` beyond 1 is behind the camera) */
type ScreenPt = Pt & { z: number };

// ---------------------------------------------------------------- where in the film

/** Whether the film's time `t` falls inside any of `spans` (each `[from, to]`, ends included). */
export function within(spans: ReadonlyArray<readonly [number, number]>, t: number) {
  return spans.some(([a, b]) => t >= a && t <= b);
}

// ---------------------------------------------------------------- what the pointer is over

/** The star nearest the point within `reach`, never one behind the camera. */
export function nearestStar(pts: Array<ScreenPt | null>, x: number, y: number, reach = 14): number | null {
  let best: number | null = null, bd = reach;
  pts.forEach((p, i) => {
    if (!p || p.z > 1 || p.z < -1) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** How a subject is hit on screen: its disc, or four corners (a ribbon card's). */
export type SubjectHit = { kind: "disc"; x: number; y: number; R: number } | { kind: "quad"; pts: Pt[] };

function inQuad(pts: Pt[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!, b = pts[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * The subject under the point: one whose disc (or `reach` round a small one) or face holds it. Where two overlap,
 * the one whose middle is nearer, for its size, wins.
 */
export function subjectAt(subjects: Array<{ hit: SubjectHit | null }>, x: number, y: number, reach = 22): number | null {
  let best: number | null = null, bd = 1;
  subjects.forEach(({ hit }, i) => {
    if (!hit) return;
    let d: number;
    if (hit.kind === "disc") d = Math.hypot(x - hit.x, y - hit.y) / Math.max(hit.R, reach);
    else {
      if (!inQuad(hit.pts, x, y)) return;
      const c = hit.pts.reduce((s, p) => ({ x: s.x + p.x / hit.pts.length, y: s.y + p.y / hit.pts.length }), { x: 0, y: 0 });
      const half = Math.hypot(hit.pts[2]!.x - hit.pts[0]!.x, hit.pts[2]!.y - hit.pts[0]!.y) / 2;
      d = (Math.hypot(x - c.x, y - c.y) / Math.max(1, half)) * 0.999;
    }
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

// ---------------------------------------------------------------- the chip and the star's label

/** The chip sits below and right of the pointer, kept `pad` inside the window. */
export function chipAt(p: Pt, w: number, h: number, vw: number, vh: number, off = 18, pad = 8): Pt {
  return { x: Math.min(p.x + off, vw - w - pad), y: Math.min(p.y + off, vh - h - pad) };
}

/** How far each bracket stands off the chip's words, from the pointer's speed in px a second. */
export function bracketSpread(speed: number, max = 12) {
  return Math.min(max, Math.max(0, speed * 0.02));
}

/** the hover ring's radius round a star, and how far its label's leader runs out from it */
export const RING_R = 9;
const LEAD = 28, PAD = 8;

/**
 * Where a star's label sits, and its leader line (from, to): from the ring, up and out to the right, as the film's
 * other labels hang from their objects; turning left near the window's right edge, and down near its top.
 */
export function placeStarLabel(s: Pt, w: number, h: number, vw: number, vh: number): Pt & { line: [number, number, number, number] } {
  const d = Math.SQRT1_2;
  let kx = 1, ky = -1;
  if (s.x + d * (RING_R + LEAD) + 4 + w > vw - PAD) kx = -1;
  if (s.y - d * (RING_R + LEAD) - h / 2 < PAD) ky = 1;
  const x1 = s.x + kx * d * RING_R, y1 = s.y + ky * d * RING_R;
  const x2 = s.x + kx * d * (RING_R + LEAD), y2 = s.y + ky * d * (RING_R + LEAD);
  return { x: kx > 0 ? x2 + 4 : x2 - 4 - w, y: Math.min(vh - h - PAD, y2 - h / 2), line: [x1, y1, x2, y2] };
}
