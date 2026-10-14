/**
 * The film, played by the scroll: it binds the runway's HTML and, every frame, moves the film's time a little
 * behind the scroll, has the stage draw that frame, then places each block in play and writes its words in or
 * dissolves them, word by word in its word mode, or by rows in its manner (`manners.ts`). Blocks out of play stay in
 * the document (and in reach of the keyboard), unseen.
 *
 * Under reduced motion nothing moves: each block has a still of its reading spot, and scrolling crossfades from one
 * still to the next while the text hands over in turn (out in the first half, in in the second), so two blocks never
 * sit on each other. The plain tier needs none of this: the page flows.
 */
import gsap from "gsap";
import type { Block } from "./block";
import { createClock } from "./clock";
import { createFling, type FlingFeel } from "./fling";
import { passStyle, type Pt } from "./manners";
import { wordStyle, type WordMode } from "./modes";
import { pinCard, placeCard, placeLabels, placeTitle, ROUTE_MAP_CLEAR, type Box, type Rect } from "./place";
import { LABEL_FADE, labelTimes } from "./label-times";
import { tabEntry } from "./tab-entry";
import { glideTo, jumpTo, JUMP_EVENT, provideMeasures, scrollYOf, spotOf } from "./scroll";
import { clamp01, smooth } from "./smooth";
import type { Laid } from "./spots";
import { drawnMs, drawsNow } from "./pace";
import { onStage, onStillsStale, type Stage } from "./stage";
import { getTier, isPort, isShort, onTier, reframes, type Tier } from "./tier";
import { isLocked } from "@/lib/wake/lock";
import { extraWindow, phase, wordWindows, type Span, type WordWindow } from "./windows";

/** `key`: the word's phase as last written, rounded, so an unchanged word isn't written again */
type Word = { el: HTMLElement; win: WordWindow; row: number; heavy: boolean; seed: number; key: number };
type Extra = { el: HTMLElement; win: WordWindow };
/** `at`: its ends as last written, in tenths of a px */
type Lead = { line: SVGLineElement; dot: SVGCircleElement; at: Float64Array };
/** a row passed by the dive, and where it rests; `last`: its style as last written, rounded */
type PassRow = { el: HTMLElement; span: Span; rest: Pt | null; last: Float64Array };
type Bound = {
  b: Laid<Block>;
  shot: HTMLElement;
  title: HTMLElement | null;
  face: HTMLElement | null;
  /** a sign's card (its face), hung beside its object on a leader line, and its size */
  card: { w: number; h: number; lead: Lead } | null;
  body: HTMLElement | null;
  words: Word[];
  extras: Extra[];
  labels: Array<{ el: HTMLElement; in: number; out: number; w: number; h: number; lead: Lead }>;
  leads: SVGGElement | null;
  pass: PassRow[];
  size: { tw: number; th: number; top: number } | null;
  on: boolean;
  still: HTMLCanvasElement | null;
};

const NS = "http://www.w3.org/2000/svg";
// what Tab stops on in the text: its links and buttons (a heading the warp focuses has tabindex -1, and isn't one)
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** A local time as a line of text says it ("7:05 PM"). */
const clockText = (timeZone: string, at = new Date()) => new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(at);
const unwritten = () => new Float64Array(4).fill(NaN);
const LINE_ENDS = ["x1", "y1", "x2", "y2"] as const;
/** a leader's line and the dot at its first end, its attributes written only where they changed */
function drawLead({ line, dot, at }: Lead, ends: readonly number[]) {
  for (let i = 0; i < 4; i++) {
    const v = Math.round(ends[i]! * 10);
    if (v === at[i]) continue;
    at[i] = v;
    const px = (v / 10).toFixed(1);
    line.setAttribute(LINE_ENDS[i]!, px);
    if (i < 2) dot.setAttribute(i ? "cy" : "cx", px);
  }
}

/** A colour from the scene's tint (`--tw`) settling to `rest`, the text's own colour, where it stays. */
const tinted = (settle: number, rest = "var(--ink)") => (settle < 1 ? `color-mix(in oklab, var(--tw, #fff) ${Math.round((1 - settle) * 100)}%, ${rest})` : "");

export function createFilmRuntime({ root, blocks, total, leaders, stills, timeZone, flingFeel }: {
  root: HTMLElement;
  /** whose clock a `{time}` in the text shows */
  timeZone: string;
  /** how a hard scroll feels, if not the default */
  flingFeel?: FlingFeel;
  blocks: Array<Laid<Block>>;
  total: number;
  /** labels' leader lines, over the text */
  leaders: SVGSVGElement;
  stills: [HTMLCanvasElement, HTMLCanvasElement];
}) {
  const html = document.documentElement;
  const clock = createClock({ tau: 0.2 });
  // how hard the scroll is, which throws the picture's loose things outwards
  const fling = createFling(flingFeel);
  let tier: Tier = getTier();
  let stage: Stage | null = null;
  let port = isPort(innerWidth, innerHeight), short = isShort(innerWidth, innerHeight);
  const boxOf = (b: Block): Box => (port ? b.body.port : short ? (b.body.short ?? b.body.land) : b.body.land);

  // ---------------------------------------------------------------- the screen: the large viewport's height
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none";
  document.body.append(probe);
  // the runway's top on the page (the film's first frame) and the screen, as measured; scroll.ts reads them too
  const measures = { top: 0, screen: 0 };
  const probeScreen = () => probe.offsetHeight || innerHeight;
  const setScreen = (h: number) => {
    measures.screen = h;
    html.style.setProperty("--screen", `${h}px`);
  };
  setScreen(probeScreen());

  // ---------------------------------------------------------------- binding the runway
  const bound: Bound[] = blocks.map((b, bi) => {
    const art = root.querySelector<HTMLElement>(`[data-block="${CSS.escape(b.id)}"]`)!;
    const shot = art.querySelector<HTMLElement>(".shot")!;
    const rowEls = [...shot.querySelectorAll<HTMLElement>("[data-row]")].sort((x, y) => Number(x.dataset.row) - Number(y.dataset.row));
    const wins = wordWindows(rowEls.map((r) => r.querySelectorAll(".w").length), b.tIn, b.tOut);
    let n = 0;
    // word modes move each word; the manners move rows instead
    const words = b.mode === "pass" ? [] : rowEls.flatMap((rowEl, j) =>
      [...rowEl.querySelectorAll<HTMLElement>(".w")].map((el, k) => ({
        el, win: wins[j]![k]!, row: j, heavy: rowEl.classList.contains("data"), seed: (n++ * 0.618 + j * 0.37 + bi * 0.13) % 1, key: NaN,
      })),
    );
    const pass = b.mode === "pass" ? rowEls.map((el, j) => ({ el, span: b.rowOut?.[j] ?? b.tOut, rest: null, last: unwritten() })) : [];
    const xw = extraWindow(rowEls.length, b.tIn, b.tOut);
    const extras = [...shot.querySelectorAll<HTMLElement>("[data-extra]")].map((el) => ({ el, win: xw }));
    let leads: SVGGElement | null = null;
    const labelEls = [...shot.querySelectorAll<HTMLElement>(".label")];
    const times = labelTimes(labelEls.length, { tIn: b.tIn[1], tOut: b.tOut[0], spot: b.spot });
    const lead = (): Lead => {
      if (!leads) {
        leads = document.createElementNS(NS, "g");
        leads.style.display = "none";
        leaders.append(leads);
      }
      const line = document.createElementNS(NS, "line"), dot = document.createElementNS(NS, "circle");
      line.setAttribute("pathLength", "1");
      dot.setAttribute("r", "2.2");
      leads.append(line, dot);
      return { line, dot, at: unwritten() };
    };
    const labels = labelEls.map((el, k) => ({ el, ...times[k]!, w: 0, h: 0, lead: lead() }));
    const face = shot.querySelector<HTMLElement>(".face");
    return {
      b, shot, title: shot.querySelector<HTMLElement>(".title"), face, card: face ? { w: 0, h: 0, lead: lead() } : null, body: shot.querySelector<HTMLElement>(".body"),
      words, extras, labels, leads, pass,
      size: null, on: shot.classList.contains("on"), still: null,
    };
  });

  const live = (B: Bound, t: number) => t >= B.b.tIn[0] - 0.05 && t <= B.b.tOut[1] + 0.25;
  const ridingLabels = (B: Bound) => !port || !!B.b.phoneRide;

  function show(B: Bound) {
    B.on = true;
    B.shot.classList.add("on", "driven");
    if (B.leads) B.leads.style.display = ridingLabels(B) || B.card ? "" : "none";
    if (!B.size) measure(B);
  }
  function hide(B: Bound) {
    B.on = false;
    B.shot.classList.remove("on");
    B.shot.style.opacity = "";
    if (B.leads) B.leads.style.display = "none";
  }
  // Sizes and places, read once a block comes into play and again on a resize: the text is fixed in the frame, so
  // they hold until then.
  function measure(B: Bound) {
    B.size = { tw: B.title?.offsetWidth ?? 0, th: B.title?.offsetHeight ?? 0, top: B.body?.getBoundingClientRect().top ?? 0 };
    for (const l of B.labels) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
    if (B.card && B.face) { B.card.w = B.face.offsetWidth; B.card.h = B.face.offsetHeight; }
    // where each passed row rests, from a point a third of the way along it
    for (const r of B.pass) {
      const tf = r.el.style.transform;
      r.el.style.transform = "";
      const q = r.el.getBoundingClientRect();
      r.rest = { x: q.left + q.width * 0.3, y: q.top + q.height / 2 };
      r.el.style.transform = tf;
      r.last.fill(NaN);
    }
  }

  // ---------------------------------------------------------------- placing a block in the frame
  // what this frame has placed so far (riding titles, labels), so two blocks on screen at once keep clear of each other
  let taken: Rect[] = [];
  function place(B: Bound) {
    const { b } = B, vw = innerWidth, vh = innerHeight, view = stage?.view;
    if (B.title && b.kind === "col") {
      const a = view && b.anchor && b.side !== "column" ? view.anchor(b.anchor) : null;
      if (a && a.z <= 1 && B.size) {
        const box = boxOf(b), side = port && b.portSide ? b.portSide : b.side;
        const p = placeTitle({
          side, anchor: a, box: box.mid ? { ...box, y: B.size.top / vh } : box, tw: B.size.tw, th: B.size.th, vw, vh,
          clear: ROUTE_MAP_CLEAR[port ? "port" : "land"],
        });
        B.title.classList.add("ride");
        B.title.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        taken.push({ x: p.x, y: p.y, w: B.size.tw, h: B.size.th });
      } else if (B.title.classList.contains("ride")) {
        B.title.classList.remove("ride");
        B.title.style.transform = "";
      }
    }
    if (B.labels.length && ridingLabels(B)) {
      const placed = view
        ? placeLabels(B.labels.map((l, k) => {
            // a label the page hides (it has no size) doesn't ride
            const lab = b.labels![k]!, at = l.w ? view.point(lab.ref) : null;
            return {
              at: at ?? { x: 0, y: 0, z: 2 }, of: lab.of ? view.point(lab.of) : null, w: l.w, h: l.h,
              rest: lab.rest ? view.point(lab.rest) : null,
              clear: view.labelClear?.(lab.ref),
            };
          }), { vw, vh, avoid: taken })
        : B.labels.map(() => null);
      placed.forEach((L, k) => {
        const l = B.labels[k]!;
        l.el.style.visibility = L ? "" : "hidden";
        l.lead.line.style.visibility = l.lead.dot.style.visibility = L ? "" : "hidden";
        if (!L) return;
        l.el.style.transform = `translate(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px)`;
        taken.push({ x: L.x, y: L.y, w: l.w, h: l.h });
        drawLead(l.lead, L.line);
      });
    }
    if (B.face && B.card) {
      // a sign's card hangs beside its object on a leader line, on phones too; pinned (its object a breakthrough's craft,
      // passing), it holds its place and the leader follows the object
      const at = view && b.sign ? view.point(b.sign) : null;
      const p = !B.card.w ? null
        : b.pin ? pinCard({ at, spot: b.pin[port ? "port" : "land"], w: B.card.w, h: B.card.h, vw, vh })
        : at ? placeCard({ at, w: B.card.w, h: B.card.h, vw, vh, reach: view?.labelClear?.(b.sign!), clear: ROUTE_MAP_CLEAR[port ? "port" : "land"] }) : null;
      const { line, dot } = B.card.lead;
      B.face.style.visibility = p ? "visible" : "hidden";
      line.style.visibility = dot.style.visibility = p?.line ? "" : "hidden";
      if (p) {
        B.face.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        taken.push({ x: p.x, y: p.y, w: B.card.w, h: B.card.h });
      }
      if (p?.line) drawLead(B.card.lead, p.line);
    }
  }

  // ---------------------------------------------------------------- writing the words
  function write(B: Bound, t: number) {
    const { b } = B;
    for (const w of B.words) {
      const p = phase(w.win, t);
      // ein, eout and settle are each 0..1
      const key = (Math.round(p.ein * 100) * 101 + Math.round(p.eout * 100)) * 51 + Math.round(p.settle * 50);
      if (key === w.key) continue;
      w.key = key;
      const st = wordStyle(b.mode as WordMode, { ein: p.ein, eout: p.eout, seed: w.seed, heavy: w.heavy });
      const css = w.el.style;
      css.opacity = String(st.opacity);
      css.transform = st.transform;
      css.fontWeight = st.fontWeight ? String(st.fontWeight) : "";
      if (st.ghost) { css.setProperty("--gx", `${st.ghost.x.toFixed(3)}em`); css.setProperty("--go", st.ghost.opacity.toFixed(3)); }
      // every word arrives in its scene's light and settles to white
      css.color = tinted(p.settle);
    }
    if (B.pass.length) writePass(B, t);
    for (const x of B.extras) {
      const p = phase(x.win, t);
      x.el.style.opacity = String(p.opacity);
      x.el.style.transform = p.opacity < 1 ? `translateY(${((1 - p.ein) * 0.45 - p.eout * 0.3).toFixed(3)}em)` : "";
    }
    if (B.card) {
      // its leader draws out from the object as the card's first words come, and goes with its last
      const din = clamp01((t - b.tIn[0]) / ((b.tIn[1] - b.tIn[0]) * 0.5)), mid = (b.tOut[0] + b.tOut[1]) / 2;
      const o = (din > 0 ? 1 : 0) * (1 - clamp01((t - mid) / (b.tOut[1] - mid)));
      B.card.lead.line.style.strokeDashoffset = (1 - din).toFixed(3);
      B.card.lead.line.style.opacity = B.card.lead.dot.style.opacity = String(o);
    }
    B.labels.forEach((l) => {
      const o = clamp01((t - l.in) / LABEL_FADE) * (1 - clamp01((t - l.out) / LABEL_FADE));
      l.el.style.opacity = String(o);
      l.lead.line.style.strokeDashoffset = (1 - clamp01((t - l.in + 0.06) / 0.18)).toFixed(3);
      l.lead.line.style.opacity = l.lead.dot.style.opacity = String(o);
    });
  }

  // The lockup, passed by the dive: each row is pushed out from the point the camera dives at.
  function writePass(B: Bound, t: number) {
    const from = (B.b.passFrom && stage?.view.point(B.b.passFrom)) || null;
    if (!from || from.z > 1) return;
    for (const r of B.pass) {
      if (!r.rest) continue;
      const s = passStyle(t, r.span, r.rest, from, port), last = r.last;
      const x = Math.round(s.x * 10), y = Math.round(s.y * 10), scale = Math.round(s.scale * 1000), o = Math.round(s.opacity * 1000);
      if (x === last[0] && y === last[1] && scale === last[2] && o === last[3]) continue;
      last[0] = x; last[1] = y; last[2] = scale; last[3] = o;
      r.el.style.transform = s.scale > 1 ? `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${s.scale.toFixed(3)})` : "";
      r.el.style.opacity = s.opacity < 1 ? s.opacity.toFixed(3) : "";
    }
  }

  // a block at rest, as it reads at its reading spot: for stills
  function settle(B: Bound) {
    for (const w of B.words) {
      const st = wordStyle(B.b.mode as WordMode, { ein: 1, eout: 0, seed: w.seed, heavy: w.heavy });
      Object.assign(w.el.style, { opacity: "1", transform: "", color: "", fontWeight: st.fontWeight ? String(st.fontWeight) : "" });
      w.el.style.setProperty("--go", "0");
      w.key = NaN;
    }
    for (const r of B.pass) { Object.assign(r.el.style, { transform: "", opacity: "" }); r.last.fill(NaN); }
    for (const x of B.extras) Object.assign(x.el.style, { opacity: "1", transform: "" });
    B.labels.forEach((l) => {
      l.el.style.opacity = "1";
      l.lead.line.style.strokeDashoffset = "0";
      l.lead.line.style.opacity = l.lead.dot.style.opacity = "1";
    });
  }

  // ---------------------------------------------------------------- reduced motion: stills
  const order = [...bound].sort((x, y) => x.b.spot - y.b.spot);
  const shown: [Bound | null, Bound | null] = [null, null];
  // the still the stage is posed at, so what's read off it on screen (a star under the pointer) matches the still
  // in front
  let posed: Bound | null = null;
  function capture(B: Bound) {
    if (!stage) return;
    // its lines count as in play while its still is drawn, so the picture makes room for them as the film does (the
    // route goes behind the road's start's line); it's shown properly once it's in front
    const lent = !B.shot.classList.contains("on");
    if (lent) B.shot.classList.add("on");
    stage.seek(B.b.spot);
    stage.render();
    if (lent) B.shot.classList.remove("on");
    posed = null;
    B.still = stage.snapshot();
    // its text placed as it sits at the reading spot
    if (!B.size) measure(B);
    taken = [];
    place(B);
  }
  function drawStill(i: 0 | 1, B: Bound | null) {
    if (shown[i] === B) return;
    shown[i] = B;
    const c = stills[i];
    // at the sky's own resolution
    const w = B?.still?.width ?? innerWidth, h = B?.still?.height ?? innerHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    if (B?.still) g.drawImage(B.still, 0, 0, c.width, c.height);
  }
  // the stills kept: the shown pair's and the one before, so turning back costs no capture (each still is the size of
  // the frame, so keeping every block's adds up to hundreds of MB)
  let keptAt = -1;
  function keepStills(i: number) {
    if (i === keptAt) return;
    keptAt = i;
    order.forEach((X, j) => { if (X.still && (j < i - 1 || j > i + 1)) X.still = null; });
  }
  function stillFrame(t: number) {
    taken = [];
    let i = order.findLastIndex((B) => B.b.spot <= t + 1e-6);
    if (i < 0) i = 0;
    keepStills(i);
    const A = order[i]!, B = order[i + 1] ?? null;
    const gap = B ? B.b.spot - A.b.spot : 1, f = B ? smooth(A.b.spot + gap * 0.3, B.b.spot - gap * 0.3, t) : 0;
    for (const X of [A, B]) if (X && stage && !X.still) capture(X);
    if (shown[0] !== A || shown[1] !== B) { shown[0] = shown[1] = null; }
    drawStill(0, A);
    drawStill(1, B);
    const lead = B && f >= 0.5 ? B : A;
    if (stage && lead.still && posed !== lead) { stage.seek(lead.b.spot); stage.render(); posed = lead; }
    stills[0].style.opacity = "1";
    stills[1].style.opacity = String(f);
    for (const X of bound) {
      const o = X === A ? 1 - smooth(0, 0.5, f) : X === B ? smooth(0.5, 1, f) : 0;
      if (o <= 0.004) { if (X.on) hide(X); continue; }
      if (!X.on) { show(X); settle(X); if (!X.still) place(X); }
      X.shot.style.opacity = o.toFixed(3);
      if (X.leads) X.leads.style.opacity = o.toFixed(3);
    }
  }

  // ---------------------------------------------------------------- every frame
  // measured as the page's layout changes, never in a frame: a read there would lay the page out twice a frame
  const measureOrigin = () => { measures.top = root.getBoundingClientRect().top + window.scrollY; };
  measureOrigin();
  const relaid = new ResizeObserver(measureOrigin);
  relaid.observe(root);
  relaid.observe(document.body);
  if (tier !== "plain") provideMeasures(measures);
  const timeAt = (y: number) => Math.max(0, Math.min(total, (y - measures.top) / measures.screen));
  const target = () => timeAt(window.scrollY);
  function filmFrame(t: number) {
    if (stage) { stage.seek(t); stage.render(); }
    taken = [];
    for (const B of bound) {
      if (!live(B, t)) { if (B.on) hide(B); continue; }
      if (!B.on) show(B);
      else if (!B.size) measure(B); // in play from first paint (the hero), so never shown
      place(B);
      write(B, t);
    }
  }
  // A reload lands on the frame it left. The browser can't restore the scroll itself: a returning visitor's runway
  // appears only once the page has read their state, after the browser has given up. So the film keeps its own
  // place (without a hash, which lands on its own reading spot instead).
  const PLACE = `film-t:${location.pathname}`;
  const savePlace = () => { try { sessionStorage.setItem(PLACE, String(clock.t)); } catch {} };
  let restore: number | null = null;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const saved = Number(sessionStorage.getItem(PLACE));
    if (nav?.type === "reload" && !location.hash && saved > 0) restore = saved;
  } catch {}
  window.addEventListener("pagehide", savePlace);

  function tick() {
    if (tier === "plain" || !drawsNow()) return;
    // (after the wake-up, which opens every load at the top)
    if (restore !== null && root.offsetHeight > 0 && !isLocked()) { jumpTo(measures.top + restore * measures.screen); restore = null; }
    const dt = drawnMs() / 1000;
    const aim = target(), t = clock.step(aim, dt, { eased: tier === "film" });
    stage?.fling?.(fling.step(aim, dt, tier !== "film"), fling);
    if (tier === "still") stillFrame(t);
    else filmFrame(t);
  }
  gsap.ticker.add(tick);

  // ---------------------------------------------------------------- the stage arrives; tiers change
  const offStage = onStage((s) => {
    stage = s;
    for (const B of bound) B.still = null;
    shown[0] = shown[1] = null;
  });
  // a stage asset that arrived late: the stills are taken again, the pose too
  const offStale = onStillsStale(() => {
    for (const B of bound) B.still = null;
    shown[0] = shown[1] = null;
    posed = null;
  });
  // leaving for the plain page (WebGL turned out not to work): the page flows, so every inline style goes
  function unbind() {
    for (const B of bound) {
      B.shot.classList.remove("driven");
      B.shot.style.opacity = "";
      if (B.title) { B.title.classList.remove("ride"); B.title.style.transform = ""; }
      if (B.face) B.face.removeAttribute("style");
      for (const w of B.words) { w.el.removeAttribute("style"); w.key = NaN; }
      for (const r of B.pass) { r.el.removeAttribute("style"); r.last.fill(NaN); }
      for (const x of B.extras) x.el.removeAttribute("style");
      for (const l of B.labels) l.el.removeAttribute("style");
      if (B.leads) B.leads.style.display = "none";
    }
  }
  const offTier = onTier((t) => {
    const at = clock.t;
    tier = t;
    if (t === "plain") {
      provideMeasures(null);
      unbind();
      // land where the visitor was: the block whose reading spot they'd reached
      const B = order.findLast((x) => x.b.spot <= at + 1e-6) ?? order[0];
      requestAnimationFrame(() => B && B.shot.closest("article")?.scrollIntoView({ block: "start" }));
    }
  });

  // ---------------------------------------------------------------- jumps, focus, resize, his clock
  const onJump = (e: Event) => { clock.jump(timeAt((e as CustomEvent<{ y: number }>).detail.y)); fling.reset(); };
  window.addEventListener(JUMP_EVENT, onJump);
  // keyboard focus lands on the reading spot of the block it's in
  const onFocus = (e: FocusEvent) => {
    if (tier === "plain") return;
    const spot = spotOf(e.target as Element);
    if (spot !== null && Math.abs(clock.t - spot) > 0.3) glideTo(scrollYOf(spot), { reduced: tier === "still" });
  };
  root.addEventListener("focusin", onFocus);
  // Tab coming into the text from outside it enters at the block on screen, not the page's first (tab-entry.ts). Seen
  // before the focus glides the film (a capture listener), and that first focus goes no further once it's sent on
  let tabbing: 0 | 1 | -1 = 0;
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    tabbing = e.shiftKey ? -1 : 1;
    window.setTimeout(() => { tabbing = 0; });
  };
  const onTabIn = (e: FocusEvent) => {
    const from = e.relatedTarget as Node | null;
    if (!tabbing || tier === "plain" || !from || root.contains(from)) return;
    const els = [...root.querySelectorAll<HTMLElement>(TABBABLE)];
    const here = order.findLast((x) => x.b.spot <= clock.t + 0.3)?.b.spot ?? 0;
    const to = els[tabEntry(els.map((x) => spotOf(x) ?? 0), here, tabbing)];
    if (!to || to === e.target) return;
    e.stopImmediatePropagation();
    to.focus({ preventScroll: true });
  };
  window.addEventListener("keydown", onTabKey, true);
  root.addEventListener("focusin", onTabIn, true);
  let resizeTimer = 0;
  let framed = { w: innerWidth, h: innerHeight, screen: measures.screen };
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const was = framed;
      framed = { w: innerWidth, h: innerHeight, screen: probeScreen() };
      if (!reframes(was, framed)) return;
      const t = clock.t;
      port = isPort(framed.w, framed.h);
      short = isShort(framed.w, framed.h);
      html.classList.toggle("port", port);
      html.classList.toggle("short", short);
      setScreen(framed.screen);
      measureOrigin();
      for (const B of bound) { measure(B); B.still = null; }
      shown[0] = shown[1] = null;
      keptAt = -1;
      stage?.resize({ w: framed.w, h: framed.h });
      // a resize lands on the same frame
      window.scrollTo(0, measures.top + t * measures.screen);
      clock.jump(t);
      fling.reset();
    }, 200);
  };
  window.addEventListener("resize", onResize);
  // titles and labels are measured again once the fonts are in
  document.fonts?.ready.then(() => { bound.forEach(measure); measureOrigin(); });
  // his clock, live: the `{time}` word is a <time> holding only the time, prerendered as a placeholder, set at once
  // and again as each minute turns
  let clockTimer = 0;
  const setClock = () => {
    const at = new Date(), now = clockText(timeZone, at);
    root.querySelectorAll<HTMLElement>(".clock").forEach((c) => { c.textContent = now; c.setAttribute("datetime", at.toISOString()); });
    clockTimer = window.setTimeout(setClock, 60000 - (at.getTime() % 60000) + 50);
  };
  setClock();

  clock.jump(target());
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __film: { get t() { return clock.t; }, total, get screen() { return measures.screen; }, blocks: blocks.map((b) => ({ id: b.id, spot: b.spot })) } });

  return {
    get t() { return clock.t; },
    destroy() {
      gsap.ticker.remove(tick);
      relaid.disconnect();
      provideMeasures(null);
      offStage();
      offStale();
      offTier();
      window.removeEventListener(JUMP_EVENT, onJump);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pagehide", savePlace);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusin", onTabIn, true);
      window.removeEventListener("keydown", onTabKey, true);
      window.clearTimeout(clockTimer);
      window.clearTimeout(resizeTimer);
      leaders.replaceChildren();
      probe.remove();
    },
  };
}
