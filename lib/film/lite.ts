/**
 * Lite: the voyage for a device that can't hold the film. It plays the `still` tier (one still per reading spot,
 * crossfaded, nothing moving between), and Tycho is his flat drawing, so no 3D draws between reading spots.
 * `<html data-lite>` marks it beside `data-film="still"`; reduced motion's stills aren't lite, and offer no switch.
 * - Who starts in lite is decided before first paint, in the head script (`TIER_SCRIPT`, tier.ts), by the same rule
 *   as `startVersion` (tier.test.ts holds the two together).
 * - The visitor's choice (the `[ LITE ]` / `[ FULL ]` switch beside the sound toggle) is kept per browser under
 *   `jrz-film-v1`, and wins.
 * - With no choice kept, a weak device starts in lite (a GPU from a slow family, or little memory with few cores:
 *   lib/universe/tier.ts), and so does a browser where an earlier visit's governor bottomed out (at the lowest quality,
 *   its pixel ratio at its floor, still missing frames), which is kept as its verdict, `slow`.
 * - `?film=film|still|plain` plays that version, in production too, over the choice and the rule; never over reduced
 *   motion, or a device without WebGL.
 * Nothing switches mid-visit: a visit that bottoms out offers lite once, and the next one starts in it.
 */
import { markSwitched } from "@/lib/wake/script";

/** where the choice and the verdict are kept */
export const KEY = "jrz-film-v1";

export type Choice = "lite" | "full";
/** what's kept per browser: the visitor's choice, if they made one, and whether a visit was too slow for the film */
export type Kept = { choice: Choice | null; slow: boolean };

const NOTHING: Kept = { choice: null, slow: false };

/** What's kept, from its stored text: anything else is nothing kept. */
export function readKept(raw: string | null): Kept {
  let v: unknown = null;
  try { v = raw ? JSON.parse(raw) : null; } catch { return NOTHING; }
  if (!v || typeof v !== "object") return NOTHING;
  const { choice, verdict } = v as Record<string, unknown>;
  return { choice: choice === "lite" || choice === "full" ? choice : null, slow: verdict === "slow" };
}

/** What's kept, as stored text. */
export const writeKept = ({ choice, slow }: Kept) => JSON.stringify({ ...(choice && { choice }), ...(slow && { verdict: "slow" }) });

/** How a visit plays: the film, lite, reduced motion's stills, or the plain page. */
export type Version = "film" | "lite" | "still" | "plain";

/** What a visit starts from. `asked`: the address's `?film=`; `weak`: the device by its stricter signals. */
export type Start = { webgl: boolean; reduced: boolean; asked: string | null; kept: Kept; weak: boolean };

export function startVersion({ webgl, reduced, asked, kept, weak }: Start): Version {
  if (!webgl || asked === "plain") return "plain";
  if (reduced) return "still";
  if (asked === "still") return "lite";
  if (asked === "film") return "film";
  if (kept.choice) return kept.choice === "lite" ? "lite" : "film";
  return kept.slow || weak ? "lite" : "film";
}

// ---------------------------------------------------------------- in the page

/** Whether this visit plays lite. */
export const isLite = () => typeof document !== "undefined" && document.documentElement.dataset.lite !== undefined;

function kept(): Kept {
  try { return readKept(localStorage.getItem(KEY)); } catch { return NOTHING; }
}
function keep(k: Kept) {
  try {
    localStorage.setItem(KEY, writeKept(k));
    return true;
  } catch {
    return false;
  }
}

let judged = false, offer = false;
const listeners = new Set<() => void>();

/**
 * The governor has bottomed out, in the film: kept as the verdict, so the next visit starts in lite (a choice kept
 * still wins), and lite is offered, once a visit. Not to a visitor who chose the film: they know where the switch is.
 */
export function noteSlow() {
  if (judged || document.documentElement.dataset.film !== "film") return;
  judged = true;
  const k = kept();
  keep({ ...k, slow: true });
  if (k.choice === "full") return;
  offer = true;
  listeners.forEach((l) => l());
}
/** Whether lite is on offer this visit. */
export const offered = () => offer;
export function onOffer(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/**
 * Keeps the visitor's choice and loads the page again in it, landing on section `sec` (its deep link). Where nothing
 * can be kept (storage blocked), the address carries it instead. The reload skips the wake-up's charge-up: its loader
 * builds the voyage, then the page is the visitor's at once (`markSwitched`, lib/wake/script.ts).
 */
export function switchTo(choice: Choice, sec: string) {
  const url = new URL(location.href);
  url.searchParams.delete("film");
  if (!keep({ ...kept(), choice })) url.searchParams.set("film", choice === "lite" ? "still" : "film");
  url.hash = sec;
  history.replaceState(history.state, "", url);
  markSwitched();
  location.reload();
}
