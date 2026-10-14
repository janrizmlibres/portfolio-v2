/**
 * The wake-up's gate: what each input does in each phase.
 * - loading: the loader counts the real load, the whole voyage's (count.ts). charging: Tycho charges up (a show of
 *   fixed length, waiting on nothing). dozing: he sleeps, the wake button shows. stalled: the 3D failed, or its first
 *   scene was still loading after STALL_MS of the loader on screen, so the button shows on the loader and the wake
 *   goes to the plain page. waking: the wake plays. done: the page is the visitor's.
 * - The wake: a click or tap on its target (`on`: his ring or the wake button; the button alone once the 3D has
 *   stalled), or Enter or Space, once he dozes (or the 3D has stalled). A click anywhere else does nothing. Never Esc, which browsers don't count as activation, so it couldn't turn the sound on.
 * - The lock: until he's awake no click reaches the page, and nothing scrolls (wheel, a touch's drag, the scrolling
 *   keys). Tab still moves focus, to the wake button. The development mascot lab (`ui`) stays in reach.
 */
import { FIRST_SCENE, type Milestone } from "./count";

export type Phase = "loading" | "charging" | "dozing" | "stalled" | "waking" | "done";
export type Input = { type: "click"; ui?: boolean; on?: boolean } | { type: "key"; key: string; ui?: boolean } | { type: "wheel" } | { type: "touchmove" };

/** A first scene still loading after the loader has been on screen this long gives way to the plain page. */
export const STALL_MS = 10_000;

const SCROLL_KEYS = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"]);
const WAKE_KEYS = new Set(["Enter", " "]);

export function respond(phase: Phase, input: Input): "wake" | "block" | "pass" {
  if (phase === "done") return "pass";
  const waiting = phase === "dozing" || phase === "stalled";
  switch (input.type) {
    case "wheel":
    case "touchmove":
      return "block";
    case "click":
      if (input.ui) return "pass";
      return waiting && input.on ? "wake" : "block";
    case "key":
      if (input.ui) return "pass";
      if (WAKE_KEYS.has(input.key)) return waiting ? "wake" : "block";
      return SCROLL_KEYS.has(input.key) ? "block" : "pass";
  }
}

/**
 * Whether the load should give up on the 3D now: it failed, or the first scene is still missing after STALL_MS of the
 * loader on screen (`loadMs`, in frame time, so a tab opened in the background isn't charged for its time hidden). The
 * rest never stalls it: what isn't in by the loader's cap is built after the wake (count.ts).
 */
export function stallDue(o: { phase: Phase; loadMs: number; universe: string | undefined; missing: readonly Milestone[] }) {
  if (o.phase !== "loading") return false;
  const first = o.missing.some((m) => (FIRST_SCENE as readonly string[]).includes(m));
  return o.universe === "failed" || (first && o.loadMs >= STALL_MS);
}
