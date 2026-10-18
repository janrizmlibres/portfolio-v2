/**
 * The voyage's stage inside the real sky: the picture the film engine plays. It is the film as storyboarded (one
 * take). Every scene's bodies are their own modules (home, the relay and Work's traffic, Athena, the crawler, its
 * pipeline, the ribbon), each in the form its finalization settled; this lays them out on one film:
 * - keys: the camera path, posed shot by shot (lib/film/path.ts);
 * - tl: a paused GSAP timeline of discrete states (a world appears, the route draws out, stars light), scrubbed by
 *   the film's time;
 * - drivers: continuous states set from the time every frame (spins, orbits, the relays' charge).
 * It loads after first paint, with three.js, and draws through the sky, so stars and bodies share one camera. Every
 * scene is built under the wake-up's loader (ADR 0018).
 */
import gsap from "gsap";
import {
  BufferGeometry, Color, Frustum, Matrix4, Object3D, Sphere, Vector3,
  type DirectionalLight, type Material,
} from "three";
import type { Anchor } from "@/lib/film/block";
import type { Fling } from "@/lib/film/fling";
import { bridge, buildPath, keyFrom, look, travel, type CameraKey, type CameraPath, type Vec3 } from "@/lib/film/path";
import { clampPitch, orbitTurn } from "@/lib/film/turn";
import { within } from "@/lib/film/hand";
import { stillsStale, type Cargo, type Stage, type StageView } from "@/lib/film/stage";
import { sectionHere } from "@/lib/film/here";
import { isShort } from "@/lib/film/tier";
import { monotoneCubic } from "@/lib/film/track";
import { rowTimes } from "@/lib/film/windows";
import { readingSpot } from "@/lib/film/spots";
import { ABOUT_1, ABOUT_2, HIS_STAR, PIPELINE, type TopicLine } from "@/lib/content/voyage";
import { oklabToSrgb, type Region } from "@/lib/universe/light";
import type { Sky } from "@/lib/universe/sky";
import { onQuality, quality, shadowSize, type Quality } from "@/lib/universe/tier";
import { createHome } from "./home";
import { aboutHold, RING_TURN, ringSpin, spreadView } from "./about";
import { RIM } from "./ships";
import { nightFill } from "./lit";
import { HERO_AZ, HERO_EL } from "./route";
import { voyageScript } from "./script";
import { createRelays } from "./relays";
import { spaceEnv } from "./space-env";
import { createJump } from "./jump";
import { builtAt, spinAt } from "./work";
import { buildKeys, buildSide, departKeys, streaksAt, turnOf } from "./work-camera";
import { createTraffic } from "./traffic";
import { createAthena } from "./athena";
import { createCrawler } from "./crawler";
import { createPipeline } from "./pipeline";
import { createRibbon, RIBBON_LIFT } from "./ribbon";
import { keyTimes, spiralTurn } from "./ribbon-turn";
import { createLightRig, resizeShadow } from "./rig";
import { warmInTurn } from "./loading";
import { markBuilt } from "@/lib/wake/built";
import type { Milestone } from "@/lib/wake/count";
import { createBodyFootprints } from "./bodies";
import { layWorld, UP } from "./world";

const FOV = 32;
/**
 * The topics whose stars Around home's frame is fitted to: those About's lines lit when Janriz set the frame
 * (2026-10-11: "move the constellation further to the left", "zoom out a bit"). A line reworded since may light other
 * stars among them (the end-to-end and stack lines light two of the early career's); the frame, and the camera's way
 * into it, hold.
 */
const AROUND_FRAME = ["t14", "t28", "t05", "t19", "t30", "t44", "t18", "t10", "t33", "t35"];
const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
const tup = (v: Vector3): Vec3 => [v.x, v.y, v.z];
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };


export function createVoyageStage({ sky }: { sky: Sky }): Stage {
  const script = voyageScript();
  const T = script.times;
  const starAt = (id: string): Vec3 => sky.pos(sky.index.get(id)!) as Vec3;
  const W = layWorld(script, starAt);
  // the region's light, as it fills home's night side (linear)
  const homeFill = new Color();
  const owned: Array<BufferGeometry | Material | { dispose(): void }> = [];
  const root = new Object3D();
  sky.scene.add(root);
  // the opening: home (the ship), the sun and the orbit
  const opening = createHome({ W, fill: homeFill, owned, renderer: sky.renderer, scene: sky.scene });
  root.add(opening.root);
  // Work: its relay by home (relays.ts) and the light of its throw (jump.ts); then the traffic round home as the
  // companies build it (traffic.ts), the ring turned to the side the camera holds (`workSide`, set as the film's laid out)
  const relaySet = createRelays({ W, owned, renderer: sky.renderer });
  root.add(relaySet.root);
  const jump = createJump(owned);
  root.add(jump.root);
  let workSide = 0;
  const traffic = createTraffic({
    owned, renderer: sky.renderer, plan: script.plan,
    turnAt: (t) => turnOf(workSide, spinAt(script.plan, t)),
    stationAt: (a, out) => opening.stationAt(a, out),
    station: () => opening.station(),
  });
  root.add(traffic.root);
  /** the space the hardware's metal reflects */
  const env = spaceEnv(sky.renderer, W.SUN.clone().sub(W.relay.P).normalize(), owned);
  // Athena, her moons and the stream of records into her (athena.ts)
  const athSet = createAthena({ W, owned, renderer: sky.renderer, scene: sky.scene, env });
  root.add(athSet.root);
  // the AI Web Crawler (the refinery), its companions and its pipeline (crawler.ts)
  // its pipeline: the shaft, the swarm, the report and the climax (pipeline.ts), held folded by the crawler
  const pipeSet = createPipeline({ W, owned, env, px: sky.px });
  root.add(pipeSet.root);
  const crwSet = createCrawler({ W, owned, renderer: sky.renderer, scene: sky.scene, env, pipe: pipeSet });
  root.add(crwSet.root);
  // scene 13: the ribbon, the personal work's frames, out of the shaft's foot (ribbon.ts)
  const ribSet = createRibbon({ W, owned, env, fill: homeFill, renderer: sky.renderer });
  root.add(ribSet.root);
  // the bodies' key lights stay in the scene when their bodies are hidden, dark, so the number of lights never
  // changes and nothing recompiles mid-film (rig.ts)
  const rig = createLightRig(root, [athSet.root, crwSet.root, ribSet.root, pipeSet.root, relaySet.root]);
  // every body's shadow map: its full size at high quality, smaller a level down (tier.ts)
  const shadowed: Array<{ light: DirectionalLight; full: number }> = [];
  root.traverse((o) => {
    const l = o as DirectionalLight;
    if (l.isDirectionalLight && l.castShadow) shadowed.push({ light: l, full: l.shadow.mapSize.x });
  });
  const fitShadows = (q: Quality) => { for (const { light, full } of shadowed) resizeShadow(light, shadowSize(full, q)); };
  fitShadows(quality());
  const offQuality = onQuality(fitShadows);
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __rig: rig });
  // round home the camera draws back into the bright cloud of the stars his About lit, whose light fills home's night side
  let fillGain = 1;

  // the relay
  const relays = relaySet.bodies;
  let tNow = 0;
  // whether the relay's in play, and how fast the camera is going (for the streaks), set by the film each frame
  let playNow = -1;
  const velNow = new Vector3();
  let flashNow = 0, streakNow = 0;

  // the stream of records from the crawler into Athena (athena.ts draws them): how much of it is shown. The records are
  // the data it carries; no line is drawn along it, which would only repeat them
  const stream = { vis: 0 };

  // LogoLife's worlds and their moons
  const athena = athSet.athena;
  const crawler = crwSet.crawler;
  // each world's moons are its own (athena.ts, crawler.ts)
  const moons = [...athSet.moons, ...crwSet.moons];
  const wedgeAt = athSet.wedgeAt;
  // how much of each body the film fades in is shown, for the tests (development only)
  if (process.env.NODE_ENV !== "production") {
    const shown = () => ({ relays: relays.map((r) => r.vis), athena: athena.vis, crawler: crawler.vis, moons: moons.map((m) => m.vis) });
    Object.assign(window, { __shown: shown });
  }

  // the crawler's pipeline: its rings are the crawler's own (crawler.ts); `pipe` is how far the fall has come
  const pipe = pipeSet.pipe;

  // the ribbon: what the film sets on it (ribbon.ts)
  const gal = ribSet.gal;

  // ---------------------------------------------------------------- the film: keys, the timeline, the drivers
  type Film = { path: CameraPath; tl: gsap.core.Timeline; drivers: Array<(t: number) => void>; spinW: (t: number) => number; spinsLive: (t: number) => boolean };
  let film: Film | null = null;
  const AZ0 = HERO_AZ, EL0 = HERO_EL;

  // every body the film fades in starts hidden: those tweens only set their start once the film reaches them, so a
  // film laid out again (a resize) far along would otherwise show them from the start
  function reset() {
    for (const x of [opening.home, opening.sun, athena, crawler, ...moons, ...relays]) x.vis = 0;
    for (const r of relays) Object.assign(r, { charge: 0, coilsLit: 0 });
    fillGain = 1;
    stream.vis = 0;
    Object.assign(athena, { open: 0 }); Object.assign(crawler, { open: 0, deploy: 0 });
    Object.assign(pipe, { vis: 0, fill: 0, bars: 0, cut: 0, glow: 0, lead: 1 }); Object.assign(gal, { vis: 1, exit: 0 });
    for (const s of sky.state) Object.assign(s, { lit: 0, heat: 0 });
    sky.U.recede.value = 0;
  }

  function buildFilm(w: number, h: number): Film {
    const aspect = w / h, port = aspect < 0.8;
    const tanH = Math.tan((FOV / 2) * (Math.PI / 180));
    const P = <X>(land: X, portrait: X) => (port ? portrait : land);
    const keys: CameraKey[] = [], drivers: Film["drivers"] = [];
    const tl = gsap.timeline({ paused: true });
    const frameDist = (r: number, size: number) => r / Math.sin(Math.atan(tanH * (port ? size * aspect : size)));
    const litDir = (Pt: Vector3, L: Vector3, turn: number, lift = 0.15) => L.clone().sub(Pt).normalize().applyAxisAngle(UP, turn).addScaledVector(UP, lift).normalize();
    const turnD = (D: Vector3, ang: number, lift = 0) => D.clone().applyAxisAngle(UP, ang).addScaledVector(UP, lift).normalize();
    const kAt = (t: number, pos: Vector3, target: Vector3, o: Partial<CameraKey> & { region?: Region } = {}) => keyFrom(t, tup(pos), tup(target), o);
    const lAt = (t: number, target: Vector3, dir: Vector3, dist: number, o: Partial<CameraKey> = {}) => look(t, tup(target), tup(dir), dist, o);
    const O = T.O;
    const idx = (id: string) => sky.index.get(id)!;
    const starsOf = (topics: string[]) => sky.ids.flatMap((_, i) => (topics.includes(sky.topicOf[i]!) ? [i] : []));
    // the stars a line is written from: its topics', or just the ones it names
    const writtenFrom = (l: TopicLine) => (l.stars ? l.stars.map(idx) : starsOf(l.topics));
    const posOf = (i: number) => V(...(sky.pos(i) as Vec3));
    // a line flares the stars it's written from; his own star is home's sun, lit by the dive already
    const lightStars = (l: TopicLine, at: number) => {
      for (const i of writtenFrom(l)) {
        if (i === idx(HIS_STAR)) continue;
        const s = sky.state[i]!;
        tl.to(s, { lit: 0.9, duration: 0.25, ease: "power2.out" }, at);
        tl.fromTo(s, { heat: 0 }, { keyframes: [{ heat: 0.55, duration: 0.06, ease: "power2.out" }, { heat: 0, duration: 0.45, ease: "power2.inOut" }], immediateRender: false }, at);
      }
    };
    const blockOf = (id: string) => script.blocks.find((b) => b.id === id)!;
    const rowsIn = (id: string) => { const b = blockOf(id); return rowTimes((b.title ? 1 : 0) + b.lines.length, b.tIn, b.tOut); };
    const H = W.HOME, SUN = W.SUN;

    // ---------------------------------------------------------------- 1 · the hero, and the dive into his star
    // the sky right of centre with the name on the left; on a phone the sky fills the top and the name sits under it
    const heroSpot = P([0.63, 0.5], [0.5, 0.36]);
    const orbitKey = (t: number, spot: number[], size: number, region: Region) => {
      const fit = Math.min(1, aspect), dist = 0.9 / (size * tanH * fit);
      const Pp = V(Math.sin(AZ0) * Math.cos(EL0) * dist, Math.sin(EL0) * dist, Math.cos(AZ0) * Math.cos(EL0) * dist);
      return kAt(t, Pp, V(0, 0, 0), { cx: spot[0]!, cy: spot[1]!, near: dist, dust: 0.085, spread: 0.95 * size * fit + 0.35, region });
    };
    const hero = orbitKey(0, heroSpot, P(1, 0.96), "hero");
    const heroP = V(...hero.target).addScaledVector(V(...hero.dir), hero.dist);
    const aboutSpot = P([0.64, 0.5], [0.5, 0.34]);
    const a1dir = litDir(H.P, SUN, 1.25, 0.28);
    opening.face(a1dir, UP);
    const sunD = heroP.clone().sub(SUN).normalize();
    const passSun = SUN.clone().addScaledVector(SUN.clone().sub(H.P).normalize(), 0.022).addScaledVector(a1dir, 0.022).addScaledVector(UP, 0.006);
    const passLook = SUN.clone().lerp(H.P, 0.55);
    keys.push(
      hero,
      lAt(0.55, SUN, sunD, heroP.distanceTo(SUN) * 0.42, { cx: 0.5, cy: 0.5, near: 1.5, dust: 0.06, spread: 1.7, region: "hero" }),
      lAt(1.2, SUN, sunD, 0.11, { cx: 0.5, cy: 0.5, near: 0.48, dust: 0.03, spread: 2.5, region: "about" }),
      kAt(1.65, passSun, passLook, { cx: aboutSpot[0]!, cy: aboutSpot[1]!, near: 0.4, region: "about" }),
    );
    // his star brightens from the first pixel of scroll, so you know which one you're diving at, warms as you near
    // it, and becomes a sun; home comes up in its light as you pass it, so the dive reads as a dive at the star
    const sunState = sky.state[idx(HIS_STAR)]!;
    tl.to(sunState, { lit: 1, duration: 0.7, ease: "power2.out" }, 0.02);
    tl.fromTo(sunState, { heat: 0 }, { keyframes: [{ heat: 0.4, duration: 0.95, ease: "power1.in" }, { heat: 0.08, duration: 0.7, ease: "power2.out" }], immediateRender: false }, 0.3);
    tl.fromTo(opening.sun, { vis: 0 }, { vis: 1, duration: 0.3, immediateRender: false }, 0.6);
    tl.fromTo(opening.home, { vis: 0 }, { vis: 1, duration: 0.25, ease: "power1.in", immediateRender: false }, 1.35);
    // (the orbit round home is no longer drawn: it was there to peel off into the route, and the film now goes
    // straight from Around home to Work)

    // ---------------------------------------------------------------- 2–3 · About: home, then the stars round it
    // the ship turns with the scroll only on the way in, then on its own clock once About is settled (its words written
    // in), so scrolling there just moves on
    const settled = blockOf("about-1").tIn[1];
    drivers.push((t) => { opening.home.spin = ringSpin(t, performance.now() / 1000, { settle: settled, ...RING_TURN }); });
    drivers.push((t) => { fillGain = 1 + 4 * smooth(O(3.85), O(4.7), t) * (1 - smooth(O(6.1), O(6.7), t)); });
    // each line lights the stars of what it's about as it writes in
    const rt1 = rowsIn("about-1");
    ABOUT_1.forEach((l, j) => lightStars(l, rt1[j + 1]!.in + rt1[j + 1]!.inSpan * 0.18));
    const aboutStars = [...new Set([...ABOUT_1, ...ABOUT_2].flatMap(writtenFrom))];
    // Around home is framed on the stars About lit when the frame was set (AROUND_FRAME), so rewording a line never
    // moves the camera: each line's own stars lie inside it
    const framed = starsOf(AROUND_FRAME);
    const aboutC = framed.reduce((c, i) => c.add(posOf(i)), V(0, 0, 0)).multiplyScalar(1 / framed.length);
    const a2dir = H.P.clone().sub(aboutC).normalize().applyAxisAngle(UP, 0.25).addScaledVector(UP, 0.18).normalize();
    // Around home: the stars his About lit, seen across their widest and spread over the right of the frame (on a
    // phone its top), the ship among them
    const around = spreadView(framed.map(posOf), H.P, {
      // seen across their widest they'd sit small in the middle; framed into a box larger than the right of the frame,
      // they spread wide, the ship among them; the box sits left of the frame's right edge, a little smaller, so the
      // whole cloud stays in the frame, on wider screens too
      prefer: a2dir, aspect, tanH, box: P<[number, number, number, number]>([0.16, -0.1, 0.89, 1.1], [-0.6, -0.4, 1.6, 0.6]),
    });
    // (its stars drawn at the size they had when it was framed from about 0.54 out, so the spread doesn't dim them)
    const aroundAt = (t: number, turn: number, far: number, o: Partial<CameraKey> = {}) =>
      lAt(t, around.target, turnD(around.dir, turn, turn * 0.15), around.dist * far, { cx: around.cx, cy: around.cy, near: 0.55 * (around.dist / 0.54), region: "about", ...o });
    {
      // from past his star, panned down onto its modules and hub, held dead still while About is read and leaves, and
      // out to Around home's frame; its visitor docks while About is read
      const quiet: [number, number] = [blockOf("about-1").tOut[1], blockOf("about-2").tIn[0]];
      const a1 = blockOf("about-1"), to = aroundAt(O(5.55), 0, 1);
      // (the dive's last key: where it passes his star, and what it looks at there)
      const from = { t: 1.65, dir: passSun.clone().sub(H.P).normalize(), dist: passSun.distanceTo(H.P), cx: aboutSpot[0]!, cy: aboutSpot[1]!, target: passLook };
      const toEnd = { t: to.t, dir: V(...to.dir), dist: to.dist, cx: to.cx, cy: to.cy, target: around.target };
      const rimR = opening.shipR * RIM;
      keys.push(...aboutHold({ H, axis: opening.shipAxis(), ref: a1dir, rimR, port, aspect, tanH, from, hold: [a1.tIn[1], quiet[0]], to: toEnd }));
      drivers.push((t) => opening.approach(smooth(2.0, quiet[0] - 0.1, t)));
    }
    // (held drifting until its words start to leave; the swing to Work eases in from there)
    const aroundEnd = aroundAt(O(5.85), 0.025, 1.015);
    keys.push(aroundAt(O(5.55), 0, 1), aroundEnd);
    // the ship is gone by Around home: it fades as the camera pulls away from it, and the film never comes back to it
    tl.to(opening.home, { vis: 0, duration: 0.5, ease: "power1.inOut" }, O(5.55) - 0.6);
    tl.to(sky.U.recede, { value: 0.8, duration: 0.7, ease: "power1.inOut" }, O(4.0));
    const rt2 = rowsIn("about-2");
    ABOUT_2.forEach((l, j) => lightStars(l, rt2[j + 1]!.in + rt2[j + 1]!.inSpan * 0.18));

    // ---------------------------------------------------------------- 4–9 · Work: home, built job by job
    // the camera turns from Around home to the relay by home while Work's intro writes in, and it throws you back to
    // August 2023, its flash a cut; there home is only its core, and the companies build it, a quarter of its ring
    // each, while the camera holds the side his star lights from the side and the ring turns under it (work-camera.ts)
    // (Around home and the relay's hold look from nearly opposite sides: bridged, the view swings round them evenly as it
    // closes in, rather than whipping round between them)
    const plan = script.plan, D = plan.depart.at;
    const depart = departKeys({ W, plan, port });
    workSide = buildSide(opening.shipPose(), SUN.clone().sub(H.P).normalize());
    const build = buildKeys({ home: H.P, r: opening.shipR, frame: opening.shipPose(), side: workSide, plan, port, aspect, tanH });
    keys.push(...bridge(aroundEnd, depart[0]!), ...depart, ...build);
    tl.to(sky.U.recede, { value: 0, duration: 0.45 }, O(6.25));
    aboutStars.filter((i) => i !== idx(HIS_STAR)).forEach((i) => tl.to(sky.state[i]!, { lit: 0, duration: 0.45 }, O(6.25)));
    tl.to(sunState, { lit: 0.35, duration: 0.45 }, O(6.25));
    // the relay stands from Work's start until it throws
    const relay = relays[0]!;
    tl.fromTo(relay, { vis: 0 }, { vis: 1, duration: 0.3, immediateRender: false }, D.come[0]);
    tl.to(relay, { vis: 0, duration: 0.05 }, D.throw[1]);
    // its charge, its coils lighting from the core out, and its gimbal's turn: an idle turn, spun up by the charge,
    // integrated so scrubbing is exact
    const chargeAt = (t: number) => smooth(D.charge[0], D.charge[1], t) * (1 - smooth(D.throw[1], D.throw[1] + 0.3, t));
    const gimbal = (() => {
      const N = 1200, t0 = O(6.0), t1 = D.throw[1] + 0.3, tab = new Float64Array(N + 1);
      for (let i = 1; i <= N; i++) tab[i] = tab[i - 1]! + (1 + 8 * chargeAt(t0 + ((i - 0.5) / N) * (t1 - t0)) ** 2) * ((t1 - t0) / N);
      return (t: number) => { const x = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) * N, i = Math.min(N - 1, Math.floor(x)); return tab[i]! + (tab[i + 1]! - tab[i]!) * (x - i); };
    })();
    drivers.push((t) => {
      relay.spin = gimbal(t);
      relay.charge = chargeAt(t);
      relay.coilsLit = smooth(D.charge[0] + 0.35 * (D.charge[1] - D.charge[0]), D.throw[0] + 0.15, t) * (1 - smooth(D.throw[1], D.throw[1] + 0.3, t));
    });
    drivers.push((t) => { playNow = t >= D.come[0] && t < D.throw[1] ? 0 : -1; });
    // the flash at the throw's height: the cut back to August 2023
    drivers.push((t) => { flashNow = smooth(plan.flash - 0.1, plan.flash - 0.004, t) * (1 - smooth(plan.flash + 0.01, plan.flash + 0.22, t)); });
    // and the streaks, the throw's alone
    const streaks = streaksAt(plan);
    drivers.push((t) => { streakNow = streaks(t); });
    // home again, as it was: out of the flash its core alone, then built a quarter a company, the ring turning a quarter
    // between them, closed and turning on through Projects; About's crew capsule isn't there yet
    tl.to(opening.home, { vis: 1, duration: 0.02 }, plan.flash);
    drivers.push((t) => {
      const work = t >= plan.flash;
      opening.home.built = work ? builtAt(plan, t) / 4 : 1;
      opening.home.visitor = !work;
      if (work) opening.home.spin = turnOf(workSide, spinAt(plan, t));
    });

    // ---------------------------------------------------------------- 10 · on to Athena
    // straight from the ship to Athena, but not a bare cut across: a farewell orbit round the finished ring by its
    // sunlit side while Projects' intro is read, to beyond it from her and below it, where she comes out from behind
    // its rim, the ring standing big in the foreground; then on to her shot. From where Work leaves the camera she's
    // behind it (152° round), so the orbit is what turns the view to her.
    const { ATH, CRW } = W;
    const athDir = litDir(ATH.P, ATH.lightP, 0.95, 0.35);
    const athSpot = P([0.6, 0.5], [0.5, 0.38]), athDist = frameDist(ATH.r * 2.2, P(0.46, 0.66));
    // her shots while she's read, turning slowly round her and drawing in
    const athAt = (k: number) => lAt(T.A0 + 0.9 * k, ATH.P, turnD(athDir, k * 0.36, k * 0.04), athDist * (1 - k * 0.05), { cx: athSpot[0]!, cy: athSpot[1]!, near: 0.3, region: "projects" });
    const camOf = (k: CameraKey) => V(...k.target).addScaledVector(V(...k.dir), k.dist);
    const T0 = T.RIDE_END, tOrbit = T0 + 1.5, tRim = T0 + 1.68, end = build.at(-1)!;
    const away = H.P.clone().sub(ATH.P).normalize(), across = new Vector3().crossVectors(away, UP).normalize();
    const rimPos = H.P.clone().addScaledVector(away, 0.04).addScaledVector(across, 0.012);
    const u0 = camOf(end).sub(H.P), dEnd = u0.length(), u1 = rimPos.clone().sub(H.P), dRim = u1.length();
    u0.normalize(); u1.normalize();
    // round by the side his star lights, so the ring's lit all the way round (the way from Work's side to beyond it from
    // her is nearly a half turn, so the side it goes by is chosen, not left to the shorter way)
    const lit = across.dot(SUN.clone().sub(H.P)) > 0 ? across : across.clone().negate();
    const ctrl = lit.clone().multiplyScalar(2).sub(u0.clone().add(u1).multiplyScalar(0.5));
    const bend = (s: number) => u0.clone().multiplyScalar((1 - s) ** 2).addScaledVector(ctrl, 2 * s * (1 - s)).addScaledVector(u1, s * s).normalize();
    // (travelled at an even turn: the curve's own parameter swells and sags)
    const turned = [0];
    for (let i = 1; i <= 200; i++) turned.push(turned[i - 1]! + bend(i / 200).angleTo(bend((i - 1) / 200)));
    const orbitDir = (p: number) => { const a = p * turned[200]!, i = Math.min(199, turned.findIndex((x) => x >= a) - 1); const j = Math.max(0, i); return bend((j + (a - turned[j]!) / Math.max(1e-9, turned[j + 1]! - turned[j]!)) / 200); };
    const rimSpot = P([0.6, 0.4], [0.5, 0.3]);
    for (let t = T0 + 0.04; t < tRim - 1e-6; t += 0.04) {
      const s = smooth(T0, tOrbit, t), pos = H.P.clone().addScaledVector(orbitDir(s), dEnd * (dRim / dEnd) ** s);
      // its eye on the ring, then, as the orbit settles, on her, out from behind its rim (from beyond the ring she's close
      // by it): the two turns one after the other, not added together
      const e = smooth(tOrbit - 0.22, tRim, t), eye = H.P.clone().lerp(ATH.P, e);
      keys.push(kAt(t, pos, eye, { cx: end.cx + (rimSpot[0]! - end.cx) * e, cy: end.cy + (rimSpot[1]! - end.cy) * e, near: 0.3, region: "work", blend: { region: "projects", k: s } }));
    }
    const rimKey = kAt(tRim, rimPos, ATH.P, { cx: rimSpot[0]!, cy: rimSpot[1]!, near: 0.3, region: "projects" });
    const arrive = camOf(athAt(1)).sub(camOf(athAt(0))).divideScalar(0.9);
    keys.push(rimKey, ...travel(rimKey, athAt(0), { leave: [0, 0, 0], arrive: tup(arrive), look: [0, 0.8] }), athAt(0));
    // she's in before she comes into frame, at its top, as the camera draws back
    tl.fromTo([athena, ...athSet.moons], { vis: 0 }, { vis: 1, duration: 0.5, immediateRender: false }, T.RIDE_END + 0.3);
    // the crawler and its companions come in with the stream out of it, as her lines go and the camera turns upstream to
    // them: while she's read they'd stand at the frame's edge with no part in her
    tl.fromTo([crawler, ...crwSet.moons], { vis: 0 }, { vis: 1, duration: 0.5, immediateRender: false }, T.A0 + 2.6);

    // ---------------------------------------------------------------- 11 · Athena and her moons
    drivers.push((t) => {
      athena.spin = t * 0.55;
      for (const m of moons) m.ang = m.m.phase + t * m.m.speed;
    });
    keys.push(athAt(1), athAt(2), athAt(3));
    athSet.times(T.A0 + 0.15, T.A0 + 0.75);
    athSet.pose(port);
    tl.to(athena, { open: 1, duration: 0.6, ease: "power2.inOut" }, T.A0 + 0.75);
    tl.to(athena, { open: 0, duration: 0.5, ease: "power2.inOut" }, T.A0 + 2.3);
    tl.to(stream, { vis: 1, duration: 0.5 }, T.A0 + 2.6);

    // ---------------------------------------------------------------- 12 · upstream to the crawler
    // (lit from 54° round from its star on the side Athena's on, so the way to it from her turns only ~60°: from the far
    // side, as it was, the view swung round 164°)
    const crwDir = litDir(CRW.P, CRW.lightP, 0.95, 0.3), crwSpot = P([0.6, 0.48], [0.5, 0.38]), crwDist = frameDist(CRW.r * 1.4, P(0.42, 0.62));
    // one smooth curve from her last shot to the crawler's, its eye going from her to it, the turn spread over the whole
    // way (a cut turned the camera over to the other side)
    const crwKey = lAt(T.C0, CRW.P, crwDir, crwDist, { cx: crwSpot[0]!, cy: crwSpot[1]!, near: 0.3, region: "crawler" });
    const athLast = athAt(3), vAth = camOf(athAt(3)).sub(camOf(athAt(2))).divideScalar(0.9);
    // (the eye goes from her to the crawler early, while the camera is still out by her shot and they're 63° apart, so the
    // crawler comes into frame as she leaves it, the stream running between them)
    const upstream = (t: number) => ATH.P.clone().lerp(CRW.P, smooth(athLast.t, athLast.t + 0.9, t));
    keys.push(...travel(athLast, crwKey, { leave: tup(vAth), arrive: [0, 0, 0], look: [0, 1] }).map((k) => keyFrom(k.t, tup(camOf(k)), tup(upstream(k.t)), k)), crwKey);
    // on a portrait screen its lines run across the bottom half, so the camera stays back while it opens, its rings
    // held in the top half until its lines have gone
    if (port) keys.push(lAt(T.C0 + 0.6, CRW.P.clone().addScaledVector(UP, -CRW.r * 0.5), crwDir, crwDist * 0.9, { cx: 0.5, cy: 0.3, near: 0.3, region: "crawler" }));

    // ---------------------------------------------------------------- 12 · inside the crawler: the fall down its pipeline
    const SHF = W.shaft, depth = W.depth, tau = T.tau, STEP = T.STEP, SK = (0.33 * STEP) / 0.95;
    const sK: Array<[number, number]> = [[T.C0 + 0.85, -0.009]];
    for (const s of PIPELINE) { if (s.id === "report") continue; const dk = depth(s.id); sK.push([tau[s.id]! - SK, dk - 0.0017], [tau[s.id]! + SK, dk + 0.0017]); }
    sK.push([tau.report! + 1.0, depth("save") + 0.0045]);
    const sTrack = monotoneCubic(sK.map((x) => x[0]), sK.map((x) => x[1]));
    const CL = T.CL;
    const az0 = Math.atan2(crwDir.z, crwDir.x);
    const pipeD = (t: number) => { const a = az0 + 0.42 * (t - (T.C0 + 1.0)); return V(Math.cos(a), 0.42, Math.sin(a)).normalize(); };
    const pipeDist = (t: number) => (0.026 + 0.03 * smooth(tau.save! + 0.2, tau.report! + 0.6, t)) * P(1, 1.55);
    const fallKey = (t: number) => {
      const dT = sTrack(t) + 0.0012 - 0.004 * smooth(tau.save! + 0.2, tau.report! + 0.6, t);
      return lAt(t, SHF.at(dT), pipeD(t), pipeDist(t), { cx: P(0.6, 0.5), cy: P(0.5, 0.4), near: 0.3, dust: 0.02, region: "crawler" });
    };
    // (the fall, down to the report's deck)
    const R0 = tau.report! + 0.25;
    for (let t = T.C0 + 1.0; t < R0 - 1e-6; t += 0.08) keys.push(fallKey(t));
    // ---------------------------------------------------------------- 12 · the climax, a showcase of the whole pipeline:
    // the camera rises up the outside of the shaft past every ring to its top, and
    // as the front of light launches it chases it down, round the shaft as it goes; past the foot it swings under the
    // report's deck and looks up the whole lit shaft, the bars standing over it, while "Paid for once" is read. Seen whole
    // from outside, the shaft was a stick in the frame: close, it runs off the frame's top and bottom.
    // (the ribbon's frames come out of the shaft's foot after it: scene 13)
    // on a portrait screen the camera stands back so the frame turned square to you fills the width, no more
    const RB = W.RIB, galDist = port ? Math.max(0.052, frameDist(RB.H * RB.A * 0.5, 0.92) + RIBBON_LIFT.port) : 0.052;
    /** where the camera looks at the frame at angle `th` round the spiral from: out from it, a little above */
    const galD = (th: number) => RB.out(th).addScaledVector(UP, 0.14).normalize();
    // round the shaft as it rides down, to end looking where the ribbon's first frame will stand (world.ts), drifting on
    // round the way the ribbon turns
    const DRIFT = 0.12, RIDE = 1.05, UNDER: [number, number] = [CL + 0.45, CL + 1.35];
    const theta1 = Math.atan2(pipeD(R0).z, pipeD(R0).x) + 0.5, theta2 = theta1 + wrap(RB.a0 - DRIFT * (T.F1 - UNDER[1]) - theta1);
    // (on a phone it ends further out and lower, so what's under the deck, empty sky, is what stands behind the words)
    const rho = (t: number) => (0.026 + P(0.008, 0.016) * smooth(UNDER[0], UNDER[1], t)) * P(1, 1.2);
    // how deep the camera is (down from the shaft's top), and how far below (+) or above (−) it it looks
    const hCam = (t: number) => -0.004 + (depth("report") + P(0.014, 0.03) + 0.004) * smooth(CL, CL + RIDE + P(0, 0.25), t);
    const ahead = (t: number) => 0.02 - P(0.056, 0.06) * smooth(UNDER[0], UNDER[1], t);
    const thetaAt = (t: number) => theta1 + (theta2 - theta1) * smooth(CL, UNDER[1], t) + DRIFT * Math.max(0, t - UNDER[1]);
    const climaxKey = (t: number) => {
      const th = thetaAt(t), h = hCam(t);
      const pos = SHF.at(h).addScaledVector(V(Math.cos(th), 0, Math.sin(th)), rho(t));
      return kAt(t, pos, SHF.at(h + ahead(t)), { cx: P(0.62, 0.5), cy: P(0.5 - 0.08 * smooth(UNDER[0], UNDER[1], t), 0.34 - 0.06 * smooth(UNDER[0], UNDER[1], t)), near: 0.3, dust: 0.02, region: "crawler" });
    };
    const vFall = camOf(fallKey(R0 + 0.01)).sub(camOf(fallKey(R0 - 0.01))).divideScalar(0.02);
    // the rise: off the deck and up the outside to the top, the eye going up the shaft with it
    keys.push(fallKey(R0), ...travel(fallKey(R0), climaxKey(CL), { leave: tup(vFall), arrive: [0, 0, 0], look: [0, 1], step: 0.04 }));
    const HOLD = T.F0 + 0.4;
    for (let t = CL; t <= HOLD + 1e-6; t += 0.04) keys.push(climaxKey(t));
    drivers.push((t) => { pipe.s = sTrack(t); });
    // the lens is live from its arrival until it opens; it splits in two, and the pipeline unfolds down out of the gap
    // as its text leaves, ahead of the fall
    crwSet.times(T.A0 + 3.6, T.C0 + 0.45, crwDir);
    crwSet.pose(port);
    tl.to(crawler, { open: 1, duration: 0.6, ease: "power2.inOut" }, T.C0 + 0.45);
    tl.to(crawler, { deploy: 1, duration: 0.65, ease: "power1.inOut" }, T.C0 + 0.7);
    tl.to(pipe, { vis: 1, duration: 0.5 }, T.C0 + 0.6);
    tl.to(stream, { vis: 0, duration: 0.4 }, T.C0 + 0.45);
    // its companions draw off as it opens (the dive is the pipeline's), their labels with them, before the closing
    // camera would carry them into the corners
    tl.to(crwSet.moons, { vis: 0, duration: 0.35 }, T.C0 + 0.5);
    // Athena and her moons go as the fall starts, out of frame: the climax's shots look out past the shaft, and she has
    // no part in it
    tl.to([athena, ...athSet.moons], { vis: 0, duration: 0.3 }, T.C0 + 1.0);
    // the fall's own changes: Save's magazine fills as the records sink in, and the report's bars rise round it
    tl.to(pipe, { fill: 1, duration: 0.7 }, tau.save! - 0.25);
    tl.to(pipe, { bars: 0.6, duration: 0.55, ease: "power2.out" }, tau.report! - 0.3);
    // the climax: the front runs down from CL (climax.ts), the rings it passes held lit; the bars shoot up as it
    // lands, the report's deck turned to the camera, and the hairline of what enriching would have cost comes in
    // the deck turns so the bars stand to the right of the shaft as the report is read, clear of the text column
    const heroD = V(...climaxKey(HOLD).dir), repD = V(heroD.x, 0, heroD.z).normalize();
    // (the deck turned so the bars stand to the shaft's right, in the hold's frame, clear of the text)
    pipeSet.times(CL, 0.85, repD.clone().applyAxisAngle(UP, 0.8));
    tl.fromTo(pipe, { glow: 0 }, { glow: 1, duration: 0.3, immediateRender: false }, CL);
    tl.to(pipe, { bars: 1, duration: 0.4, ease: "back.out(2)" }, CL + 0.72);
    tl.fromTo(pipe, { cut: 0 }, { cut: 1, duration: 0.4, immediateRender: false }, CL + 0.8);
    tl.to(pipe, { glow: 0, cut: 0, duration: 0.45 }, T.PIPE_END - 0.3);

    // ---------------------------------------------------------------- 13 · the ribbon's frames come out of the shaft
    // (a camera that chased a record's flight out to the frames bobbed: it rose 0.08 over the shaft and dropped 0.1,
    // its view swinging from 57° up to 34° down and back; ADR 0016): the frames come out of the shaft's own foot. The
    // camera draws back out from under the deck, past where it reads them from, its view coming down the shaft to the
    // bore's way out as the first frame comes out of it, and watches them come out, the shaft's foot and the first
    // frame's place both in frame, down the bore and out to their places (spiral.ts); then it eases in to the first, as
    // the last lands. Its view only ever tilts down, and its height only ever falls (on a phone, where the climax ends
    // lower, only ever rises).
    const WATCH = T.F0 + 1.3, first = RB.at(0);
    const holdK = climaxKey(HOLD), readK = lAt(T.F1, first, galD(0), galDist, { cx: P(0.66, 0.5), cy: P(0.48, 0.36), near: 0.3, region: "own" });
    const c0 = camOf(holdK), c2 = camOf(readK), ax = SHF.top;
    const out0 = Math.hypot(c0.x - ax.x, c0.z - ax.z), out2 = Math.hypot(c2.x - ax.x, c2.z - ax.z), outW = out2 + P(0.035, 0.045);
    // what it watches: the bore's way out and the first frame's place
    const watchEye = SHF.at(depth("report") + 0.004).lerp(first, 0.5), watchCy = P(0.46, 0.34);
    const eyeAt = (t: number) => V(...holdK.target).lerp(watchEye, smooth(HOLD, WATCH, t)).lerp(first, smooth(WATCH, T.F1, t));
    for (let t = HOLD + 0.04; t < T.F1 - 1e-6; t += 0.04) {
      const th = thetaAt(t), e = smooth(HOLD, T.F1, t), w = smooth(HOLD, WATCH, t), r = smooth(WATCH, T.F1, t);
      const out = out0 + (outW - out0) * w + (out2 - outW) * r;
      const pos = V(ax.x + Math.cos(th) * out, c0.y + (c2.y - c0.y) * e, ax.z + Math.sin(th) * out);
      keys.push(kAt(t, pos, eyeAt(t), {
        cx: holdK.cx + (readK.cx - holdK.cx) * e, cy: holdK.cy + (watchCy - holdK.cy) * w + (readK.cy - watchCy) * r, near: 0.3, dust: 0.02 * (1 - e),
        region: "crawler", blend: { region: "own", k: e },
      }));
    }
    // the record you fell with is the first to come out: the swarm's copy goes as it does
    tl.fromTo(pipe, { lead: 1 }, { lead: 0, duration: 0.05, immediateRender: false }, T.F0 + 0.75);

    // ---------------------------------------------------------------- 13 · the ribbon: round the spiral
    const thEnd = T.thEnd, G1 = T.G1;
    // the camera comes round evenly, but is round at a frame at each project's reading spot, so the frame square to you
    // there is the one it's looking at (ribbon-turn.ts); a key at each spot holds the path to it
    const ownSpots = script.blocks.filter((b) => b.id.startsWith("own-")).map((b) => readingSpot(b, T.END));
    const thAt = spiralTurn({ t0: T.F1, t1: G1 - 0.3, thEnd, step: T.RIBBON_STEP, spots: ownSpots });
    for (const t of keyTimes({ t0: T.F1, t1: G1 - 0.3, every: 0.08, spots: ownSpots })) { const th = thAt(t); keys.push(lAt(t, RB.at(th), galD(th), galDist, { cx: P(0.66, 0.5), cy: P(0.48, 0.36), near: 0.3, region: "own" })); }
    ribSet.times({ F0: T.F0, F1: T.F1, G1, thOf: thAt });

    // ---------------------------------------------------------------- 14 · out to the whole sky: Contact
    const END = T.END;
    const contact = orbitKey(END - 0.2, P([0.58, 0.5], [0.5, 0.42]), 0.92, "contact");
    keys.push(lAt(G1 + 0.9, RB.C.clone().lerp(V(0, 0, 0), 0.35), galD(thEnd).lerp(V(...contact.dir), 0.5).normalize(), 0.5, { cx: 0.55, cy: 0.48, near: 0.8, dust: 0.05, spread: 2, region: "projects" }), contact);
    // as the camera pulls out the frames go out by the spiral's hidden exit, sliding on round it as one chain, each
    // shrinking into thin air a step past the last, as a chain going into a hidden exit (spiral.ts)
    tl.fromTo(gal, { exit: 0 }, { exit: 1, duration: 1.2, ease: "sine.in", immediateRender: false }, G1 + 0.25);
    tl.to(gal, { vis: 0, duration: 0.15 }, G1 + 1.45);
    // the crawler and its shaft go while the first frames are read, out of frame above them, so they're gone by the
    // carousel's end; the ribbon's own key, from the same star, takes over lighting them
    tl.to([crawler, pipe], { vis: 0, duration: 0.05 }, T.F1 + 0.6);
    // every other body is hidden (not dimmed) while it's out of frame, before the camera draws back past it (Athena and
    // her moons are out of frame from the fall on, home from the middle of the ribbon); their keys go dark with them
    // (rig.ts)
    tl.to([athena, ...moons], { vis: 0, duration: 0.05 }, T.F1 + 0.1);
    tl.to(opening.home, { vis: 0, duration: 0.05 }, G1 - 1.0);
    tl.to(sunState, { lit: 1, duration: 0.4 }, G1 + 1.5);
    tl.fromTo(sunState, { heat: 0 }, { heat: 0.9, duration: 0.4, ease: "power2.out", immediateRender: false }, G1 + 1.65);

    // the hero's own turn is unwound by the dive and wound back in by the pull-out
    const spinW = (t: number) => (t < G1 ? 1 - smooth(0, 1.4, t) : smooth(G1 + 0.6, END - 0.2, t));
    // the sky's own turn shows through where it's seen whole, as the hand's drag does (the script's `sky.drag`)
    const spinsLive = (t: number) => within(script.sky.drag, t);
    return { path: buildPath(keys), tl, drivers, spinW, spinsLive };
  }

  // ---------------------------------------------------------------- seeking: the timeline, the drivers, the camera
  sky.camera.near = 0.0004;
  sky.camera.updateProjectionMatrix();
  sky.setManual(true);
  let pose = { pos: [3, 0.5, 3] as Vec3, target: [0, 0, 0] as Vec3, cx: 0.5, cy: 0.5, near: 3, spread: 1.2 };
  let spinOffset = 0, pitchOffset = 0;
  sky.drive = () => pose;

  const rebuild = () => {
    film?.tl.kill();
    reset();
    return (film = buildFilm(sky.size.w, sky.size.h));
  };
  let F = rebuild();
  // the film's camera at any time, and the throws' cuts (each hidden by its flash), for measuring its moves
  // (scripts/film/turns.mjs, voyage.spec.ts; development only)
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __path: (t: number) => F.path.at(t), __cuts: [script.plan.flash] });

  const k = () => sky.size.h / 2 / Math.tan((FOV / 2) * (Math.PI / 180));
  const frustum = new Frustum(), homeBall = new Sphere(), projView = new Matrix4();
  function seek(t: number) {
    F.tl.time(t, false);
    for (const d of F.drivers) d(t);
    const p = F.path.at(t);
    // where the hero's sky turns on its own, the camera turns with it
    const live = F.spinsLive(t);
    sky.spin.factor = live ? 1 : 0;
    // and a drag there turns it over too (the pitch, clamped short of the pole), unwound and wound back in the same way
    if (live) { spinOffset = wrap(sky.cam.az - HERO_AZ); pitchOffset = clampPitch(sky.cam.el, HERO_EL) - HERO_EL; }
    const w = F.spinW(t), off = spinOffset * w, tip = pitchOffset * w;
    let pos = V(...p.pos), target = V(...p.target);
    if (off || tip) { const r = orbitTurn(p.pos, p.target, off, tip); pos = V(...(r.pos as Vec3)); target = V(...(r.target as Vec3)); }
    pose = { pos: tup(pos), target: tup(target), cx: p.cx, cy: p.cy, near: p.near, spread: p.spread };
    sky.setLight(oklabToSrgb(p.light.space), oklabToSrgb(p.light.tint));
    sky.U.dustGain.value = p.dust;
    const tint = oklabToSrgb(p.light.tint);
    homeFill.setRGB(...nightFill(tint, fillGain));
    tNow = t;
    // how fast the camera's going, from the path itself (so a scrub or a still sees the same streaks a scroll would)
    const a = F.path.at(t - 0.01).pos, b = F.path.at(t + 0.01).pos;
    velNow.set((b[0] - a[0]) / 0.02, (b[1] - a[1]) / 0.02, (b[2] - a[2]) / 0.02);
    // the bodies cull and fade by the camera, so it takes this frame's pose before they're updated
    sky.pose();
    update(pos);
  }

  // the blocks, posed for this frame; a body under ~16 px on screen fades by its size
  function update(cam: Vector3) {
    const kk = k();
    opening.update(cam, kk);
    // the relay, lit while it's in play; the throw's streaks and flash; the traffic round home as it's built
    relaySet.update(playNow);
    jump.update(cam, velNow, flashNow, streakNow);
    traffic.update(tNow, { pos: cam, target: V(...pose.target), tanH: Math.tan((FOV / 2) * (Math.PI / 180)), aspect: sky.size.w / sky.size.h }, sky.renderer.getPixelRatio());
    athSet.stream.vis = stream.vis;
    athSet.update(tNow, cam, sky.camera, sky.size, (r, P) => (r / Math.max(1e-6, P.distanceTo(cam))) * kk);
    crwSet.update(tNow, sky.camera, sky.size, (r, P) => (r / Math.max(1e-6, P.distanceTo(cam))) * kk);
    pipeSet.update(tNow, sky.camera, performance.now() / 1000, sky.size, sky.renderer.getPixelRatio());
    ribSet.update(tNow, sky.camera, sky.size, sky.renderer.getPixelRatio(), cam, crwSet.key.intensity > 0);
    // while the ribbon is read only the crawler's star lights it, as it lights the shaft over it: the worlds behind keep
    // their place, not their keys (each is a directional light, so it reaches every surface in the sky); each body set
    // its key afresh in its update above, so this dims this frame only
    const own = smooth(T.F0 + 0.5, T.F0 + 0.9, tNow) * (1 - smooth(T.G1 + 0.3, T.G1 + 0.6, tNow));
    if (own > 0) for (const k of [athSet.key, opening.key]) k.intensity *= 1 - own;
    rig.cull();
    // home's key lights the whole film, but its shadow map only falls round the ship: it's redrawn only while the
    // ship is drawn (as home.ts fades it: shown, and over ~2.5 px across) and near the frame
    homeBall.center.copy(W.HOME.P);
    homeBall.radius = W.HOME.r * 4;
    sky.camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(projView.multiplyMatrices(sky.camera.projectionMatrix, sky.camera.matrixWorldInverse));
    opening.key.shadow.autoUpdate = opening.home.vis > 0.004 && (W.HOME.r / Math.max(1e-6, cam.distanceTo(W.HOME.P))) * kk * 2 > 5 && frustum.intersectsSphere(homeBall);
  }

  // ---------------------------------------------------------------- where things are on screen
  const cam = sky.camera, camR = new Vector3(), camU = new Vector3(), pv = new Vector3();
  const screen = (P: Vector3) => {
    pv.copy(P).project(cam);
    return { x: (pv.x * 0.5 + 0.5) * sky.size.w, y: (-pv.y * 0.5 + 0.5) * sky.size.h, z: pv.z };
  };
  const subjects: Record<string, () => { P: Vector3; r: number; shown: boolean } | null> = {
    home: () => ({ P: W.HOME.P, r: W.HOME.r, shown: opening.home.vis > 0.3 }),
    // where a label on the ship points (into its near modules), and where it hangs, its leader reaching on to that point (ships.ts)
    "home-edge": () => {
      camR.setFromMatrixColumn(cam.matrixWorld, 0);
      camU.setFromMatrixColumn(cam.matrixWorld, 1);
      return { P: opening.edge(camR, camU, isShort(sky.size.w, sky.size.h)), r: 0, shown: opening.home.vis > 0.3 };
    },
    "home-hang": () => {
      camR.setFromMatrixColumn(cam.matrixWorld, 0);
      camU.setFromMatrixColumn(cam.matrixWorld, 1);
      return { P: opening.hang(camR, camU, isShort(sky.size.w, sky.size.h)), r: 0, shown: opening.home.vis > 0.3 };
    },
    athena: () => ({ P: W.ATH.P, r: athSet.reach(), shown: athena.vis > 0.3 }),
    "ai-web-crawler": () => ({ P: W.CRW.P, r: crwSet.reach(), shown: crawler.vis > 0.3 }),
    crawler: () => ({ P: W.CRW.P, r: crwSet.reach(), shown: crawler.vis > 0.3 }),
  };
  const resolve = (ref: string): { P: Vector3; r: number; shown: boolean } | null => {
    if (subjects[ref]) return subjects[ref]!();
    const [kind, id, n] = ref.split(":");
    if (kind === "star") { const i = sky.index.get(id!); return i === undefined ? null : { P: V(...(sky.pos(i) as Vec3)), r: 0, shown: true }; }
    // a breakthrough's craft, while it's in play (traffic.ts)
    if (kind === "craft") { const P = traffic.heroAt(id!); return P ? { P, r: 0, shown: true } : null; }
    // where a company's stack hangs from: a part of its quarter, once its hull's going up (traffic.ts)
    if (kind === "stack") {
      const q = script.plan.quarters.find((x) => x.role.id === id);
      const P = q ? traffic.stackAt(q.i, Number(n), tNow) : null;
      return P ? { P, r: 0, shown: opening.home.vis > 0.3 && opening.home.built * 4 >= q!.i + 0.6 } : null;
    }
    if (kind === "moon") { const m = moons.find((x) => x.m.slug === id); return m ? { P: m.obj.position, r: m.m.r, shown: m.vis > 0.3 } : null; }
    if (kind === "wedge") return { P: wedgeAt(Number(n)), r: 0, shown: athena.vis > 0.3 };
    // a report bar's top, or the top of the hairline of what enriching would have cost
    if (kind === "bar") {
      const cut = id === "cut", P = pipeSet.barTop(cut ? 2 : Number(id), cut);
      return P ? { P, r: 0, shown: pipe.vis > 0.3 && (cut ? pipe.cut > 0.3 : pipe.bars > 0.05) } : null;
    }
    if (kind === "stage") { const l = W.shaft.levels.find((x) => x.id === id); return l ? { P: W.shaft.at(l.d), r: W.shaft.R, shown: pipe.vis > 0.3 } : null; }
    return null;
  };
  const view: StageView = {
    anchor(a: Anchor) {
      const s = resolve(a.ref);
      if (!s || !s.shown) return null;
      camR.setFromMatrixColumn(cam.matrixWorld, 0);
      camU.setFromMatrixColumn(cam.matrixWorld, 1);
      const r = a.r ?? s.r * (a.rScale ?? 1);
      return screen(s.P.clone().addScaledVector(camR, r * a.ax).addScaledVector(camU, r * a.ay));
    },
    point(ref) {
      const s = resolve(ref);
      return s && s.shown ? screen(s.P) : null;
    },
    star(id) {
      const i = sky.index.get(id);
      return i === undefined ? null : screen(V(...(sky.pos(i) as Vec3)));
    },
    // a pattern rides one of Athena's wedges, and a world's moons cross in front of it: their labels hang outside it,
    // clear of her ice and the crawler's rock
    labelClear: (ref) =>
      ref.startsWith("wedge:athena") || athSet.moons.some((m) => ref === `moon:${m.m.slug}`) ? athSet.clearPx()
        : crwSet.moons.some((m) => ref === `moon:${m.m.slug}`) ? crwSet.clearPx(ref) : undefined,
  };

  // what the page keeps clear of on screen (Tycho parks and flies clear of the subjects, not only the text): each
  // scene's bodies as drawn, leaving out the lines laid as meshes (the orbit, the route), and his star's disc as it
  // burns at Contact (bodies.ts)
  const prints = createBodyFootprints(sky.camera, () => sky.size);
  prints.add(opening.root, { shown: () => opening.home.vis > 0.05 });
  prints.add(relaySet.root, { shown: () => relays.some((r) => r.vis > 0.05) });
  prints.add(athSet.root, { shown: () => athena.vis > 0.05 });
  prints.add(crwSet.root, { shown: () => crawler.vis > 0.05 });
  prints.add(pipeSet.root, { shown: () => pipe.vis > 0.05, skip: pipeSet.notSubjects });
  prints.add(ribSet.root, { shown: () => gal.vis > 0.05 });
  const beacon = sky.state[sky.index.get(HIS_STAR)!]!;
  prints.addSpot(() => {
    const p = view.star(HIS_STAR);
    return p && p.z < 1 && beacon.lit > 0.3 ? { x: p.x, y: p.y, r: 14 + 44 * beacon.heat } : null;
  });

  // every later scene loads under the wake-up's loader (loading.ts), warming itself up as it's built, then the
  // pipeline's and the ribbon's programs, each in a turn of its own; each marks itself built, and the loader's count
  // waits on them all (lib/wake/built.ts); any reduced-motion still taken before they were in is taken again
  const built = (m: Milestone, p: Promise<unknown>) => p.then(() => markBuilt(m));
  const whole = Promise.all([
    built("relay", relaySet.ready),
    built("traffic", traffic.ready),
    built("athena", athSet.ready),
    built("crawler", crwSet.ready),
    built("pipeline", Promise.all([pipeSet.ready, crwSet.ready]).then(() => warmInTurn(sky.renderer, (r) => pipeSet.warm(r, sky.scene, [crwSet.root])))),
    built("ribbon", ribSet.ready.then(() => warmInTurn(sky.renderer, (r) => ribSet.warm(r, sky.scene)))),
  ]).then(() => stillsStale());
  return {
    ready: opening.ready,
    whole,
    seek,
    // what a warp carries down its throat (warp-debris.ts): Work's traffic, the ribbon's frames (a frame's screen is the
    // mesh drawn with its screenshot) while they're in view, and records from all of Projects
    cargo: (() => {
      const crafts = (): Cargo[] => Object.values(traffic.models() ?? {}).map((obj) => ({ kind: "craft", obj }));
      const frames = (): Cargo[] => ribSet.frames().map((obj) => ({ kind: "frame", obj }));
      return {
        at(t: number): Cargo[] {
          const sec = sectionHere(t), own = script.scenes.find((x) => x.id === "own");
          if (sec === "sec-about") return [{ kind: "slab" }];
          if (sec === "sec-work") return crafts();
          // past the pipeline's end, the ribbon's frames are out
          if (sec === "sec-projects") return own && t > own.t0 + 0.35 ? [...frames(), { kind: "record" }] : [{ kind: "record" }];
          return [];
        },
        all: (): Cargo[] => [...crafts(), ...frames(), { kind: "record" }],
      };
    })(),
    // a hard scroll throws loose things outwards
    fling(v: number, f?: Fling) {
      // in development a forced value (`__flingForce`) holds them thrown, for stills of the fling
      const forced = process.env.NODE_ENV !== "production" ? (window as { __flingForce?: number }).__flingForce : undefined;
      pipeSet.fling(forced ?? v);
      ribSet.fling(forced ?? v);
      athSet.fling(forced ?? v, forced === undefined ? f : undefined);
    },
    render: () => sky.render(),
    view,
    snapshot() {
      const from = sky.renderer.domElement, c = document.createElement("canvas");
      c.width = from.width;
      c.height = from.height;
      c.getContext("2d")!.drawImage(from, 0, 0);
      return c;
    },
    resize() {
      F = rebuild();
    },
    dispose() {
      F.tl.kill();
      sky.drive = null;
      sky.setManual(false);
      sky.spin.factor = 1;
      sky.camera.near = 0.05;
      sky.camera.updateProjectionMatrix();
      rig.dispose();
      offQuality();
      prints.dispose();
      sky.scene.remove(root);
      athSet.dispose();
      crwSet.dispose();
      ribSet.dispose();
      owned.forEach((o) => o.dispose());
    },
  };
}
