"use client";

import { useEffect, useRef, useState } from "react";

export interface ActiveSection {
  /** Semantic slug used by the chat tools and system prompt. */
  sectionId: "about" | "experience" | "work" | "projects" | "contact";
  /** DOM anchor id (without `#`). */
  domId: string;
  /** Human-readable label injected into the system prompt. */
  label: string;
}

const SECTIONS: ActiveSection[] = [
  { sectionId: "about", domId: "sec-about", label: "About" },
  { sectionId: "experience", domId: "sec-work", label: "Work timeline" },
  { sectionId: "work", domId: "sec-selected-projects", label: "Selected professional projects" },
  { sectionId: "projects", domId: "sec-projects", label: "Personal projects" },
  { sectionId: "contact", domId: "sec-contact", label: "Contact" },
];

/**
 * Tracks which section the visitor is currently looking at, using an
 * IntersectionObserver tuned to a thin band near the viewport center.
 *
 * Pass `enabled=false` while the visitor is on State 1 — the State 2 sections
 * aren't mounted yet and there's nothing to observe.
 */
export function useActiveSection(enabled: boolean): ActiveSection | null {
  const [active, setActive] = useState<ActiveSection | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const ratios = new Map<string, number>();

    const pickBest = () => {
      let bestId: string | null = null;
      let bestRatio = 0;
      for (const [id, r] of ratios) {
        if (r > bestRatio) {
          bestRatio = r;
          bestId = id;
        }
      }
      if (!bestId) return;
      const next = SECTIONS.find((s) => s.domId === bestId);
      if (!next) return;
      setActive((prev) => (prev?.domId === next.domId ? prev : next));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        }
        if (debounceRef.current !== null) {
          window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(pickBest, 120);
      },
      {
        // Thin band near the center of the viewport — whichever section
        // crosses it is what the visitor is reading.
        rootMargin: "-40% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Sections may not all be mounted on first render (transition from State 1).
    // Retry until they appear, then stop.
    let cancelled = false;
    let attempts = 0;
    const attach = () => {
      if (cancelled) return;
      let attached = 0;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.domId);
        if (el) {
          observer.observe(el);
          attached++;
        }
      }
      if (attached < SECTIONS.length && attempts < 20) {
        attempts++;
        window.setTimeout(attach, 100);
      }
    };
    attach();

    return () => {
      cancelled = true;
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, [enabled]);

  return active;
}
