"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { provideStage, type Stage } from "@/lib/film/stage";
import { getTier, onTier, setTier } from "@/lib/film/tier";
import { provideSky } from "@/lib/universe/live";
import { createUniverseLoader, supportsWebGL2, whenIdleAfterLoad } from "@/lib/universe/loader";
import { quality, skyTier } from "@/lib/universe/tier";
import type { Sky } from "@/lib/universe/sky";

/**
 * The universe behind the page. There is no loading screen: the page is complete in HTML first, and the sky
 * loads once the page has painted and gone idle, then fades in, with the voyage's stage, which the film then
 * plays. Without WebGL, or if it fails to load, the page becomes the plain reading layout. The container's
 * `data-universe` attribute carries the readiness state.
 */
export function Universe() {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = canvas.current!, container = box.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stage: Stage | null = null;

    const loader = createUniverseLoader<Sky>({
      // the plain reading layout draws no universe
      supportsWebGL: () => getTier() !== "plain" && supportsWebGL2(),
      afterFirstPaint: () => whenIdleAfterLoad(),
      async load() {
        const { loadSky } = await import("@/lib/universe/load");
        const tier = skyTier({ width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio || 1 }, quality());
        const sky = await loadSky(el, { tier, reduced });
        if (getTier() !== "plain") {
          try {
            const { createVoyageStage } = await import("@/lib/voyage/stage");
            stage = createVoyageStage({ sky });
            await stage.ready;
          } catch (e) {
            stage?.dispose();
            stage = null;
            sky.dispose();
            throw e;
          }
          provideStage(stage);
          // the later scenes build under the wake-up's loader; `data-stage="whole"` says they're all in
          void stage.whole?.then(() => { container.dataset.stage = "whole"; });
        }
        if (process.env.NODE_ENV !== "production") Object.assign(window, { __sky: sky, __skyTier: tier });
        provideSky(sky);
        return sky;
      },
      discard(sky) {
        provideSky(null);
        if (stage) {
          provideStage(null);
          stage.dispose();
          stage = null;
        }
        sky.dispose();
      },
    });

    const unsubscribe = loader.subscribe((status) => {
      container.dataset.universe = status;
      if (status === "unsupported" || status === "failed") setTier("plain");
      if (status === "ready") gsap.to(el, { opacity: 1, duration: reduced ? 0.3 : 1.6, ease: "power1.inOut" });
    });
    loader.start();
    // given up on for the plain page (the wake-up's fallback, when the 3D is late): a universe that arrives after
    // that is never shown
    const offTier = onTier((t) => {
      if (t === "plain") loader.cancel();
    });
    // a GPU context lost and not given back soon: the plain page
    let gone = 0;
    const onLost = () => { gone = window.setTimeout(() => setTier("plain"), 3000); };
    const onRestored = () => window.clearTimeout(gone);
    el.addEventListener("webglcontextlost", onLost);
    el.addEventListener("webglcontextrestored", onRestored);

    return () => {
      window.clearTimeout(gone);
      el.removeEventListener("webglcontextlost", onLost);
      el.removeEventListener("webglcontextrestored", onRestored);
      offTier();
      unsubscribe();
      loader.cancel();
    };
  }, []);

  return (
    <div ref={box} aria-hidden data-universe="waiting" className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={canvas} className="block h-[100lvh] w-full opacity-0" />
    </div>
  );
}
