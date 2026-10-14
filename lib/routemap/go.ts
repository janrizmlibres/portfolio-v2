/**
 * Where a route-map link takes you, and how:
 * - to another section, a warp, aimed at that section's first entry (past an intro the scroll passes on the way in:
 *   Work lands on LogoLife, Projects on Athena);
 * - Start replays instead: black, and the film's first frame, back in (never the wake-up, as Contact's "Replay
 *   experience" brings back);
 * - in the section you're already in there's no warp and no replay: it glides back to the section's first entry.
 *   That holds for Start too while you're still in the opening.
 * Every route-map click goes through `goToSection`; its legs (the replay, the glide, the warp) are handed in, so the
 * warp can be swapped without touching the rules. A glide or a warp keeps Back honest as the deep links do: where
 * you were is saved on the entry being left and the section's address is pushed. The replay does that itself.
 */
import type { SectionId } from "@/lib/film/block";
import { pushDeepLink } from "@/lib/scroll/deep-links";

export type Way = "replay" | "glide" | "warp";

/** How a link to `to` goes from `here`, the section the map shows you in. */
export function wayTo(to: SectionId, here: SectionId): Way {
  if (to === here) return "glide";
  return to === "sec-hero" ? "replay" : "warp";
}

type Deps = {
  /** the section you're in, as the map shows it */
  here: () => SectionId;
  /** where a link to a section lands, in film time: its first entry */
  spotOf: (sec: SectionId) => number;
  glide: (t: number) => void;
  warp: (sec: SectionId, t: number) => void;
  /** the replay to the start, given the address it pushes */
  replay: (href: string) => void;
  history: Pick<History, "state" | "pushState" | "replaceState">;
  scrollY: () => number;
  /** whether the film (or its stills) is playing: on the plain page a link is an ordinary deep link */
  active: () => boolean;
};

export function createGoToSection({ here, spotOf, glide, warp, replay, history, scrollY, active }: Deps) {
  function goToSection(sec: SectionId): Way {
    const way = wayTo(sec, here()), href = `#${sec}`;
    if (way === "replay") {
      replay(href);
      return way;
    }
    pushDeepLink(history, scrollY(), href);
    const t = spotOf(sec);
    if (way === "glide") glide(t);
    else warp(sec, t);
    return way;
  }

  return {
    goToSection,
    /** a click on the link to `sec`: a plain click plays its way; a modified one is left to the browser */
    onClick(e: MouseEvent, sec: SectionId) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !active()) return;
      e.preventDefault();
      goToSection(sec);
    },
  };
}
