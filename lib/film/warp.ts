/**
 * The warp: how the page travels to another section (a route-map link, and the agent's jumps). Reading scrolls; a
 * jump warps. Every warp goes through `warpTo`: *Warp or scroll*'s wormhole journey, with *Make every scroll a
 * scene*'s pull-back and flare before the hole (its beats and their times are warp-plan.ts):
 * 1. the camera pulls back out to the whole sky while the text leaves (not in the hero, already outside it).
 *    Meanwhile Tycho leaves his corner: his boosters pop out, his jets fire, and he flies one clean circle round the
 *    middle in 3D, leaning into it; its fire closes into a ring;
 * 2. on a question, the stars it explored flare on the whole sky;
 * 3. the ring winds into a spark while he perches, his back to us, and winds up;
 * 4. the spark bursts into a black hole with a flash and a shock, and the blast throws him back at us. The sky falls
 *    into the hole, bent round it, while he strains against the pull; then a glance back, a grin, and he dives in;
 * 5. the horizon swells over the frame and the page jumps, unseen. Down the throat after him, past pieces of the
 *    section left behind: he drops back past us with a wave and barrel-rolls off towards the light;
 * 6. a portal opens out of the light onto the destination's point of light and its white hole, settling into the
 *    destination's own light, as the camera comes in to its hold and its words write in. He bursts
 *    out, swoops past and lands back on his spot, dizzy, then all good, and the corner Tycho takes over.
 * The page is locked while it runs (warp-input.ts); a click, tap or Esc hurries it. Under reduced motion it's a
 * crossfade; on the plain page, a jump. At mid and low quality it's the same journey, lighter (lib/universe/tier.ts).
 * The hole is drawn in the sky's own frame (lib/voyage/warp-hole.ts, with his fire, warp-trail.ts, and the section
 * left behind, warp-debris.ts) and Tycho on a stage of his own (lib/tycho/flight.ts); all are made ahead once the
 * page is idle, so the first warp compiles nothing.
 * `onWarp` tells anything else each beat as it begins: its sound (lib/audio/warp-sound.ts) is played off those.
 */
import gsap from "gsap";
import type { SectionId } from "./block";
import { filmT } from "./here";
import { jumpTo, scrollYOf } from "./scroll";
import { smooth } from "./smooth";
import { drawsNow } from "./pace";
import { onStage, type Stage } from "./stage";
import { getTier, isPort } from "./tier";
import { dolly, pullPose, type CamPose } from "./warp-camera";
import { createWarpInput } from "./warp-input";
import { warpPalette } from "./warp-palette";
import { HURRY, planWarp, tripProgress, WARP_S, type WarpKind, type WarpPlan } from "./warp-plan";
import { announce } from "@/lib/a11y/announce";
import { currentRig, onRig } from "@/lib/tycho/current";
import { eyeDist, orbit, path, quake, route, type At, type Key, type P3 } from "@/lib/tycho/flight-path";
import type { TychoFlight } from "@/lib/tycho/flight";
import { oklabToSrgb, oklchToOklab, REGION_LIGHT, type Region } from "@/lib/universe/light";
import { detail } from "@/lib/universe/tier";
import { onSky } from "@/lib/universe/live";
import { inTurn } from "./turns";
import { markBuilt } from "@/lib/wake/built";
import type { Pose, Sky } from "@/lib/universe/sky";
import type { WarpHole } from "@/lib/voyage/warp-hole";
import type { WarpTrail } from "@/lib/voyage/warp-trail";
import type { WarpDebris } from "@/lib/voyage/warp-debris";

export type WarpPhase = "start" | "burst" | "travel" | "arrive" | "land" | "end" | "hurry";
export type WarpEvent = { phase: WarpPhase; sec: SectionId; kind: WarpKind; plan: WarpPlan | null };

// the film time before where a section's link lands (its first entry) that the warp lands on, so the film itself
// plays the last stretch in as the scene opens and its words write in
const LEAD = 0.7;
// how many times its own distance the arrival's camera starts out, where the subject is a point of light
const FAR = 40;
// below this film time the frame is still the whole sky (the hero): there's nothing to pull back from
const WHOLE_SKY_T = 0.5;
const TAU = Math.PI * 2;
const REGION: Record<SectionId, Region> = { "sec-hero": "hero", "sec-about": "about", "sec-work": "work", "sec-projects": "projects", "sec-contact": "contact" };

// ---------------------------------------------------------------- what the warp draws with, made ahead
let sky: Sky | null = null, stage: Stage | null = null, flight: TychoFlight | null = null;
type Gear = { hole: WarpHole; trail: WarpTrail; debris: WarpDebris; throatEase: () => (p: number) => number };
let gear: Gear | null = null;
let preparing = false;
/** resolves once Tycho's 3D rig is in (it comes in under the loader, before the warp can need it) */
const rigIn = () => new Promise<void>((done) => {
  if (currentRig()) return done();
  const off = onRig(() => { if (currentRig()) { off(); done(); } });
});

/**
 * Makes what the warp draws with, under the wake-up's loader with every scene (ADR 0018), each piece in a turn of its
 * own: the hole and Tycho's fire, the pieces of each scene the throat carries once every scene is in, and Tycho's stage
 * (a second rig, once his 3D body is in). Then the loader's count may go on (lib/wake/built.ts). A film that doesn't
 * warp (reduced motion) has nothing to make.
 */
function prepare() {
  if (preparing || !sky || !stage) return;
  if (getTier() !== "film") return markBuilt("warp");
  preparing = true;
  const s = sky, st = stage;
  let made: Gear | null = null;
  void inTurn(() => Promise.all([import("@/lib/voyage/warp-hole"), import("@/lib/voyage/warp-trail"), import("@/lib/voyage/warp-debris")]))
    .then(([{ createWarpHole }, { createWarpTrail }, { createWarpDebris, throatEase }]) => inTurn(() => {
      if (sky !== s) return;
      const g = { hole: createWarpHole({ renderer: s.renderer, lite: () => detail().lite }), trail: createWarpTrail(), debris: createWarpDebris(), throatEase };
      return Promise.all([g.hole.warm(s.camera), g.trail.warm(s.renderer)]).then(() => { if (sky === s) gear = made = g; });
    }))
    // the pieces of each scene the throat carries, once every scene is in (waited for outside a turn: the scenes' own
    // turns are queued behind it)
    .then(() => st.whole)
    .then(() => inTurn(() => { if (made && sky === s && stage === st && st.cargo) return made.debris.library(s.renderer, st.cargo.all()); }))
    .then(rigIn)
    .then(() => inTurn(() => import("@/lib/tycho/flight").then(({ createTychoFlight }) => createTychoFlight())))
    .then((f) => {
      if (sky === s) flight = f;
      else f.dispose();
    })
    .catch(() => { preparing = false; })
    // a warp that couldn't be made falls back to a jump; the loader never waits on it
    .finally(() => markBuilt("warp"));
}
if (typeof window !== "undefined") {
  onSky((s) => {
    if (s === sky) return;
    gear?.hole.dispose();
    gear?.trail.dispose();
    gear?.debris.dispose();
    gear = null;
    flight?.dispose();
    flight = null;
    sky = s;
    preparing = false;
    prepare();
  });
  onStage((s) => { stage = s; prepare(); });
  // the journey is laid out for the frame it set out in: a rotation or resize hurries it to its end
  window.addEventListener("resize", () => run?.hurry());
  // in development, what's ready and a way to warp, for captures
  if (process.env.NODE_ENV !== "production") {
    Object.assign(window, { __warp: { ready: () => ({ hole: !!gear, flight: !!flight }), to: warpTo, get running() { return !!run; }, time: () => run?.tl.time() ?? null, get plan() { return run?.plan ?? null; }, get gear() { return gear; }, get flight() { return flight; } } });
  }
}

// ---------------------------------------------------------------- the warp under way, and who's told
const listeners = new Set<(e: WarpEvent) => void>();
/** Tells `fn` each beat of every warp as it begins; returns the way to stop. */
export function onWarp(fn: (e: WarpEvent) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
const tell = (e: WarpEvent) => listeners.forEach((fn) => fn(e));

// givenBack: the page is the visitor's again (his landing may still be playing out)
type Run = { plan: WarpPlan | null; tl: gsap.core.Timeline; sec: SectionId; kind: WarpKind; hurry: () => void; givenBack: () => boolean };
let run: Run | null = null;
export const isWarping = () => run !== null;
/** The trip in miniature: how far the warp under way has travelled (0..1), or null with none under way. */
export function warpTrip() {
  if (!run) return null;
  return run.plan ? tripProgress(run.plan, run.tl.time()) : run.tl.progress();
}

let input: ReturnType<typeof createWarpInput> | null = null;
const lockInput = () => {
  input ??= createWarpInput({ onHurry: () => run?.hurry() });
  input.lock();
};

// the text over the picture, its leader lines and the hand's labels: what leaves as the warp sets out
const textLayers = () => ["runway", "leaders", "hand"].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);

const nameOf = (sec: SectionId) => (document.getElementById(sec)?.querySelector("h1, h2, h3")?.textContent ?? sec.replace("sec-", "")).trim();

/**
 * After a link's warp, focus moves to the heading of the block it landed on, at film time `t` (without the browser
 * scrolling to it): past a section's intro that's its first entry's, since focus on the intro would glide back to it.
 */
function focusSection(sec: SectionId, t: number) {
  const el = document.getElementById(sec);
  const at = [...(el?.querySelectorAll<HTMLElement>("article[data-spot]") ?? [])].findLast((a) => Number(a.dataset.spot) <= t + 0.01);
  const h = (at ?? el)?.querySelector<HTMLElement>("h1, h2, h3");
  if (!h) return;
  if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
  h.focus({ preventScroll: true });
}

/**
 * Warps to section `sec`, landing on film time `t` (its first entry's reading spot, past an intro). `question`: the agent's jump, after a
 * question (its explored stars flare, it runs longer, and focus stays where the visitor is typing). A warp asked for
 * while one runs is ignored until the page is given back; after that, while his landing plays out, it cuts the landing
 * short and sets out. Returns false only when it's ignored.
 */
export function warpTo(sec: SectionId, t: number, { reduced = false, question = false }: { reduced?: boolean; question?: boolean } = {}): boolean {
  if (run) {
    if (!run.givenBack()) return false;
    run.tl.progress(1);
    if (run) return false;
  }
  const tier = getTier();
  const kind: WarpKind = question ? "question" : "link";
  if (tier === "plain") jumpTo(scrollYOf(t));
  else if (reduced || tier === "still") crossfade(sec, t, kind);
  // the 3D isn't in yet: the film plays through on the way, fast
  else if (!sky || !stage || !gear) gsap.to(window, { scrollTo: { y: scrollYOf(t), autoKill: true }, duration: 1.6, ease: "power2.inOut", overwrite: true });
  else journey(sec, t, kind, sky, gear);
  return true;
}

// ---------------------------------------------------------------- reduced motion: a crossfade
function crossfade(sec: SectionId, t: number, kind: WarpKind) {
  const stills = document.getElementById("stills");
  const shots = [...(stills?.querySelectorAll("canvas") ?? [])];
  const over = document.createElement("canvas");
  over.width = shots[0]?.width || innerWidth;
  over.height = shots[0]?.height || innerHeight;
  // over the stills, which the stylesheet keeps at opacity 0 until the film shows one
  over.style.cssText = "position:fixed;inset:0;width:100vw;height:100lvh;pointer-events:none;opacity:1";
  const g = over.getContext("2d")!;
  for (const c of shots) {
    const o = +getComputedStyle(c).opacity;
    if (o > 0.004 && c.width) { g.globalAlpha = o; g.drawImage(c, 0, 0, over.width, over.height); }
  }
  stills?.append(over);
  const text = textLayers();
  lockInput();
  const tl = gsap.timeline({
    onComplete: () => {
      over.remove();
      gsap.set(text, { clearProps: "opacity" });
      input?.unlock();
      run = null;
      if (kind === "link") focusSection(sec, t);
      else announce(`Tycho took you to ${nameOf(sec)}.`);
      tell({ phase: "end", sec, kind, plan: null });
    },
  });
  run = { plan: null, tl, sec, kind, hurry: () => tl.timeScale(HURRY), givenBack: () => false };
  tell({ phase: "start", sec, kind, plan: null });
  tl.to(text, { opacity: 0, duration: 0.25, ease: "power1.in" }, 0)
    .call(() => jumpTo(scrollYOf(t)), [], 0.25)
    .to(over, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 0.3)
    .to(text, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0.55);
}

// ---------------------------------------------------------------- the journey
function journey(sec: SectionId, t: number, kind: WarpKind, sky: Sky, gear: Gear) {
  const { hole, trail, debris } = gear;
  const fromHero = filmT() < WHOLE_SKY_T;
  // the stars the chat lit (its own pair, `read` and `flare`: the film's lit stars aren't the question's)
  const lit = sky.state.map((s, i) => (s.read > 0.05 ? i : -1)).filter((i) => i >= 0);
  // in development, `?warp=<seconds>` tunes a link's length live (a question's scales with it)
  const tuned = process.env.NODE_ENV !== "production" ? Number(new URLSearchParams(location.search).get("warp")) || 0 : 0;
  const seconds = tuned ? (kind === "link" ? tuned : (tuned * WARP_S.question) / WARP_S.link) : undefined;
  const P = planWarp({ kind, fromHero, flare: lit.length > 0, seconds });
  // the journey's own beats, in seconds at this warp's pace
  const at = (x: number) => x * P.k;
  const len = (l: readonly [number, number]) => l[1] - l[0];
  const tLand = Math.max(0, t - LEAD), yLand = scrollYOf(tLand), ySpot = scrollYOf(t);
  const text = textLayers();
  const lite = detail().lite;
  // the frame, and the eye in front of it (flight-path.ts)
  sky.holdScale((P.total + 1) * 1000);
  hole.resize();
  const box = sky.renderer.domElement, res = { w: box.clientWidth || innerWidth, h: box.clientHeight || innerHeight };
  const c = { x: res.w / 2, y: res.h / 2 }, m = Math.min(res.w, res.h), diag = Math.hypot(res.w, res.h), D = eyeDist(res.h);
  const R0 = m * 0.075, big = diag * 0.8;
  const hs = hole.state, tf = trail.fx;
  // the way the throat turns: down the page turns one way, back up the other
  const down = ySpot >= window.scrollY ? 1 : -1;
  hole.reset({ twist: down, cx: c.x, cy: c.y });
  // the warp is in the destination's light from the start: its fire, its gas and Tycho's flames take its hue
  // (warp-palette.ts), and at the exit the white hole settles into its own light. In development, `?warphue=<deg>`
  // (and `&warpchroma=<k>`) try another
  const q = process.env.NODE_ENV !== "production" ? new URLSearchParams(location.search) : null;
  const hue = Number(q?.get("warphue")) || REGION_LIGHT[REGION[sec]].tint[2];
  const palette = warpPalette(hue, Number(q?.get("warpchroma")) || 1);
  hole.hue(oklabToSrgb(oklchToOklab([0.84, 0.12, hue])));
  hole.palette(palette);
  trail.palette(palette);
  trail.clear();

  // ---- the camera: the film's own pose, pulled back to the whole sky, and after the jump brought in from afar
  const cam = { pull: 0, lm: 0 };
  let arrived = false;
  const filmDrive = sky.drive;
  const drive = (o: () => Pose): Pose => {
    const fp = (filmDrive ? filmDrive(o) : o()) as CamPose;
    if (arrived) return dolly(fp, Math.exp(cam.lm)) as Pose;
    return (fromHero ? fp : pullPose(fp, o() as CamPose, cam.pull)) as Pose;
  };
  sky.drive = drive;
  const giveBackCamera = () => { if (sky.drive === drive) sky.drive = filmDrive; };
  // and the eye's own camera over all of it: a shake, a roll, a zoom (as it rolls, so the corners stay covered)
  const eye = { t: 0, shake: 0, rumble: 0, roll: 0, push: 0, x: 0, y: 0, zoom: 1 };
  const universe = box.parentElement;

  // ---- Tycho, and the way he flies: off his spot, his circle, and (once the hole has opened) out and back
  const f = flight && flight.begin() ? flight : null;
  const rig = f?.rig ?? null;
  rig?.warpColours(palette);
  const homeAt = f?.home() ?? { x: c.x, y: c.y, z: 0, s: 100 };
  const side = homeAt.x >= c.x ? 1 : -1; // the side he starts on; he swoops out over the other first
  // his height on screen at depth 0 while he flies: a bigger share of a small or portrait frame
  const flyS = Math.max(homeAt.s, m * (isPort(res.w, res.h) || m < 600 ? 0.24 : 0.2));
  const fl = { route: route(), w: 0, ring: false, life: 1 };
  const tLift = P.lift;
  const start: Key = { t: tLift, x: homeAt.x, y: homeAt.y + m * 0.015, z: 0, v: [0, 0, 0] };
  fl.route.add(path([{ t: 0, x: homeAt.x, y: homeAt.y, z: 0, v: [0, 0, 0] }, start]));
  const ringC: P3 = { x: c.x, y: c.y, z: -0.35 * D };
  const orb = orbit({ c, D, R: m * (res.w < 600 ? 0.4 : 0.3), e: 0.9, depth: (a) => (-0.28 + 0.26 * Math.sin(a)) * D, from: start, dir: side > 0 ? -1 : 1, t0: tLift, t1: P.circle[1], endZ: 0.24 * D });
  fl.route.add(orb);
  const perched = { ...orb.end };
  const tSnap = P.burst, t2 = P.swallow[0], sw = len(P.swallow), t3 = P.swallow[1], tDive = P.dive;
  fl.route.add(path([
    { t: tSnap, ...perched, v: [0, 0, 0] },
    { t: tSnap + at(0.13), x: c.x + side * res.w * 0.06, y: c.y + m * 0.13, z: 0.5 * D }, // thrown back at us
    { t: tSnap + at(0.45), x: c.x + side * res.w * 0.13, y: c.y + m * 0.12, z: 0.42 * D }, // he catches himself, off to the side
    { t: t2 + sw * 0.55, x: c.x + side * res.w * 0.11, y: c.y + m * 0.1, z: 0.28 * D }, // dragged back, straining
    { t: t3, x: c.x + side * res.w * 0.08, y: c.y + m * 0.08, z: 0.12 * D },
    { t: tDive - at(0.02), x: c.x + side * res.w * 0.1, y: c.y + m * 0.1, z: 0.2 * D, v: [0, 0, 0] }, // a pull back at us before he goes
    { t: tDive + at(0.44), x: c.x, y: c.y, z: -2.2 * D }, // and in, head first
  ]));
  const t4 = P.travel[0], tr = len(P.travel), t5 = P.arrive[0], tDown = P.land;
  // his way out: far down the throat, back past us, off into the light, out of the white hole, a swoop past us over
  // the side away from his spot, round, and down onto it
  const sd = homeAt.x >= c.x ? 1 : -1;
  const wayOut = path([
    { t: t4, x: c.x, y: c.y, z: -3.2 * D, v: [0, 0, 0] },
    { t: t4 + at(0.42), x: c.x - sd * res.w * 0.08, y: c.y + m * 0.08, z: -0.3 * D },
    { t: t4 + at(0.66), x: c.x - sd * res.w * 0.19, y: c.y - m * 0.02, z: 0.5 * D }, // right by us: a look, a wave
    { t: t4 + at(0.92), x: c.x - sd * res.w * 0.05, y: c.y - m * 0.05, z: -0.5 * D },
    { t: t4 + tr, x: c.x, y: c.y, z: -3 * D }, // off into the light
    { t: t5 + at(0.46), x: c.x + sd * res.w * 0.04, y: c.y + m * 0.03, z: -0.7 * D }, // out of the white hole, at us
    { t: t5 + at(0.72), x: c.x - sd * res.w * 0.15, y: c.y - m * 0.13, z: 0.55 * D }, // swooping past, huge
    { t: t5 + at(0.94), x: c.x + (homeAt.x - c.x) * 0.55, y: c.y - m * 0.08 + (homeAt.y - c.y) * 0.4, z: 0.25 * D },
    { t: tDown, x: homeAt.x, y: homeAt.y, z: 0, v: [0, 0, 0] },
  ]);
  const along = (time: number) => fl.route.at(time) as At;
  const size = { k: 1 };

  // ---- the section left behind, for the throat: its real pieces, taken now, where the film is as it sets out
  if (debris.measure(text, { light: lite, cargo: stage?.cargo?.at(filmT()) ?? [] })) debris.state.travel = 0;
  debris.palette(palette);

  // ---- each frame: the hole, his fire, him, the eye's camera
  let last = 0;
  const frame = () => {
    const now = tl.time(), dt = Math.max(0, now - last), was = last;
    last = now;
    hole.step(dt);
    // his fire goes out at the hole's horizon while it's seen from outside; once we're in the throat, it's all there is
    tf.holeR = hs.on > 0.001 && hs.inside < 0.001 ? hs.hole : 0;
    trail.step(dt);
    debris.state.inside = hs.inside;
    debris.state.glow = hs.glow;
    // the eye's camera
    eye.t += dt;
    const n = quake(eye.t), a = eye.shake + eye.rumble;
    eye.x = n.x * a;
    eye.y = n.y * a;
    eye.zoom = 1 + Math.abs(eye.roll) * 1.5 + eye.push + (a * 2.2) / m;
    if (universe) universe.style.transform = `translate(${eye.x.toFixed(2)}px, ${eye.y.toFixed(2)}px) rotate(${eye.roll.toFixed(4)}rad) scale(${eye.zoom.toFixed(4)})`;
    if (f && rig) {
      f.follow(along(now));
      // as big as he flies while he's away (grown as he sets out, back to his corner's size as he lands), gone over
      // the horizon and back out of the throat (`size`)
      const grow = smooth(tLift, tLift + at(0.6), now), back = smooth(tDown - at(0.6), tDown, now);
      f.pos.s = (homeAt.s + (flyS - homeAt.s) * grow * (1 - back)) * size.k;
      rig.flight.w = fl.w;
      f.place({ c, D, cam: eye });
      if (now > tLift && now < tDown) f.emit(along, was, now, (j, p, w, h, life) => trail.push(j, p, w, h, life, fl.ring), { life: fl.life, light: lite });
    }
  };
  const overlay: NonNullable<Sky["overlay"]> = {
    draw(r) {
      hole.draw(r);
      debris.draw(r, res, c, D);
      trail.draw(r, res, c, D);
    },
    covers: () => hole.covered,
  };
  sky.overlay = overlay;

  // ---- the timeline
  // on the frames the film is drawn on (pace.ts); `frame` reads its time from the timeline, so none is lost between
  const tl = gsap.timeline({ paused: true, onUpdate: () => { if (drawsNow()) frame(); }, onComplete: finish });
  const tUnlock = P.unlock + 0.001; // the page is given back
  run = {
    plan: P, tl, sec, kind,
    hurry: () => {
      if (tl.timeScale() === HURRY) return;
      tl.timeScale(HURRY);
      tell({ phase: "hurry", sec, kind, plan: P });
    },
    givenBack: () => tl.time() >= tUnlock,
  };
  lockInput();
  tell({ phase: "start", sec, kind, plan: P });
  const B = rig?.boost, F = rig?.fly, act = rig?.act, look = f?.look;

  // 1. the text leaves; the camera pulls back out to the whole sky
  tl.to(text, { opacity: 0, duration: at(0.45), ease: "power2.in" }, 0);
  if (P.pull) tl.to(cam, { pull: 1, duration: len(P.pull), ease: "sine.inOut" }, P.pull[0]);
  // 1. his boosters pop out of his back while he crouches, and his jets fire: a kick, a jolt of the view, and he's off
  if (B && F && act && look) {
    tl.call(() => act.ignite(), [], 0);
    tl.to(look, { k: 1, duration: at(0.5), ease: "power2.inOut" }, at(0.05));
    tl.fromTo(B, { deploy: 0 }, { deploy: 1, duration: at(0.22), ease: "back.out(2.4)", immediateRender: false }, at(0.02));
    tl.fromTo(B, { thrust: 0 }, { thrust: 0.45, duration: at(0.06), ease: "power2.out", immediateRender: false }, tLift - at(0.06));
    tl.fromTo(B, { kick: 0 }, { kick: 1.4, duration: at(0.05), ease: "power2.out", immediateRender: false }, tLift - at(0.02));
    tl.to(B, { kick: 0, duration: at(0.55), ease: "power2.inOut" }, tLift + at(0.05));
    tl.to(B, { thrust: 1, duration: at(0.3) }, tLift + at(0.05));
    tl.to(fl, { w: 1, duration: at(0.3), ease: "power2.inOut" }, tLift);
  }
  tl.fromTo(eye, { shake: 0 }, { shake: 3.5, duration: at(0.03), immediateRender: false }, tLift - at(0.02));
  tl.to(eye, { shake: 0, duration: at(0.35), ease: "power2.out" }, tLift + at(0.02));
  // his circle: the fire it leaves on the circle is the ring; it closes as he stops in front of it and turns his back
  tl.call(() => { fl.ring = true; }, [], orb.ringOn);
  tl.call(() => { fl.ring = false; act?.brake(); }, [], orb.ringOff);
  tl.call(() => Object.assign(tf, { ringAt: orb.ringAt, ringAngle: orb.angleOf, ringA1: orb.angle(orb.q(orb.ringOff)), ringDir: orb.dir, ring: { ...ringC } }), [], orb.ringOff - at(0.01));
  tl.fromTo(tf, { close: 0 }, { close: 1, duration: at(0.4), ease: "power2.inOut", immediateRender: false }, orb.ringOff);
  if (B && F) {
    tl.to(F, { yaw: Math.PI, duration: at(0.42), ease: "back.inOut(1.3)" }, orb.ringOff - at(0.02));
    tl.to(fl, { w: 0, duration: at(0.3), ease: "power2.inOut" }, orb.ringOff + at(0.02));
    tl.to(B, { thrust: 0.35, duration: at(0.3) }, orb.ringOff + at(0.05));
  }
  // 2. the explored stars flare, on the whole sky, while the ring hangs
  if (P.flare) {
    const st = lit.map((i) => sky.state[i]!);
    tl.to(st, { flare: 0.85, duration: at(0.3), ease: "power2.out", stagger: Math.min(0.08, 0.6 / st.length) }, P.flare[0])
      .to(st, { flare: 0, duration: len(P.flare) * 0.7, ease: "power2.inOut" }, P.flare[0] + len(P.flare) * 0.35);
  }
  // 3. the ring winds in on itself, faster and faster, into a spark where the hole will open, while he winds up and
  // the view starts to tremble
  const wind = len(P.wind);
  tl.call(() => { act?.windup(wind); Object.assign(tf.ring, ringC); }, [], P.wind[0]);
  tl.to(tf, { gather: 1, duration: wind, ease: "power3.in" }, P.wind[0]);
  tl.to(tf, { spin: (side > 0 ? -1 : 1) * 1.2, duration: wind, ease: "power2.in" }, P.wind[0]);
  tl.to(hs, { charge: 1, duration: wind, ease: "power3.in" }, P.wind[0]);
  if (F) tl.to(F, { rim: 0.8, duration: wind, ease: "power2.in" }, P.wind[0]);
  tl.fromTo(eye, { rumble: 0 }, { rumble: 2.2, duration: wind, ease: "power2.in", immediateRender: false }, P.wind[0]);

  // 4. the burst: the spark bursts into a black hole with a flash; its shock races out, the view shakes, and the
  // blast throws him back at us
  tl.call(() => { act?.cast(); trail.dropRing(); tell({ phase: "burst", sec, kind, plan: P }); }, [], tSnap);
  tl.set(eye, { rumble: 0 }, tSnap);
  tl.fromTo(eye, { shake: 16 }, { shake: 0, duration: at(0.75), ease: "power2.out", immediateRender: false }, tSnap);
  tl.fromTo(eye, { push: 0.04 }, { push: 0, duration: at(0.7), ease: "elastic.out(1, .45)", immediateRender: false }, tSnap);
  tl.fromTo(hs, { flash: 0.5 }, { flash: 0, duration: at(0.18), ease: "power2.out", immediateRender: false }, tSnap);
  tl.set(hs, { on: 1, shock: 0, shockA: 1.2 }, tSnap);
  tl.to(hs, { shock: diag * 0.75, duration: at(0.6), ease: "power2.out" }, tSnap);
  tl.to(hs, { shockA: 0, duration: at(0.6), ease: "power1.in" }, tSnap);
  tl.to(hs, { charge: 0, duration: at(0.08), ease: "power2.out" }, tSnap);
  tl.fromTo(hs, { hole: 0 }, { hole: R0 * 1.35, duration: at(0.1), ease: "expo.out", immediateRender: false }, tSnap);
  tl.to(hs, { hole: R0, duration: at(0.5), ease: "elastic.out(1, .45)" }, tSnap + at(0.1));
  tl.to(hs, { lens: R0 * 1.6, duration: at(0.3), ease: "power2.out" }, tSnap);
  tl.fromTo(hs, { ring: 0 }, { ring: 2.2, duration: at(0.06), ease: "power2.out", immediateRender: false }, tSnap);
  tl.to(hs, { ring: 1, duration: at(0.4), ease: "power2.out" }, tSnap + at(0.06));
  tl.to(hs, { disk: 0.8, duration: at(0.45), ease: "power2.out" }, tSnap);
  tl.fromTo(hs, { spinRate: 0 }, { spinRate: 7 * down, duration: at(0.1), ease: "power2.out", immediateRender: false }, tSnap);
  tl.to(hs, { spinRate: 2.2 * down, duration: at(0.5), ease: "power2.out" }, tSnap + at(0.1));
  if (B && F && act) {
    tl.to(F, { rim: 2.4, duration: at(0.05) }, tSnap);
    tl.to(F, { rim: 0.9, duration: at(0.4), ease: "power2.out" }, tSnap + at(0.05));
    // thrown back, he tumbles, turns round to face us, and catches himself on his jets
    tl.call(() => act.whoa(), [], tSnap + at(0.04));
    tl.to(F, { pitch: -0.7, duration: at(0.08), ease: "power2.out" }, tSnap);
    tl.to(F, { pitch: 0, duration: at(0.55), ease: "elastic.out(1, .5)" }, tSnap + at(0.08));
    tl.to(F, { yaw: TAU, duration: at(0.4), ease: "power2.inOut" }, tSnap + at(0.1));
    tl.fromTo(B, { kick: 1.3 }, { kick: 0, duration: at(0.5), ease: "power2.out", immediateRender: false }, tSnap + at(0.22));
    tl.to(B, { thrust: 1.35, duration: at(0.3), ease: "power2.out" }, tSnap + at(0.22));
    tl.call(() => act.strain(), [], tSnap + at(0.5));
  }

  // 4. the swallow: after a held beat the sky falls into the hole, nearest first, slowly and then all at once; he
  // strains against the pull on full thrust and is dragged back, his fire drawn round and into the hole; the view tilts
  const tGrow = tSnap + at(0.55);
  tl.call(() => Object.assign(tf.hole, { x: c.x, y: c.y, z: -0.3 * D }), [], t2);
  tl.to(hs, { drain: 1, duration: sw, ease: "sine.in" }, t2);
  tl.to(hs, { hole: R0 * 1.45, lens: R0 * 1.45 * 1.6, disk: 1.35, spinRate: 5 * down, duration: t2 + sw - tGrow, ease: "power2.in" }, tGrow);
  tl.to(tf, { pull: 1.4, swirl: 3.2 * down, duration: at(0.5) }, tSnap + at(0.3));
  tl.to(fl, { life: 2.4, duration: at(0.3) }, tSnap + at(0.3)); // his fire lasts long enough to curl into the hole
  tl.to(eye, { roll: 0.06 * down, duration: sw + at(0.2), ease: "sine.inOut" }, t2);

  // 4. the plunge: a glance back at the hole, a grin at us, he lets go and dives in head first on full thrust; the
  // horizon swells over the frame as the view tips and rumbles
  if (B && act) {
    tl.call(() => act.glanceBack(-side), [], t3 - at(0.2));
    tl.call(() => act.grin(), [], t3 + at(0.2));
    tl.to(B, { thrust: 0.45, duration: at(0.15) }, t3 + at(0.12));
    tl.call(() => act.dive(), [], tDive - at(0.04));
    tl.to(fl, { w: 1, duration: at(0.16), ease: "power2.in" }, tDive - at(0.06));
    tl.to(B, { thrust: 1.5, duration: at(0.1), ease: "power2.in" }, tDive);
    tl.fromTo(B, { kick: 0 }, { kick: 1, duration: at(0.06), immediateRender: false }, tDive);
    tl.to(B, { kick: 0, duration: at(0.3) }, tDive + at(0.08));
    if (F) tl.to(F, { rim: 0, duration: at(0.3) }, tDive);
  }
  tl.to(size, { k: 0, duration: at(0.28), ease: "power2.in" }, tDive + at(0.16)); // over the horizon
  tl.to(tf, { pull: 0, swirl: 0, duration: at(0.2) }, tDive);
  tl.to(fl, { life: 1, duration: at(0.2) }, tDive);
  tl.to(hs, { spinRate: 9 * down, duration: at(0.3), ease: "power2.in" }, tDive);
  tl.to(hs, { hole: big, lens: big * 1.2, duration: at(0.4), ease: "expo.in" }, tDive + at(0.1));
  tl.to(eye, { roll: 0.16 * down, duration: at(0.5), ease: "power2.in" }, tDive - at(0.1));
  tl.to(eye, { rumble: 7, duration: at(0.45), ease: "power2.in" }, tDive);

  // 5. the peak: the frame is the horizon's black; the page jumps, and the destination waits behind the white hole
  tl.call(() => {
    arrived = true;
    cam.lm = Math.log(FAR);
    jumpTo(yLand);
    fl.route.add(wayOut);
    trail.clear();
    // the throat's pieces keep off the side he comes by on, bar one that shoots past him as he rolls away
    const e = gear.throatEase(), near = wayOut.at(t4 + at(0.86));
    debris.plan({ c, D, m, dir: down, avoid: { from: e(0.4 / 1.25), to: e(0.95 / 1.25), side: -sd }, near: { x: near.x + sd * m * 0.2, y: near.y - m * 0.03, z: near.z, travel: e(0.86 / 1.25) } });
  }, [], P.jump);

  // 5. the throat opens out of the dark and we surge down it; he drops back past us for a look and a wave, then
  // rolls and boosts off into the light, his fire streaming past us
  tl.call(() => { act?.soar(); tell({ phase: "travel", sec, kind, plan: P }); }, [], t4);
  tl.to(hs, { inside: 1, duration: at(0.45), ease: "power2.out" }, t4);
  tl.call(() => Object.assign(hs, { hole: 0, lens: R0 * 0.9, ring: 0, disk: 0, drain: 0 }), [], t4 + at(0.46)); // open space, for the exit
  tl.fromTo(hs, { speed: 0 }, { speed: 3.2, duration: at(0.3), ease: "expo.out", immediateRender: false }, t4);
  tl.to(hs, { speed: 1.1, duration: at(0.5), ease: "power2.inOut" }, t4 + at(0.3));
  tl.to(hs, { speed: 2.8, duration: at(0.5), ease: "power2.in" }, t4 + at(0.75));
  tl.fromTo(hs, { glow: 0.5 }, { glow: 1.8, duration: tr, ease: "power1.in", immediateRender: false }, t4);
  tl.to(hs, { spinRate: 1.5 * down, duration: at(0.5) }, t4);
  tl.to(eye, { roll: 0, duration: at(0.7), ease: "power2.out" }, t4);
  tl.to(eye, { rumble: 2, duration: at(0.4) }, t4);
  tl.to(eye, { rumble: 4.5, duration: at(0.45), ease: "power2.in" }, t4 + at(0.75));
  tl.fromTo(size, { k: 0 }, { k: 1, duration: at(0.35), ease: "power2.out", immediateRender: false }, t4 + at(0.03));
  tl.set(tf, { drift: 2.6 * D }, t4);
  tl.fromTo(debris.state, { travel: 0 }, { travel: 1, duration: tr, ease: gear.throatEase(), immediateRender: false }, t4);
  tl.call(() => debris.clear(), [], t5 + at(0.7));
  if (B && F && act) {
    tl.to(B, { thrust: 1.1, duration: at(0.2) }, t4);
    tl.to(fl, { w: 0.2, duration: at(0.2), ease: "power2.inOut" }, t4 + at(0.5)); // turns to us as he comes by
    tl.call(() => act.wave(), [], t4 + at(0.52));
    tl.to(fl, { w: 1, duration: at(0.2), ease: "power2.inOut" }, t4 + at(0.78));
    tl.call(() => act.soar(), [], t4 + at(0.8));
    tl.to(F, { yaw: TAU * 2, duration: at(0.42), ease: "power2.inOut" }, t4 + at(0.8)); // a barrel roll as he boosts off
    tl.fromTo(B, { kick: 0 }, { kick: 1.1, duration: at(0.08), immediateRender: false }, t4 + at(0.82));
    tl.to(B, { kick: 0, duration: at(0.4) }, t4 + at(0.92));
  }

  // 6. the exit: the portal snaps open onto the destination's point of light and its white hole; he shoots through
  // first and we follow, out into its light, as the camera comes in to the hold and the words write in
  tl.call(() => { Object.assign(hs, { diskR: R0 * 0.5 }); tell({ phase: "arrive", sec, kind, plan: P }); }, [], t5);
  tl.fromTo(hs, { exit: 0 }, { exit: m * 0.22, duration: at(0.14), ease: "expo.out", immediateRender: false }, t5);
  tl.to(hs, { exit: diag * 0.62, duration: at(0.45), ease: "power2.in" }, t5 + at(0.2));
  tl.call(() => Object.assign(hs, { inside: 0, exit: 0 }), [], t5 + at(0.66));
  tl.fromTo(hs, { white: 0 }, { white: 1.8, duration: at(0.12), ease: "power2.out", immediateRender: false }, t5);
  tl.to(hs, { disk: 0.7, spinRate: -4 * down, duration: at(0.3) }, t5);
  tl.to(hs, { cool: 1, duration: len(P.arrive), ease: "power1.inOut" }, t5);
  tl.fromTo(hs, { flash: 0.25 }, { flash: 0, duration: at(0.2), immediateRender: false }, t5);
  tl.fromTo(hs, { flash: 0.5 }, { flash: 0, duration: at(0.35), ease: "power2.out", immediateRender: false }, t5 + at(0.62));
  tl.to(eye, { rumble: 0, duration: at(0.3) }, t5 + at(0.5));
  tl.fromTo(eye, { shake: 11 }, { shake: 0, duration: at(0.6), ease: "power2.out", immediateRender: false }, t5 + at(0.62));
  tl.to(tf, { drift: 0, duration: at(0.4) }, t5 + at(0.5));
  tl.to(cam, { lm: 0, duration: len(P.arrive), ease: "power3.out" }, t5);
  tl.to(window, { scrollTo: { y: ySpot, autoKill: false }, duration: len(P.arrive), ease: "power2.out" }, t5);
  tl.to(text, { opacity: 1, duration: len(P.arrive) * 0.6, ease: "power1.out" }, t5 + len(P.arrive) * 0.4);
  tl.to(hs, { white: 0, disk: 0, duration: at(0.4), ease: "power2.inOut" }, t5 + at(0.58));
  tl.to(hs, { on: 0, duration: at(0.45), ease: "power1.inOut" }, t5 + at(0.85));
  if (B && F && act && look) {
    tl.call(() => act.burst(), [], t5 + at(0.3));
    tl.fromTo(B, { kick: 0 }, { kick: 1.2, duration: at(0.06), immediateRender: false }, t5 + at(0.3));
    tl.to(B, { kick: 0, duration: at(0.4) }, t5 + at(0.4));
    tl.to(F, { rim: 1.4, duration: at(0.1) }, t5 + at(0.3));
    tl.to(F, { rim: 0, duration: at(0.6) }, t5 + at(0.55));
    // braking: he turns to face us, leans back on his jets and lands on his spot; the boosters fold away
    tl.call(() => act.brake(), [], tDown - at(0.3));
    tl.to(fl, { w: 0, duration: at(0.35), ease: "power2.inOut" }, tDown - at(0.38));
    tl.to(look, { k: 0, duration: at(0.4), ease: "power2.inOut" }, tDown - at(0.4));
    tl.to(F, { yaw: TAU * 2, pitch: 0, roll: 0, duration: at(0.3) }, tDown - at(0.35));
    tl.to(B, { thrust: 0.9, duration: at(0.2) }, tDown - at(0.35));
    tl.call(() => act.land(), [], tDown);
    tl.to(B, { thrust: 0, duration: at(0.25), ease: "power2.in" }, tDown);
    tl.fromTo(B, { kick: 0 }, { kick: 0.7, duration: at(0.05), immediateRender: false }, tDown);
    tl.to(B, { kick: 0, duration: at(0.2) }, tDown + at(0.05));
    tl.to(B, { deploy: 0, duration: at(0.3), ease: "back.in(2)" }, tDown + at(0.18));
  }
  tl.fromTo(eye, { shake: 0 }, { shake: 2.5, duration: at(0.02), immediateRender: false }, tDown);
  tl.to(eye, { shake: 0, duration: at(0.25) }, tDown + at(0.02));
  tl.call(() => {
    giveBackCamera();
    input?.unlock();
    if (kind === "link") focusSection(sec, t);
    else announce(`Tycho took you to ${nameOf(sec)}.`);
    tell({ phase: "land", sec, kind, plan: P });
  }, [], tUnlock);
  tl.set({}, {}, P.total);

  function finish() {
    giveBackCamera();
    if (sky.overlay === overlay) sky.overlay = null;
    if (universe) universe.style.removeProperty("transform");
    f?.end();
    trail.clear();
    debris.clear();
    gsap.set(text, { clearProps: "opacity" });
    input?.unlock();
    run = null;
    tell({ phase: "end", sec, kind, plan: P });
  }
  frame();
  tl.play(0);
}
