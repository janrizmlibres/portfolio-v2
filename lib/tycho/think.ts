/**
 * What Tycho does next, a few times a second, from where he is and what's on screen: the rules of his place on the
 * frame's edges (keeping clear, home base, the wander), apart from the moving itself (roam.ts), so they can be
 * checked on their own.
 * - **Keeping clear:** text, the page's chrome or a 3D subject coming under him sends him, hurried, to the clear spot
 *   nearest home. With no spot clear he shrinks where he is, and hops only to a spot covered less than half as much.
 *   Small, he grows back as soon as his spot clears.
 * - **Home base:** once a scroll settles (0.4 s without one), he goes back home when it's clear and not a spot he was
 *   shooed from.
 * - **The wander:** a hop every 7–12 s, 240–900 px, to a clear spot along a clear flight; none while he's held still
 *   (a phone, reduced motion, the pointer resting on him) or a spot the visitor picked holds him. Until the visitor
 *   picks one, where he wanders to is home.
 */
import { arcClear, BOW, bowFor, coverage, inFrame, isClear, OFF_LIMITS_R, placeSpot, SMALL, type Pt, type Rect } from "./spots";

/** what he remembers between thoughts; times are ms (performance.now()) */
export type Mind = {
  here: Pt;
  home: Pt;
  /** the visitor picked home (a drop, a flick, a shoo, the "Move Tycho" key) */
  chosen: boolean;
  /** shrunk on a spot that isn't clear */
  small: boolean;
  offLimits: readonly Pt[];
  now: number;
  /** a picked spot holds him until then */
  graceUntil: number;
  lastScroll: number;
  /** he's been home (or tried) since the last scroll */
  settledBack: boolean;
  /** when the next hop is due; 0 before the first is set */
  nextHop: number;
  /** no wander: a phone, reduced motion, the pointer resting on him */
  still: boolean;
};

/** what's on screen: the spots, his size, the frame, what he keeps clear of, and a random source for the wander */
export type Seen = { cands: readonly Pt[]; size: number; vw: number; vh: number; page: readonly Rect[]; bodies: readonly Rect[]; rand: () => number };

export type Act =
  | { do: "stay"; small: boolean }
  | { do: "go"; to: Pt; small: boolean; hurry: boolean; bow: number; why: "clear" | "home" | "wander" };

const WANDER_S: [number, number] = [7, 12];
const HOP_PX: [number, number] = [240, 900];
/** a scroll has settled once it's been still this long, ms */
const SETTLE_MS = 400;

const far = (a: Pt, b: Pt, d: number) => Math.hypot(a.x - b.x, a.y - b.y) > d;

export function think(m: Mind, s: Seen): { act: Act; mind: Partial<Mind> } {
  const { size, page, bodies } = s, all = [...page, ...bodies];
  const shooed = (p: Pt) => m.offLimits.some((o) => !far(o, p, OFF_LIMITS_R - 1e-6));
  const go = (to: Pt, o: { small?: boolean; hurry?: boolean; why: "clear" | "home" | "wander" }): Act =>
    ({ do: "go", to, small: !!o.small, hurry: !!o.hurry, bow: bowFor(m.here, to, size, all, s), why: o.why });

  // keeping clear: something came under him
  if (!isClear(m.here, size, all)) {
    const p = placeSpot({ cands: s.cands, size, vw: s.vw, vh: s.vh, page, bodies, offLimits: m.offLimits, prefer: m.home });
    if (p && !p.small) return { act: go(p.at, { hurry: true, why: "clear" }), mind: {} };
    const sm = size * SMALL;
    // the words come first (a title counts as text): off them beats on them, however much body covers either
    const offWords = p && coverage(m.here, sm, page) > 0 && coverage(p.at, sm, page) === 0;
    if (p && far(p.at, m.here, 6) && (offWords || coverage(p.at, sm, all) < 0.5 * coverage(m.here, sm, all))) return { act: go(p.at, { small: true, hurry: true, why: "clear" }), mind: {} };
    return { act: { do: "stay", small: true }, mind: {} };
  }

  // home base: once a scroll settles, back home when it's clear
  if (!m.settledBack && m.now - m.lastScroll > SETTLE_MS) {
    const back = far(m.home, m.here, 6) && isClear(m.home, size, all) && !shooed(m.home);
    return { act: back ? go(m.home, { why: "home" }) : { do: "stay", small: false }, mind: { settledBack: true } };
  }

  // the wander
  const hopIn = () => m.now + (WANDER_S[0] + s.rand() * (WANDER_S[1] - WANDER_S[0])) * 1000;
  if (m.still || m.now < m.graceUntil) return { act: { do: "stay", small: false }, mind: {} };
  if (!m.nextHop) return { act: { do: "stay", small: false }, mind: { nextHop: hopIn() } };
  if (m.now < m.nextHop) return { act: { do: "stay", small: false }, mind: {} };
  const ok = s.cands.filter((c) => {
    const d = Math.hypot(c.x - m.here.x, c.y - m.here.y);
    return d > HOP_PX[0] && d < HOP_PX[1] && !shooed(c);
  });
  const free = ok.filter(
    (c) => inFrame(c, size, s) && isClear(c, size, all) && (arcClear(m.here, c, BOW, size, all) || arcClear(m.here, c, -BOW, size, all)),
  );
  if (!free.length) return { act: { do: "stay", small: false }, mind: { nextHop: hopIn() } };
  const to = free[Math.min(free.length - 1, Math.floor(s.rand() * free.length))]!;
  return { act: go(to, { why: "wander" }), mind: { nextHop: hopIn(), ...(m.chosen ? {} : { home: to }) } };
}
