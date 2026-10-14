/**
 * The wake-up's loader counts the real load, never backwards, and the wake button waits until it's all in, or for
 * CAP_S at most: nothing loads, builds, compiles or uploads once the charge-up has begun (ADR 0018), unless the cap
 * left some of it to come in after. Each milestone is one thing in:
 * - the first scene: the page, the 3D starting, the stars, three.js, Tycho's model, the ship, the first scene built,
 *   and two frames drawn by both (so every shader has compiled before anything shows);
 * - every later scene, and the warp, each fetched, built, compiled, uploaded and warmed, shadow maps included
 *   (lib/wake/built.ts);
 * - the score's hero layers decoded.
 * The count moves toward the share of them in, at most a full count in FULL_COUNT_S, and never past what has loaded.
 */
export const FIRST_SCENE = ["start", "stars", "three", "tycho", "ship", "scene", "warm"] as const;
export const LATER_SCENES = ["relay", "traffic", "athena", "crawler", "pipeline", "ribbon", "warp"] as const;
export const MILESTONES = ["page", ...FIRST_SCENE, ...LATER_SCENES, "sound"] as const;
export type Milestone = (typeof MILESTONES)[number];

/**
 * The loader's longest wait, in its frame time: past it, with the first scene in, whatever else isn't in yet (a later
 * scene, the warp, the score) is counted in, and is still built in its turn after the wake (ADR 0018). A first scene
 * that isn't in gives way to the plain page before then (gate.ts).
 */
export const CAP_S = 15;

/** The fastest the count may go: a whole count in this many seconds, so even a warm load reads as a count. */
export const FULL_COUNT_S = 0.8;

export function createCount() {
  const done = new Set<Milestone>(["page"]);
  let shown = 0,
    elapsed = 0;
  const target = () => done.size / MILESTONES.length;
  return {
    mark(m: Milestone) {
      if ((MILESTONES as readonly string[]).includes(m)) done.add(m);
    },
    has: (m: Milestone) => done.has(m),
    target,
    /** Moves the count on by `dt` seconds; returns it, 0 to 1. */
    step(dt: number) {
      elapsed += Math.max(0, dt);
      if (elapsed >= CAP_S && FIRST_SCENE.every((m) => done.has(m))) MILESTONES.forEach((m) => done.add(m));
      shown = Math.max(shown, Math.min(target(), shown + Math.max(0, dt) / FULL_COUNT_S));
      return shown;
    },
    shown: () => shown,
    missing: () => MILESTONES.filter((m) => !done.has(m)),
    loaded: () => shown >= 1,
  };
}

/** What a screen reader hears, a polite status every 25 %: what to say at `n` %, if `lastQuarter` hasn't said it. */
export function statusAt(n: number, lastQuarter: number): { say: string; quarter: number } | null {
  const quarter = Math.floor(n / 25);
  if (quarter === lastQuarter) return null;
  return { say: n < 100 ? `Loading, ${quarter * 25} percent` : "Loaded", quarter };
}
