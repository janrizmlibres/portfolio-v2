/**
 * Where the film is, read from the page: its time (from the scroll; the picture eases to it) and the section it's in
 * (the last one whose first reading spot it has passed, a little early so a section being arrived at counts).
 */
import type { SectionId } from "./block";
import { runwayTop, screenPx } from "./scroll";

const ORDER: SectionId[] = ["sec-hero", "sec-about", "sec-work", "sec-projects", "sec-contact"];

/** the film time a runway element (a section or a block) lands at, from its `data-spot` */
export const spotAt = (el: HTMLElement | null) => Number(el?.dataset.spot ?? 0);

/** where a link to each section lands: its first entry, past an intro the scroll passes on the way in */
export const sectionSpot = (sec: SectionId) => spotAt(document.getElementById(sec));

/** where each section starts: its first reading spot, its intro's if it opens on one */
const sectionTop = (sec: SectionId) => Number(document.getElementById(sec)?.dataset.top ?? 0);

/** the film's time now, in screens */
export const filmT = () => Math.max(0, (window.scrollY - runwayTop()) / screenPx());

/** the section the film is in, or arriving at */
export function sectionHere(t = filmT()): SectionId {
  return ORDER.findLast((s) => sectionTop(s) <= t + 0.3) ?? "sec-hero";
}
