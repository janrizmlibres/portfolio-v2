/**
 * Where Tycho is on the screen, and how he moves round it (Finalize Tycho in the film). He belongs to the screen, not
 * to the picture: he parks on spots along the frame's edges, whatever scene is playing.
 * - He keeps 10 px clear of the text being read, of label plates, of the route map and the sound chip, and of the
 *   film's 3D subjects on screen (their footprints, from the shared registry in lib/film/footprints.ts). Whatever
 *   comes under him (a block arriving, a riding title, a label, a subject sliding in) sends him along to the free edge
 *   spot nearest home. With no spot free he takes the least-covered one and stays small.
 * - Lively wander: every 7–12 s he hops to another free edge spot, flying direct on a shallow arc that bows round
 *   whatever's in its way.
 * What he does next is decided in think.ts; this moves him.
 * - A spot the visitor drops or flicks him to (snapped to the nearest edge spot) becomes his home base: he holds it
 *   30 s before wandering again, and settling after a scroll brings him back to it when it's free.
 * - Shaking the pointer over him shoos him: notice, apologise, glance, scoot, all good. That spot stays off-limits for
 *   the session.
 * - He moves off whatever the visitor focuses, clicks or selects; the keyboard's "Move Tycho" takes him round the
 *   corners.
 * - Clicking him to talk doesn't move him: his bubble opens where he is, and while it's open he moves only when the
 *   visitor moves him (a drag or flick, the keyboard's "Move Tycho"): no wander, no keeping clear, no shooing. A move
 *   already under way when it opens still lands, and a resize still puts him somewhere new. Each time he's drawn
 *   somewhere else he says so (`moved`), and his bubble comes along.
 * - Phones: no wander, though drag and flick still move him, and text still moves him on. Reduced motion: no wander,
 *   and every move is a fade.
 *
 * His spot is written as an offset from his corner (the body's CSS place), so before this runs, and while the wake-up
 * flies him in, he's where the page puts him.
 */
import gsap from "gsap";
import type { TychoRig } from "@/lib/tycho/rig";
import { footprints } from "@/lib/film/footprints";
import { arcPoint, BOW, bodyBox, bowFor, createShake, edgeCandidates, isClear, placeSpot, releaseAt, SMALL, type Pt, type Rect } from "@/lib/tycho/spots";
import { think as decide } from "@/lib/tycho/think";
import { createOverlay, wantsOverlay } from "@/lib/tycho/overlay";

const HOME_KEY = "tycho-home"; // sessionStorage: the visitor's spot, as fractions of the frame
const GRACE_S = 30; // a spot the visitor picks holds him this long
const QUIET = { quiet: true }; // what he does as he moves makes no sound

export function createRoam(o: {
  body: HTMLElement;
  rig: () => TychoRig | null;
  phone: () => boolean;
  reduced: boolean;
  /** his bubble is open: he moves only when the visitor moves him */
  talking: () => boolean;
  announce: (text: string) => void;
  /** he's just been drawn somewhere else */
  moved?: () => void;
}) {
  const { body, rig, reduced } = o;
  const html = document.documentElement;
  const size = () => (o.phone() ? 92 : 128);
  // his corner, the body's CSS place: right 18 / bottom 14 on desktop, 6 / 6 on a phone
  const corner = (): Pt => (o.phone() ? { x: innerWidth - 6 - 46, y: innerHeight - 6 - 46 } : { x: innerWidth - 18 - 64, y: innerHeight - 14 - 64 });
  const edges = () => edgeCandidates(innerWidth, innerHeight, size());
  const frame = () => ({ vw: innerWidth, vh: innerHeight });
  // where his centre is, his opacity, and his scale (SMALL on a spot that isn't clear)
  const pos = { x: 0, y: 0, o: 1, s: 1 };
  let small = false;
  const shrink = (to: boolean) => {
    if (to === small) return;
    small = to;
    gsap.to(pos, { s: to ? SMALL : 1, duration: reduced ? 0 : 0.35, ease: "power2.inOut", overwrite: "auto" });
  };
  Object.assign(pos, corner());

  // ---------------------------------------------------------------- home: his corner, the last wander, or the visitor's
  let home: Pt = corner(), chosen = false, graceUntil = 0;
  try {
    const f = JSON.parse(sessionStorage.getItem(HOME_KEY) ?? "null");
    if (f) { home = { x: f.x * innerWidth, y: f.y * innerHeight }; chosen = true; }
  } catch {}
  const offLimits: Pt[] = [];
  const choose = (p: Pt) => {
    home = p;
    chosen = true;
    graceUntil = performance.now() + GRACE_S * 1000;
    try { sessionStorage.setItem(HOME_KEY, JSON.stringify({ x: p.x / innerWidth, y: p.y / innerHeight })); } catch {}
  };

  // ---------------------------------------------------------------- what's on screen that he mustn't cover
  const blockers: Array<{ el: Element; until: number }> = [];
  function obstacles(): Rect[] {
    const out: Rect[] = [], range = document.createRange();
    const add = (r: DOMRect, pad = 0) => { if (r.width > 1 && r.height > 1) out.push({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad }); };
    for (const shot of document.querySelectorAll<HTMLElement>(".shot.on")) {
      if (+getComputedStyle(shot).opacity < 0.05) continue;
      const tw = document.createTreeWalker(shot, NodeFilter.SHOW_TEXT);
      for (let n: Node | null; (n = tw.nextNode());) {
        if (!(n as Text).data.trim() || getComputedStyle(n.parentElement!).visibility === "hidden") continue;
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.bottom > 0 && r.top < innerHeight) add(r);
      }
    }
    // a label's whole plate (the portrait's card, its photo), not only its words
    for (const el of document.querySelectorAll<HTMLElement>(".shot.on .label, .shot.on img")) {
      const cs = getComputedStyle(el);
      if (cs.visibility !== "hidden" && +cs.opacity > 0.05) add(el.getBoundingClientRect(), 4);
    }
    for (const sel of ["nav.routemap", ".snd"]) { const el = document.querySelector(sel); if (el) add(el.getBoundingClientRect(), 8); }
    const now = performance.now();
    for (const b of blockers) if (b.until > now) add(b.el.getBoundingClientRect(), 14);
    return out;
  }
  // where to park among `cands`: clear of the page and the subjects, or the least covered, small
  const place = (cands: Pt[], page: Rect[], prefer?: Pt) =>
    placeSpot({ cands, size: size(), vw: innerWidth, vh: innerHeight, page, bodies: footprints(), offLimits, prefer });

  // ---------------------------------------------------------------- moving him
  let mode: "parked" | "travel" | "drag" | "shoo" = "parked";
  let move: gsap.core.Timeline | null = null;
  function travel(to: Pt, { hurry = false, arrive = "settle" as "settle" | "allGood", bow = BOW, shrunk = false } = {}) {
    move?.kill();
    mode = "travel";
    const done = () => { move = null; mode = "parked"; rig()?.lean(0, 0); };
    shrink(shrunk);
    if (reduced) {
      move = gsap.timeline({ onComplete: done }).to(pos, { o: 0, duration: 0.15, ease: "power1.in" }).set(pos, { x: to.x, y: to.y }).to(pos, { o: 1, duration: 0.15, ease: "power1.out" });
      return;
    }
    const a = { x: pos.x, y: pos.y }, dist = Math.hypot(to.x - a.x, to.y - a.y);
    if (dist < 3) { done(); return; }
    const dur = gsap.utils.clamp(0.45, 1.5, dist / (hurry ? 1700 : 1100));
    const p = { k: 0 };
    let lx = a.x, ly = a.y, lt = performance.now();
    const tl = gsap.timeline({ onComplete: done });
    // nothing sounds when he moves: his takeoff, his landing, or a drag
    if (!hurry && dist > 160) { rig()?.emote("anticipate", QUIET); tl.to({}, { duration: 0.42 }); }
    tl.to(p, {
      k: 1, duration: dur, ease: "power2.inOut",
      onUpdate: () => {
        // direct, on a shallow arc, bowed to whichever side keeps clearer
        Object.assign(pos, arcPoint(a, to, bow, p.k));
        const now = performance.now(), dt = Math.max(8, now - lt) / 1000;
        rig()?.lean((pos.x - lx) / dt, (pos.y - ly) / dt);
        lx = pos.x; ly = pos.y; lt = now;
      },
    });
    tl.add(() => { rig()?.lean(0, 0); rig()?.emote(arrive, QUIET); });
    move = tl;
  }

  // ---------------------------------------------------------------- each frame: draw him where he is
  // (written only when it changes: parked, he costs the page nothing a frame)
  let drawn = "";
  const draw = () => {
    // the wake-up places him itself; after it, he's written afresh
    if (html.classList.contains("wake")) { drawn = ""; return; }
    const c = corner();
    const t = `translate3d(${(pos.x - c.x).toFixed(1)}px, ${(pos.y - c.y).toFixed(1)}px, 0)${pos.s < 0.999 ? ` scale(${pos.s.toFixed(3)})` : ""}`;
    const op = pos.o < 1 ? pos.o.toFixed(3) : "";
    if (t + op === drawn) return;
    drawn = t + op;
    body.style.transform = t;
    body.style.opacity = op;
    o.moved?.();
  };
  gsap.ticker.add(draw);

  // ---------------------------------------------------------------- a few times a second: keep clear, home, the wander
  let lastScroll = 0, settledBack = true, nextHop = 0, overHimNow = false;
  const onScroll = () => { lastScroll = performance.now(); settledBack = false; };
  addEventListener("scroll", onScroll, { passive: true });

  // development only: what he keeps clear of, drawn over the page (`?prints`)
  const overlay = wantsOverlay() ? createOverlay() : null;
  // held by whatever flies him off his spot and back (the warp) or keeps him still (the point), counted, as both can
  // hold him at once
  let holds = 0;
  function think() {
    if (overlay) overlay.draw({ page: obstacles(), bodies: footprints(), body: bodyBox({ x: pos.x, y: pos.y }, size() * pos.s), small });
    if (html.classList.contains("wake") || holds > 0 || mode !== "parked" || o.talking()) return;
    const { act, mind } = decide(
      { here: { x: pos.x, y: pos.y }, home, chosen, small, offLimits, now: performance.now(), graceUntil, lastScroll, settledBack, nextHop, still: o.phone() || reduced || overHimNow },
      { cands: edges(), size: size(), vw: innerWidth, vh: innerHeight, page: obstacles(), bodies: footprints(), rand: Math.random },
    );
    if (mind.settledBack !== undefined) settledBack = mind.settledBack;
    if (mind.nextHop !== undefined) nextHop = mind.nextHop;
    if (mind.home) home = mind.home;
    if (act.do === "stay") shrink(act.small);
    else travel(act.to, { hurry: act.hurry, bow: act.bow, shrunk: act.small });
  }
  // four times a second, and eight while the page scrolls, so a title riding in under him (titles count as text) sends
  // him along before it's covered for long
  let beat = 0;
  const thinking = window.setInterval(() => {
    if (++beat % 2 && performance.now() - lastScroll > 600) return;
    think();
  }, 125);
  // development only: what he sees and where he is, for checks and captures
  if (process.env.NODE_ENV !== "production")
    Object.assign(window, { __roam: { seen: () => ({ page: obstacles(), bodies: footprints(), body: bodyBox({ x: pos.x, y: pos.y }, size() * pos.s), small, mode, home }) } });

  // ---------------------------------------------------------------- shake to shoo
  const shake = createShake();
  let hinted = false, cool = 0;
  const overHim = (x: number, y: number, pad: number) => {
    const b = bodyBox({ x: pos.x, y: pos.y }, size() * pos.s);
    return x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad;
  };
  const onPointerMove = (e: PointerEvent) => {
    overHimNow = e.pointerType !== "touch" && overHim(e.clientX, e.clientY, 0);
    if (e.pointerType === "touch" || e.buttons || holds > 0 || mode !== "parked" || o.talking() || reduced) return;
    const now = performance.now();
    if (now < cool || !overHim(e.clientX, e.clientY, 60)) { shake.reset(); hinted = false; return; }
    const level = shake.feed(e.clientX, e.clientY, now);
    if (level >= 2 && !hinted) { hinted = true; rig()?.emote("flinch"); }
    if (level >= 4) shoo({ x: e.clientX, y: e.clientY });
  };
  addEventListener("pointermove", onPointerMove);
  // "oh! ok, sorry, I'll move over here"
  function shoo(ptr: Pt) {
    shake.reset();
    hinted = false;
    cool = performance.now() + 1800;
    const from = { x: pos.x, y: pos.y };
    offLimits.push(from);
    const cands = edges().filter((c) => Math.hypot(c.x - from.x, c.y - from.y) > 240 && Math.hypot(c.x - ptr.x, c.y - ptr.y) > 140);
    const page = obstacles(), p = place(cands, page, from);
    if (!p) return;
    const to = p.at;
    choose(to);
    move?.kill();
    mode = "shoo";
    const r = rig();
    gsap.timeline()
      .call(() => r?.emote("notice"))
      .call(() => r?.emote("apologise"), [], 0.75)
      .call(() => r?.emote("glance"), [], 2.1)
      .call(() => travel(to, { hurry: true, arrive: "allGood", bow: bowFor(from, to, size(), [...page, ...footprints()], frame()), shrunk: p.small }), [], 2.6);
  }

  // ---------------------------------------------------------------- drag and flick: to the nearest free edge spot
  let press: { x: number; y: number; dx: number; dy: number; id: number } | null = null;
  let samples: Array<{ x: number; y: number; t: number }> = [];
  let dragged = false;
  const onDown = (e: PointerEvent) => {
    if (holds > 0) return;
    press = { x: e.clientX, y: e.clientY, dx: pos.x - e.clientX, dy: pos.y - e.clientY, id: e.pointerId };
    dragged = false;
  };
  const onMove = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    if (!dragged && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
    if (!dragged) {
      dragged = true;
      body.setPointerCapture(e.pointerId);
      move?.kill();
      mode = "drag";
      pos.o = 1;
      rig()?.emote("flinch", QUIET);
    }
    const now = performance.now();
    samples.push({ x: e.clientX, y: e.clientY, t: now });
    samples = samples.filter((p) => now - p.t < 100);
    const nx = e.clientX + press.dx, ny = e.clientY + press.dy;
    rig()?.lean((nx - pos.x) * 30, (ny - pos.y) * 30);
    pos.x = nx;
    pos.y = ny;
  };
  const onUp = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    press = null;
    if (!dragged) return;
    const a = samples[0], dt = a ? Math.max(16, performance.now() - a.t) / 1000 : 1;
    const v = a ? { x: (e.clientX - a.x) / dt, y: (e.clientY - a.y) / dt } : { x: 0, y: 0 };
    samples = [];
    const want = releaseAt({ x: pos.x, y: pos.y }, v, size(), { vw: innerWidth, vh: innerHeight });
    const page = obstacles(), p = place(edges(), page, want), to = p?.at ?? corner();
    choose(to);
    mode = "parked";
    travel(to, { hurry: true, bow: bowFor({ x: pos.x, y: pos.y }, to, size(), [...page, ...footprints()], frame()), shrunk: !!p?.small });
  };
  body.addEventListener("pointerdown", onDown);
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", onUp);
  // a drag isn't a click: the click that ends it doesn't open his bubble
  const onClickCapture = (e: MouseEvent) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } };
  body.addEventListener("click", onClickCapture, true);

  // ---------------------------------------------------------------- moving off what the visitor uses
  const block = (el: Element | null) => {
    if (!el || el.closest("#tycho")) return;
    blockers.push({ el, until: performance.now() + 20000 });
    while (blockers.length > 6) blockers.shift();
  };
  const onFocus = (e: FocusEvent) => block(e.target as Element);
  const onPress = (e: PointerEvent) => block((e.target as Element)?.closest?.("a, button, input, [data-block] p, .shot h2, .shot h3") ?? null);
  const onSelect = () => {
    const sel = getSelection();
    if (sel && !sel.isCollapsed && sel.anchorNode) block(sel.anchorNode.nodeType === 1 ? (sel.anchorNode as Element) : sel.anchorNode.parentElement);
  };
  addEventListener("focusin", onFocus);
  addEventListener("pointerdown", onPress);
  document.addEventListener("selectionchange", onSelect);

  // ---------------------------------------------------------------- the keyboard's "Move Tycho": round the corners
  const CORNERS = ["bottom right", "bottom left", "top left", "top right"] as const;
  let cornerAt = 0;
  function moveByKey() {
    if (holds > 0) return;
    const obs = [...obstacles(), ...footprints()], w = innerWidth, h = innerHeight, e = edges();
    const at = (k: number) => {
      const xs = [1, 0, 0, 1][k]! * w, ys = [1, 1, 0, 0][k]! * h;
      return e.reduce((best, c) => (Math.hypot(c.x - xs, c.y - ys) < Math.hypot(best.x - xs, best.y - ys) ? c : best));
    };
    for (let i = 1; i <= 4; i++) {
      const k = (cornerAt + i) % 4, p = at(k);
      if (isClear(p, size(), obs)) {
        cornerAt = k;
        choose(p);
        travel(p, { bow: bowFor({ x: pos.x, y: pos.y }, p, size(), obs, frame()) });
        o.announce(`Tycho moved to the ${CORNERS[k]}.`);
        return;
      }
    }
  }

  const onResize = () => {
    if (!chosen) home = corner();
    if (mode === "parked") { const p = place(edges(), obstacles(), home); Object.assign(pos, p?.at ?? corner()); shrink(!!p?.small); }
  };
  addEventListener("resize", onResize);

  return {
    moveByKey,
    /** his centre (CSS px), his canvas's size and his scale: where a flight off his spot leaves from and lands back on */
    spot: () => ({ x: pos.x, y: pos.y, size: size(), scale: pos.s }),
    /**
     * back on his corner as a load starts him, his spot cleared (the replayed wake-up flies him there from its stage);
     * a spot the visitor chose is still his home
     */
    reset() {
      move?.kill();
      move = null;
      mode = "parked";
      holds = 0;
      small = false;
      Object.assign(pos, corner(), { o: 1, s: 1 });
      drawn = "";
      body.style.transform = body.style.opacity = "";
    },
    /** holds him where he is (no thinking, wander, drag or shake) until every hold is released */
    hold(on: boolean) {
      holds = Math.max(0, holds + (on ? 1 : -1));
      if (on) { move?.kill(); move = null; mode = "parked"; }
    },
    destroy() {
      gsap.ticker.remove(draw);
      clearInterval(thinking);
      overlay?.destroy();
      move?.kill();
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      removeEventListener("focusin", onFocus);
      removeEventListener("pointerdown", onPress);
      removeEventListener("resize", onResize);
      document.removeEventListener("selectionchange", onSelect);
      body.removeEventListener("pointerdown", onDown);
      body.removeEventListener("click", onClickCapture, true);
      body.style.transform = body.style.opacity = "";
    },
  };
}
