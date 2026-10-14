"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { announce } from "@/lib/a11y/announce";
import { footprints } from "@/lib/film/footprints";
import { filmT, sectionHere, spotAt } from "@/lib/film/here";
import { glideTo, scrollYOf } from "@/lib/film/scroll";
import { onStage, type Stage } from "@/lib/film/stage";
import { getTier } from "@/lib/film/tier";
import { isWarping, onWarp, warpTo } from "@/lib/film/warp";
import { on } from "@/lib/tool-effects/event-bus";
import { currentRig, currentRoam } from "@/lib/tycho/current";
import { subjectOf, wayTo, type Subject } from "@/lib/voyage/subjects";

// once the page is at the subject's block, how long the scene has to open (its words writing in) before he points
const SETTLE_S = 0.5;
// how long he holds the point (the subject's moment, about 3 s with his turn in and out)
const HOLD_S = 2.6;
// he points from a standstill: at most this long to wait for a flight under way (home after a warp, a shoo) to end
const PARK_WAIT_S = 3;

/** where the subject is on screen: the stage's own point for it, or else the biggest body in frame */
function targetOf(s: Subject, stage: Stage | null): { x: number; y: number } | null {
  const p = s.ref && stage ? stage.view.point(s.ref) : null;
  if (p && p.z < 1) return { x: p.x, y: p.y };
  let best: { x: number; y: number } | null = null, area = 0;
  for (const r of footprints()) {
    const a = (r.r - r.l) * (r.b - r.t);
    if (a > area) { area = a; best = { x: (r.l + r.r) / 2, y: (r.t + r.b) / 2 }; }
  }
  return best;
}

/**
 * The agent's `highlight_project`, the point: Tycho points from where he is at the subject an answer is about (a
 * world, a moon, a gate, a personal project's screenshot), held about 3 s. If its block isn't the one being read, the
 * page gets there first by the route map's rules: a warp (a question's) to another section, a glide within this one,
 * and he points once the scene has opened. A warp under way finishes first. Under reduced motion the warp is its
 * crossfade and he only looks; on the plain page the page scrolls to the block and nothing points.
 */
export function PointEffectHandler() {
  useEffect(() => {
    let stage: Stage | null = null;
    const offStage = onStage((s) => { stage = s; });
    const reduced = () => getTier() === "still";
    let pending: gsap.core.Tween | null = null;
    let afterWarp: (() => void) | null = null;
    // the ticker checks waiting to point (for him to park, for a glide to settle), removed if the page goes first
    const checks = new Set<() => void>();
    const watch = (check: () => void) => {
      checks.add(check);
      gsap.ticker.add(check);
    };
    const unwatch = (check: () => void) => {
      checks.delete(check);
      gsap.ticker.remove(check);
    };

    // he's parked once his spot hasn't moved for a few frames (or he has no roam: the flat Tycho)
    const whenParked = (fn: () => void) => {
      const roam = currentRoam();
      if (!roam) return fn();
      let last = roam.spot(), still = 0;
      const t0 = gsap.ticker.time;
      const check = () => {
        const now = roam.spot();
        still = Math.hypot(now.x - last.x, now.y - last.y) < 0.5 && now.scale === last.scale ? still + 1 : 0;
        last = now;
        if (still < 8 && gsap.ticker.time - t0 < PARK_WAIT_S) return;
        unwatch(check);
        fn();
      };
      watch(check);
    };

    // what lets him go again after a point (killed early when another point comes, or the page goes)
    let release: (() => void) | null = null;
    const letGo = () => { release?.(); release = null; };
    let gen = 0;
    const point = (s: Subject) => {
      pending?.kill();
      letGo();
      const g = ++gen;
      pending = gsap.delayedCall(SETTLE_S, () => whenParked(() => {
        // a later point (or the page going) took over while he was landing
        if (g !== gen) return;
        pending = null;
        const at = targetOf(s, stage);
        const rig = currentRig();
        // he stays put while he points: no wander or shoo mid-gesture
        const roam = currentRoam();
        roam?.hold(true);
        if (at && rig) rig.pointAt(at.x, at.y, HOLD_S);
        else rig?.emote("point");
        const done = gsap.delayedCall(HOLD_S + 0.5, letGo);
        release = () => { done.kill(); roam?.hold(false); };
        announce(`Tycho points at ${s.name}.`);
      }));
    };

    // waits for the scroll to settle (a glide) before pointing
    const whenStill = (fn: () => void) => {
      const check = () => {
        if (gsap.isTweening(window)) return;
        unwatch(check);
        fn();
      };
      watch(check);
    };

    const go = (slug: string) => {
      const s = subjectOf(slug);
      const el = s && document.querySelector<HTMLElement>(`[data-block="${s.block}"]`);
      if (!s || !el) return;
      if (getTier() === "plain") {
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTo(el, !window.matchMedia("(prefers-reduced-motion: reduce)").matches, "top 24px");
        else el.scrollIntoView({ block: "start" });
        return;
      }
      if (isWarping()) {
        afterWarp = () => go(slug);
        return;
      }
      const spot = spotAt(el);
      const way = wayTo({ t: filmT(), sec: sectionHere() }, { spot, sec: s.sec });
      if (way === "here") return point(s);
      if (way === "glide") {
        glideTo(scrollYOf(spot), { reduced: reduced() });
        return whenStill(() => point(s));
      }
      afterWarp = () => point(s);
      warpTo(s.sec, spot, { reduced: reduced(), question: true });
      // the 3D wasn't in yet, so it glided instead
      if (!isWarping()) { afterWarp = null; whenStill(() => point(s)); }
    };

    const offWarp = onWarp((e) => {
      if (e.phase !== "end" || !afterWarp) return;
      const next = afterWarp;
      afterWarp = null;
      next();
    });
    const off = on("highlightProject", ({ slug }) => go(slug));
    return () => {
      off();
      offWarp();
      offStage();
      checks.forEach(unwatch);
      gen++;
      pending?.kill();
      letGo();
    };
  }, []);

  return null;
}
