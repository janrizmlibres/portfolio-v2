/**
 * The voyage's hand: what the pointer, touch and keyboard can do across the film.
 * - Where the sky is the subject (the hero, the stars round home, his university's stars the relay throws you to,
 *   Contact: the script's `sky` windows), hovering a star shows its topic and clicking it asks Tycho. At Contact a
 *   label waits until the pointer rests on a star, so a sweep across the sky plays it without labels flickering.
 * - A star under the pointer twinkles, as hard as its shimmer sounds (`lib/film/twinkle.ts`; the sky draws it as a
 *   real star's scintillation); a sweep leaves the stars it crossed dying away behind it. Under reduced motion the
 *   hovered star shows its twinkle held still: its spikes caught at a bright instant.
 * - Where the sky is seen whole (the hero's first frame, Contact's last), a drag turns it on both axes, round and
 *   over, its pitch clamped short of the pole (`lib/film/turn.ts`), and it coasts when let go. Until the first drag,
 *   empty sky there says it can be turned.
 * - Over any subject a chip names it, and a click asks Tycho about it; the chip ticks as it comes onto a subject and
 *   clicks as it asks. A block's "Ask Tycho about …" button, focused from the keyboard, pins the chip on its subject.
 * - While Tycho answers, asking is held off, and the stars and chips say so.
 * - On a touch screen a tap asks at once, and the tapped star's label shows a moment as the question goes.
 * Nothing here moves under reduced motion except what the pointer asks for: the chip and labels show, unmoving.
 * The picture's subjects come from the blocks (their title's subject, or what their anchor points at) unless a scene
 * registers its own (`lib/film/pointer.ts`).
 */
import gsap from "gsap";
import stars from "@/public/sky/stars-pca.json";
import { currentSound } from "@/lib/audio/current";
import { answeringFor, isAnswering, subscribe as onAnswering } from "@/lib/chat/answering";
import { SKY_TOPICS, UNNAMED_TOPIC } from "@/lib/content/sky-topics";
import type { Block } from "@/lib/film/block";
import { FLING_FEEL, type FlingFeel } from "@/lib/film/fling";
import { bracketSpread, chipAt, nearestStar, placeStarLabel, RING_R, subjectAt, within, type SubjectHit } from "@/lib/film/hand";
import { clampPitch, createTurnCoast, turnBy, turnSpeed } from "@/lib/film/turn";
import { createTwinkles, TWINKLE } from "@/lib/film/twinkle";
import { pointer, registeredSubjects } from "@/lib/film/pointer";
import { onStage, type Stage, type StageView } from "@/lib/film/stage";
import { getTier } from "@/lib/film/tier";
import type { Span } from "@/lib/film/windows";
import { onSky } from "@/lib/universe/live";
import type { Sky } from "@/lib/universe/sky";
import { HERO_EL } from "./route";

/** how a hard scroll feels: loose things leave one after another, up to 0.25 s apart, and spring home in about 0.6 s */
export const HAND_FLING: FlingFeel = { ...FLING_FEEL, fall: 0.6, lag: 0.25 };

/** where the pointer is over something of the page's own, not the picture */
const UI = 'a, button, input, textarea, select, aside, [role="dialog"], nav.routemap, [data-hand-ui], .label';
/** at Contact, how long the pointer rests on a star before its label shows */
const DWELL_MS = 250;
/** how long the pointer rests off every star and subject before `[ DRAG TO TURN ]` shows, so a sweep doesn't flash it */
const HINT_REST_MS = 400;
/** how long a tapped star's label shows as its question goes */
const TAP_LABEL_MS = 1500;

type Script = {
  blocks: Block[];
  /** where the stars answer the pointer, where their labels wait for it to rest (Contact), where the sky turns */
  sky: { stars: Span[]; contact: Span[]; drag: Span[] };
};
type HandSubject = { id: string; label: string; q: string; hit: (view: StageView) => SubjectHit | null };
type Asked = { q: string; star: number | null; subject: string | null };

const STAR_IDS = stars.stars.map((s) => s.id);
const topicOf = (j: number) => SKY_TOPICS[stars.stars[j]!.topic] ?? UNNAMED_TOPIC;

/**
 * A subject's disc on screen, from its centre and how far its radius reaches along the camera's right; none while it's
 * smaller than `least` px across (a moon is asked about small, the hand reaching round it).
 */
function disc(view: StageView, ref: string, least = 6): SubjectHit | null {
  const c = view.point(ref);
  if (!c || c.z > 1) return null;
  const e = view.anchor({ ref, ax: 1, ay: 0 });
  const R = e ? Math.hypot(e.x - c.x, e.y - c.y) : 0;
  return R < least ? null : { kind: "disc", x: c.x, y: c.y, R };
}

/**
 * Something the hand can ask about, as plain data: where it is on screen (a subject the stage resolves), and, if it's
 * only there for a while, when.
 */
export type Askable = { id: string; label: string; q: string; at: { ref: string; small?: boolean }; live?: Span };

/**
 * What the blocks let you ask about: home is Janriz himself; each block with a question asks it over its title's
 * subject or the craft its card follows; each moon a block names is asked about by its name while that block is in
 * play.
 */
export function askables(blocks: Block[]): Askable[] {
  const list: Askable[] = [{ id: "home", label: "Janriz", q: "Who is Janriz?", at: { ref: "home" } }];
  for (const b of blocks) {
    if (b.ask) {
      if (b.kind === "sign" && b.sign) list.push({ id: b.id, ...b.ask, at: { ref: b.sign } });
      else if (b.anchor) list.push({ id: b.id, ...b.ask, at: { ref: b.anchor.ref } });
    }
    for (const l of b.labels ?? []) {
      if (!l.ref.startsWith("moon:")) continue;
      list.push({ id: l.ref, label: `the ${l.text}`, q: `Tell me about the ${l.text}.`, at: { ref: l.ref, small: true }, live: [b.tIn[0], b.tOut[1]] });
    }
  }
  return list;
}

/** Each askable with where it is on screen this frame, at the film's time `t`. */
function blockSubjects(blocks: Block[], film: { readonly t: number }): HandSubject[] {
  return askables(blocks).map(({ id, label, q, at, live }): HandSubject => {
    return { id, label, q, hit: (v) => (live && !within([live], film.t) ? null : disc(v, at.ref, at.small ? 2 : 6)) };
  });
}

/**
 * What the hand reports for the sound to follow, each optional. Speeds are the view's turn in radians a second (both
 * axes together); `pointerSpeed` is the pointer's in CSS px a second.
 */
export type HandSound = {
  /** whenever the star under the pointer changes (null when it leaves a star) */
  star?: (star: number | null, atContact: boolean, pointerSpeed: number) => void;
  /** a star tapped or clicked */
  tap?: (star: number, atContact: boolean) => void;
  /** each move of a drag that turns the view */
  turn?: (speed: number) => void;
  /** a drag let go while moving, so the view coasts on */
  fling?: (speed: number) => void;
};

export function createHand({ layer, film, script, onAsk, sound }: {
  /** the hand's own layer over the picture, empty; it fills it */
  layer: HTMLElement;
  film: { readonly t: number };
  script: Script;
  onAsk: (q: string, how?: { stay?: boolean }) => void;
  sound?: HandSound;
}) {
  const html = document.documentElement;
  const fineMq = matchMedia("(pointer: fine)");
  pointer.fine = fineMq.matches;
  // where the stars are the subject; where their labels wait for the pointer to rest; where the sky turns
  const starsLive = (t: number) => within(script.sky.stars, t);
  const atContact = (t: number) => within(script.sky.contact, t);
  const dragLive = (t: number) => within(script.sky.drag, t);
  const own = blockSubjects(script.blocks, film);

  // ---------------------------------------------------------------- the layer
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("hand-lines");
  const lead = document.createElementNS(NS, "line"), ring = document.createElementNS(NS, "circle"), pinRing = document.createElementNS(NS, "circle");
  // under reduced motion, a hovered star's twinkle held still: its spikes caught at a bright instant, longer across
  // than up, as the sky's spikes are
  const glint = document.createElementNS(NS, "path");
  glint.setAttribute("d", "M-17 0L0-1.1L17 0L0 1.1ZM0-12L1.1 0L0 12L-1.1 0Z");
  lead.setAttribute("pathLength", "1");
  lead.classList.add("lead");
  ring.classList.add("ring");
  pinRing.classList.add("pin-ring");
  glint.classList.add("glint");
  svg.append(lead, ring, pinRing, glint);
  const el = (cls: string, inner: string) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = inner; return d; };
  const label = el("hand-label", `<b></b><small></small>`);
  const chip = el("hand-chip", `<span class="br l">[</span><b></b><span class="br r">]</span>`);
  const pin = el("hand-chip hand-pin", `<span class="br l">[</span><b></b><span class="br r">]</span>`);
  layer.append(svg, label, chip, pin);
  const q = <E extends Element>(root: Element, s: string) => root.querySelector<E>(s)!;
  const lab = { topic: q<HTMLElement>(label, "b"), hint: q<HTMLElement>(label, "small") };
  const chipWords = q<HTMLElement>(chip, "b"), chipL = q<HTMLElement>(chip, ".br.l"), chipR = q<HTMLElement>(chip, ".br.r");
  const pinWords = q<HTMLElement>(pin, "b");
  gsap.set([label, chip, pin, lead, ring, pinRing, glint], { autoAlpha: 0 });
  // each piece's size, measured when its words change (not every frame, which would lay the page out each frame)
  const sizes = new Map<HTMLElement, { w: number; h: number }>();
  const measure = (x: HTMLElement) => { const m = { w: x.offsetWidth, h: x.offsetHeight }; sizes.set(x, m); return m; };
  const sizeOf = (x: HTMLElement) => sizes.get(x) ?? measure(x);
  const forget = () => sizes.clear();
  void document.fonts?.ready.then(forget);
  addEventListener("resize", forget);

  const still = () => getTier() === "still";
  const chipX = gsap.quickTo(chip, "x", { duration: 0.45, ease: "power3.out" });
  const chipY = gsap.quickTo(chip, "y", { duration: 0.45, ease: "power3.out" });

  let stage: Stage | null = null, sky: Sky | null = null;
  const offStage = onStage((s) => { stage = s; });
  const offSky = onSky((s) => { sky = s; });

  // ---------------------------------------------------------------- answering
  let busy = isAnswering();
  let asked: Asked | null = null;
  // what the hand asked is pinned only while he answers that question (one asked elsewhere pins nothing)
  const offAnswering = onAnswering(() => {
    busy = isAnswering();
    if (!busy || (asked && asked.q.trim() !== answeringFor()?.trim())) asked = null;
  });
  function ask(qs: string, star: number | null, subject: string | null) {
    if (isAnswering()) return; // one question at a time
    asked = { q: qs, star, subject };
    if (star !== null) sound?.tap?.(star, atContact(film.t));
    else currentSound()?.play("ui-click");
    // a star's answer lights the constellation where it is: the page stays put
    onAsk(qs, star !== null ? { stay: true } : undefined);
  }
  // a block's own button asks too (the voyage sends it): it clicks, and pins its subject while he answers. Heard on
  // the way down, before the voyage's own listener sends the question and he's answering.
  const onAskButton = (e: MouseEvent) => {
    const b = (e.target as Element | null)?.closest?.<HTMLElement>(".askb");
    if (!b?.dataset.q || isAnswering()) return;
    asked = { q: b.dataset.q, star: null, subject: b.closest<HTMLElement>("[data-block]")?.dataset.block ?? null };
    currentSound()?.play("ui-click");
  };

  // ---------------------------------------------------------------- the pointer
  let speed = 0, lastMove = 0, moved = false;
  const brk = { s: 0 };
  let settleBrk: gsap.core.Tween | gsap.core.Timeline | null = null;
  const drag = { on: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, t: 0, down: 0, done: false };
  try { drag.done = sessionStorage.getItem("hand-dragged") === "1"; } catch {}
  const coast = createTurnCoast();
  // turns the sky's view, its pitch held short of the pole; meeting the clamp stops the pitch's coast
  const turnSky = (az: number, el: number) => {
    if (!sky) return;
    sky.cam.az += az;
    const want = sky.cam.el + el;
    sky.cam.el = clampPitch(want, HERO_EL);
    if (sky.cam.el !== want) coast.stopPitch();
  };
  let focusedBlock: string | null = null;

  const onMove = (e: PointerEvent) => {
    const now = performance.now(), dt = Math.max(1, now - lastMove);
    const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
    if (pointer.in) speed = Math.hypot(dx, dy) / (dt / 1000);
    lastMove = now;
    const target = e.target as Element | null;
    Object.assign(pointer, { x: e.clientX, y: e.clientY, in: true, fine: e.pointerType === "mouse" || e.pointerType === "pen", overUI: !!target?.closest?.(UI) });
    moved = true;
    if (!drag.on) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    if (!drag.moved) { drag.moved = true; pointer.dragging = true; html.classList.add("hand-dragging"); }
    const mx = e.clientX - drag.x, my = e.clientY - drag.y;
    const by = turnBy(mx, my), v = turnSpeed(mx, my, now - drag.t);
    coast.release(v.az, v.el);
    turnSky(by.az, by.el);
    sound?.turn?.(Math.hypot(v.az, v.el));
    drag.t = now;
    drag.x = e.clientX;
    drag.y = e.clientY;
  };
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    pointer.down = true;
    Object.assign(drag, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), down: performance.now(), moved: false });
    if ((e.target as Element | null)?.closest?.(UI)) return;
    if (e.pointerType !== "touch" && !still() && dragLive(film.t)) { drag.on = true; coast.stop(); }
  };
  const onUp = (e: PointerEvent) => {
    pointer.down = false;
    const tap = !drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6 && performance.now() - drag.down < 450;
    if (drag.on) {
      drag.on = false;
      if (drag.moved) {
        html.classList.remove("hand-dragging");
        if (!drag.done) { drag.done = true; try { sessionStorage.setItem("hand-dragged", "1"); } catch {} }
        // a pointer let go after it stopped moving doesn't fling the sky
        if (performance.now() - drag.t > 80) coast.stop();
        else if (coast.moving) sound?.fling?.(coast.speed);
      } else coast.stop();
    }
    pointer.dragging = false;
    drag.moved = false;
    if (!tap || (e.target as Element | null)?.closest?.(UI) || getTier() === "plain") return;
    if (e.pointerType === "touch") return tapAt(e.clientX, e.clientY);
    if (hoverStar !== null) ask(topicOf(hoverStar).ask, hoverStar, null);
    else if (hoverSubject) ask(hoverSubject.q, null, hoverSubject.id);
  };
  const onLeave = (e: PointerEvent | MouseEvent) => { if (!(e as MouseEvent).relatedTarget) pointer.in = false; };
  const onFocus = (e: FocusEvent) => {
    const b = (e.target as Element | null)?.closest?.(".askb");
    focusedBlock = b ? b.closest<HTMLElement>("[data-block]")?.dataset.block ?? null : null;
  };
  const onBlur = () => { focusedBlock = null; };
  document.addEventListener("click", onAskButton, true);
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  addEventListener("pointerup", onUp, { passive: true });
  document.addEventListener("mouseout", onLeave);
  document.addEventListener("focusin", onFocus);
  document.addEventListener("focusout", onBlur);

  // ---------------------------------------------------------------- what's on screen
  const pts: Array<{ x: number; y: number; z: number } | null> = STAR_IDS.map(() => null);
  function projectStars(view: StageView) {
    STAR_IDS.forEach((id, j) => { pts[j] = view.star(id); });
  }
  function subjects(): HandSubject[] {
    const reg = registeredSubjects();
    const list: HandSubject[] = own.filter((s) => !reg.has(s.id));
    for (const s of reg.values()) list.push({ id: s.id, label: s.label, q: s.q, hit: () => s.hit() });
    return list;
  }

  // a tapped star's label, for a moment
  let tapped: { star: number; until: number } | null = null;
  function tapAt(x: number, y: number) {
    const view = stage?.view;
    if (!view) return;
    const t = film.t;
    if (starsLive(t)) {
      projectStars(view);
      const j = nearestStar(pts, x, y, 22);
      if (j !== null) {
        tapped = { star: j, until: performance.now() + TAP_LABEL_MS };
        return ask(topicOf(j).ask, j, null);
      }
    }
    const list = subjects(), k = subjectAt(list.map((s) => ({ hit: s.hit(view) })), x, y);
    if (k !== null) ask(list[k]!.q, null, list[k]!.id);
  }

  // ---------------------------------------------------------------- every frame, after the film has drawn
  let hoverStar: number | null = null, hoverSubject: HandSubject | null = null, heardStar: number | null = null;
  let dwell: { star: number | null; since: number } = { star: null, since: 0 };
  let shownStar: number | null = null, shownKey = "", chipKey = "", pinKey = "";
  const visible = new Map<Element, boolean>();
  const fade = (x: Element, on: boolean, dur = 0.2) => {
    if (visible.get(x) === on) return;
    visible.set(x, on);
    gsap.to(x, { autoAlpha: on ? 1 : 0, duration: still() ? 0 : dur, overwrite: "auto" });
  };
  // a pinned chip sits clear of its subject, level with its middle on the right
  const rightOf = (h: SubjectHit) => {
    if (h.kind === "disc") return { x: h.x + h.R * 1.12 + 14, y: h.y };
    const xs = h.pts.map((p) => p.x), ys = h.pts.map((p) => p.y);
    return { x: Math.max(...xs) + 14, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  };

  function setLabel(j: number | null) {
    const key = j === null ? "" : `${j}|${busy}`;
    if (key !== shownKey) {
      shownKey = key;
      if (j !== null) {
        const tp = topicOf(j);
        lab.topic.textContent = tp.label;
        lab.hint.textContent = busy ? "Tycho is answering" : pointer.fine ? "click to ask Tycho" : "tap to ask Tycho";
        label.classList.toggle("held", busy);
        measure(label);
      }
      if (j !== shownStar) {
        sky?.setHover(j === null ? null : sky.index.get(STAR_IDS[j]!) ?? null);
        if (j !== null && !still()) gsap.fromTo(lead, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" });
        shownStar = j;
      }
    }
    fade(label, j !== null);
    fade(lead, j !== null, 0.15);
    // a still shows no hover ring of the sky's own, nor its twinkle, so the hand draws them
    fade(ring, j !== null && still(), 0.15);
    fade(glint, j !== null && still(), 0);
    if (still()) ring.setAttribute("r", String(RING_R));
    if (j === null) return;
    const p = pts[j];
    if (!p) return;
    const m = sizeOf(label);
    const L = placeStarLabel(p, m.w, m.h, innerWidth, innerHeight);
    label.style.transform = `translate(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px)`;
    lead.setAttribute("x1", L.line[0].toFixed(1)); lead.setAttribute("y1", L.line[1].toFixed(1));
    lead.setAttribute("x2", L.line[2].toFixed(1)); lead.setAttribute("y2", L.line[3].toFixed(1));
    ring.setAttribute("cx", p.x.toFixed(1));
    ring.setAttribute("cy", p.y.toFixed(1));
    if (still()) glint.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  }

  // the stars twinkling, by the hand's own star numbers; each one's place in the sky's state
  const twinkles = createTwinkles();
  const skyIndex = (j: number) => sky?.index.get(STAR_IDS[j]!);
  let heardSubject: string | null = null, offSince = 0;

  function frame() {
    const t = film.t, tier = getTier(), view = stage?.view, now = performance.now(), dt = gsap.ticker.deltaRatio(60) / 60;
    if (tier === "plain" || !view) {
      for (const x of [label, chip, pin, lead, ring, pinRing, glint]) fade(x, false, 0);
      return;
    }
    // the coast: the sky keeps turning where it's seen whole, and stops anywhere else
    if (!drag.on && coast.moving) {
      const v = coast.step(dt);
      if (sky && dragLive(t) && tier === "film") turnSky(v.az * dt, v.el * dt);
      else coast.stop();
    }
    const free = pointer.in && pointer.fine && !pointer.overUI && !drag.moved;
    const live = starsLive(t);
    if (tapped && now > tapped.until) tapped = null;
    // where the stars are on screen, only while one could be under the pointer, labelled or pinned
    if ((free && live) || tapped || (busy && asked?.star != null)) projectStars(view);

    // a star under the pointer, where the stars are the subject
    const onStar = free && live ? nearestStar(pts, pointer.x, pointer.y) : null;
    let star = onStar;
    if (atContact(t)) {
      if (star !== dwell.star) dwell = { star, since: now };
      if (now - dwell.since < DWELL_MS) star = null;
    }
    // the sound hears the star under the pointer itself, before Contact's dwell holds its label back, so a sweep plays
    if (onStar !== heardStar) { sound?.star?.(onStar, atContact(t), speed); heardStar = onStar; }
    hoverStar = star;
    setLabel(star ?? tapped?.star ?? null);

    // the twinkle follows the star under the pointer as the sound does (a tapped one flares as if struck); a still
    // shows it held instead (setLabel)
    twinkles.hover(tier === "film" ? onStar ?? tapped?.star ?? null : null, onStar !== null ? speed : TWINKLE.fast, now / 1000);
    if (!twinkles.idle && sky) {
      for (const [j, v] of twinkles.levels(now / 1000)) {
        const i = skyIndex(j);
        if (i !== undefined) sky.state[i]!.twinkle = v;
      }
    }

    // a subject under the pointer, when no star is
    // where the subjects are on screen, only while the pointer could be over one
    const list = subjects();
    const hits = free && onStar === null ? list.map((s) => s.hit(view)) : [];
    const k = hits.length ? subjectAt(hits.map((hit) => ({ hit })), pointer.x, pointer.y) : null;
    hoverSubject = k === null ? null : list[k]!;
    // the chip ticks as it comes onto a subject it can ask about
    if ((hoverSubject?.id ?? null) !== heardSubject) {
      heardSubject = hoverSubject?.id ?? null;
      if (hoverSubject && !busy) currentSound()?.play("ui-hover");
    }
    if (onStar !== null || k !== null || !free) offSince = now;
    const hint = free && onStar === null && k === null && dragLive(t) && tier === "film" && !drag.done && !drag.on && now - offSince > HINT_REST_MS;
    const words = hoverSubject ? (busy ? "Tycho is answering" : `Ask about ${hoverSubject.label}`) : hint ? "Drag to turn" : "";
    const key = `${words}|${busy}`;
    if (key !== chipKey) {
      chipKey = key;
      if (words) {
        chipWords.textContent = words;
        chip.classList.toggle("held", busy && !!hoverSubject);
        const m = measure(chip), p0 = chipAt(pointer, m.w, m.h, innerWidth, innerHeight);
        chipX(p0.x, p0.x); chipY(p0.y, p0.y); // it appears where it is, then follows
      }
    }
    fade(chip, !!words);
    if (words) {
      const m = sizeOf(chip), p = chipAt(pointer, m.w, m.h, innerWidth, innerHeight);
      if (still()) gsap.set(chip, { x: p.x, y: p.y });
      else { chipX(p.x); chipY(p.y); }
      // the brackets spread with the pointer's speed and spring back once it stops (looked at once a frame, however
      // often the pointer reports)
      if (moved && !still()) {
        gsap.to(brk, { s: bracketSpread(speed), duration: 0.15, ease: "power2.out", overwrite: true });
        settleBrk?.kill();
        settleBrk = gsap.to(brk, { s: 0, duration: 0.5, ease: "back.out(1.2)", delay: 0.1 });
      }
      const s = still() ? 0 : brk.s;
      chipL.style.transform = `translateX(${(-s).toFixed(1)}px)`;
      chipR.style.transform = `translateX(${s.toFixed(1)}px)`;
    }
    moved = false;
    html.classList.toggle("hand-ask", (star !== null || !!hoverSubject) && !busy);
    html.classList.toggle("hand-grab", hint || (free && dragLive(t) && onStar === null && k === null && tier === "film"));

    // pinned: the keyboard's focused subject, or what Tycho is answering about (a star keeps its ring, a subject its chip)
    let pinHit: SubjectHit | null = null, pinText = "", pinStar: number | null = null;
    const answeringAbout = (id: string | null) => busy && !!asked && asked.star === null && asked.subject === id;
    if (focusedBlock) {
      const s = list.find((x) => x.id === focusedBlock);
      const h = s ? s.hit(view) : null;
      if (s && h) { pinHit = h; pinText = answeringAbout(s.id) ? `Answering about ${s.label}` : busy ? "Tycho is answering" : `Ask about ${s.label}`; }
    } else if (busy && asked) {
      if (asked.star !== null) pinStar = asked.star;
      else if (asked.subject) {
        const s = list.find((x) => x.id === asked!.subject);
        const h = s ? s.hit(view) : null;
        if (s && h) { pinHit = h; pinText = `Answering about ${s.label}`; }
      }
    }
    const pk = `${pinText}|${busy}`;
    if (pk !== pinKey) {
      pinKey = pk;
      pinWords.textContent = pinText;
      pin.classList.toggle("answering", busy);
      if (pinText) measure(pin);
    }
    fade(pin, !!pinHit);
    if (pinHit) {
      const at = rightOf(pinHit), { w, h } = sizeOf(pin);
      gsap.set(pin, { x: Math.min(at.x, innerWidth - w - 8), y: Math.max(8, Math.min(innerHeight - h - 8, at.y - h / 2)) });
    }
    const ps = pinStar !== null ? pts[pinStar] : null;
    if (ps) { pinRing.setAttribute("cx", ps.x.toFixed(1)); pinRing.setAttribute("cy", ps.y.toFixed(1)); pinRing.setAttribute("r", String(RING_R)); }
    fade(pinRing, !!ps);
  }
  gsap.ticker.add(frame);
  // for the evidence scripts: where each subject is on screen now
  if (process.env.NODE_ENV !== "production") Object.assign(window, {
    __hand: {
      subjects: () => (stage ? subjects().map((s) => ({ id: s.id, hit: s.hit(stage!.view) })).filter((s) => s.hit) : []),
      // where each star is on screen now (the ones in the frame)
      stars: () =>
        stage
          ? STAR_IDS.map((id) => ({ id, at: stage!.view.star(id) })).filter(({ at }) => at && at.x > 40 && at.y > 40 && at.x < innerWidth - 40 && at.y < innerHeight - 40)
          : [],
      // shows Tycho answering about `q` (asked of a subject or a star) without asking him
      fakeBusy(q: string | null, subject: string | null = null, star: number | null = null) { busy = q !== null; asked = q ? { q, star, subject } : null; },
    },
  });

  return {
    destroy() {
      gsap.ticker.remove(frame);
      offStage();
      offSky();
      offAnswering();
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseout", onLeave);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("click", onAskButton, true);
      removeEventListener("resize", forget);
      html.classList.remove("hand-ask", "hand-grab", "hand-dragging");
      sky?.setHover(null);
      sky?.state.forEach((x) => { x.twinkle = 0; });
      layer.replaceChildren();
    },
  };
}
