/**
 * Moving through the film by scrolling. The film's time is the scroll from the runway's top in screens, and a screen is the
 * large viewport's height (`--screen`, in px, kept by the runtime), so a phone's toolbar showing and hiding never
 * moves the film.
 * - A jump (a loaded deep link, a typed hash, Back) lands on its frame at once.
 * - A glide (an in-page link, keyboard focus) scrolls there and the film plays through on the way, fast.
 * Anything on the runway lands on the reading spot of the block it's in (or the section it opens).
 */
import gsap from "gsap";

export const JUMP_EVENT = "film:jump";

// the runway's top and the screen as the film's runtime last measured them, so a scroll handler reading them forces
// no style or layout; null while no film runs (the plain page flows, and is measured each time)
let measured: { top: number; screen: number } | null = null;
export function provideMeasures(m: { top: number; screen: number } | null) {
  measured = m;
}

export function screenPx() {
  if (measured) return measured.screen;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--screen").trim();
  return raw.endsWith("px") ? parseFloat(raw) : innerHeight;
}

/** Where the runway starts on the page: the film's first frame is scrolled to here. */
export function runwayTop() {
  if (measured) return measured.top;
  const el = document.getElementById("runway");
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
}

/** The scroll position of the film's time `t`. */
export const scrollYOf = (t: number) => runwayTop() + t * screenPx();

/** The film's time an element on the runway lands at: its block's (or section's) reading spot. */
export function spotOf(el: Element): number | null {
  const holder = el.closest<HTMLElement>("[data-spot]") ?? el.querySelector<HTMLElement>("[data-spot]");
  const spot = holder ? parseFloat(holder.dataset.spot ?? "") : NaN;
  return Number.isFinite(spot) ? spot : null;
}

export function jumpTo(y: number) {
  gsap.killTweensOf(window, "scrollTo");
  window.scrollTo(0, y);
  window.dispatchEvent(new CustomEvent(JUMP_EVENT, { detail: { y } }));
}

/** Glides to `y`; the further it goes the longer it takes, up to 3.4 s. */
export function glideTo(y: number, { reduced = false } = {}) {
  if (reduced) return jumpTo(y);
  const d = Math.abs(y - window.scrollY) / screenPx();
  gsap.to(window, { scrollTo: { y, autoKill: true }, duration: Math.min(3.4, 0.45 + d * 0.065), ease: "power2.inOut", overwrite: true });
}
