"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HERO_AZ } from "@/lib/voyage/route";
import { createCount, statusAt } from "@/lib/wake/count";
import { respond, stallDue, type Input, type Phase } from "@/lib/wake/gate";
import { unlock } from "@/lib/wake/lock";
import { onBuilt } from "@/lib/wake/built";
import { offerReplay, onReplayWake, wakeClasses } from "@/lib/wake/replay";
import { setTier } from "@/lib/film/tier";
import { currentRig } from "@/lib/tycho/current";
import { onSky } from "@/lib/universe/live";
import type { TychoRig } from "@/lib/tycho/rig";
import type { Sky } from "@/lib/universe/sky";
import type { Sound } from "@/lib/audio/engine";
import { soundWasOff } from "@/lib/audio/mute";
import { swayAt } from "@/lib/wake/sway";
import { drawGlow, drawSky, skySide } from "@/lib/wake/stage";
import "./wake.css";

/**
 * The wake-up, every load's opening (ADR 0005). The page's HTML is complete underneath throughout.
 * 1. The loader: black, the name typing in a letter at a time over a small count of the real load (lib/wake/count),
 *    never backwards: the whole voyage, every scene fetched, built and warmed, and the score's hero layers (ADR 0018). At 100 a hairline of the stars' light sweeps across the name, the name fades, and the black
 *    fades onto Tycho's stage.
 * 2. The charge-up, a show now the load is done: Tycho on a black stage, lit low key, a faint cool glow behind him and
 *    his sky drifting round him, as if he'd tumbled alone through space for ages (the Milky Way, distant galaxies, a
 *    cluster and a satellite passing), the camera coming round and in as his band fills a segment at a time; then he
 *    dozes, his pose held. The pointer sways the camera a few degrees, the sky drifting against it.
 * 3. The wake button: a bare `[ WAKE ME ]` in mono capitals, its brackets spreading with the pointer's speed. He stands
 *    in a ring whose eight arcs light with his band, and the button is the trigger in his state machine under him
 *    (charging, dozing, the button, awake), over his readout.
 * 4. The wake (a click or tap on his ring, or on the button; or Enter or Space; lib/wake/gate): the
 *    sound comes on inside the gesture, his
 *    studio light comes back, the sky comes up, he flies to his corner as the name's rows rise in, and he greets.
 * Until then nothing scrolls and nothing else answers (the lock). "Replay experience" (Contact's, and the route map's
 * Start) brings it back from the loader, the name on black without the count, since everything's loaded, and the wake
 * brings the score back up rather than turning it on (lib/wake/replay). 3D that fails, or whose first scene is still loading
 * at about 10 s, gives way to the plain page: the button shows on the loader, and the wake opens onto the plain page with the flat
 * Tycho parked in his corner. Under reduced motion the name and count show whole, the charge steps, and every move is
 * a short fade. Without WebGL there's no wake-up (the head script, lib/wake/script, never marks it).
 */

const NAME = "JANRIZ LIBRES";
const PHONES = "Turns the sound on · best with headphones";
const CLASSES = ["wake", "wake-lock", "wake-centre", "wake-still"];
// his stage canvas is this much bigger than the square he fills (wake.css), so the camera stands this much further
// back: the same framing, with room above for his antenna
const ROOM = 1.22;
// the letters type from faint to bright
const FAINT = "rgba(244, 246, 255, 0.09)",
  INK = "rgba(244, 246, 255, 1)";
// the ring's eight arcs, clockwise from the top, a little apart (its viewBox is 100 across, centred)
const ARCS = Array.from({ length: 8 }, (_, i) => {
  const at = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(49 * Math.cos(a)).toFixed(2)} ${(49 * Math.sin(a)).toFixed(2)}`;
  };
  return `M${at(i * 45 + 3)} A49 49 0 0 1 ${at(i * 45 + 42)}`;
});

export function WakeUp() {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("wake")) return;
    const el = root.current!;
    let stop = run(html, el);
    // "Replay experience" brings it back from its loader, under the replay's black
    const withdraw = offerReplay();
    const offReplay = onReplayWake(() => {
      stop();
      rest(el);
      html.classList.add(...wakeClasses(matchMedia("(prefers-reduced-motion: reduce)").matches));
      stop = run(html, el, { replay: true });
    });
    return () => {
      withdraw();
      offReplay();
      stop();
    };
  }, []);

  return (
    <div id="wake" ref={root}>
      <div className="wk-load" aria-hidden="true">
        <p className="wk-mark">
          {[...NAME].map((c, i) => (
            <span key={i}>{c === " " ? " " : c}</span>
          ))}
          <i className="wk-sweep" />
        </p>
        <p className="wk-pct">
          <span>0</span>%
        </p>
      </div>
      <p className="wk-status" role="status" aria-live="polite" />
      <div className="wk-sky" aria-hidden="true">
        <canvas className="wk-glow" />
        <div className="wk-far">
          <canvas className="wk-stars" />
        </div>
        <i className="wk-sat" />
      </div>
      <div className="wk-frame" aria-hidden="true">
        <div className="wk-fin">
          <svg className="wk-ring" viewBox="-50 -50 100 100">
            <circle className="base" r="49" />
            {ARCS.map((d, i) => (
              <path key={i} className="arc lit" data-seg={i} d={d} />
            ))}
          </svg>
        </div>
      </div>
      <div className="wk-ctl">
        <div className="wk-states">
          <span className="st" data-st="charging" aria-hidden="true">
            <b>Charging</b>
            <i />
          </span>
          <span className="ln" aria-hidden="true">
            <i />
          </span>
          <span className="st" data-st="dozing" aria-hidden="true">
            <b>Dozing</b>
            <i />
          </span>
          <span className="ln" aria-hidden="true">
            <i />
          </span>
          <button type="button" className="wk-chip" aria-label="Wake Tycho (turns on sound)">
            <span className="br l">[</span>
            <b>Wake me</b>
            <span className="br r">]</span>
          </button>
          <span className="ln" aria-hidden="true">
            <i />
          </span>
          <span className="st" data-st="awake" aria-hidden="true">
            <b>Awake</b>
            <i />
          </span>
        </div>
        <p className="wk-read" aria-hidden="true">
          Band <span className="r-n">0</span>/8 · eyes <span className="r-eyes">shut</span> · sound <span className="r-snd">off</span>
        </p>
        <p className="wk-phones" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * The wake-up's stage as it stood before it first ran: what the last run's tweens left on it, and its words, taken off
 * (the stars keep the size and place they're drawn at).
 */
function rest(el: HTMLDivElement) {
  const all = [el, ...el.querySelectorAll<HTMLElement>("*")];
  gsap.killTweensOf(all);
  gsap.set(all, { clearProps: "opacity,visibility,transform,color" });
  el.querySelector<HTMLElement>(".wk-ctl")!.style.top = "";
  for (const k of ["state", "chip", "phones", "stalled"]) delete el.dataset[k];
  const say = (sel: string, text: string) => { el.querySelector(sel)!.textContent = text; };
  say(".wk-pct span", "0");
  say(".wk-status", "");
  say(".wk-phones", "");
  say(".wk-read .r-n", "0");
  say(".wk-read .r-eyes", "shut");
  say(".wk-read .r-snd", "off");
}

/**
 * The wake-up itself: the loader, the charge, the doze and the wake. Returns its teardown. Replayed, the loader shows
 * the name alone and goes on once it's typed: everything's loaded, so there's nothing to count or wait for.
 */
function run(html: HTMLElement, el: HTMLDivElement, o: { replay?: boolean } = {}) {
  const q = <T extends Element>(s: string) => el.querySelector<T>(s)!;
  const load = q<HTMLDivElement>(".wk-load"),
    chip = q<HTMLButtonElement>(".wk-chip"),
    phones = q<HTMLParagraphElement>(".wk-phones"),
    status = q<HTMLParagraphElement>(".wk-status"),
    pct = q<HTMLSpanElement>(".wk-pct span"),
    ctl = q<HTMLDivElement>(".wk-ctl"),
    frame = q<HTMLDivElement>(".wk-frame"),
    read = q<HTMLParagraphElement>(".wk-read"),
    stage = q<HTMLDivElement>(".wk-sky");
  const still = html.classList.contains("wake-still");
  const states = el.querySelectorAll<HTMLElement>(".wk-states .st, .wk-states .ln");
  // the lines between his states: on to dozing, into the button, on to awake
  const lines = el.querySelectorAll<HTMLElement>(".wk-states .ln i");
  const line = (i: number) => lines[i]!;
  let pulse: gsap.core.Tween | null = null;
  const box = () => document.querySelector<HTMLElement>("#tycho .tycho-body");
  let phase: Phase = "loading";
  const tl = gsap.timeline();
  // `kills` is everything, for unmounting; `listeners` only what must stop once he's awake
  const kills: Array<() => void> = [() => tl.kill()];
  const listeners: Array<() => void> = [];
  const listen = (off: () => void) => {
    kills.push(off);
    listeners.push(off);
  };

  // the voyage's text is out of reach until he wakes: no focus, no find, no clicks (the HTML is still all there)
  const runway = document.getElementById("runway");
  runway?.setAttribute("inert", "");
  listen(() => runway?.removeAttribute("inert"));

  // ---------------------------------------------------------------- the name types in, a letter at a time
  const letters = el.querySelectorAll(".wk-mark span");
  if (!still) tl.fromTo(letters, { color: FAINT }, { color: INK, duration: 0.01, stagger: 0.075 }, 0.35);
  // replayed, no count: the loader gives way once the name is in
  if (o.replay) {
    gsap.set(q(".wk-pct"), { autoAlpha: 0 });
    tl.call(() => loaded(), [], still ? 0.2 : 0.35 + NAME.length * 0.075 + 0.4);
  }

  // ---------------------------------------------------------------- the count: real milestones, never backwards
  const count = createCount();
  const uni = document.querySelector<HTMLElement>("[data-universe]");
  const uniCanvas = () => uni?.querySelector("canvas") ?? null;
  const onUni = () => {
    const s = uni?.dataset.universe;
    if (s === "loading") count.mark("start");
    if (s === "ready") {
      (["start", "stars", "ship", "scene"] as const).forEach((m) => count.mark(m));
      // the universe fades itself in when it's ready; under the loader, keep it dark for the charge-up's black stage
      requestAnimationFrame(() => stageSky(false, 0));
    }
    // WebGL that turned out not to work: no wake-up, only the plain page
    if (s === "unsupported") finish();
  };
  const mo = new MutationObserver(onUni);
  if (uni) mo.observe(uni, { attributes: true, attributeFilter: ["data-universe"] });
  listen(() => mo.disconnect());
  // the score's hero layers, decoded before the click; a failure leaves the page silent, never stuck
  let sound: Sound | null = null,
    owed = false;
  const wakeSound = () => {
    // woken before the engine arrived: it's woken as it arrives, outside the gesture, where a browser that wants one
    // leaves the context suspended and the sound toggle offers the restore
    if (!sound) return void (owed = true);
    if (o.replay) sound.rewake();
    else sound.wake();
  };
  import("@/lib/audio/client")
    .then((m) => {
      sound = m.sound();
      if (owed) wakeSound();
      // replayed, the score is in already, held under the replay's black
      return o.replay ? undefined : sound.loadHero();
    })
    .then(
      () => count.mark("sound"),
      () => count.mark("sound"),
    );
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.name.includes("/sky/stars-pca.json")) count.mark("stars");
      else if (e.name.includes("/voyage/ship/")) count.mark("ship");
    }
  });
  po.observe({ type: "resource", buffered: true });
  listen(() => po.disconnect());
  // the hero's sky waits at its first frame until he wakes
  let sky: Sky | null = null;
  listen(onSky((s) => (sky = s)));
  // each later scene, and the warp, built and warmed (lib/wake/built)
  listen(onBuilt((m) => count.mark(m)));

  let rig: TychoRig | null = null,
    warming = false,
    lastSaid = -1,
    last = performance.now(),
    loadMs = 0;
  const show = (v: number) => {
    const n = Math.min(100, Math.floor(v * 100));
    pct.textContent = String(n);
    const s = statusAt(n, lastSaid);
    if (s) {
      lastSaid = s.quarter;
      status.textContent = s.say;
    }
  };
  if (!o.replay) show(0);
  // the sky behind him: the universe's canvas, and under reduced motion the film's stills drawn from it
  const stageSky = (on: boolean, duration: number) => {
    const sky = [uniCanvas(), document.getElementById("stills")].filter(Boolean);
    if (sky.length) gsap.to(sky, { opacity: on ? 1 : 0, duration: still ? Math.min(duration, 0.3) : duration, ease: "power1.inOut", overwrite: true });
  };
  // replayed, the sky's in already: dark for his stage, under the black
  if (o.replay) stageSky(false, 0);
  const watch = () => {
    if (sky && (phase === "loading" || phase === "charging" || phase === "dozing")) sky.cam.az = HERO_AZ;
    const r = currentRig();
    if (r && r !== rig) {
      rig = r;
      count.mark("three");
      r.ready.then(() => {
        if (rig !== r) return;
        // waiting under the loader: eyes shut, the band empty, at rest, lit low key from low and off his right
        r.idle(false);
        r.face("Shut");
        r.charge(0);
        r.resize();
        r.look("lowkey");
        r.view({ az: 0.7, el: -0.18, dist: 1.3 * ROOM });
        count.mark("tycho");
      });
    }
    if (count.has("tycho") && count.has("scene") && !warming) {
      // two frames drawn by both, so every shader has compiled before anything is shown
      warming = true;
      requestAnimationFrame(() => requestAnimationFrame(() => count.mark("warm")));
    }
    const now = performance.now(),
      dt = (now - last) / 1000;
    last = now;
    if (phase !== "loading" || o.replay) return;
    // frame time: a tab opened in the background has no frames, and its first one back is a single frame
    const step = Math.min(dt, 0.25);
    loadMs += step * 1000;
    const shown = count.step(step);
    if (stallDue({ phase, loadMs, universe: uni?.dataset.universe, missing: count.missing() })) return stall();
    show(shown);
    if (count.loaded()) loaded();
  };
  gsap.ticker.add(watch);
  listen(() => gsap.ticker.remove(watch));

  // ---------------------------------------------------------------- his states, the frame's eight, his readout
  // the live state is lit, its mark breathing with his beacon; the ones passed are pale
  function setState(s: "charging" | "dozing" | "awake") {
    el.dataset.state = s;
    pulse?.kill();
    gsap.set(el.querySelectorAll(".wk-states .st i"), { opacity: 1 });
    const dot = el.querySelector(`.wk-states .st[data-st="${s}"] i`);
    if (!still && dot && s !== "awake") pulse = gsap.fromTo(dot, { opacity: 1 }, { opacity: 0.35, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }
  kills.push(() => pulse?.kill());
  // segment n of his band is lit: its part of the frame, the line on to dozing, the readout's count
  function light(n: number) {
    const d = still ? 0 : 0.35;
    gsap.to(el.querySelectorAll(`.wk-frame .lit[data-seg="${n - 1}"]`), { opacity: 1, duration: d, ease: "power1.out" });
    gsap.to(line(0), { scaleX: n / 8, duration: d, ease: "power1.out" });
    q(".wk-read .r-n").textContent = String(n);
  }
  // ---------------------------------------------------------------- the stage's sky: the glow behind him, his sky
  // the sky turns slowly round him and he floats, weightless
  const starsEl = q<HTMLCanvasElement>(".wk-stars"),
    glowEl = q<HTMLCanvasElement>(".wk-glow");
  let drawn = { w: 0, S: 0 };
  const drawStage = () => {
    const w = innerWidth,
      h = innerHeight,
      cy = 0.43 * h,
      S = skySide(w, h, cy);
    drawGlow(glowEl, w, h, cy);
    // a height that changes alone (a phone's toolbar) is moved to, not drawn again, while the sky drawn still covers it
    if (w !== drawn.w || S > drawn.S) {
      drawSky(starsEl, w, h, cy);
      drawn = { w, S };
    }
    const D = drawn.S;
    Object.assign(starsEl.style, { width: `${D}px`, height: `${D}px`, left: `${w / 2 - D / 2}px`, top: `${cy - D / 2}px` });
  };
  // drawn while the loader counts, when the page is idle
  const idling = "requestIdleCallback" in window;
  const idle = idling ? requestIdleCallback(drawStage, { timeout: 1500 }) : window.setTimeout(drawStage, 200);
  listen(() => (idling ? cancelIdleCallback(idle) : window.clearTimeout(idle)));
  let resized: gsap.core.Tween | null = null;
  const onResize = () => {
    resized?.kill();
    resized = gsap.delayedCall(0.2, drawStage);
  };
  addEventListener("resize", onResize);
  listen(() => {
    removeEventListener("resize", onResize);
    resized?.kill();
  });

  // whether the visitor's mute is remembered: then the click wakes him silently
  const muted = () => {
    try {
      return soundWasOff(localStorage);
    } catch {
      return false;
    }
  };

  // a satellite passing high over him, catching the sun once on its way (a glint), every 50 s while he's on his stage
  let spin: gsap.core.Tween | null = null,
    pass: gsap.core.Timeline | null = null;
  kills.push(() => (spin?.kill(), pass?.kill()));
  function passOver() {
    const sat = q<HTMLElement>(".wk-sat"),
      w = innerWidth,
      h = innerHeight;
    pass = gsap
      .timeline({ repeat: -1, repeatDelay: 24 })
      .fromTo(sat, { x: -20, y: h * 0.24 }, { x: w + 20, y: h * 0.07, duration: 26, ease: "none" }, 0)
      .fromTo(sat, { autoAlpha: 0 }, { autoAlpha: 0.5, duration: 2 }, 0)
      .to(sat, { autoAlpha: 1, scale: 2.4, duration: 0.5, ease: "power2.out" }, 14)
      .to(sat, { autoAlpha: 0.5, scale: 1, duration: 1.2, ease: "power2.in" }, 14.5)
      .to(sat, { autoAlpha: 0, duration: 2 }, 24);
  }

  // ---------------------------------------------------------------- loaded: the loader gives way to Tycho in 3D
  function loaded() {
    phase = "charging";
    const out = gsap.timeline();
    kills.push(() => out.kill());
    if (still) out.to(load, { autoAlpha: 0, duration: 0.3 }, 0.2);
    // a sweep of light across the name, then the black fades onto his stage
    else
      out
        .fromTo(".wk-sweep", { xPercent: -60, autoAlpha: 0 }, { xPercent: 60, autoAlpha: 1, duration: 0.9, ease: "power2.inOut" }, 0.1)
        .to(".wk-sweep", { autoAlpha: 0, duration: 0.25 }, 0.8)
        .to([".wk-mark", ".wk-pct"], { autoAlpha: 0, duration: 0.5 }, 1.0)
        .to(load, { autoAlpha: 0, duration: 0.8, ease: "power1.inOut" }, 1.2);
    // the stage's sky arrives with the stage; drifting, it turns and he floats from the first
    out.to(stage, { autoAlpha: 1, duration: still ? 0.3 : 1.6, ease: "power1.inOut" }, still ? 0.2 : 1.2);
    if (!still) {
      spin = gsap.to(starsEl, { rotation: 360, duration: 720, ease: "none", repeat: -1 });
      rig?.float(true);
      out.call(passOver, [], 3.5);
    }
    // the frame and his states come up with his stage, charging live
    setState("charging");
    out.to([frame, ...states, read], { autoAlpha: 1, duration: still ? 0.3 : 0.9, ease: "power1.out", stagger: still ? 0 : 0.05 }, still ? 0.2 : 1.4);
    out.to(chip, { opacity: 0.22, duration: still ? 0.3 : 0.9, ease: "power1.out" }, still ? 0.2 : 1.6);
    // the charge-up, from the moment his stage starts to show: the band fills a segment at a time, its light growing on
    // him, while the camera comes round and in, slowly; then he dozes off as it's full, and the button's there at once
    const seg = 0.34,
      full = 1.2 + 8 * seg;
    out.add(
      () => {
        for (let i = 1; i <= 8; i++) {
          const call = gsap.delayedCall(still ? 0 : i * seg, () => {
            rig?.charge(i / 8);
            light(i);
          });
          kills.push(() => call.kill());
        }
        rig?.view({ az: 0.34, el: -0.1, dist: 0.9 * ROOM }, 8 * seg + 0.2, "power1.inOut");
      },
      still ? 0.4 : 1.2,
    );
    out.call(
      () => {
        phase = "dozing";
        // asleep, his pose held just as it charged
        rig?.doze(false);
        setState("dozing");
      },
      [],
      still ? 0.6 : full + 0.15,
    );
    out.call(showChip, [], still ? 0.6 : full + 0.25);
  }

  // ---------------------------------------------------------------- stalled: the 3D failed or is late
  function stall() {
    phase = "stalled";
    el.dataset.stalled = "";
    // the plain page, laid out under the loader; Tycho turns into his flat drawing, parked in his corner
    setTier("plain");
    html.classList.remove("wake-centre");
    gsap.to(".wk-pct", { autoAlpha: 0, duration: still ? 0 : 0.4 });
    status.textContent = "";
    showChip();
  }

  // ---------------------------------------------------------------- the wake button: a bare [ WAKE ME ], under him
  function showChip() {
    // already woken, from his ring the moment he dozed: the button has nobody left to wake
    if (phase === "waking" || phase === "done") return;
    // it waits in its place in his states (wake.css); stalled, alone, low on the screen
    if (phase === "stalled") ctl.style.top = `${Math.round(innerHeight * 0.86)}px`;
    el.dataset.chip = "on";
    // the headphones line, under the button; not when the visitor's mute is remembered, since this click wakes him
    // silently, nor on a replay, where the sound is on already
    if (!muted() && !o.replay) {
      phones.textContent = PHONES;
      el.dataset.phones = "on";
    }
    if (still) {
      gsap.set([chip, phones], { opacity: (i) => (i ? 0.62 : 1) });
      return;
    }
    const brs = chip.querySelectorAll<HTMLElement>(".br");
    gsap.to(chip, { opacity: 1, duration: 0.35 });
    gsap.fromTo(phones, { opacity: 0 }, { opacity: 0.62, duration: 0.6, delay: 0.25 });
    gsap.fromTo(brs, { x: (i) => (i ? -10 : 10) }, { x: 0, duration: 0.5, ease: "back.out(1.6)" });
    // the brackets spread with the pointer's speed, as the hand's chip does, and spring back once it stops; over the
    // button they stand a little open
    let lx = 0,
      ly = 0,
      lt = 0,
      open = 0;
    const spread = (sp: number) => {
      gsap.to(brs, { x: (i) => (i ? sp + open : -sp - open), duration: 0.15, overwrite: true });
      gsap.to(brs, { x: (i) => (i ? open : -open), duration: 0.5, ease: "back.out(1.2)", delay: 0.1 });
    };
    const onMove = (e: PointerEvent) => {
      const now = performance.now(),
        v = Math.hypot(e.clientX - lx, e.clientY - ly) / Math.max(1, now - lt);
      lx = e.clientX;
      ly = e.clientY;
      lt = now;
      spread(Math.min(14, v * 5));
    };
    const hover = (on: boolean) => () => {
      open = on ? 4 : 0;
      spread(0);
    };
    const enter = hover(true),
      leave = hover(false);
    moved = onMove;
    chip.addEventListener("pointerenter", enter);
    chip.addEventListener("pointerleave", leave);
    chip.addEventListener("focus", enter);
    chip.addEventListener("blur", leave);
    listen(() => {
      moved = null;
      chip.removeEventListener("pointerenter", enter);
      chip.removeEventListener("pointerleave", leave);
      chip.removeEventListener("focus", enter);
      chip.removeEventListener("blur", leave);
    });
  }

  // ---------------------------------------------------------------- the lock, and the wake
  const ui = (t: EventTarget | null) => !!(t as Element | null)?.closest?.(".tl-chip, .tl-panel");
  const act = (e: Event, input: Input) => {
    const r = respond(phase, input);
    if (r === "pass") return;
    e.preventDefault();
    if (e.type !== "wheel" && e.type !== "touchmove") e.stopPropagation();
    if (r === "wake") wake();
  };
  // the wake's target: the button, or (until the 3D has stalled) his ring
  const onTarget = (e: MouseEvent) => {
    const t = e.target as Element | null;
    if (t?.closest?.(".wk-chip")) return true;
    return phase !== "stalled" && !!t?.closest?.(".wk-frame");
  };
  const onClick = (e: MouseEvent) => act(e, { type: "click", ui: ui(e.target), on: onTarget(e) });
  const onKey = (e: KeyboardEvent) => act(e, { type: "key", key: e.key, ui: ui(e.target) });
  const onWheel = (e: Event) => act(e, { type: e.type === "wheel" ? "wheel" : "touchmove" });
  // the pointer reaches nothing under the gate either (the hand's stars and drag listen for it), until he's awake;
  // the wake button's brackets still follow it
  let moved: ((e: PointerEvent) => void) | null = null;
  // the camera drifts round him with the pointer while he charges and dozes (Edolus's landing), a few degrees at most;
  // not under reduced motion, nor for a finger
  const swaying = !still && matchMedia("(pointer: fine)").matches;
  const onStage = () => phase === "charging" || phase === "dozing";
  // the frame is nearer than him: it drifts a few pixels against the camera, for depth
  const fin = q<HTMLDivElement>(".wk-fin");
  const finX = gsap.quickTo(fin, "x", { duration: 1.2, ease: "power3.out" }),
    finY = gsap.quickTo(fin, "y", { duration: 1.2, ease: "power3.out" });
  // and the stars, beyond him, drift the other way
  const far = q<HTMLDivElement>(".wk-far");
  const starX = gsap.quickTo(far, "x", { duration: 1.2, ease: "power3.out" }),
    starY = gsap.quickTo(far, "y", { duration: 1.2, ease: "power3.out" });
  const swayTo = (az: number, up: number) => {
    rig?.sway(az, up);
    starX(az * 60);
    starY(-up * 70);
    finX(-az * 90);
    finY(up * 110);
  };
  const sway = (e: PointerEvent) => {
    if (!swaying || e.pointerType === "touch" || !onStage()) return;
    const s = swayAt(e.clientX, e.clientY, innerWidth, innerHeight);
    swayTo(s.az, s.el);
  };
  const onPointer = (e: PointerEvent) => {
    if (phase === "done" || ui(e.target)) return;
    if (e.type === "pointermove") {
      moved?.(e);
      sway(e);
    }
    e.stopPropagation();
  };
  // and back to rest once the pointer leaves the window
  const onOut = (e: MouseEvent) => {
    if (!e.relatedTarget && onStage()) swayTo(0, 0);
  };
  const POINTER = ["pointerdown", "pointerup", "pointermove"] as const;
  for (const type of POINTER) addEventListener(type, onPointer, { capture: true });
  // the browser may still scroll to a fragment, or to where it was, as the page loads: the page stays at the top
  const onScroll = () => {
    if (phase !== "waking" && phase !== "done" && scrollY !== 0) scrollTo(0, 0);
  };
  onScroll();
  document.addEventListener("click", onClick, true);
  addEventListener("keydown", onKey, { capture: true });
  addEventListener("wheel", onWheel, { passive: false });
  addEventListener("touchmove", onWheel, { passive: false });
  addEventListener("scroll", onScroll, { passive: true });
  if (swaying) document.addEventListener("mouseout", onOut);
  listen(() => {
    document.removeEventListener("click", onClick, true);
    removeEventListener("keydown", onKey, { capture: true });
    removeEventListener("wheel", onWheel);
    removeEventListener("touchmove", onWheel);
    removeEventListener("scroll", onScroll);
    document.removeEventListener("mouseout", onOut);
    for (const type of POINTER) removeEventListener(type, onPointer, { capture: true });
  });

  // runs inside the click, tap or key: that's what lets the sound start
  function wake() {
    const plain = phase === "stalled";
    phase = "waking";
    // replayed, the score comes back up from under the black; it was never stopped
    wakeSound();
    // where he is, read before anything is written, so the wake's first frame lays out once
    const body = box();
    const a = body?.getBoundingClientRect();
    const rows = Array.from(document.querySelectorAll<HTMLElement>("#runway .shot.hero .body > *"));
    const t = gsap.timeline();
    kills.push(() => t.kill());
    // the button closes on its words, cutting off its and the headphones line's fade-in if they were still arriving
    t.to(chip.querySelectorAll(".br"), { x: (i) => (i ? -8 : 8), duration: 0.18, ease: "power2.in", overwrite: true }, 0).to(
      [chip, phones],
      { opacity: 0, duration: 0.2, overwrite: true },
      0.08,
    );
    // the trigger fires: the line runs on through the button to awake, and the frame and states go as he flies
    if (!plain) {
      t.to(line(1), { scaleX: 1, duration: still ? 0 : 0.16, ease: "power1.in" }, 0)
        .to(line(2), { scaleX: 1, duration: still ? 0 : 0.16, ease: "power1.out" }, still ? 0 : 0.16)
        .call(
          () => {
            setState("awake");
            q(".wk-read .r-eyes").textContent = "open";
            if (!muted()) q(".wk-read .r-snd").textContent = "on";
          },
          [],
          still ? 0 : 0.3,
        )
        .to([frame, ...states, read], { autoAlpha: 0, duration: still ? 0.3 : 0.45, ease: "power1.in" }, still ? 0.3 : 0.6);
    }
    // the name's rows wait hidden, then rise in
    gsap.set(rows, { autoAlpha: 0, y: still ? 0 : 14 });
    runway?.removeAttribute("inert");
    // the page is the visitor's: a deep link or a reload's place lands now, under the sky coming up
    unlock();
    const rise = (at: number) =>
      t.to(rows, { autoAlpha: 1, y: 0, duration: still ? 0.3 : 1.1, ease: "expo.out", stagger: still ? 0 : 0.09, clearProps: "transform" }, at);

    if (plain) {
      // the loader gives way to the plain page, the flat Tycho parked in his corner
      t.to(load, { autoAlpha: 0, duration: still ? 0.3 : 0.8, ease: "power1.inOut" }, 0.1);
      rise(still ? 0.4 : 0.6);
      t.call(land, [], still ? 0.7 : 1.4);
      return;
    }

    rig?.wake();
    rig?.look("studio", 1.4);
    rig?.view({ az: 0, el: 0, dist: 1 }, 1.4);
    swayTo(0, 0);
    stageSky(true, still ? 0.3 : 1.6);
    gsap.to(stage, { autoAlpha: 0, duration: still ? 0.3 : 1.4, ease: "power1.inOut" });
    // the rescue: he steadies, and the turning sky slows to a stop as the full sky comes up
    rig?.float(false);
    if (spin) gsap.to(spin, { timeScale: 0, duration: 1.6, ease: "power2.out" });
    pass?.kill();
    rise(still ? 0.4 : 1.1);
    // he flies from the centre to his corner: across first, then down, the size easing with it
    if (body && a) {
      t.call(
        () => {
          html.classList.remove("wake-centre");
          const b = body.getBoundingClientRect();
          if (still) {
            gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.1, onComplete: () => rig?.resize() });
            return;
          }
          gsap.set(body, { transformOrigin: "0 0" });
          gsap.fromTo(body, { x: a.left - b.left }, { x: 0, duration: 1.35, ease: "power2.inOut" });
          gsap.fromTo(body, { y: a.top - b.top }, { y: 0, duration: 1.35, ease: "power3.in" });
          gsap.fromTo(
            body,
            { scale: a.width / b.width },
            {
              scale: 1,
              duration: 1.35,
              ease: "power1.inOut",
              onComplete: () => {
                gsap.set(body, { clearProps: "transform,transformOrigin" });
                rig?.resize();
              },
            },
          );
        },
        [],
        0.5,
      );
    } else html.classList.remove("wake-centre");
    t.call(land, [], still ? 0.9 : 2.1);
  }
  function land() {
    rig?.idle(true);
    rig?.emote("greet");
    const greet = gsap.delayedCall(0.5, () => dispatchEvent(new Event("tycho:greet")));
    const done = gsap.delayedCall(0.8, finish);
    kills.push(() => (greet.kill(), done.kill()));
  }
  function finish() {
    const woke = phase === "waking";
    phase = "done";
    unlock();
    html.classList.remove(...CLASSES);
    // the route map arrives once he's landed
    if (woke) gsap.fromTo(".routemap", { autoAlpha: 0 }, { autoAlpha: 1, duration: still ? 0.3 : 0.6, ease: "power1.out", clearProps: "opacity,visibility" });
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    listeners.forEach((k) => k());
    // the stage's canvases hold tens of MB at full size; a replay draws them again
    for (const c of [starsEl, glowEl]) c.width = c.height = 0;
  }

  // last, once everything it might tear down is listening: 3D already known not to work finishes at once
  if (uni) onUni();

  return () => kills.forEach((k) => k());
}
