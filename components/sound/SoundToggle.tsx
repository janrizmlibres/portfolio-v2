"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { currentSound, onSound } from "@/lib/audio/current";
import type { Sound } from "@/lib/audio/engine";
import { Mixer } from "./Mixer";
import "./sound.css";

type Client = typeof import("@/lib/audio/client");
let client: Client | null = null;
const fetchClient = () => import("@/lib/audio/client").then((m) => (client = m));

const never = () => () => {};
const htmlClass = {
  subscribe: (fn: () => void) => {
    const mo = new MutationObserver(fn);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  },
  waking: () => document.documentElement.classList.contains("wake"),
};

/**
 * The sound toggle, and the restore control a stuck context needs: a bracketed chip bottom left with a hairline trace
 * of the score's output. It shows once the wake-up is over (or straight away where there's none) and, where there was no
 * wake-up, it's how the sound comes on. A click acts at once, inside the gesture, which is what unlocks audio, so
 * the engine's module is fetched ahead: after first paint, or sooner as the pointer or focus comes to the chip.
 */
export function SoundToggle() {
  const here = useSyncExternalStore(never, () => true, () => false);
  const waking = useSyncExternalStore(htmlClass.subscribe, htmlClass.waking, () => true);
  const state = useSyncExternalStore(onSound, () => currentSound()?.state ?? null, () => null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const traced = here;
  // the levels, set by ear: development only, with ?mixer
  const mixing = here && process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).has("mixer");

  useEffect(() => {
    if (!here) return;
    const id = window.setTimeout(fetchClient, 1500);
    return () => window.clearTimeout(id);
  }, [here]);

  const playing = !!state?.woken && !!state?.on;

  // the trace: the score's real output, drawn once a frame while it plays, a flat line when it's off
  useEffect(() => {
    const c = canvas.current;
    if (!traced || !c) return;
    const g = c.getContext("2d")!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = 28, H = 10;
    c.width = W * dpr;
    c.height = H * dpr;
    g.scale(dpr, dpr);
    const buf = new Float32Array(1024);
    const ink = getComputedStyle(c).color;
    const draw = () => {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = ink;
      g.lineWidth = 1;
      g.beginPath();
      const s = playing ? currentSound() : null;
      if (s) s.trace(buf);
      else buf.fill(0);
      for (let x = 0; x <= W; x++) {
        const v = buf[Math.floor((x / W) * (buf.length - 1))]!;
        const y = H / 2 - Math.max(-1, Math.min(1, v * 3)) * (H / 2 - 1);
        if (x) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    };
    draw();
    if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [traced, playing, waking, state?.woken]);

  if (!here || (waking && !state?.woken)) return null;
  const flip = (s: Sound) => {
    // its click sounds on the way out, and once the sound is back on the way in
    if (playing) s.play("toggle");
    s.setSound(!playing);
    if (!playing) s.play("toggle");
  };
  const toggle = () => {
    const s = currentSound() ?? client?.sound();
    if (s) return flip(s);
    // clicked before the engine arrived: it's turned on as it arrives (a browser that wants the gesture itself leaves
    // the context suspended, and the restore is offered)
    void fetchClient().then((m) => flip(m.sound()));
  };

  return (
    <div className="snd" data-on={playing ? "on" : "off"}>
      {mixing && <Mixer />}
      <button type="button" className="snd-chip" aria-pressed={playing} onClick={toggle} onPointerEnter={() => void fetchClient()} onFocus={() => void fetchClient()}>
        <span aria-hidden="true">[</span> Sound {playing ? "on" : "off"}
        {traced && <canvas ref={canvas} className="snd-trace" aria-hidden="true" />}
        <span aria-hidden="true">]</span>
      </button>
      {state?.restore && (
        <button type="button" className="snd-chip snd-restore" onClick={() => currentSound()?.restore()}>
          <span aria-hidden="true">[</span> Sound stuck? Restore <span aria-hidden="true">]</span>
        </button>
      )}
    </div>
  );
}
