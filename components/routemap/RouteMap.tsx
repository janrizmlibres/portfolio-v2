"use client";

import gsap from "gsap";
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import stars from "@/public/sky/stars-pca.json";
import type { SectionId } from "@/lib/film/block";
import { getTier, isPort, isShort, onTier, type Tier } from "@/lib/film/tier";
import { currentSound } from "@/lib/audio/current";
import { glideTo, scrollYOf } from "@/lib/film/scroll";
import { warpTo, warpTrip } from "@/lib/film/warp";
import { arc, layChart, spotNear, type Chart, type P2 } from "@/lib/routemap/chart";
import { createGoToSection } from "@/lib/routemap/go";
import { foldSteps, openSteps } from "@/lib/routemap/grow";
import { onSky } from "@/lib/universe/live";
import { oklabToSrgb, oklchToOklab, REGION_LIGHT, textTint, type Region } from "@/lib/universe/light";
import { starMagnitude } from "@/lib/universe/magnitude";
import type { Sky } from "@/lib/universe/sky";
import type { VoyageScript } from "@/lib/voyage/script";

/**
 * The route map: the nav, top right, as a porthole onto the sky in miniature (ADR 0004's form).
 * - The stars seen from the hero's side, not turning, in the sky's own light: each a point with its halo, the
 *   window washed with the light of the region you're in. The voyage is drawn through them as one hairline, the part
 *   you've travelled brighter, and "you are here" is a ring on what the camera is looking at, moving with the film.
 *   The flare plays on its stars as it plays in the sky.
 * - At rest, five ticks beside it, the section you're in named. Hover or the keyboard's focus grows the map, and the
 *   five names hang beside it in page order, each on a leader line to where its section sits (not while a trip plays:
 *   it opens once it's landed). Hovering one marks its section and draws the way there.
 * - A real `<nav>` of `<a href="#sec-…">`, every click going through `goToSection` (lib/routemap/go.ts): a link
 *   warps to its section (`warpTo`, lib/film/warp.ts), and during the warp the map shows the trip in miniature, a
 *   light-travel arc across the chart, with the destination's name beside it. Start replays instead: black, and the
 *   film's first frame (lib/film/replay.ts). A link to the section you're already in glides back to its first entry.
 * - On a phone it folds into a pill (a small map and the name) that drops a sheet: a larger map and five 44-px rows.
 *   Escape (focus back to the pill) and a tap outside fold it.
 * - Under reduced motion "you are here" holds the reading spot whose still is shown; on the plain page it's a row of
 *   links.
 */

const SECTIONS: ReadonlyArray<{ sec: SectionId; name: string; region: Region }> = [
  { sec: "sec-hero", name: "Start", region: "hero" },
  { sec: "sec-about", name: "About", region: "about" },
  { sec: "sec-work", name: "Work", region: "work" },
  { sec: "sec-projects", name: "Projects", region: "projects" },
  { sec: "sec-contact", name: "Contact", region: "contact" },
];
const nameOf = (sec: SectionId) => SECTIONS.find((s) => s.sec === sec)!.name;
const regionOf = (sec: SectionId) => SECTIONS.find((s) => s.sec === sec)!.region;
// "Start" is the whole sky: its callout points at the window's edge
const START_AT: P2 = [-Math.SQRT1_2, -Math.SQRT1_2];

const V = 1.15; // the chart's half-width in its own units: the window's edge is at 1
const MINI = 92, GROW = 236; // the map's size at rest and grown, in px
const LABEL_GAP = 26; // between the grown map's names, in px
const INK = "244, 246, 255";
const ink = (a: number) => `rgba(${INK}, ${a})`;
/** a polyline's length, in the chart's units */
const pathLen = (pts: readonly P2[]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1]![0], p[1] - pts[i - 1]![1]) : 0), 0);
const pathOf = (pts: readonly P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join("");
// the region's light, as it washes the window
const regionGlow = (r: Region) => `rgb(${oklabToSrgb(oklchToOklab([0.34, REGION_LIGHT[r].tint[1] * 1.6, REGION_LIGHT[r].tint[2]])).map((c) => Math.round(c * 255)).join(", ")})`;

/** What every drawn map shows this frame. */
type Frame = {
  here: P2;
  trail: number;
  way: { pts: P2[]; prog: number } | null;
  hover: SectionId | null;
  hoverWay: P2[] | null;
  lit: Float32Array | null;
  heat: Float32Array | null;
  region: Region;
};
type Painter = (f: Frame) => void;

// ---------------------------------------------------------------- one drawn map, at a size in px
// Its props are fixed for a size, so the nav's own re-renders (the section you're in, a trip) never rebuild its
// stars: everything that moves is painted through refs, once a frame.
const MapSvg = memo(function MapSvg({ chart, px, painters, tag }: { chart: Chart; px: number; painters: Set<Painter>; tag: string }) {
  const u = (2 * V) / px; // chart units per px, so marks keep their size in px
  const k = Math.max(1, px / 120); // marks grow a little on a large map
  const here = useRef<SVGSVGElement | null>(null);
  const trail = useRef<SVGPathElement | null>(null);
  const way = useRef<SVGPathElement | null>(null);
  const hoverG = useRef<SVGGElement | null>(null);
  const hoverWay = useRef<SVGPathElement | null>(null);
  const starsG = useRef<SVGGElement | null>(null);
  const stop = useRef<SVGStopElement | null>(null);
  const track = useMemo(() => pathOf(chart.track), [chart]);
  const base = useMemo(() => chart.stars.map((s) => starMagnitude(s.id)), [chart]);
  const fade = useMemo(() => chart.stars.map((s) => s.fade), [chart]);
  const starR = (mag: number) => (0.55 + 1.1 * mag) * k * u;
  const alpha = (mag: number, lit: number, heat: number) => Math.min(1, 0.35 + 0.5 * mag + 0.6 * lit + heat);

  useEffect(() => {
    const circles = [...(starsG.current?.querySelectorAll<SVGCircleElement>("circle.c") ?? [])];
    const halos = [...(starsG.current?.querySelectorAll<SVGCircleElement>("circle.g") ?? [])];
    const last = new Float32Array(circles.length).fill(-1);
    // a map that's written repaints, and on a phone a frame with a repaint in it misses its turn (its raster waits
    // behind the frame's WebGL), which held the whole film to 30 fps: "you are here" moves without repainting (its own
    // layer, moved by a transform, on a touch screen), and the trail and the flare are written once they've changed
    // enough to see, the trail an eighth of a px, the flare in steps a small map can show
    const step = 1 / 8, trailStep = (step * u) / pathLen(chart.track), flareSteps = px < 60 ? 12 : 50;
    let lastHere = "", lastTrail = NaN, lastWay = "", lastHover: SectionId | null | undefined, lastRegion = "";
    const paint: Painter = (f) => {
      const hx = Math.round(f.here[0] / u / step), hy = Math.round(f.here[1] / u / step), h = `${hx} ${hy}`;
      if (h !== lastHere && here.current) { lastHere = h; here.current.style.transform = `translate(${hx * step}px, ${hy * step}px)`; }
      const tr = Math.round(f.trail / trailStep);
      if (tr !== lastTrail) { lastTrail = tr; trail.current?.style.setProperty("stroke-dashoffset", (1 - tr * trailStep).toFixed(6)); }
      // the trip in miniature: the arc drawn in as the light travel runs
      const w = f.way ? pathOf(f.way.pts) : "";
      if (w !== lastWay) { lastWay = w; way.current?.setAttribute("d", w); }
      if (f.way && way.current) way.current.style.strokeDashoffset = (1 - f.way.prog).toFixed(4);
      if (f.hover !== lastHover) {
        lastHover = f.hover;
        hoverG.current?.querySelectorAll<SVGElement>("[data-sec]").forEach((el) => { el.style.opacity = el.dataset.sec === f.hover ? "1" : "0"; });
        hoverWay.current?.setAttribute("d", f.hoverWay ? pathOf(f.hoverWay) : "");
      }
      if (f.region !== lastRegion) { lastRegion = f.region; stop.current?.setAttribute("stop-color", regionGlow(f.region)); }
      // the flare: a lit star brighter, a warm star warmer, as in the sky
      if (f.lit && f.heat) {
        circles.forEach((c, i) => {
          const lit = f.lit![i]!, heat = f.heat![i]!;
          const key = Math.round((lit + heat * 2) * flareSteps);
          if (key === last[i]) return;
          last[i] = key;
          const m = base[i]!, a = alpha(m, lit, heat) * fade[i]!;
          c.setAttribute("r", (starR(m) + (0.8 * lit + 1.2 * heat) * u).toFixed(5));
          c.style.fill = heat > 0.04 ? `rgba(255, ${Math.round(236 - 70 * Math.min(1, heat))}, ${Math.round(220 - 120 * Math.min(1, heat))}, ${a.toFixed(3)})` : ink(a);
          const g = halos[i];
          if (g) g.style.opacity = (Math.min(1, 0.25 + m * 0.6 + lit * 0.8 + heat * 1.2) * fade[i]!).toFixed(3);
        });
      }
    };
    painters.add(paint);
    return () => { painters.delete(paint); };
    // the painter reads only fixed geometry and refs; it's rebuilt when the size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painters, px, chart]);

  // stroke widths in px, in the chart's units; a grown map (scaled by --g) keeps them hairlines
  const sw = (n: number) => ({ strokeWidth: `calc(${(n * u).toFixed(5)}px / var(--g, 1))` });
  const sectionMark = (sec: SectionId) => {
    if (sec === "sec-hero") return <circle r={1.03} fill="none" stroke={ink(0.85)} style={sw(1)} />;
    const m = chart.marks[sec], r = 3.1 * k * u;
    return (
      <>
        {m.line && <path d={pathOf(m.line)} fill="none" stroke={ink(0.9)} style={sw(1.2)} />}
        {[m.at, ...(m.more ?? [])].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={r} fill="none" stroke={ink(0.95)} style={sw(1)} />)}
      </>
    );
  };

  const box = `${-V} ${-V} ${2 * V} ${2 * V}`;
  return (
    <span className="rm-chart" style={{ width: px, height: px }}>
    <svg className="rm-svg" viewBox={box} width={px} height={px} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`rm-sky-${tag}`}>
          <stop ref={stop} offset="0" stopColor={regionGlow("hero")} stopOpacity="0.9" />
          <stop offset="1" stopColor="#03040a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`rm-halo-${tag}`}>
          <stop offset="0" stopColor="rgb(226, 232, 255)" stopOpacity="0.55" />
          <stop offset="1" stopColor="rgb(226, 232, 255)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`rm-clip-${tag}`}><circle r={1.08} /></clipPath>
      </defs>

      {/* the window: the region's light, and its rim */}
      <circle r={1.08} fill={`url(#rm-sky-${tag})`} />
      <circle r={1.08} fill="none" stroke={ink(0.22)} style={sw(1)} />

      <g clipPath={`url(#rm-clip-${tag})`}>
        <g ref={starsG}>
          {chart.stars.map((s, i) => (
            <g key={s.id}>
              <circle className="g" cx={s.at[0]} cy={s.at[1]} r={starR(base[i]!) * 4} fill={`url(#rm-halo-${tag})`} style={{ opacity: (0.25 + base[i]! * 0.6) * fade[i]! }} />
              <circle className="c" cx={s.at[0]} cy={s.at[1]} r={starR(base[i]!)} style={{ fill: ink(alpha(base[i]!, 0, 0) * fade[i]!) }} />
            </g>
          ))}
        </g>
        <path d={track} fill="none" stroke={ink(0.2)} style={sw(1)} />
        <path ref={trail} d={track} fill="none" pathLength={1} stroke={ink(0.75)} strokeDasharray="1 1" style={{ ...sw(1.25), strokeDashoffset: 1 }} />
      </g>

      {/* the hovered link's section, and the way there from where you are */}
      <g ref={hoverG}>
        {SECTIONS.map((s) => (
          <g key={s.sec} data-sec={s.sec} style={{ opacity: 0 }}>{sectionMark(s.sec)}</g>
        ))}
        <path ref={hoverWay} fill="none" stroke={ink(0.6)} strokeDasharray={`${2 * u} ${3 * u}`} style={sw(1)} />
      </g>

      {/* a trip */}
      <path ref={way} fill="none" pathLength={1} stroke={ink(0.95)} strokeDasharray="1 1" style={{ ...sw(1.3), strokeDashoffset: 1 }} />

    </svg>
    {/* you are here, over the map, moved by its transform */}
    <svg ref={here} className="rm-you" viewBox={box} width={px} height={px} aria-hidden="true" focusable="false"
      style={{ transform: `translate(${chart.hereAt(0)[0] / u}px, ${chart.hereAt(0)[1] / u}px)` }}>
      <circle r={5 * k * u} fill="none" stroke={ink(0.9)} style={sw(1)} />
      <circle r={1.3 * k * u} fill="#fff" />
    </svg>
    </span>
  );
});

// ---------------------------------------------------------------- the nav
// the screen, as "phone:width" (a phone: portrait, or held sideways), and the tier
const onResize = (cb: () => void) => { addEventListener("resize", cb); return () => removeEventListener("resize", cb); };
const screenNow = () => `${isPort(innerWidth, innerHeight) || isShort(innerWidth, innerHeight) ? 1 : 0}:${innerWidth}`;

export function RouteMap({ script, spots, secSpots, film, replay }: {
  script: VoyageScript;
  /** every block's reading spot, and each section's (where its link lands) */
  spots: readonly number[];
  secSpots: Record<SectionId, number>;
  /** the film's runtime, once it's playing: its time */
  film: RefObject<{ t: number } | null>;
  /** the replay, which Start plays to the film's first frame (never the wake-up, which only Contact's link brings back) */
  replay: RefObject<{ start: (href: string) => void } | null>;
}) {
  const chart = useMemo(() => layChart(script, stars.stars), [script]);
  const nav = useRef<HTMLElement | null>(null);
  const painters = useMemo(() => new Set<Painter>(), []);
  const screen = useSyncExternalStore(onResize, screenNow, () => "0:1440");
  const phone = screen.startsWith("1"), vw = Number(screen.split(":")[1]);
  const tier = useSyncExternalStore(onTier, getTier, () => "film" as Tier);
  const [open, setOpen] = useState(false);
  const [sec, setSec] = useState<SectionId>("sec-hero");
  const [dest, setDest] = useState<SectionId | null>(null);
  const live = useRef({ hover: null as SectionId | null, sec: "sec-hero" as SectionId, warp: null as null | { from: number; to: number; at: number; pts: P2[] }, open: false });
  useEffect(() => { live.current.open = open; }, [open]);

  // every frame: where you are, the trail, a trip, the flare
  useEffect(() => {
    // each of the chart's stars, as the sky numbers it
    let sky: Sky | null = null, map: Int32Array | null = null;
    const offSky = onSky((s) => {
      sky = s;
      map = s ? Int32Array.from(chart.stars, (st) => s.index.get(st.id) ?? -1) : null;
    });
    const lit = new Float32Array(chart.stars.length), heat = new Float32Array(chart.stars.length);
    let curSec: SectionId | null = null, hoverOf: SectionId | null = null, hoverWay: P2[] | null = null;
    const tick = () => {
      // hidden under the wake-up until he lands
      if (document.documentElement.classList.contains("wake")) return;
      const t = film.current?.t ?? 0, tierNow = getTier();
      const L = live.current;
      // the warp's light travel draws the trip; it ends once the warp is over and the film has arrived (or, before the
      // 3D is in and the warp only glides, once the glide has)
      const trip = warpTrip();
      if (L.warp && trip === null && !gsap.isTweening(window) && (Math.abs(t - L.warp.to) < 0.05 || gsap.ticker.time - L.warp.at > 12)) {
        L.warp = null;
        setDest(null);
      }
      const atT = tierNow === "still" ? spotNear(t, spots) : t;
      const s = chart.sectionAt(atT);
      if (s !== curSec) { curSec = s; L.sec = s; setSec(s); }
      let here = chart.hereAt(atT), trail = chart.travelled(atT), way: Frame["way"] = null;
      if (L.warp && tierNow === "film") {
        // the light travels the arc, not the road; the trail fills in on arrival
        const span = L.warp.to - L.warp.from, prog = trip ?? (span ? Math.min(1, Math.max(0, (t - L.warp.from) / span)) : 1);
        way = { pts: L.warp.pts, prog };
        here = L.warp.pts[Math.round(prog * (L.warp.pts.length - 1))]!;
        trail = chart.travelled(prog < 1 ? L.warp.from : t);
      }
      if (sky && map) {
        for (let i = 0; i < map.length; i++) { const st = sky.state[map[i]!]; lit[i] = st ? Math.max(st.lit, st.read) : 0; heat[i] = st ? Math.max(st.heat, st.flare) : 0; }
      }
      const hover = L.hover;
      // a map draws the way there only as the hover changes
      if (hover !== hoverOf) {
        hoverOf = hover;
        hoverWay = hover && hover !== s ? arc(chart.hereAt(atT), chart.hereAt(secSpots[hover])) : null;
      }
      const f: Frame = { here, trail, way, hover, hoverWay, lit: sky ? lit : null, heat: sky ? heat : null, region: regionOf(s) };
      painters.forEach((p) => p(f));
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); offSky(); };
  }, [chart, film, painters, spots, secSpots]);

  // the name of the section you're in arrives in its region's light and settles to white; it leaves no colour of its
  // own behind, so once it's a section you've left the grown map dims it as it does the others
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const names = el.querySelectorAll<HTMLElement>(".rm-links .rm-name");
    gsap.killTweensOf(names, "color");
    gsap.set(names, { clearProps: "color" });
    const els = el.querySelectorAll<HTMLElement>(".rm-here, .rm-pill-name, [aria-current] .rm-name");
    gsap.fromTo(els, { color: textTint(regionOf(sec)) }, { color: `rgb(${INK})`, duration: 1.2, ease: "power2.out", overwrite: true, clearProps: "color" });
  }, [sec]);

  // hover and focus open it (desktop); the pill opens it (phones); Escape and a tap outside fold it. On a desktop it's
  // open while the pointer's on it or the keyboard's in it: a link a click left focused (the browser focuses it, and
  // a glide or a trip still under way leaves it so) doesn't hold it open once the pointer's gone
  useEffect(() => {
    const el = nav.current!;
    const enter = () => { if (!phone) setOpen(true); };
    const leave = () => { if (!phone && !el.querySelector(":focus-visible")) setOpen(false); live.current.hover = null; };
    // whether the pointer's on it, looked up afresh where it last was: for a pointer that's still, the browser's hover
    // (`:hover`, and the enter and leave that go with it) catches up with what's under it only when the pointer next
    // moves or the page scrolls, as when the map folds out from under it or a trip's jump lands
    let px = -1, py = -1;
    const track = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
    const gone = (e: MouseEvent) => { if (!e.relatedTarget) px = py = -1; };
    const pointerOver = () => px >= 0 && el.contains(document.elementFromPoint(px, py));
    // the window coming back (alt-tab) gives focus back to the link that had it: that isn't someone coming to the map,
    // so that focus doesn't open it. Until the visitor next presses a key or the pointer, a focus is that one
    let returning = false;
    const away = () => { returning = true; };
    const acting = () => { returning = false; };
    const focusIn = () => {
      if (returning) { returning = false; return; }
      if (!phone) setOpen(true);
    };
    // focus going elsewhere (a trip landing gives it to the section's heading) leaves it open while the pointer's on it
    const focusOut = (e: FocusEvent) => { if (!el.contains(e.relatedTarget as Node | null)) { if (!phone && !pointerOver()) setOpen(false); live.current.hover = null; } };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !live.current.open) return;
      setOpen(false);
      if (phone) el.querySelector<HTMLButtonElement>(".rm-pill")?.focus();
      else if (el.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    };
    const outside = (e: PointerEvent) => { if (phone && live.current.open && !el.contains(e.target as Node)) setOpen(false); };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("focusin", focusIn);
    el.addEventListener("focusout", focusOut);
    addEventListener("keydown", key);
    addEventListener("pointerdown", outside);
    addEventListener("blur", away);
    addEventListener("keydown", acting, true);
    addEventListener("pointerdown", acting, true);
    addEventListener("pointermove", track, { passive: true });
    document.addEventListener("mouseout", gone);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
      el.removeEventListener("focusin", focusIn);
      el.removeEventListener("focusout", focusOut);
      removeEventListener("keydown", key);
      removeEventListener("pointerdown", outside);
      removeEventListener("blur", away);
      removeEventListener("keydown", acting, true);
      removeEventListener("pointerdown", acting, true);
      removeEventListener("pointermove", track);
      document.removeEventListener("mouseout", gone);
    };
  }, [phone]);

  // opening: the map grows and its names hang beside it, on leader lines drawn out from their marks; folding plays it
  // back the other way (the names go, the lines draw back into their marks, then the map shrinks). GSAP plays both,
  // and each takes over from the other where it's got to (lib/routemap/grow.ts): coming back mid-fold, what's still
  // out stays and the rest comes back. While a trip plays it stays folded: the names are hidden then, and the
  // destination's named where the ticks were, so grown it'd hang lines on nothing; it opens once it's landed
  const grows = open && !dest;
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const mapBox = el.querySelector<HTMLElement>(".rm-map")!, links = [...el.querySelectorAll<HTMLElement>(".rm-links li")];
    const leaders = el.querySelector<SVGSVGElement>(".rm-leaders")!;
    const lines = () => leaders.querySelectorAll("line"), dots = () => leaders.querySelectorAll("circle");
    // back at rest: the ticks, and the section you're in named
    const rest = () => {
      delete el.dataset.grown;
      leaders.innerHTML = "";
      mapBox.style.removeProperty("--g");
      gsap.set(mapBox, { clearProps: "transform" });
      links.forEach((li) => { li.style.top = ""; });
      gsap.set(links, { clearProps: "opacity,x" });
    };
    // a phone's sheet and the plain page's row keep nothing of the grown map (the window narrowed while it was open)
    if (phone || tier === "plain") {
      if ("grown" in el.dataset) rest();
      return;
    }
    const reduced = tier === "still", S = GROW / MINI;
    // every move is instant under reduced motion
    const d = (s: number) => (reduced ? 0 : s);
    let tl: gsap.core.Timeline | null = null;
    if (grows) {
      if (!("grown" in el.dataset)) {
        // from rest: each name hangs in a column left of the grown map in page order (the ticks' order, and the
        // keyboard's), centred on the map, each on a leader line to its mark; lines, dots and names all still to come
        const toPx = (p: P2): P2 => [GROW * ((p[0] + V) / (2 * V)), GROW * ((p[1] + V) / (2 * V))];
        const pts = SECTIONS.map((s) => toPx(s.sec === "sec-hero" ? START_AT : chart.marks[s.sec].at));
        const ys = SECTIONS.map((_, i) => GROW / 2 + (i - (SECTIONS.length - 1) / 2) * LABEL_GAP);
        leaders.innerHTML = pts.map((p, i) => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="-10" y2="${ys[i]!.toFixed(1)}" pathLength="1" /><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" />`).join("");
        links.forEach((li, i) => { li.style.top = `${ys[i]! - 9}px`; });
        el.dataset.grown = "";
        // (a line's whole length is 1, by its pathLength: its dash offset is tweened unrounded, as GSAP would round
        // a px value to whole pixels and the line would pop on whole instead of drawing out)
        gsap.set(lines(), { strokeDashoffset: 1 });
        gsap.set(dots(), { opacity: 0 });
        gsap.set(links, { opacity: 0, x: 6 });
      }
      const at = openSteps((Number(gsap.getProperty(mapBox, "scale")) - 1) / (S - 1));
      tl = gsap.timeline({ defaults: { overwrite: true } })
        .to(mapBox, { scale: S, "--g": S, duration: d(0.42), ease: "power3.out" }, d(at.map))
        .to(lines(), { strokeDashoffset: 0, autoRound: false, duration: d(0.35), stagger: d(at.stagger), ease: "power2.out" }, d(at.lines))
        .to(dots(), { opacity: 1, duration: d(0.1) }, d(at.dots))
        .to(links, { opacity: 1, x: 0, duration: d(0.3), stagger: d(at.stagger), ease: "power2.out" }, d(at.names));
    } else if ("grown" in el.dataset) {
      // the lines draw back last first, each into its mark, and are in before the map starts to shrink (they're laid
      // out for the grown map, so they'd hang off it as it shrank); it waits only for what's out
      const shown = Math.max(
        ...links.map((li) => Number(gsap.getProperty(li, "opacity"))),
        ...[...lines()].map((l) => 1 - Number(gsap.getProperty(l, "strokeDashoffset"))),
      );
      const at = foldSteps(shown);
      tl = gsap.timeline({ defaults: { overwrite: true } })
        .to(links, { opacity: 0, duration: d(0.12) }, d(at.names))
        .to(lines(), { strokeDashoffset: 1, autoRound: false, duration: d(0.16), stagger: { each: d(at.stagger), from: "end" }, ease: "power2.in" }, d(at.lines))
        .to(dots(), { opacity: 0, duration: d(0.1) }, d(at.dots))
        .to(mapBox, { scale: 1, "--g": 1, duration: d(0.3), ease: "power2.inOut" }, d(at.map))
        .add(rest);
    }
    // the next open or fold takes over from here: this one's last step mustn't undo it
    return () => { tl?.kill(); };
  }, [grows, phone, tier, chart]);

  // a link: marks its section and draws the way there while hovered (and ticks under the pointer, once the sound's on)
  const hoverOn = (s: SectionId | null) => { live.current.hover = s; };
  const pointerOn = (s: SectionId) => { hoverOn(s); currentSound()?.play("ui-hover"); };

  // a click goes through goToSection: a warp plays the trip in miniature while it runs
  useEffect(() => {
    const el = nav.current!;
    const reduced = () => getTier() === "still";
    const links = createGoToSection({
      here: () => live.current.sec,
      spotOf: (s) => secSpots[s],
      glide: (t) => glideTo(scrollYOf(t), { reduced: reduced() }),
      warp: (s, to) => {
        const t = film.current?.t ?? 0;
        // refused while another warp has the page: this one's trip mustn't take over the map
        if (!warpTo(s, to, { reduced: reduced() })) return;
        live.current.warp = { from: t, to, at: gsap.ticker.time, pts: arc(chart.hereAt(t), chart.hereAt(to)) };
        setDest(s);
      },
      replay: (href) => replay.current?.start(href),
      history: window.history,
      scrollY: () => window.scrollY,
      active: () => getTier() !== "plain",
    });
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-sec]");
      if (!a) return;
      // taken: it folds, and the way there gives over to the trip (the link keeps the focus a click gave it)
      setOpen(false);
      live.current.hover = null;
      currentSound()?.play("ui-click");
      links.onClick(e, a.dataset.sec as SectionId);
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [chart, film, replay, secSpots]);

  const sheetPx = Math.round(Math.min(260, vw - 72));
  return (
    <nav
      ref={nav}
      className="routemap"
      aria-label="Sections"
      data-phone={phone || undefined}
      data-open={open || undefined}
      data-warp={dest ? "" : undefined}
    >
      <button type="button" className="rm-pill" aria-expanded={open} aria-controls="rm-body" onClick={() => { currentSound()?.play("ui-click"); setOpen(!open); }}>
        {phone && <MapSvg chart={chart} px={30} painters={painters} tag="pill" />}
        <span className="rm-pill-name">{dest ? `→ ${nameOf(dest)}` : nameOf(sec)}</span>
        <span className="sr">, sections</span>
      </button>
      <div className="rm-body" id="rm-body">
        <div className="rm-map">
          <MapSvg key={phone ? "sheet" : "mini"} chart={chart} px={phone ? sheetPx : MINI} painters={painters} tag={phone ? "sheet" : "mini"} />
        </div>
        <svg className="rm-leaders" aria-hidden="true" width={GROW} height={GROW} />
        <p className="rm-here" aria-hidden="true">{dest ? `→ ${nameOf(dest)}` : nameOf(sec)}</p>
        <ol className="rm-links">
          {SECTIONS.map((s) => (
            <li key={s.sec} data-on={s.sec === sec || undefined}>
              <a
                href={`#${s.sec}`}
                data-sec={s.sec}
                aria-current={s.sec === sec ? "location" : undefined}
                onMouseEnter={() => pointerOn(s.sec)}
                onMouseLeave={() => hoverOn(null)}
                onFocus={() => hoverOn(s.sec)}
                onBlur={() => hoverOn(null)}
              >
                <i className="rm-tick" aria-hidden="true" />
                <span className="rm-name">{s.name}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="sr" aria-live="polite">{dest ? `Going to ${nameOf(dest)}` : ""}</p>
      </div>
    </nav>
  );
}
