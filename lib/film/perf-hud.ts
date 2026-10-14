/**
 * `?perf`: a small frame readout over the page, for finding where the film hitches on a real device, the deployed site
 * included. Each late frame is listed with its film time and what changed in it (perf-meter.ts). It's loaded only when
 * the address asks for it (a dynamic import from the voyage), so without the flag it costs nothing. The frames are also
 * kept on `window.__perf` for the motion probe (.scratch/redesign/research/motion/scroll.mjs). It reads the frames
 * drawn (pace.ts), so on a 120 Hz display a frame is late against 60 fps, and its head gives both rates.
 */
import gsap from "gsap";
import { onQuality, quality } from "@/lib/universe/tier";
import { onSky } from "@/lib/universe/live";
import type { Sky } from "@/lib/universe/sky";
import { drawsNow, pace } from "./pace";
import { createPerfMeter, type Sample } from "./perf-meter";

/** frames kept for the probe: about five minutes at 60 Hz */
const KEEP = 20_000;
/** how often the readout's text is written */
const WRITE_MS = 250;

type Script = { invokerType?: string; invoker?: string; sourceFunctionName?: string; sourceURL?: string; duration: number };

export function startPerfHud({ film }: { film: { t: number } }) {
  const meter = createPerfMeter();
  const frames: Sample[] = [];
  let sky: Sky | null = null, level: string = quality(), idle = 0, wrote = 0, decoding = 0;
  const io: string[] = [];
  const offSky = onSky((s) => {
    sky = s;
    // the draw calls are counted over the whole frame (shadow passes and every scene drawn), not one render call
    if (s) s.renderer.info.autoReset = false;
  });
  const offQuality = onQuality((q) => (level = q));

  // idle jobs, timed: a job that lands in a frame is named on it (a job queued on a promise the callback resolves runs
  // in the microtasks after it, so it's timed to the next task, which runs once they're all done)
  const ric = window.requestIdleCallback?.bind(window);
  const after = new MessageChannel(), ends: Array<() => void> = [];
  after.port1.onmessage = () => ends.shift()?.();
  if (ric)
    window.requestIdleCallback = (cb, opts) =>
      ric((d) => {
        const t0 = performance.now();
        ends.push(() => { idle += performance.now() - t0; });
        after.port2.postMessage(0);
        cb(d);
      }, opts);

  // files arriving, and audio decoding (the score's layers): loading that lands in a frame is named on it
  const kind = (n: string) => (/\.glb/.test(n) ? "glb" : /\.(webp|jpe?g|png|ktx2)/.test(n) ? "image" : /\.(opus|ogg|mp3|m4a|webm|aac)/.test(n) ? "audio" : /\.js/.test(n) ? "script" : "data");
  let files: PerformanceObserver | null = null;
  try {
    files = new PerformanceObserver((list) => { for (const e of list.getEntries()) io.push(`fetch ${kind(e.name)}`); });
    files.observe({ type: "resource", buffered: false });
  } catch {
    files = null;
  }
  const decode = typeof BaseAudioContext === "function" ? BaseAudioContext.prototype.decodeAudioData : null;
  if (decode)
    BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, ...a: Parameters<typeof decode>) {
      decoding++;
      const p = decode.apply(this, a);
      const end = () => { decoding--; io.push("decode audio"); };
      p.then(end, end);
      return p;
    };

  // long animation frames, where the browser reports them (Chromium), with the scripts that ran longest in each
  let po: PerformanceObserver | null = null;
  try {
    po = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Array<PerformanceEntry & { scripts?: Script[] }>) {
        const scripts = [...(e.scripts ?? [])].sort((a, b) => b.duration - a.duration).slice(0, 2).map((s) => {
          const file = (s.sourceURL ?? "").split(/[?#]/)[0]!.split("/").at(-1);
          return `${s.invokerType ?? ""} ${s.sourceFunctionName || s.invoker || "?"}${file ? `@${file}` : ""} ${Math.round(s.duration)}ms`;
        });
        meter.long({ start: e.startTime, duration: e.duration, scripts });
      }
    });
    po.observe({ type: "long-animation-frame", buffered: false });
  } catch {
    po = null;
  }

  const box = document.createElement("pre");
  Object.assign(box.style, {
    position: "fixed", left: "6px", top: "6px", zIndex: "2147483647", margin: "0", padding: "6px 8px", maxWidth: "calc(100vw - 12px)",
    font: "10px/1.35 ui-monospace, Menlo, monospace", color: "#e8ecff", background: "rgba(0,0,0,0.72)", pointerEvents: "none", whiteSpace: "pre-wrap",
  });
  document.body.appendChild(box);

  const phase = () => {
    if (!document.documentElement.classList.contains("wake")) return "film";
    return document.getElementById("wake")?.dataset.state ?? "loading";
  };
  const write = () => {
    const { frames: n, missed, cadence } = meter.totals();
    const { display, every } = pace();
    const hz = every > 1 ? `${Math.round(1000 / display)} Hz drawn at ${Math.round(1000 / cadence)}` : `${Math.round(1000 / cadence)} Hz`;
    const head = `${hz} · missed ${missed}/${n} · dpr ${sky ? sky.renderer.getPixelRatio().toFixed(2) : "-"} · ${level} · t ${film.t.toFixed(2)}`;
    const rows = meter.hitches().slice(-8).reverse().map((h) => `t ${h.t.toFixed(2)} ${String(Math.round(h.dt)).padStart(4)}ms ${h.phase === "film" ? "" : `[${h.phase}] `}${h.flags.join(" · ")}`);
    box.textContent = [head, ...rows].join("\n");
  };

  // each frame drawn (pace.ts): on a 120 Hz display, every other one
  const tick = () => {
    if (!drawsNow()) return;
    const at = Number(document.timeline?.currentTime ?? performance.now());
    const info = sky?.renderer.info;
    const s: Sample = {
      at, t: film.t, phase: phase(),
      calls: info?.render.calls ?? 0, tris: info?.render.triangles ?? 0,
      programs: info?.programs?.length ?? 0, textures: info?.memory.textures ?? 0, geometries: info?.memory.geometries ?? 0,
      dpr: sky?.renderer.getPixelRatio() ?? 0, quality: level, idle, io: decoding ? [...io, "decode audio"] : [...io],
    };
    info?.reset();
    idle = 0;
    io.length = 0;
    meter.feed(s);
    frames.push(s);
    if (frames.length > KEEP) frames.shift();
    if (at - wrote > WRITE_MS) { wrote = at; write(); }
  };
  gsap.ticker.add(tick);
  Object.assign(window, { __perf: { frames, hitches: meter.hitches, totals: meter.totals } });

  return () => {
    gsap.ticker.remove(tick);
    po?.disconnect();
    files?.disconnect();
    after.port1.close();
    if (decode) BaseAudioContext.prototype.decodeAudioData = decode;
    if (ric) window.requestIdleCallback = ric;
    if (sky) sky.renderer.info.autoReset = true;
    offSky();
    offQuality();
    box.remove();
  };
}
