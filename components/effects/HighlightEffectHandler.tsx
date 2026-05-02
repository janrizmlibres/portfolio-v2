"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { on } from "@/lib/tool-effects/event-bus";

export function HighlightEffectHandler() {
  useGSAP(() => {
    const off = on("highlightProject", ({ slug }) => {
      // The same slug may match multiple targets (e.g. a sidebar button AND
      // its detail panel in the Work section). Pulse all of them.
      // Double rAF so a sibling listener that calls setState (e.g. WorkSection
      // auto-switching its active tab) has a chance to commit before we query.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cards = document.querySelectorAll(`[data-project-slug="${CSS.escape(slug)}"]`);
          if (cards.length === 0) return;
          // Animate only boxShadow + clearProps after — borderColor would leave
          // an inline override on elements like the active sidebar button,
          // whose Tailwind border isn't `ink-line`.
          gsap.fromTo(
            cards,
            { boxShadow: "0 0 0 0 rgba(232,183,90,0), 0 0 0 rgba(232,183,90,0)" },
            {
              boxShadow: "0 0 0 1px rgba(232,183,90,1), 0 0 32px rgba(232,183,90,0.35)",
              duration: 0.6,
              yoyo: true,
              repeat: 1,
              ease: "power2.out",
              clearProps: "boxShadow",
            }
          );
        });
      });
    });
    return off;
  });

  return null;
}
