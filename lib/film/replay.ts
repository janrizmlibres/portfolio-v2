/**
 * "Replay experience" sends you to the very start, as Edolus's replay does, instead of playing the whole film back:
 * back to the loader with his name, without the loading count since everything's loaded already. The frame fades to black (0.5 s, 0.25 under reduced motion), the page lands on
 * the film's first frame under it, and the wake-up comes back from its loader (`rewake`), which is black: the black
 * goes at once under it. The score dips under the black and stays there, never stopping, until he's woken again.
 * Where this page has no wake-up (an automated browser, `?wake=off`), it fades back in on the first frame instead:
 * a hold (0.4 s) and a fade in (1 s), the score coming back with it; under reduced motion only a crossfade. The route
 * map's Start, started from code, always does that: it never goes back to the wake-up.
 * Back stays honest the way deep links keep it: where you were is saved on the entry being left, and the start's
 * address is pushed, so Back returns to Contact. Only the film and its stills replay; the plain page scrolls as any
 * in-page link does.
 */
import { pushDeepLink } from "@/lib/scroll/deep-links";

type Deps = {
  /** the black over the frame: fades its opacity to `to` over `s` seconds */
  veil: { fade: (to: number, s: number) => Promise<void> };
  wait: (s: number) => Promise<void>;
  /** lands on the film's first frame at once */
  jumpToStart: () => void;
  /** the score dips under the black (`down`) and comes back as it lifts, over `s` seconds; it never stops */
  dip?: (down: boolean, s: number) => void;
  history: Pick<History, "state" | "pushState" | "replaceState">;
  scrollY: () => number;
  reduced: () => boolean;
  /** whether the film (or its stills) is what's playing */
  active: () => boolean;
  /** brings the wake-up back from its loader; false where this page has none */
  rewake?: () => boolean;
};

export function createReplay({ veil, wait, jumpToStart, dip, history, scrollY, reduced, active, rewake }: Deps) {
  let running = false;

  /** `experience`: Contact's "Replay experience", which may bring the wake-up back; otherwise only the first frame */
  async function run(experience: boolean) {
    running = true;
    try {
      const still = reduced(), wake = experience && !!rewake;
      const out = still ? 0.25 : wake ? 0.5 : 0.6, back = still ? 0.4 : 1;
      dip?.(true, out);
      await veil.fade(1, out);
      jumpToStart();
      // the wake-up's loader, black, takes over from the black; the score stays under until he's woken
      if (wake && rewake?.()) return void (await veil.fade(0, 0));
      if (!still) await wait(0.4);
      const lift = veil.fade(0, back);
      dip?.(false, back);
      await lift;
    } finally {
      running = false;
    }
  }

  /**
   * Replays, pushing `href` (the start's address) after saving where you were; does nothing while one is under way.
   * From code (the route map's Start) it lands on the first frame; `experience` (Contact's link) brings the wake-up back.
   */
  function start(href: string | null, experience = false) {
    if (running) return;
    pushDeepLink(history, scrollY(), href);
    void run(experience);
  }

  return {
    start,
    onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !active()) return;
      const a = (e.target as Element | null)?.closest?.("a[data-back]");
      if (!a) return;
      e.preventDefault();
      start(a.getAttribute("href"), true);
    },
  };
}
