"use client";

import { useEffect } from "react";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import type { SectionId } from "@/lib/film/block";
import { sectionHere, sectionSpot } from "@/lib/film/here";
import { glideTo, scrollYOf } from "@/lib/film/scroll";
import { getTier } from "@/lib/film/tier";
import { warpTo } from "@/lib/film/warp";
import { createGoToSection } from "@/lib/routemap/go";
import { on, type ScrollSection } from "@/lib/tool-effects/event-bus";

const SECTION: Record<ScrollSection, SectionId> = { about: "sec-about", work: "sec-work", projects: "sec-projects", contact: "sec-contact" };

/**
 * The agent's `scroll_to`: a warp to the section, as a question's (its explored stars flare and the journey runs a
 * little longer), by the route map's rules: already in that section, it glides back to the section's first reading
 * spot instead. Focus stays where the visitor is typing. On the plain page (no WebGL) it scrolls there.
 */
export function ScrollEffectHandler() {
  useEffect(() => {
    const reduced = () => getTier() === "still";
    const go = createGoToSection({
      here: () => sectionHere(),
      spotOf: sectionSpot,
      glide: (t) => glideTo(scrollYOf(t), { reduced: reduced() }),
      warp: (sec, t) => warpTo(sec, t, { reduced: reduced(), question: true }),
      // the agent never sends you to the start
      replay: () => {},
      history: window.history,
      scrollY: () => window.scrollY,
      active: () => getTier() !== "plain",
    });

    const off = on("scrollTo", ({ section }) => {
      const sec = SECTION[section];
      const el = sec && document.getElementById(sec);
      if (!el) return;
      if (getTier() !== "plain") return void go.goToSection(sec);
      // the plain page scrolls inside the smoother
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTo(el, !window.matchMedia("(prefers-reduced-motion: reduce)").matches, "top 24px");
      else el.scrollIntoView({ block: "start" });
    });
    return () => { off(); };
  }, []);

  return null;
}
