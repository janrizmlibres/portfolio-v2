"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { on } from "@/lib/tool-effects/event-bus";

export function HighlightEffectHandler() {
  useGSAP(() => {
    const off = on("highlightProject", ({ slug }) => {
      const card = document.querySelector(`[data-project-slug="${slug}"]`);
      if (!card) return;
      gsap.fromTo(
        card,
        { boxShadow: "0 0 0 0 rgba(232,183,90,0)", borderColor: "var(--color-ink-line)" },
        {
          boxShadow: "0 0 0 1px var(--color-saffron-500), 0 0 32px rgba(232,183,90,0.18)",
          borderColor: "var(--color-saffron-500)",
          duration: 0.6,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    });
    return off;
  });

  return null;
}
