"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { CompactHero } from "./CompactHero";
import { CurrentlyStrip } from "./CurrentlyStrip";
import { AboutSection } from "./AboutSection";
import { WorkSection } from "./WorkSection";
import { PersonalProjectsSection } from "./PersonalProjectsSection";
import { ContactSection } from "./ContactSection";

interface Props {
  chatPanelSlot: React.ReactNode;
  chatCollapsed?: boolean;
}

const EXPANDED_TRACK = "minmax(0,1fr) 380px";
const COLLAPSED_TRACK = "minmax(0,1fr) 56px";
const LG_QUERY = "(min-width: 1024px)";

export function StateTwoView({ chatPanelSlot, chatCollapsed }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = gridRef.current;
      if (!el) return;

      if (!window.matchMedia(LG_QUERY).matches) {
        // Below lg the grid is single-column via Tailwind; clear any inline
        // override left over from a previous wide-viewport render.
        el.style.gridTemplateColumns = "";
        return;
      }

      const target = chatCollapsed ? COLLAPSED_TRACK : EXPANDED_TRACK;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        el.style.gridTemplateColumns = target;
        return;
      }

      gsap.to(el, {
        gridTemplateColumns: target,
        duration: 0.45,
        ease: "power3.inOut",
      });
    },
    { dependencies: [chatCollapsed] }
  );

  const initialLgTrack = chatCollapsed
    ? "lg:[grid-template-columns:minmax(0,1fr)_56px]"
    : "lg:[grid-template-columns:minmax(0,1fr)_380px]";

  return (
    <section id="state-2" aria-label="Portfolio with side chat" className="relative z-[2] min-h-dvh">
      <div
        ref={gridRef}
        className={`grid gap-4 px-4 pb-16 pt-6 sm:px-8 lg:gap-8 lg:px-12 max-lg:pb-[35vh] ${initialLgTrack}`}
      >
        <div className="min-w-0 max-w-[78rem]">
          <CompactHero />
          <CurrentlyStrip />
          <AboutSection />
          <WorkSection />
          <PersonalProjectsSection />
          <ContactSection />
        </div>
        {chatPanelSlot}
      </div>
    </section>
  );
}

