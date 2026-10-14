/**
 * Work, without three.js: the plan the script times Work's words on and the stage builds its picture from.
 *
 * Its intro is the relay by home, the only relay, in its finished form: the camera turns to it while Work's intro is read, and it throws you
 * back to August 2023, its flash a cut. There home is only its core, and the companies build it, oldest first, a quarter
 * of its ring each, home built job by job, its skeleton going up before its hull so it's seen being built:
 * - `quartersOf`: a company a quarter, oldest first; the ring has four, so a fifth company needs the model to change;
 * - `gapsOf`: after each company's build, the AI breakthroughs from its time (up to the next one's start) come by;
 * - `callsOf`: each as a craft ("make it look like something out of a sci fi movie"): the ones he built with dock at the
 *   hub, the rest pass close, never two of the same craft in a row, nor two passing the same way;
 * - `planWork`: the beats' times; `builtAt`, `spinAt`, `busyAt`, `callsAt`: the build at any moment, for the stage.
 * The ring holds while a quarter builds and turns a quarter in the gap after it, so every quarter is built on the side
 * facing the camera and his star; once it's closed it turns on, as About's does.
 */
import type { Breakthrough, Role } from "@/lib/content/voyage";
import type { V3 } from "./route";

const month = (ym: string) => { const [y, m] = ym.split("-").map(Number); return y! * 12 + (m! - 1); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const ss = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const UP: V3 = [0, 1, 0];
type Span = [number, number];

// ---------------------------------------------------------------- the relay
/** A relay's size in the sky, in its model's units (the gimbal's outer ring is 0.78 of them across): the flagship's. */
export const RELAY_U = 0.0045 * 1.3;
/** How far from home the relay stands, towards the start. */
const HOME_OFF = 0.06;
const frameOf = (axis: V3) => { const side = norm(cross(axis, UP)), up = cross(side, axis); return { side, up }; };

/** Work's one relay: just off home, towards the start (his university's stars), aimed back at it. */
export function relayOf({ home, start }: { home: V3; start: V3 }) {
  const P = add(home, scale(norm(sub(start, home)), HOME_OFF)), axis = norm(sub(start, P));
  return { id: "relay", grade: "flagship" as const, P, axis, ...frameOf(axis), scale: RELAY_U };
}
export type Relay = ReturnType<typeof relayOf>;

// ---------------------------------------------------------------- the build: a quarter a company
export const QUARTERS = 4;
export type Quarter = { i: number; role: Role };

/** Each company's quarter of home's ring, oldest first. */
export function quartersOf(roles: readonly Role[]): Quarter[] {
  if (roles.length > QUARTERS) throw new Error(`home's ring has four quarters, one a company: ${roles.length} companies need a ring of ${roles.length} (scripts/models/station.py)`);
  return [...roles].sort((a, b) => month(a.from) - month(b.from)).map((role, i) => ({ i, role }));
}

/** The breakthroughs that come by after each company's build: those from its start to the next one's, oldest first. */
export function gapsOf(quarters: readonly Quarter[], marks: readonly Breakthrough[]): Breakthrough[][] {
  const gaps: Breakthrough[][] = quarters.map(() => []);
  for (const m of [...marks].sort((a, b) => month(a.date) - month(b.date))) {
    const k = quarters.findLastIndex((q) => month(q.role.from) <= month(m.date));
    gaps[Math.max(0, k)]!.push(m);
  }
  return gaps;
}

export type CraftKind = "craft" | "hauler" | "pod" | "shuttle" | "crane";
export type Way = "dock" | "near" | "far" | "dive" | "high";
export type Call = { mark: Breakthrough; kind: CraftKind; way: Way };
/** the craft that dock, in turn, for the breakthroughs he built with; and those that pass, and how */
const DOCKERS: CraftKind[] = ["craft", "pod", "hauler", "crane"];
const PASSERS: CraftKind[] = ["shuttle", "hauler", "pod", "craft", "crane"];
const WAYS: Way[] = ["near", "far", "dive", "high"];

/** Each breakthrough as a craft: those he built with dock, in turn as DOCKERS; the rest pass, never as the one before. */
export function callsOf(gaps: readonly Breakthrough[][]): Call[][] {
  const flat = gaps.flat();
  let d = 0, p = 0, w = 0;
  const docks = flat.map((m) => (m.built ? DOCKERS[d++ % DOCKERS.length]! : null));
  let prevKind: CraftKind | null = null, prevWay: Way | null = null;
  const calls = flat.map((mark, i): Call => {
    if (docks[i]) { prevKind = docks[i]; return { mark, kind: docks[i], way: "dock" }; }
    const next = docks[i + 1] ?? null;
    for (let n = 0; n < PASSERS.length && [prevKind, next].includes(PASSERS[p % PASSERS.length]!); n++) p++;
    const kind = PASSERS[p++ % PASSERS.length]!;
    if (WAYS[w % WAYS.length] === prevWay) w++;
    const way = WAYS[w++ % WAYS.length]!;
    prevKind = kind; prevWay = way;
    return { mark, kind, way };
  });
  let k = 0;
  return gaps.map((g) => g.map(() => calls[k++]!));
}

/**
 * Each beat's length, in screens of scroll. `depart`: the relay's (Work's intro, then its throw); `core`: the bare core
 * after the flash; `build`: a company's quarter; then its gap: a breakthrough he built with takes `dock` (down the axis,
 * a hold docked, away), one passing `pass` from off the frame to off it, the next starting `every` after it; `settle`
 * after the last; `turn` at the least (the ring's quarter turn); `end`: the closed ring turning, before Projects.
 */
export const BEAT = {
  depart: { come: 0.75, hold: 0.55, align: 0.6, charge: 0.3, throw: 0.4 },
  core: 0.6,
  build: 1.0,
  dock: 0.5,
  every: 0.3,
  pass: 0.4,
  settle: 0.12,
  turn: 0.35,
  end: 0.5,
  /** quarters a screen the closed ring turns on at */
  spin: 0.3,
} as const;

export type WorkPlan = ReturnType<typeof planWork>;

/** The times of Work's beats from `t0` (when Around home has gone): the departure, the bare core, each company's build
 *  and the gap after it, and the closed ring. */
export function planWork({ t0, roles, marks }: { t0: number; roles: readonly Role[]; marks: readonly Breakthrough[] }) {
  let t = t0;
  const span = (len: number): Span => { const s: Span = [t, t + len]; t += len; return s; };
  const D = BEAT.depart;
  const depart = { at: { come: span(D.come), hold: span(D.hold), align: span(D.align), charge: span(D.charge), throw: span(D.throw) } };
  const flash = depart.at.throw[1];
  const core = span(BEAT.core);
  const qs = quartersOf(roles), calls = callsOf(gapsOf(qs, marks));
  const quarters = qs.map((q, i) => {
    const build = span(BEAT.build);
    let u = 0, last = 0;
    const timed = calls[i]!.map((c) => {
      const len = c.way === "dock" ? BEAT.dock : BEAT.pass;
      const at: Span = [build[1] + u, build[1] + u + len];
      last = Math.max(last, u + len);
      u += c.way === "dock" ? BEAT.dock : BEAT.every;
      return { ...c, at };
    });
    const gap = span(Math.max(BEAT.turn, last + BEAT.settle));
    return { ...q, build, gap, calls: timed };
  });
  const end = span(BEAT.end);
  return { depart, flash, core, quarters, end, total: end[1] };
}

const where = (plan: WorkPlan, t: number) => {
  const q = plan.quarters.find((x) => t < x.gap[1]);
  return q ? { q, inBuild: t < q.build[1] } : null;
};

/** How much of home is built at `t`, in quarters (0 its core alone, 4 whole): whole before the jump and after the end. */
export function builtAt(plan: WorkPlan, t: number) {
  if (t < plan.flash) return 4;
  if (t < plan.core[1]) return 0;
  const w = where(plan, t);
  if (!w) return 4;
  const { q, inBuild } = w;
  return inBuild ? q.i + ss(((t - q.build[0]) / (q.build[1] - q.build[0]) - 0.05) / 0.8) : q.i + 1;
}

/** How far the ring has turned at `t`, in quarters: still while a quarter builds, a quarter in the gap after it, and
 *  once it's closed, on at BEAT.spin a screen. */
export function spinAt(plan: WorkPlan, t: number) {
  const last = plan.quarters.at(-1)!;
  if (t >= last.gap[0]) return last.i + (t - last.gap[0]) * BEAT.spin;
  const w = where(plan, t);
  if (!w) return 0;
  const { q, inBuild } = w;
  return inBuild ? q.i : q.i + ss((t - q.gap[0]) / (q.gap[1] - q.gap[0]));
}

/** How busy the build is at `t` (0..1): the share of its drones at work. */
export function busyAt(plan: WorkPlan, t: number) {
  if (t < plan.flash) return 0;
  if (t < plan.core[1]) return 0.25 + 0.75 * ss((t - plan.core[0]) / (plan.core[1] - plan.core[0]) * 1.4 - 0.4);
  const w = where(plan, t);
  if (!w) return t < plan.end[1] ? 0.25 * (1 - (t - plan.end[0]) / (plan.end[1] - plan.end[0])) : 0;
  return w.inBuild ? 1 : 0.35;
}

/** The breakthroughs' craft in play at `t`, each with how far through its call it is (0..1). */
export function callsAt(plan: WorkPlan, t: number) {
  return plan.quarters.flatMap((q) => q.calls).filter((c) => t >= c.at[0] && t <= c.at[1]).map((c) => ({ ...c, k: (t - c.at[0]) / (c.at[1] - c.at[0]) }));
}
