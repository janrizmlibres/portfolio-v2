"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CONTACT } from "@/lib/content/voyage";
import { createFilmRuntime } from "@/lib/film/runtime";
import { createReplay } from "@/lib/film/replay";
import { replayWake } from "@/lib/wake/replay";
import { jumpTo, scrollYOf } from "@/lib/film/scroll";
import { layRunway } from "@/lib/film/spots";
import { getTier } from "@/lib/film/tier";
import { createHand, HAND_FLING } from "@/lib/voyage/hand";
import { voyageScript } from "@/lib/voyage/script";
import type { SectionId } from "@/lib/film/block";
import { RouteMap } from "@/components/routemap/RouteMap";
import { Runway } from "./Runway";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { currentSound } from "@/lib/audio/current";
import { createHandSound } from "@/lib/audio/hand-sound";
import { followFilm } from "@/lib/audio/follow";
import { followWarp } from "@/lib/audio/warp-sound";
import { onWarp } from "@/lib/film/warp";
import { voyageCues } from "@/lib/audio/cues";
import { askTycho } from "@/lib/chat/ask";

const script = voyageScript();
const runway = layRunway(script.blocks, script.total);
// where the hero ends: a star hovered before it makes no sound
const HERO_END = Math.max(...script.scenes.filter((s) => s.sec === "sec-hero").map((s) => s.t1));
const spots = runway.blocks.map((b) => b.spot);
// where each section's link lands: its first entry, past its intro
const secSpots = Object.fromEntries(runway.sections.map((s) => [s.id, s.land])) as Record<SectionId, number>;

/**
 * The voyage: the page's text as the film's runway, played by the scroll. The picture is the universe's (loaded
 * after first paint); this places and writes the text over it, and keeps the reduced-motion stills and the labels'
 * leader lines. Each block's "Ask Tycho about …" button asks Tycho.
 */
export function Voyage() {
  const root = useRef<HTMLDivElement | null>(null);
  const leaders = useRef<SVGSVGElement | null>(null);
  const stillA = useRef<HTMLCanvasElement | null>(null);
  const stillB = useRef<HTMLCanvasElement | null>(null);
  const veil = useRef<HTMLDivElement | null>(null);
  const handLayer = useRef<HTMLDivElement | null>(null);
  const filmRef = useRef<{ t: number } | null>(null);
  const replayRef = useRef<ReturnType<typeof createReplay> | null>(null);

  useEffect(() => {
    const film = createFilmRuntime({
      root: root.current!,
      blocks: runway.blocks,
      total: script.total,
      leaders: leaders.current!,
      stills: [stillA.current!, stillB.current!],
      timeZone: CONTACT.timeZone,
      flingFeel: HAND_FLING,
    });
    filmRef.current = film;
    // the score follows the film's scene and speed, and each scene change sounds as its moment is crossed
    const offScore = followFilm(currentSound, film, script.scenes, voyageCues(script));
    // the warp's riser and arrival, off its legs
    const offWarp = followWarp(onWarp, currentSound);
    // the hand: stars, chips and the drag, over the picture; made after the film, so each frame it reads what the
    // film has just drawn
    // (`?nohand` leaves it out while its frame cost is measured, in development only)
    const handOff = process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).has("nohand");
    const hand = handOff
      ? null
      : createHand({ layer: handLayer.current!, film, script, onAsk: askTycho, sound: createHandSound(currentSound, "celesta", { skyWhole: () => film.t <= 0.02, quiet: () => film.t < HERO_END }) });
    const onClick = (e: MouseEvent) => {
      const b = (e.target as Element).closest<HTMLButtonElement>(".askb");
      if (b?.dataset.q) askTycho(b.dataset.q);
    };
    const el = root.current!;
    el.addEventListener("click", onClick);
    // "Replay experience": to the very start under a fade to black, and the wake-up again. It listens before the deep
    // links do, which leave a click it has taken alone.
    const replay = createReplay({
      veil: { fade: (to, s) => new Promise((done) => { gsap.to(veil.current, { opacity: to, duration: s, ease: to ? "power2.in" : "power2.out", overwrite: true, onComplete: () => done() }); }) },
      wait: (s) => new Promise((done) => { gsap.delayedCall(s, done); }),
      jumpToStart: () => jumpTo(scrollYOf(0)),
      dip: (down, s) => currentSound()?.dip(down, s),
      history: window.history,
      scrollY: () => window.scrollY,
      reduced: () => getTier() === "still",
      active: () => getTier() !== "plain",
      rewake: replayWake,
    });
    document.addEventListener("click", replay.onClick, true);
    replayRef.current = replay;
    // `?perf`: the frame readout, loaded only when asked for (lib/film/perf-hud.ts)
    let perfOff: (() => void) | null = null, gone = false;
    if (new URLSearchParams(location.search).has("perf"))
      void import("@/lib/film/perf-hud").then((m) => { if (!gone) perfOff = m.startPerfHud({ film }); });
    return () => {
      gone = true;
      perfOff?.();
      el.removeEventListener("click", onClick);
      document.removeEventListener("click", replay.onClick, true);
      filmRef.current = null;
      replayRef.current = null;
      offScore();
      offWarp();
      hand?.destroy();
      film.destroy();
    };
  }, []);

  return (
    <>
      <RouteMap script={script} spots={spots} secSpots={secSpots} film={filmRef} replay={replayRef} />
      <div ref={root}>
        <Runway runway={runway} clock="--:--" />
      </div>
      <svg id="leaders" ref={leaders} aria-hidden="true" />
      <div id="stills" aria-hidden="true">
        <canvas ref={stillA} />
        <canvas ref={stillB} />
      </div>
      <div id="hand" ref={handLayer} aria-hidden="true" />
      <div id="veil" ref={veil} aria-hidden="true" />
      <SoundToggle />
    </>
  );
}
