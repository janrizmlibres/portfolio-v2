"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";

/**
 * Fixed full-viewport overlays:
 *   - SVG grain at ~6% opacity (mix-blend overlay)
 *   - Soft saffron + phosphor radial gradient that drifts in a slow loop
 *
 * Sits behind all content (z-0). `<main>` and friends should be z-2.
 */
export function AmbientBackdrop() {
  const bloomRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!bloomRef.current) return;
    gsap.to(bloomRef.current, {
      backgroundPositionX: "+=80px",
      backgroundPositionY: "-=60px",
      duration: 60,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  });

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.94  0 0 0 0 0.92  0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        ref={bloomRef}
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 25% 18%, rgba(232,183,90,0.10), transparent 60%), radial-gradient(ellipse 45% 35% at 75% 75%, rgba(94,229,217,0.06), transparent 60%)",
          backgroundRepeat: "no-repeat",
          willChange: "background-position",
        }}
      />
    </>
  );
}
