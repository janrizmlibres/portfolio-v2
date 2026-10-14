"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/lib/film/block";
import { filmT, sectionHere, spotAt } from "@/lib/film/here";

export interface ActiveSection {
  /** the section's slug, as the chat's tools and system prompt name it */
  sectionId: "hero" | "about" | "work" | "projects" | "contact";
  /** its id on the page (without `#`) */
  domId: SectionId;
  /** what the visitor is reading, for the system prompt: the block's title, and its section */
  label: string;
}

const SECTION_NAME: Record<SectionId, string> = { "sec-hero": "the opening", "sec-about": "About", "sec-work": "Work", "sec-projects": "Projects", "sec-contact": "Contact" };

// the runway's blocks in film order with their spots and titles, read once (the runway is laid at first paint)
let blocks: { spot: number; title: string | undefined }[] | null = null;
const laid = () =>
  (blocks = blocks?.length ? blocks : [...document.querySelectorAll<HTMLElement>("#runway [data-block]")]
    .map((el) => ({ spot: spotAt(el), title: el.querySelector("h1, h2, h3")?.textContent?.trim() }))
    .sort((a, b) => a.spot - b.spot));

/** the title of the block being read at film time `t`: the last one whose reading spot the film has reached */
const titleAt = (t: number) => laid().findLast((b) => b.spot <= t + 0.3)?.title;

function read(): ActiveSection {
  const t = filmT(), sec = sectionHere(t);
  const title = titleAt(t);
  const name = SECTION_NAME[sec];
  return { sectionId: sec.slice(4) as ActiveSection["sectionId"], domId: sec, label: title && title !== name ? `${title} (in ${name})` : name };
}

/**
 * What the visitor is reading on the voyage, from the film's time: its section and the block at its reading spot
 * (each `[data-block]` on the runway is laid at its spot). Read at most once a frame while scrolling.
 */
export function useActiveSection(enabled: boolean): ActiveSection | null {
  const [active, setActive] = useState<ActiveSection | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const next = read();
      setActive((prev) => (prev?.label === next.label && prev.domId === next.domId ? prev : next));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return active;
}
