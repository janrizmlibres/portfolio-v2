"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { sectionHere } from "@/lib/film/here";
import { isLite, noteSlow, offered, onOffer, switchTo, type Choice } from "@/lib/film/lite";
import { getTier, onTier, type Tier } from "@/lib/film/tier";

/** how long the offer stays, in s, before it fades */
const OFFER_S = 8;

/**
 * The Lite / Full switch, beside the sound toggle and in its style: `[ LITE ]` in the film, `[ FULL ]` in lite
 * (lib/film/lite.ts). A click keeps the choice and loads the page again in it, at the section the visitor is in. Not
 * on the plain page, nor under reduced motion, whose stills are the only way it plays.
 * When the film can't be held even at the lowest quality, it offers lite once a visit, in a line above it that fades
 * after a few seconds; not clicking it is the dismissal. It never switches by itself.
 */
export function LiteSwitch() {
  const tier = useSyncExternalStore(onTier, getTier, () => "film" as Tier);
  const offer = useSyncExternalStore(onOffer, offered, () => false);
  const [gone, setGone] = useState(false);
  const line = useRef<HTMLButtonElement | null>(null);
  const lite = isLite();

  // the offer comes in, waits, and fades; under reduced motion it shows and goes without moving
  useEffect(() => {
    const el = line.current;
    if (!offer || !el) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    if (still) tl.set(el, { autoAlpha: 1 }).set(el, { autoAlpha: 0 }, OFFER_S);
    else tl.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }).to(el, { autoAlpha: 0, duration: 0.8, ease: "power1.in" }, OFFER_S);
    return () => { tl.kill(); };
  }, [offer]);

  // for the evidence scripts: the governor's verdict, given by hand
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __lite: { slow: noteSlow } });
  }, []);

  if (tier === "plain" || (tier === "still" && !lite)) return null;
  const go = (to: Choice) => switchTo(to, sectionHere());

  return (
    <span className="lite">
      <button
        type="button"
        className="snd-chip lite-chip"
        aria-label={lite ? "Switch to the full version: the moving film" : "Switch to the lite version: lighter on your phone, still pictures instead of the moving film"}
        onClick={() => go(lite ? "full" : "lite")}
      >
        <span aria-hidden="true">[</span> {lite ? "Full" : "Lite"} <span aria-hidden="true">]</span>
      </button>
      {offer && !gone && !lite && (
        <button ref={line} type="button" className="lite-offer" onClick={() => go("lite")}>
          Running slow? Switch to lite
        </button>
      )}
    </span>
  );
}
