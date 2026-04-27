"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { on } from "@/lib/tool-effects/event-bus";

const SECTION_IDS = {
  about: "#sec-about",
  work: "#sec-work",
  projects: "#sec-projects",
  contact: "#sec-contact",
} as const;

export function ScrollEffectHandler() {
  const lastSectionRef = useRef<string | null>(null);

  useGSAP(() => {
    const off = on("scrollTo", ({ section }) => {
      const target = SECTION_IDS[section];
      if (!target || !document.querySelector(target)) return;

      // Pulse marker
      document.querySelectorAll(".scrolled-to").forEach((el) => el.classList.remove("scrolled-to"));
      document.querySelector(target)!.classList.add("scrolled-to");
      lastSectionRef.current = target;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        document.querySelector(target)!.scrollIntoView({ block: "start" });
        return;
      }
      gsap.to(window, {
        duration: 0.9,
        scrollTo: { y: target, offsetY: 24 },
        ease: "power3.inOut",
      });
    });
    return off;
  });

  return null;
}
