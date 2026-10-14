"use client";

import { useGSAP } from "@gsap/react";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { glideTo, jumpTo, scrollYOf, spotOf } from "@/lib/film/scroll";
import { getTier } from "@/lib/film/tier";
import { registerGsapPlugins } from "@/lib/gsap/register";
import { createDeepLinks } from "@/lib/scroll/deep-links";
import { whenUnlocked } from "@/lib/wake/lock";

const SMOOTH_CONTENT_ID = "smooth-content";

/**
 * Scrolling over the page's native scroll: the document keeps its real height, so the scrollbar, keyboard
 * scrolling, find-in-page and scroll restoration all still work.
 * - In the voyage (the film and its reduced-motion stills) nothing on the page scrolls by: the text is fixed in the
 *   frame and the film eases its own picture behind the scroll. So there's no smoother, and a deep link lands on
 *   the reading spot of the block (or section) it names.
 * - On the plain reading layout ScrollSmoother eases the content after the scroll, and scrolls focused elements
 *   into view itself. Touch scrolling stays native, and under reduced motion there is no smoothing at all.
 *
 * While the smoother runs, anything `position: fixed` must sit outside this wrapper: the content moves by transform.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapper = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    registerGsapPlugins();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smoother = reduced || getTier() !== "plain"
      ? null
      : ScrollSmoother.create({ wrapper: wrapper.current!, content: content.current!, smooth: 1, smoothTouch: false, effects: false });

    const links = createDeepLinks({
      scrollTo(target, smooth) {
        const tier = getTier();
        if (tier !== "plain") {
          const y = typeof target === "number" ? target : scrollYOf(spotOf(target) ?? 0);
          return smooth ? glideTo(y, { reduced: tier === "still" }) : jumpTo(y);
        }
        if (smoother) {
          // a glide's end is fixed when it starts, so measure first in case the content changed this frame
          ScrollTrigger.refresh();
          return smoother.scrollTo(target, smooth, "top top");
        }
        if (typeof target === "number") window.scrollTo({ top: target });
        else target.scrollIntoView({ block: "start" });
      },
      // only a section that's laid out can be landed on: a returning visitor's sections appear after hydration
      find: (id) => {
        const el = document.getElementById(id);
        return el && el.getClientRects().length ? el : null;
      },
      history: window.history,
      location: window.location,
      scrollY: () => window.scrollY,
    });

    // the smoother only measures the content on a window resize; content that grows or shrinks by itself (fonts,
    // images, a message) would leave its scroll limit stale, so a content resize refreshes it (the observer already
    // batches to one call a frame)
    const grown = new ResizeObserver(() => ScrollTrigger.refresh());
    if (smoother) grown.observe(content.current!);

    const onClick = (e: MouseEvent) => links.onClick(e);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", links.onPopState);
    window.addEventListener("hashchange", links.onHashChange);
    // land on the loaded URL's section, and stay anchored to it while the page settles (the sections appear and
    // resize during hydration, and images load in above it) until the visitor first scrolls, presses a key or
    // touches. Under the smoother, refresh first so the document already has the content's new height (the
    // smoother's own resize refresh is debounced, and would clamp the jump).
    const INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    const reland = () => {
      if (smoother) ScrollTrigger.refresh();
      links.landOnHash();
    };
    const anchored = new ResizeObserver(reland);
    const stopAnchoring = () => {
      anchored.disconnect();
      for (const type of INPUT) window.removeEventListener(type, stopAnchoring);
    };
    // (after the wake-up, which opens every load at the top: the link lands as the visitor wakes Tycho)
    const offLanding = whenUnlocked(() => {
      if (links.landOnHash() === "none") return;
      anchored.observe(content.current!);
      for (const type of INPUT) window.addEventListener(type, stopAnchoring, { passive: true });
    });

    return () => {
      offLanding();
      grown.disconnect();
      stopAnchoring();
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", links.onPopState);
      window.removeEventListener("hashchange", links.onHashChange);
      smoother?.kill();
    };
  });

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id={SMOOTH_CONTENT_ID} ref={content}>
        {children}
      </div>
    </div>
  );
}
