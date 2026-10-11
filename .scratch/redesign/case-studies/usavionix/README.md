# Case study — US Avionix

Captured 2026-09-27, headless Chromium with the GPU (ANGLE Metal, Apple M5), 1440×900 at DPR 2 for stills and CSS-pixel 60 fps MP4 clips. Mobile is the iPhone 13 preset (390×664, DPR 3, touch). Recipe: `research/capture-setup.md` (step 2 skipped, see `case-studies/BRIEF.md`). Scenarios are in `scenarios/`, run logs and probes in `logs/`, working notes in `logs/notes.md`. The site's JavaScript is in `logs/src/` (pretty-printed copies in `logs/src/pretty/`).

## 1. At a glance

| | |
|---|---|
| URL | https://www.usavionix.com/ |
| Awwwards | https://www.awwwards.com/sites/usavionix. **Site of the Day, Sep 9 2026**, score **7.41** (Design 7.38, Usability 7.03, Creativity 8.00, Content 7.47). The page also shows a Developer score of **7.74** (Semantics/SEO 8.00, Animations/Transitions 8.20, Accessibility 7.00, WPO 7.60, Responsive 7.60, Markup 7.80). Tags: Startups, Storytelling, 3D, WebGL, Next.js. Palette listed as `#000` / `#fff`. Source: `logs/awwwards-page.txt` |
| Studio | **basement studio** (Awwwards credit, PRO profile) |
| Client | USAvionix, which by its own copy builds jet-powered VTOL ISR drones ("Delta") and a command layer ("Phalanx AI"), with "SARA" and "Athena" products, a contact form, "Request Access" for demos and a notes blog at notes.usavionix.com. Unlike Edolus, it presents itself as a real company, not a studio showcase |

**Gist.** The home page is a scroll-driven product film in React Three Fiber, told in 14 beats. A black delta-wing drone flies over endless mountains; its specs draw themselves on; it becomes a swarm, then a formation. A zoom-blur punch-out cuts to a digital-twin flock. The drone then detects objects, finds a fire with a thermal sensor and confirms it over a town. A diagonal wipe cuts to "Phalanx AI", a dark 3D command map where threats go red and turn cyan as drones and emergency services respond. After the film, ordinary scrolling leads through mission cards and a wireframe globe, and the drone lands into the footer as a 96-frame image sequence. Every word is real HTML over one canvas; the camera and drones follow baked animation clips scrubbed by a Lenis-based **scene stepper** that plays one scene per wheel gesture. There is no GSAP: DOM motion is Motion (framer-motion).

**Most memorable thing.** Two moments tie. The first is the **loader's match cut**: a flat grey silhouette of the drone sits in exactly the hero pose while "LOADING ASSETS → CALIBRATING → READY" ticks by, then a diagonal wipe replaces it with the lit, textured drone flying over the terrain (`71-cold-load.mp4`, `logs/71-cold-load-reveal-detail.png`). The second is the hidden **keyboard flight** at the hero: ←/→ bank the drone across the screen and **Shift** fires the afterburner, speeds the ground up six times and brings up the only sound on the site, a four-stem jet-and-wind mix with the engine pitch rising under the throttle (`08-hero-keyboard-flight.mp4`, §8). Nothing on the page tells you it exists.


## 2. Tech found

| What | Detail | How detected |
|---|---|---|
| Framework | **Next.js 15.5.9** App Router on Vercel, React 19.2 (the canary build Next bundles, `19.2.0-canary-0bdb9206-20250818`), **Tailwind CSS v4.1.13**. Routes: `/` (the film) plus `/delta`, `/phalanx`, `/sara`, `/athena`, `/about`; `notes.usavionix.com` is a separate blog | `_next/static/chunks/app/(home)/page-*.js`, `__next_f`/`next` globals, the `"15.5.9"` string in chunk 7817, the `tailwindcss v4.1.13` banner in the CSS, `?dpl=` deployment ids; route list from the menu data in the layout chunk |
| 3D | **three.js r180** through **React Three Fiber** and **drei** (`useGLTF` with the Draco 1.5.5 decoder from gstatic, `KeyboardControls`, `Html`, `PerspectiveCamera`, `Text3D`, `RenderTexture`). 3D text via **troika-three-text** (`Geist-SemiBold.woff`) and a typeface JSON (`orbitron-bold.json`, the "01" tail number painted on the drone through a render texture) | `window.__THREE__ = "180"`; `"@react-three/fiber"` in chunks 8530/8612; `draco_decoder.wasm` request; `Troika` in chunk e7c1e244; `KeyboardControls` map and `Text3D font:` in the home chunk |
| Post-processing | pmndrs **postprocessing**: `EffectComposer`, `SMAAEffect`, `KawaseBlurPass` (a blurred copy of the scene behind glass panels), plus a custom full-screen grade pass `Efx` (vignette, saturation, contrast, tint, sharpen, gamma, ACES, grain, and the loader's diagonal wipe) | `super("SMAAEffect"`, `"KawaseBlurPass"`, `"EffectComposer"` in chunk d5504597; the `Efx` fragment shader in the worker chunk 4867 and the home chunk |
| Render approach | **Three** full-window WebGL2 canvases once loaded, plus the loader's: (1) the main R3F film (2160×1350 = DPR 1.5 cap, `dpr: [1, 1.5]`, ACES tone mapping); (2) a second full-screen 2160×1350 canvas, idle (0 draw calls) at every film stop, almost certainly the fixed `z-scroll-sequence` layer for the footer's landing sequence; (3) a 1360×976 canvas that draws one ~1 424-triangle mesh in *every* frame at every film stop, most likely the post-film globe, rendering while off-screen. The **loader** is a fourth canvas, an R3F scene rendered in a **Web Worker on an OffscreenCanvas** (chunk 4867; the `worker`/`fallback` props match `@react-three/offscreen`), removed when the film is ready | DOM probe `canvases` (`logs/probe-dom-landing.json`) and runtime probe `canvasContexts` (all `webgl2`); renderer probe (captured through three's `__THREE_DEVTOOLS__` hook) in `logs/probe-stops-desktop.json`; readiness timeline shows 4 canvases while loading, 3 after (`logs/probe-ready-desktop.json`); `transferControlToOffscreen` in chunk 7162 |
| Scroll | **Lenis 1.3.17** as the root scroller (`{ lerp: 0.95, syncTouch: true }`), with a custom **scene stepper** on top that turns every wheel, arrow-key or swipe gesture into an auto-played move to the next scene boundary (§5) | `lenisVersion` global, `html.lenis`, `ReactLenis root options` in chunk 2245 |
| DOM animation | **Motion** (framer-motion) for every overlay: `AnimatePresence mode="wait"`, `initial/animate/exit` on headings, callouts, the nav labels and the missions grid (`layout`). **No GSAP** anywhere | `MotionIsMounted` global; `to.P.div`/`to.P.path` motion components in the home chunk; no `gsap` string in any chunk |
| State | **zustand** stores (with immer): one per scene (`progress`, `isActive`, `showRatio`, `hideRatio`, 15 scenes), a mouse store, and a loading store (`loadingCanvasLoaded`, `mainAppLoaded`, `imageSequenceLoaded`, `degraded`) | modules 36745 and 86700 in chunk 2245 |
| 3D assets | 13 GLBs in 15 requests (resource timing counts 14; 3.5 MB transferred): `terrain.glb` 2.0 MB, `delta-pbr.glb` 0.9 MB, `city-terrain.glb` 0.4 MB, `loading-delta.glb` 0.14 MB (fetched 3×: main thread, worker, preload), `delta-lowpoly`, `building`, `grid`, `grid-city`, `power-station`, and baked animation clips `camera-animations(-mobile).glb` / `drone-animations(-mobile).glb` (**both the desktop and mobile variants load on desktop**). Textures: `env.exr` (145 KB), `fire.webp` 0.67 MB (flipbook), `city.webp` 0.56 MB, `wind.webp`, `noise.webp`, `bnoise.png` (blue noise), globe `earth_outline`/`earth_normal`, landing logos | network log `logs/run-2026-09-27T12-09-52-323Z.json`; resource timing `logs/probe-perf-landing.json` |
| Image sequence | 96 AVIF frames (`/assets/images/landing-sequence/0001–0096.avif`, 2.8 MB) drawn on a shader plane with a two-frame crossfade (`uBase0`, `uBase1`, `uRatio`) | `LandingSequence` component in the home chunk; 96 `image/avif` requests |
| Fonts | **Geist** and **Geist Mono** (Vercel, SIL OFL 1.1), self-hosted through `next/font` as variable woff2 (weights 100–900); Geist SemiBold woff for troika text in the canvas; Orbitron Bold (OFL) as a three.js typeface JSON. Details in §9 | `document.fonts` (`Geist 100 900`, `Geist Mono 100 900`); `_next/static/media/*-s.p.woff2`; `__variable_*` body classes |
| Sound | Web Audio only: four looping MP3s on Vercel Blob storage, fetched when the first flight key is pressed (§8). No Howler, no Tone | `AudioContext` block in the home chunk; `audioEvents`/`audioFiles` in the run logs |
| Analytics | Vercel Web Analytics (`va`, `vaq`, `vam` globals; `/177628583e5dde75/script.js`) | runtime probe globals; network log |
| Meta | `lang="en"`, a real `<meta name="description">`, Open Graph and Twitter cards with a generated `opengraph-image.png`, `viewport` without zoom limits. One `h1` ("Securing the skies with autonomous intelligence"), `h2`s for every scene heading | DOM probe `meta`, `headings` |
| Debug | `r3f-perf` (`<Perf position="bottom-left" showGraph={false} overClock />`) and a scene table (Scene / Progress / Show / Hide) mount behind a debug flag | chunk 2485; `"Scene"`, `"Progress"`, `"Show"`, `"Hide"` strings in the home chunk |

## 3. Intro & loading

**Boot splash, then a loader drawn in a worker.** Measured on a cold browser cache (`logs/probe-ready-desktop.json`, polled every 100 ms from navigation start):

| t (ms) | What is on screen |
|---|---|
| 324 | first paint: the `BootSplash`, a radial gradient `#0d1014 → #06070a → #000` |
| 310–1 194 | status line "INITIALIZING" (Geist Mono caps, bottom centre, with a thin progress bar), the loader canvas mounts |
| 1 194 | "LOADING ASSETS": the worker's canvas shows a flat, unlit silhouette of the drone (`loading-delta.glb` recoloured `#2d302e`, fov 20) on the dark gradient |
| 2 384 | "CALIBRATING": the main R3F app has loaded; the gate is now waiting only for `imageSequenceLoaded`, i.e. the **96 AVIF frames (2.8 MB) of the footer's landing animation**. That costs ~1.4 s of the 4.6 s gate |
| 3 795 | "READY" |
| 3 795–4 600 | **the reveal**: a diagonal wipe (0.75 s, screen UV rotated 225°) replaces the flat silhouette with the lit, textured drone over the moving terrain. The silhouette sits in exactly the hero drone's pose, so it reads as a **match cut** from blueprint to render (`logs/71-cold-load-reveal-detail.png`) |
| 4 094–4 695 | the nav bar fades in (`opacity` 0.7 s ease-out, 0.2 s delay) |
| 4 595 | the loader canvas is removed, the page unlocks (`scrollY` 1) and the H1 starts to fade in |
| 4 595–4 995 | the H1 enters from 8 px below, going **from red-orange `#FF2200` to white** |
| 4 995–5 395 | the body copy and the "Scroll To Explore" pill follow the same way |

- **Time to first action: 4.6 s** (input is ignored until the loader is gone; the wheel, arrow and touch listeners all check `loadingCanvasHidden`). The recon run, shot while other agents held the GPU, took 7.5 s (LCP 7 544 ms). LCP is the H1 (4 608 ms here), which is honest on this site because the H1 is real HTML.
- **Progress is staged, not measured.** The status labels map to fixed bar values (Initializing 0.18, Loading assets 0.52, Calibrating 0.84, Ready 1) and the bar never goes backwards. The label is a `role="status" aria-live="polite"` element.
- **Fallbacks:** if the worker fails to start, or the loader has not reported "loaded" within **12 s**, the site sets `degraded` and shows "SLOW CONNECTION". If the app is not ready **20 s** after the loader loaded, it forces the reveal anyway, and the hide itself is capped at **3 s**. So the gate is never longer than ~35 s.
- **Not skippable**, and it replays on every visit and every reload (no "seen" flag). After the reveal the page auto-steps once to the start of the film (`scrollY` 1).
- Clips: `71-cold-load.mp4` (sheet `71-cold-load.sheet.png`). The page's own frame log over this load (`logs/probe-raf-reshoot.json` → `cold-load`) shows **one 2.3 s main-thread frame**: the film being built. That is almost certainly why the loader lives in a Web Worker on an OffscreenCanvas: the silhouette keeps rendering while the main thread is frozen.

## 4. Navigation & page transitions

**Inside the film: scene jumps.** The home is one page; "navigation" is mostly the scene stepper (§5) and the tick-mark nav.

- **Tick nav jump** (`45-nav-jump-to-phalanx.mp4`, grid `logs/45-nav-jump-detail.png`; `55-nav-jump-to-response.mp4`). Click a tick → `#scene-container` fades to black in 150 ms → Lenis `scrollTo(scene end, 0.75 s)` behind the black → fade back. In the capture the screen is black for ≈ 1.3 s, and the destination appears already composed (heading in place), so it reads as a **blackout cut**, not a fly-through. Clicking the active tick does nothing. The ticks are `div`s with `cursor: pointer` and `onClick`, **not buttons or links**: no keyboard focus, no `href`, no accessible name beyond the hidden label text.
- **Tick hover** (`43-nav-ticks-hover-sweep.mp4`, `44-nav-hover-last-tick.png`). Sweeping across the nav opens each label in turn (all 10 sweep points had `cursor: pointer`), and leaving restores the active one.
- **Stepper gestures** (`47-fast-wheel-burst.mp4`, `48-wheel-back-up.mp4`). A 3 000 px wheel burst in 0.6 s moved exactly **one scene** (36 001 → 40 501); one gesture up went back exactly one scene (40 501 → 36 001). Fast scrolling cannot skip ahead; only the tick nav can.
- **Logo:** on the home it is a button that jumps to `scrollY` 1 instantly (no animation) and restarts Lenis.

**Menu, Contact.**

- **Menu** (`49-menu-open.mp4`, `50-menu-open.png`, `51-menu-links-hover.mp4`, `52-menu-close.mp4`). A right-hand sheet, 316 px (`md:max-w-79`), `bg-black/70` + `backdrop-blur-xl`, `border-l` white/20, sliding in over the dimmed film. Links: Delta, Phalanx AI, SARA, Athena, About Us (each with an arrow; hover dims the label to white/60), then "We're hiring ↗" and "Partner Program ↗" with one-line descriptions at the bottom. Opening it **locks** Lenis through the lock counter; Escape closes it.
- **Contact** (`53-contact-open.mp4`, `54-contact-open.png`). A centred modal form "Contact Us" (Name, Company, E-mail, Message, "Submit Form"), dark glass over the dimmed scene. Escape closes it.

**Other routes are an "info" layer over a persistent film.** `/delta`, `/phalanx`, `/sara`, `/athena` and `/about` render through a separate `(info)` layout. Opening one:

- sets `html.info-open` and shows a black full-screen page with a close × (`button.z-info`, "Close"), an `h1` ("Delta"), copy, a spec table, a **live WebGL turntable** of the drone in its own 843×844 canvas, and the shared footer (`66-delta-page.png`, `68-delta-page-scrolled.png`);
- keeps the home mounted underneath: its three canvases stay alive, collapsed to 0×0, and its DOM (all H2s) stays in the document (`logs/probe-dom-delta.json`);
- transition in (`65-route-to-delta.mp4`): the menu sheet slides away and the page **hard-cuts** to the info page; no wipe, no loader.
- transition out (`69-route-back-home.mp4`): the logo link returns to `/` with `scroll: false`, straight back to the **same scroll position** in the film (here the footer, `70-home-after-route-back.png`), with no loader replay. In this capture the landing drone flashed once and did not reappear afterwards.

Each info route is therefore a real URL with real HTML, while the expensive 3D is paid for once. Direct loads of `/delta` were not tested.

## 5. Scroll behaviour

**The film is a scene stepper on top of Lenis.** The film takes the first 60 301 px of a 64 664 px home document (at 900 px viewport height); the rest is the post-film page. A sticky, full-height `#scene-container` holds the canvas and overlays while the document scrolls behind it. Its length is the sum of 15 scenes (`module 36745` in chunk 2245):

| # | Scene id | Height | Nav tick label (in brackets: no tick of its own, the previous label stays) | Overlay (DOM) shown in its window |
|---|---|---|---|---|
| 0 | `intro-scene` | 1 px | — | hero H1 + copy + "Scroll To Explore", until delta-drone 0.075 |
| 1 | `delta-drone` | 500 vh | Specs | four spec callouts, while delta-drone > 0.9 and swarm < 0.01 |
| 2 | `swarm-scene` | 500 vh | Swarm | "Understanding the Swarm System" + copy + a four-row table (Autonomy, Scalability, Collaboration, Coverage), swarm 0.75 → mission 0.075 |
| 3 | `mission-preset` | 500 vh | Mission | "Mission preset" + "Start Mission", mission 0.75 → flock 0.01 |
| 4 | `flock-scene` | 500 vh | Sync | no H2, body copy "Coordinated in real time…"; telemetry lines start (BOOT SEQUENCE…), flock 0.75 → detection 0.01 |
| 5 | `real-time-detection` | 500 vh | Detection | "Real-time detection", detection 0.5 → thermal 0.075 |
| 6 | `thermal-irregularity` | 500 vh | (Detection) | "Thermal irregularity detected" + "M-1 Success" pill, thermal 0.9 → ignition 0.075 |
| 7 | `ignition-verified` | 500 vh | (Detection) | "Ignition verified", 0.75 → Phalanx 0.075 |
| 8 | `phalanx-ai` | 500 vh | Phalanx AI | "Phalanx AI", 0.8 → analysis 0.075 |
| 9 | `analysis-evaluation` | 500 vh | Sys Analysis | "Analysis & evaluation" |
| 10 | `integrated-notifications` | 500 vh | Int Alerts | "Integrated notifications" |
| 11 | `interdrone-coordination` | 500 vh | Coordination | "Inter-drone coordination" |
| 12 | `extra-support` | 500 vh | (Coordination) | no H2, body copy only ("The swarm detects the need for extra support…"), red "ALERT AREA" |
| 13 | `zone-stabilized` | 100 vh | (Coordination) | "Zone stabilized" + cyan "M-2 Completed" pill |
| 14 | `multi-threat-response` | 500 vh | Response | "Multi-threat response", from 0.9 |

Each scene publishes `progress` (0→1 across its own height), `isActive`, `showRatio` and `hideRatio` (0→1 over one viewport before and after it) to a zustand store on every Lenis `scroll` event. Every 3D rig and every overlay reads its own window from that store, so the whole film is **one shared scroll timeline with per-effect windows**, the same pattern as Edolus but on native document scroll.

**The stepper** (`chunk 2245`, module 82245) is what makes the site feel like a sequence of shots rather than a scroll:

- A `wheel` event (any size), `ArrowDown`/`ArrowUp`, or a touch swipe sets a **target**: the end of the current scene if it is less than 99 % through, otherwise the end of the next one. Upwards, the target is the previous boundary.
- A `requestAnimationFrame` loop then moves Lenis toward the target with `scrollTo(…, { immediate: true })` in steps of **2 px per ms** of frame time (2 000 px/s), but only while the visitor's own scroll velocity is low. A 500 vh scene therefore **plays for 2.25 s at 900 px tall** (1.66 s at 664 px) at constant speed, whatever the wheel sent.
- Measured: a 900 px wheel moved `scrollY` from 1 to **4 501** (one scene), and a further 2 000 px wheel spread over 2.5 s moved it to **13 501** (two more scenes, because the second half of the gesture arrived after the first boundary). Wheel size does not matter, only gesture count: `wheelScale` was irrelevant here (`logs/notes.md`).
- Lenis itself runs with `lerp: 0.95`, which is almost no smoothing: the "smoothness" is the stepper's constant-speed glide, not an inertial ease.
- The native scrollbar still works. Dragging it is detected (a `pointerdown` in the scrollbar gutter), and on `mouseup` the stepper snaps forward to the end of the scene you dropped into.
- `history.scrollRestoration = "manual"` and a forced `scrollTo(0)` on load: a reload always starts at the top, behind the loader.
- The in-page CTAs ("Scroll To Explore", "Start Mission") call `lenis.scrollTo(end of that scene, { duration: 3, easing: linear })`.
- A **lock counter** (`lenis-lock-change` event) stops Lenis while the menu sheet is open.
- After the last scene (from 59 401 px) the stepper lets go and the rest of the page (missions grid, image sequence, founders, footer) scrolls natively through Lenis.

**After the film** (`57-post-film-scroll-to-missions.mp4`, `59-mission-card-hover-expand.mp4`, `61-post-film-scroll-sequence.mp4`, `63-post-film-scroll-footer.mp4`, `86-landing-sequence-slow.mp4`, `87-autonomy-in-real-operations.png`): ordinary Lenis scroll through "One platform, many missions." (three photo cards: Wildfire Cascade, Border Storm, Critical Infrastructure in Crisis; clicking one on `lg` widens it to two columns with a Motion `layout` animation and reveals its title and description), the globe band, "Autonomy in real operations" with "Request Access", then the landing drone and the footer. The nav bar gains its black backing here, and the tick nav hides.

Velocity effects: none on the DOM. In the 3D, the terrain's scroll speed is its own clock (`offsetZ` grows with time × a per-scene speed), so the ground keeps moving even at rest; Shift at the hero multiplies it by 6 (§6).

## 6. Cursor & micro-interactions

Found by clips, hover sweeps (`h.sweep`: a grid of pointer stops that records the element, computed cursor and `:hover` target at each), and the listeners in the bundle (`grep mouseenter|pointerenter|mousedown|click|raycast|cursor|keydown`).

- **The keyboard flight (the site's easter egg).** At the hero only (delta-drone progress < 0.001 and no lock), drei `KeyboardControls` maps **←/A**, **→/D** and **left Shift**:
  - ←/→ push the drone sideways: a damped velocity toward ±100 units/s, position clamped to ±200, and a **bank** proportional to lateral speed (`roll = −0.002 × velocity`). Release and it springs back to centre.
  - **Shift is a boost:** the terrain's scroll speed eases to **×6** (0.05 per frame in, 0.025 out), an exhaust plume appears behind the engine (the `fire.webp` flipbook shader), and the jet sound comes up (§8).
  - Shift + ←/→ combine: boosting while banking.
  - There is **no on-page hint**: no copy mentions the keys (checked every string in the bundle). It is found by accident or by word of mouth. On touch devices it does not exist.
  - Evidence: `08-hero-keyboard-flight.mp4` (← 1.5 s, → 2.2 s, Shift 3 s, Shift+← 1.5 s, Shift+→ 1.5 s, release), `09-hero-after-flight.png`, `logs/probe-mix-journey-a.json`.
- **Pointer on the 3D: almost nothing.** A global `MouseTracker` writes normalised pointer x/y (−1…1) on `mousemove`, and only the hero drone reads it: during the specs scene it rolls by up to `0.25 × x` rad (damped). In the capture this is imperceptible (`logs/74-specs-sweep-roll-detail.png`: 12 frames across a full left-to-right sweep, no visible change). Every sweep point over the drone, the swarm, the mission formation and the Phalanx map returned the canvas with `cursor: auto` (15/15, 22/24, 15/15, 13/15; the others hit callout text or an invisible overlay div). **No hotspots, raycast targets or hover reveals on any 3D object.** The `raycast` hits in the bundle are R3F/drei internals (event compute for a render-texture portal) plus an `onPointerOver: () => null` stub.
- **Tick-mark scene nav** (top centre, visible once the film starts). Ten 1 × 6 px white/50 % ticks, one per navigable scene, with the active scene's label (Geist Mono 12 px caps) opened between them. Hovering a tick opens *its* label instead (width animates to the label's measured width over 0.5 s, Motion) and `onMouseLeave` restores the active one. Click → the scene container fades to 0 in 150 ms, Lenis `scrollTo` the scene end in 0.75 s, fade back in. On touch: press on the nav, slide along it (the label under the finger opens), release to jump. Evidence in §4.
- **Headline colour-in.** Every H1/H2 and body paragraph enters with Motion from `{opacity: 0, y: 8, color: #FF2200}` to `{opacity: 1, y: 0, color: #FFFFFF}` and exits the same way in reverse (to `y: −8`, red). The effect is a brief red-orange flash that settles to white: the only warm accent on the site, used as the "signal" colour of a new beat. `AnimatePresence mode="wait"` makes the old heading leave before the new one enters.
- **Spec callouts** (end of delta-drone). Four drei `Html` anchors on the drone (`transform: false`, re-projected every frame). For each: a 1 px white dot fades in, a 1 px line draws out with Motion `pathLength` 0 → 1 (0.8 s, `[0.33, 1, 0.68, 1]`, delay 0.3 s) through an SVG gradient that fades from transparent to white, then the title and description fade in, each staggered by 0.1 s per callout. They are text, not hotspots: hovering does nothing (`74-specs-sweep.mp4`, `73-scroll-to-explore-click-to-specs.mp4`).
- **Drone ID tags** (swarm). Small white tags ("DSA011", "DSA012"…) pinned to each drone. Each character is its own span and the tag "decodes" out of a solid white block, then disappears the same way (`75-scene-swarm-scene.sheet.png`). Thin link lines join the drones.
- **Detection boxes** (real-time detection). Dozens of thin box outlines with mono label chips on `bg-yellow` `#ffcb47` (two in lime `#b1ff7a`), e.g. "car 83%", "campfire 87%", "road obstruction 87%", tracking points on the terrain; all DOM (`probe-stops-desktop.json` → `real-time-detection`).
- **Telemetry block** (bottom right, flock → multi-threat). Geist Mono 12 px caps lines ("BOOT SEQUENCE…", "THERMAL / LIDAR / RGB / IR [ONLINE]", "AI: 2 AGENTS / DUAL GPU [ACTIVE]", "COORD: [37.4419°N / 119.8772°W]", "ALT 1,240M | SPEED 74 KM/H", "2 WILDFIRES + 1 ROADBLOCK DETECTED", "AREA STATUS: SECURED"), each keyed to a scene progress value. A window of the last four lines is shown, with older lines at 0.5–0.75 opacity, and status words are coloured by state (red WILDFIRES, cyan SECURED).
- **CTA pills** ("Scroll To Explore", "Start Mission", "Contact", "Request Access"). `rounded-full bg-white/25 px-5 py-3` with a Phosphor bold arrow (`@phosphor-icons/react`, `weight="bold"`). Hover is only `bg-white/30`, a 5 % step that is invisible over the moving terrain (`logs/72-cta-hover-detail.png`); the cursor is `pointer`. Keyboard focus is handled: `focus-visible:outline-1 outline-white`. Disabled state is `bg-white/0 text-white/40` with a 1 px outline.
- **Cursor:** the system cursor throughout. No custom cursor, no magnetic buttons.

## 7. 3D / WebGL

**One R3F scene carries the whole film**, rendered at DPR 1.5 max (2160×1350 at 1440×900) with ACES filmic tone mapping (`toneMapping` 4, exposure 1), then pmndrs `postprocessing`: SMAA, a Kawase blur copy for glass panels, and the custom `Efx` grade pass (vignette, saturation, contrast, tint, sharpen, gamma, film grain, and the diagonal `uHideRatio` wipe). Two more canvases sit alongside: an idle full-screen one for the footer's landing sequence, and a 1360×976 one that keeps drawing a ~1 424-triangle mesh (most likely the post-film globe) even while the film is on screen (renderer probe in `logs/probe-stops-desktop.json`).

**The camera and drones are authored, not simulated.** `camera-animations.glb` and `drone-animations.glb` (plus `-mobile` variants with reframed shots) hold baked clips, `Camera01`–`Camera09` and `Drone01-01` … `Drone03-02`. Each clip is bound to a scene window and scrubbed by that scene's `progress`, with a separate desktop and mobile "tracker" (home chunk, line 632). The effect is a one-take film shot in a DCC tool, played back by scroll. Procedural motion is layered on top: the terrain's endless scroll, the formation offsets in swarm/mission, the keyboard flight, the pointer roll.

What each world is, in film order (stills `screenshots/06`–`42`, sheets `motion/*.sheet.png`):

| Scenes | World | Technique |
|---|---|---|
| hero, specs, swarm, mission | a black delta-wing drone over endless mountains, low cloud, soft sun | `delta-pbr.glb` (PBR, lit by `env.exr` IBL) over `terrain.glb` with a custom shader: per-scene fog (`uFogStart/End/Density/Exponent`, table at home-chunk line 106), sky and cloud colours, sun direction, blue-noise dithering (`bnoise.png`). The terrain never stops moving: its UV offset grows with time × a per-scene speed. The tail number "01…" is Orbitron `Text3D` rendered into a `RenderTexture` on the wing. Swarm and mission add two more drones on baked paths |
| boost (hero only) | exhaust plume | `fire.webp` flipbook on a billboard (`uFireTexture`, `uFramesPerRow`) |
| mission → flock | a **zoom-blur punch-out**: radial blur and white speed streaks, then a cut to a dark digital-twin world | *inferred:* the `wind.webp` streak texture plus a radial blur (`79-scene-flock-scene.sheet.png`); I did not trace the exact pass |
| flock ("Sync") | a flock of several dozen small white low-poly drones over a dark grid, linked by dotted network lines | `delta-lowpoly.glb` as `instancedMesh`, line segments between neighbours, `grid.glb` |
| real-time detection | back over the terrain, desaturated; DOM detection boxes track terrain points | `Html` anchors on 3D points |
| thermal irregularity | the drone banks down to a low camera, a translucent **sensor cone** reaches a ground target, and a false-colour **thermal inset** ("THERMAL SENSOR 0°C–148°C", purple → yellow) appears top right | baked `Drone03-02`/`Camera05`; the inset re-renders the scene through a thermal palette (`uThermalInvertPos/Size/TargetPos`, `uSceneTexture`) |
| ignition verified | top-down satellite view of a small town | `city-terrain.glb` + `city.webp` (0.56 MB) |
| ignition → Phalanx | the loader's **diagonal wipe** again, into the command map | the same `Efx` hide ratio |
| Phalanx AI → multi-threat response | a dark tilted grid "command map": region outlines drawn in white, glowing points that change colour with state (yellow survey → red threat → cyan secured), white low-poly drones circling targets with trails, a `power-station.glb` that turns red then cyan | `grid-city.glb`, `building.glb`, `power-station.glb`, `delta-lowpoly.glb`; state colours from the Tailwind tokens (`#ffcb47`, `#f66`, `#7aebff`) |
| post-film: globe | a dark wireframe **globe** with continent outlines and cyan callouts ("FLOOD AREA SECURED", "EVACUATION SUPPORTED") joined by arcs, rotating as you scroll past "USAvionix covers vast areas…" | `earth_outline.webp` + `earth_normal.webp` on a sphere with a Fresnel rim shader (`uNormalMap`, `uFresnelPower`, `uLightDirection`) |
| post-film: landing | the drone **lands into the footer**: close-up of the engine at "Autonomy in real operations", then the drone descends, gear down, and settles behind a giant outlined "USAvionix" wordmark and "Ready to talk to us?" | `LandingSequence`: 96 pre-rendered AVIF frames scrubbed by scroll, two frames crossfaded per step (`uBase0`, `uBase1`, `uRatio`), progress remapped (0–0.45 → first 10 % of frames, 0.45–0.7 → to 30 %, 0.7–1 → the rest), a Kawase-blurred copy behind a glass panel (`uBlurredScene`) |

- **It reacts to:** scroll (everything), the keyboard at the hero (§6), and the pointer only as a faint roll on the specs drone. No raycast interaction, no drag.
- **Colour and light are read from code**, not eyedropped: fog/sky/cloud uniforms, the three state colours, the loader silhouette `#2d302e`, the headline flash `#FF2200`. Full list in §9.
- **Look:** photoreal PBR plus terrain for the "hardware" half, then flat, dark, diagrammatic UI-in-3D for the "software" half (Phalanx). The two halves are joined by hard cuts (zoom-blur punch-out, diagonal wipe) rather than a continuous camera move. It reads as two films edited together: product film, then product demo.

## 8. Sound

**The film is silent.** There is no music, no ambience, no UI sound, no transition hits and no sound toggle. The only audio is the **keyboard-flight easter egg** at the hero. Nothing loads until the first flight key is pressed: `audio/` stayed empty through the whole recon run (load, scroll, 3 stills), and all four files arrived 0.04–0.35 s after the first `ArrowLeft` (`audioFiles` in `logs/run-2026-09-27T12-18-36-985Z.json`).

| File (as downloaded) | Role in the code | Format (ffprobe) | Duration | Level (astats) | Read from spectrogram / waveform |
|---|---|---|---|---|---|
| `delta-jet.mp3` | `engine`, gain max **0.54**, playbackRate **0.85 → 1.25** with throttle | MP3 mono 48 kHz 327 kb/s, 130 KB | 3.27 s | peak −1.0, RMS −10.2 dBFS, crest 9.2 dB | a stationary broadband roar: most energy below ~300 Hz, dense noise up to ~1.2 kHz, rolled off above; no tonal turbine whine lines. A rumble bed, not a transient |
| `jet-wind.mp3` | `jetWind`, gain max **0.67** | mono 48 kHz 321 kb/s, 476 KB | 12.13 s | −1.0 / −13.0 dBFS, crest 12.0 dB | sub-100 Hz rumble plus a resonant band that sweeps slowly between ~300 and ~700 Hz (rises near 0.6 s, dips near 7.5 s, rises again near 9 s): airflow with slow gusts |
| `jet-wind-left.mp3` | `windLeft`, gain max **0.67** | mono 48 kHz 325 kb/s, 140 KB | 3.54 s | −1.1 / −10.3 dBFS, crest 9.2 dB | one gust: the band rises ~400 → ~800 Hz around 0.9–1.4 s and falls back |
| `jet-wind-right.mp3` | `windRight`, gain max **0.65** | mono 48 kHz 325 kb/s, 155 KB | 3.92 s | −1.0 / −7.6 dBFS, crest 6.6 dB | a brighter gust: the band sits at ~0.9–1.3 kHz, peaks near 1.5 s, falls to ~500 Hz by 3.3 s |

Spectrograms and waveforms sit next to each file in `audio/`; the table of stats is `logs/audio-probe.md`.

**Mix design: a four-stem mix table driven by the keys.** On the first key press, one `AudioContext` fetches and decodes all four files and starts all four as looping `AudioBufferSource`s, each through its own `GainNode` at gain 0 (the audio hook logged all four `buffer` starts within 0.35 s, all `loop: true`, during `key ArrowLeft`). From then on, every frame (R3F `useFrame`), each stem's level chases a target:

| Input (at the hero only) | engine | jetWind | windLeft | windRight | engine pitch |
|---|---|---|---|---|---|
| nothing | 0 | 0 | 0 | 0 | 0.85 |
| ← / A | 0 | 0 | **0.67** | 0 | 0.85 |
| → / D | 0 | 0 | 0 | **0.65** | 0.85 |
| Shift | **0.54** | **0.67** | 0 | 0 | → **1.25** |
| Shift + ← | 0.54 | 0.67 | 0.67 | 0 | 1.25 |

- **Envelope:** attack `level += (1 − level) × 0.05` per frame (≈ 1 s to 95 % at 60 fps), release `× 0.18` per frame (≈ 0.3 s), snapped to 0 below 0.01. Engine pitch is `0.85 + 0.4 × level`, so the engine "spools up" as it fades in. Measured every 200 ms (`logs/probe-mix-journey-a.json`): windLeft was already at 0.60 in the first sample after the files decoded (the level ramps even before the node exists) and 0.66 by 0.6 s later; release 0.66 → 0.165 → 0.015 → 0 over 0.4 s; with Shift, engine rate 0.956 → 1.25 over ~2 s.
- **Frame-rate dependent:** the ramps are per frame, not per second, so on a 120 Hz display they run twice as fast, and on a janky frame they stall.
- **Leaving the hero** (progress ≥ 0.001) sets every target to 0, so sound can only exist in the first 1 px of the page. The nodes keep running silently afterwards; the context is closed only on unmount.
- **No panning.** "Left" and "right" are separate mono recordings routed straight to the destination (`gain.connect(destination)`); the direction is conveyed by timbre (the right gust is brighter) and by the picture, not by stereo position.
- **Loops:** each file loops whole. Envelope autocorrelation found no internal repetition (best r = 0.23–0.31), so the loop period is the file length: 3.3 s engine, 12.1 s wind, 3.5 / 3.9 s gusts. The gust files swell in the middle (RMS 0.31 and 0.68 against ~0.10 at the ends), so **holding ← or → pulses every 3.5–3.9 s**. At the seam, `jet-wind` steps down ~9 dB (RMS 0.097 at the start vs 0.034 at the end) and `jet-wind-right` has a 0.17 sample discontinuity: likely an audible bump or click on each wrap. No MP3 priming gap (no leading silence after decode). Method: `logs/notes.md`.
- **Default on/off:** effectively on, with no toggle, but gated behind a gesture only a keyboard user at the hero will make. Mobile and touch visitors never hear anything.

### Questions for Janriz

1. Hold **Shift** at the hero for ~5 s: does the engine read as a jet spooling up (the pitch rises 0.85 → 1.25 over ~2 s), or as noise getting louder? Is the "boost" satisfying enough to be a reward on its own?
2. Hold **←** for ~8 s: is the 3.5 s gust loop obvious (a whoosh every 3.5 s)? Same for **→** (3.9 s).
3. Hold **Shift** for 15 s: can you hear a bump or click every 12 s where `jet-wind.mp3` wraps (a ~9 dB step at the seam)?
4. Tap ← and → alternately: does the ~0.3 s release sound natural, or does the wind cut off?
5. Since the whole film is silent: would a quiet engine bed that follows the scroll have made the stepper's auto-play feel more like flying? (This is a design question for the portfolio's own score, which Janriz already wants to follow sections and chat state.)

**Janriz's answers (2026-09-27):**

1–4. Not answered.
5. Yes: an engine bed that follows the scroll would make it feel more immersive.

## 9. Type, colour, layout

### Fonts

| Family | Used for | Weights / styles | Served from | Licence |
|---|---|---|---|---|
| **Geist** (Vercel, drawn with basement studio) | everything except labels: H1, H2, body, CTAs, callouts; also inside the canvas via troika (`Geist-SemiBold.woff`, the post-film "Founded by leaders…" line on desktop) | 500 and 600 in use (variable 100–900 loaded) | self-hosted via `next/font` (`_next/static/media/*.woff2`, variable, with a metric-adjusted "Geist Fallback") | **SIL OFL 1.1, free**, commercial web use allowed; also on Google Fonts |
| **Geist Mono** | nav labels, telemetry, HUD tags, detection chips, status label | 500 (variable 100–900 loaded) | self-hosted via `next/font` | SIL OFL 1.1, free |
| **Orbitron** Bold | the "01…" tail number painted on the drone (three.js `Text3D`, `orbitron-bold.json`) | 700 | typeface JSON in `/assets/3d-fonts/` | SIL OFL 1.1, free (Google Fonts) |

No paid fonts, so no alternatives are needed. Geist is already a Google Font, which fits the portfolio's "Google Fonts / free" rule directly.

### Type scale (desktop 1440×900, computed styles at every stop: `logs/probe-stops-desktop.json`; tokens: `logs/css-tokens.txt`)

| Role | Token | Family / weight | Size / line height | Letter spacing | Colour | Where |
|---|---|---|---|---|---|---|
| Display (H1) | `text-d-h0` | Geist 600 | **80 / 76 px** | −0.04 em (−3.2 px) | `#fff` | hero only, top left, `max-w-204` (816 px) |
| Scene heading (H2) | `text-d-h1` | Geist 600 | **76 / 80 px** | −0.04 em (−3.04 px) | `#fff` | every scene, top left |
| Section heading (post-film) | `text-d-h2` | Geist 600 | 50 / 52 px | −0.03 em | `#fff` | "One platform, many missions." |
| Lead / body | `text-d-h3` | Geist 500 | **29 / 32 px** | −0.01 em | `#fff` | scene copy, bottom left or right, `max-w-128.5` (514 px) |
| Body L | `text-d-body-l` | Geist 500 | 19 / 24 px | 0 | `#fff`, or white at 80 % for table cells | callout descriptions, swarm table |
| Body S | `text-d-body-s` (+ `leading-6`) | Geist 500 | 16 / 24 px | 0 | white at 40 % | menu link descriptions |
| CTA | `text-d-cta` | Geist 500 | 17 / 20 px | 0 | `#fff` | pills, Contact |
| Pill tag | `text-m-body-l` + `md:text-[1.375rem]/[1.5rem]` | Geist 500 | 22 / 24 px | 0 | `#7aebff` on `#7aebff` at 20 % | "M-1 Success", "M-2 Completed" |
| Nav label | `text-d-mono` (13 px computed) | Geist Mono 500, caps | 13 / 16 px | 0.06 em | `#fff` | tick nav |
| Mono / telemetry | `text-d-mono` | Geist Mono 500, caps | **12 / 16 px** | 0.06 em (0.72 px) | `#fff` at 0.5 / 0.75 / 1 by age; state colours for status words | telemetry, HUD tags |
| Detection chip | `text-m-mono` | Geist Mono 500, caps | 11 / 12 px | 0.06 em | `#000` on `#ffcb47` (or `#b1ff7a`) | detection boxes |

- Headings and body over the 3D carry `text-shadow: 0 1px 32px rgba(0,0,0,.25)`, a soft dark halo instead of a scrim.
- A special rule, `@media (min-width: 48rem) and (max-height: 37.5rem)`, drops desktop to the mobile sizes on short landscape windows.
- Only two weights (500, 600) and two families across the whole site. Tight negative tracking on display, wide positive tracking on mono caps.

### Type scale (mobile 390×664, `logs/probe-stops-mobile.json`)

| Role | Token | Family / weight | Size / line height | Letter spacing | Colour |
|---|---|---|---|---|---|
| Display (H1) | `text-m-h0` | Geist 600 | **43 / 38.7 px** | −0.04 em (−1.72 px) | `#fff` |
| Scene heading (H2) | `text-m-h1` | Geist 600 | **34 / 36 px** | −0.04 em (−1.36 px) | `#fff` |
| Section heading | `text-m-h2` | Geist 600 | 30 / 32 px | −0.04 em | `#fff` |
| Lead / body | `text-m-h3` | Geist 500 | 19 / 20 px | 0 | `#fff` (white/80 secondary) |
| Callouts, table, pill tag | `text-m-body-l` | Geist 500 | 14 / 16 px | 0 | `#fff`, white/80, `#7aebff` |
| CTA | `text-d-cta` (unchanged) | Geist 500 | 17 / 20 px | 0 | `#fff` |
| Nav label | mono | Geist Mono 500 caps | 13 / 16 px | 0.06 em | `#fff` |
| Telemetry / HUD | `text-d-mono` (unchanged) | Geist Mono 500 caps | 12 / 16 px | 0.06 em | white, state colours |
| Detection chip | `text-m-mono` | Geist Mono 500 caps | 11 / 12 px | 0.06 em | `#000` on `#ffcb47` |

The display drops from 80 to 43 px (×0.54) and the H2 from 76 to 34 px, while mono and CTA sizes stay the same: labels hold their size, only the voice shrinks. Line height is tighter than the size on the H1 (0.9), as on desktop (0.95).


### Colour (from CSS custom properties and declared WebGL values, not eyedropped)

| Role | Value | Source |
|---|---|---|
| Page background | `#000` (`body`), `--color-bg` `#0f0f0f` (post-film canvas `uBgColor`) | computed `body` background; CSS vars; colours probe |
| Text | `#fff`, with alpha steps white/80, /70, /60, /50, /40 | computed styles |
| **Signal flash** | **`#FF2200`**: every heading and paragraph passes through it on enter and exit (Motion `color`) | home chunk |
| State: detection / survey | `--color-yellow` `#ffcb47` (shader `uColor #ffcb47`); lime `#b1ff7a` variant on some chips | CSS vars; `probe-colours3.json` |
| State: threat | `--color-red` `#f66` (shader `uRed #ff6666`) | same |
| State: secured / services | `--color-green` **`#7aebff`** (a cyan, despite the name; shader `uBlue #7aebff`, `PointsMaterial #7aebff`) | same |
| UI chrome | pills white at 25 % (hover 30 %), full radius; tick marks white at 50 %; menu sheet `bg-black/70` + `backdrop-blur-xl` + `border-l white/20`; the nav bar's black backing fades in only after the film (`--bg-opacity` = multi-threat `hideRatio`) | computed chrome at each stop; layout chunk |
| Loader | boot gradient `#0d1014 → #06070a → #000`; drone silhouette `#2d302e` | layout and home chunks |
| 3D: atmosphere | haze `uFogSkyColor #c9e0f7`, sky `uSkyColor #95cbff`, clouds `#fff`; ambient light white ×1, directional white ×4; ACES tone mapping | colours probe |
| 3D: grade | `Efx` tint `#092b3b` (a deep teal pushed into the image), vignette `#000` | colours probe (`e0UTintColor`) |
| 3D: drone | `mtl-usavionix` MeshStandard white base with **white emissive ×3.3** (the painted panel lines and lights glow); decals white; tail number `#c6c6c6` | colours probe |
| 3D: command map | grid lines `uColor #8a8a8a`, outlines and network lines white (`LineMaterial`) | colours probe |

Awwwards lists the palette as `#000` / `#fff`, which is accurate for the chrome: all colour comes from the 3D and three small state accents.

### Layout

- **Full-bleed stage, overlay text in the corners.** The canvas fills the viewport, and each scene's overlay (`absolute inset-0`, padding `pt-20 px-8 pb-10` on desktop, `pt-18 px-4 pb-4` on mobile) puts the **heading top left**, the **body copy bottom left or bottom right**, and **telemetry bottom right**, leaving the centre to the drone. Nothing overlaps the subject at the hero poses.
- **Nav** (`--nav-height` 3.5 rem = 56 px, `px-8`): logo left (collapses to the mark after 40 px of scroll), tick scene nav centred, Contact pill and menu right.
- **Post-film page** (`container-md`: max 92.25 rem ≈ 1 476 px, `px-4` → `md:px-8`): a 4-column missions grid (`lg:grid-cols-4`, expandable cards 630 px tall, `rounded-2xl`, `outline-white/15`), the image-sequence band, a founders strip with logos, and the footer.
- **Mobile layout** (stills `89`–`110`, clips `88`, `90`, `105`, `108`, grid `logs/shots-2026-09-27T12-57-19-006Z.jpg`): every scene heading moves to the **bottom left**, above its body copy (the overlay becomes a `justify-end` column); the telemetry moves to the top, under the nav; the spec callouts form a 2 × 2 grid around the top-down drone; the nav keeps logo mark, ticks and menu, and Contact moves into the menu. The camera and drone use their own reframed `-mobile` animation clips.
- Spacing is Tailwind's 0.25 rem scale; radii 0.375–1.5 rem plus full pills.

## 10. Performance & degradation

- **Transfer (resource timing, desktop, cold cache).**
  - **8.8 MB in 161 requests before the first action** (10.7 MB decoded), and 9.5 MB after the whole film. Only `+0.9 MB` of MP3 follows, and only if a flight key is pressed.

    | Type | Transferred |
    |---|---|
    | GLB (13 files, 15 requests; both desktop and mobile animation clips) | 3.5 MB |
    | AVIF (96 landing-sequence frames, for the footer) | 2.8 MB |
    | WebP (terrain, fire, wind, globe, city; 2.3 MB after the full film) | 1.7 MB |
    | JS (34 chunks) | 0.76 MB (2.3 MB decoded) |
    | EXR environment | 0.15 MB |
    | Fonts (2 variable woff2) | 52 KB |

  - The document itself is small and fast: TTFB 158–611 ms, DCL 245–763 ms, `load` 420–1 088 ms (`logs/probe-perf-landing.json`, `logs/probe-perf-journey-a.json`).
- **LCP 4.6 s** on desktop (7.5 s in the contended recon run). It is the real H1, which only appears after the loader, so the metric is honest here, and it fails the ≤ 2.5 s budget because of the gate, not the page weight (§3).
- **Frame feel (headless M5 with the GPU; the page's own rAF intervals, `logs/probe-raf-reshoot.json`).**
  - Median 16.7 ms and p95 17.4–18.3 ms in every clip: the film holds 60 fps on this machine, including the heaviest terrain scenes.
  - **Hitches at world changes:** one 2.3 s main-thread frame during the load (hidden behind the worker loader), up to **133 ms** entering the flock world, up to **250 ms** (a few long frames) in the thermal scene, 35 ms in real-time detection, and one **417 ms** frame in the post-film section. These are one-off stalls, most likely shader compiles and texture or render-target creation the first time a world is shown. Nothing pre-warms them.
  - Journey A's capture had shown 22–42 fps on the terrain transitions; the reshoot with the rAF recorder proved that was capture contention from other agents' runs, not the site (`logs/notes.md`).
  - It never idles: the terrain scrolls, the drone animates, and the 1360×976 canvas (most likely the post-film globe) keeps drawing a mesh every frame even while the film is on screen.
  - DPR is capped at 1.5, SMAA replaces MSAA, and drei `AdaptiveDpr` (pixelated) is mounted. There is no GPU tiering or device sniffing; media queries alone pick the mobile/tablet camera clips and layout.

- **Mobile tier (iPhone 13 preset, measured; `04-mobile.js`, run `logs/run-2026-09-27T12-57-19-006Z.json`).**
  - **6.8 MB before the first action** (92 requests): the 96 AVIF frames are skipped (the footer drone is a still), but the full **3.5 MB of GLB still loads**, including the desktop camera and drone clips it never plays, plus 2.3 MB of WebP.
  - Readiness: Loading assets 1.1 s, Calibrating 3.51 s, Ready 3.59 s (no image sequence to wait for), H1 at **4.4 s**, CTA fully visible at 5.2 s. LCP 4 372 ms (the H1). Still above the 2.5 s budget, on a fast desktop CPU and network; a real mid-range phone was not tested.
  - Canvases: the main film at **585×996 (DPR 1.5 cap on a DPR 3 phone)** and a 633×633 globe canvas; rAF 60 fps at the end of the run.
  - The film works end to end by swipe: **each swipe of ≤ 350 px plays exactly one scene** (3 320 px at 664 px tall) whatever its length, 14 swipes from hero to the end (y 1 → 3 321 → … → 43 825). `syncTouch` makes Lenis drive touch scrolling too.
  - The tick nav works by touch-drag (release over a tick to jump: 40 505 → 3 321, `105-mobile-nav-touch-drag.mp4`).
  - No keyboard flight, so **no sound at all on mobile**. No pointer effects either (there are none on desktop worth missing).
  - Capture: `88-mobile-cold-load.mp4` p95 29.9 ms with median 16.7 (the same load hitch the desktop rAF log shows) and `108-mobile-post-film-scroll.mp4` at 37 fps captured (a static DOM section between strokes; median 16.7, p95 21.1).

- **Reduced motion (measured, `05-reduced-motion.js`, run `logs/run-2026-09-27T13-07-03-061Z.json`).** `matchMedia("(prefers-reduced-motion: reduce)")` returned true, and **nothing changed**:
  - the same worker loader and diagonal wipe (`117-rm-cold-load.mp4`, `118-rm-hero.png`), the H1 fading in over ~0.3 s;
  - the same auto-played stepper with its camera swing to top-down, the drawn callout lines and the red → white colour-in (`119-rm-step-to-specs.mp4`, `120-rm-specs.png`);
  - the same swarm fly-in and decoding tags (`121-rm-step-to-swarm.mp4`, `122-rm-swarm.png`);
  - the bundle never opts in: the only `reducedMotion` strings belong to the Motion library itself; there is no `MotionConfig reducedMotion="user"` and no media-query check in the app code. The first reduced-motion run was shot under contention and replaced (`logs/notes.md`).
- **Other degradation.** Good basics: `lang="en"`, a meta description, zoom allowed, real `h1`/`h2`s, `role="status"` on the loader, `focus-visible` outlines on the pills. Weak spots: the tick nav is not keyboard-reachable, input is ignored during the loader, and on desktop one line of copy is canvas-only for assistive tech (`lg:invisible` on its DOM twin).

## 11. Ideas worth taking

The standing constraints, numbered as in the map Notes:

1. GSAP-only animation
2. real-HTML text
3. chat usable within 1 s
4. reduced-motion and mobile tiers, with lazy 3D and audio
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free/self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **The match-cut reveal: a flat silhouette that becomes the real render in the same pose.** USAvionix's loader draws the drone as an unlit `#2d302e` silhouette in exactly the hero pose, then a diagonal wipe swaps it for the lit, textured drone (§3).
   - **Why it fits:** it is the cleanest answer yet to the Facade question. State 1 can paint a silhouette of the bot (an inline SVG or a tiny unlit GLB) in the first frame, next to a chat bar that already works. When the real model has streamed in, a GSAP-tweened wipe or dissolve uniform swaps it in place. Loading becomes a reveal, and nothing waits for it.
   - **Strains:**
     - Constraint 3: USAvionix gates all input behind it (4.6 s here, 7.5 s under load); ours must be decoration over a working page.
     - Constraint 4: the silhouette must be the reduced-motion and low-tier end state, not just a loading frame.
     - Constraint 1: the wipe must be a GSAP tween on a uniform, not a per-frame `dt` counter.
2. **Colour as the "signal" of a new beat: text enters in one accent and settles to white.** Every heading and paragraph arrives from `#FF2200` at `y: 8` and settles to white, and leaves the same way (§6). It is the site's only warm colour, and it marks "this just changed".
   - **Why it fits:** a chat-driven page has exactly this need. When the agent fires a tool effect (`scroll_to`, `highlight_project`) or streams an answer, the text it just changed could enter through Janriz's accent and settle, so a visitor sees *what the agent did*. It is tied to meaning (agent → page), so it is not a generic effect, it costs one `gsap.fromTo` on `color`/`y`/`autoAlpha`, and the text stays real HTML.
   - **Strains:** constraint 4 (the reduced-motion branch keeps the colour step but drops the `y` move). Keep contrast: the settle colour must pass AA, and the accent should only ever be a transition state.
3. **A telemetry line that narrates what the system is doing.** A mono, caps, 12 px log in the corner ("BOOT SEQUENCE…", "LINK: PHALANX SYSTEM [ESTABLISHED]", "2 WILDFIRES + 1 ROADBLOCK DETECTED"), four lines at a time, older lines fading to 0.75 and 0.5, and status words coloured by state (yellow detect, red threat, cyan secured) (§6, §9).
   - **Why it fits:** Janriz's agent really does things (retrieves wiki chunks, calls tools, rate-limits). One terse line per real event ("WIKI: 5 CHUNKS", "SCROLL_TO #sec-work", "RATE LIMIT OK") would make the AI entrypoint feel alive and honest, in Geist Mono, a free Google Font.
   - **Strains:**
     - The effects rule: it must report real events, never decorative "hacker UI" filler.
     - Accessibility: keep it `aria-hidden` and let the chat transcript be the accessible record, so screen readers are not flooded.
     - Constraint 4: on mobile, one line at most.
4. **A tick-mark section nav with only the current label spelled out.** Ten 1 × 6 px ticks, the active section's name opened between them, hover opens another, click jumps (§4).
   - **Why it fits:** it is a compact, quiet way to show "where am I" in a long single page, and the chat's `scroll_to` tool effect could drive the same component, so the label opens as the agent moves you.
   - **Strains:**
     - Accessibility: USAvionix's ticks are `div`s. Ours must be `<a href="#sec-…">` links with focus styles and bigger hit areas.
     - Constraint 1: the width tween moves to GSAP.
     - Its jump is a 1.3 s blackout. Use ScrollSmoother's `scrollTo` with a short, visible move instead.
5. **Sound that exists only inside an interaction, as a stem mix driven by input.** Four looping stems start silent together on the first key press. Each key sets gain targets, and the engine's pitch follows the throttle (0.85 → 1.25) (§8).
   - **Why it fits:** the same shape suits a steerable roaming bot: a code-generated hum (Web Audio noise through filters, no files) whose level and pitch follow the bot's speed, heard only while you drive it. It matches Janriz's Edolus answers (sound after a gesture, stems that follow state).
   - **Strains:**
     - Constraint 4: audio loads lazily and stays off until a gesture.
     - Accessibility: arrow keys must never be captured while focus is in the chat input or while reading.
     - Mobile needs its own control, or the feature stays desktop-only.
     - Replace the per-frame easing with GSAP tweens on `gain` (or `setTargetAtTime`) so it does not depend on frame rate.
6. **Detail routes as an overlay over a persistent 3D stage.** `/delta` and the other product pages are real URLs with their own H1 that open over the still-mounted film and return you to the same scroll position with no reload (§4).
   - **Why it fits:** project detail views (or the résumé) could have real URLs for sharing and LLM citation without paying for the 3D twice, and the chat drawer would persist across them.
   - **Strains:** AGENTS.md says not to add per-project routes just for SEO. This is only worth it if the detail views are real content, which the redesign has not decided. No constraint is strained.
7. **Hard cuts between worlds instead of one continuous camera.** The film joins its photoreal "hardware" half and its flat diagrammatic "software" half with a zoom-blur punch-out and a diagonal wipe (§7).
   - **Why it fits:** if the concept has two registers (Janriz the person / the agent and its wiki), a clean cut is cheaper and clearer than a morphing camera move.
   - **Strains:** constraint 5 (the transition frames were the site's worst), and a zoom blur can slide into a generic effect if it is not motivated.

**What to avoid:**

- **A gate in front of everything, partly for content at the bottom of the page.** Input is ignored for 4.6 s (7.5 s under load), it is not skippable, it replays on every visit, and ~1.4 s of it waits for the footer's 96-frame image sequence. This breaks constraints 3 and 4.
- **The one-gesture-one-scene stepper.** Any wheel, however small or fast, plays exactly one scene at a fixed 2 000 px/s. You cannot skim, stop mid-scene or go faster, and a 3 000 px flick still moves one scene. It is "scroll" in name only, and it fights ScrollSmoother's native feel (constraint 1).
- **Navigation you cannot reach by keyboard.** The tick nav is click-only `div`s, and its targets are 1 px wide ticks.
- **An easter egg as the only sound.** It is undiscoverable (no hint anywhere), desktop-only, with frame-rate-dependent envelopes and likely clicks at loop seams.
- **Text drawn in the canvas with its DOM copy visually hidden.** On desktop, "Founded by leaders from SpaceX, Apple, Tesla, Palantir, JPL…" is troika text in WebGL; the HTML copy is `visibility: hidden` (`lg:invisible`), which also hides it from screen readers. This breaks constraint 2 in spirit.
- **Invisible hover states.** `bg-white/25 → /30` over moving terrain reads as no feedback at all.
- **The generic layer:** film grain, vignette, glowing point sprites on the map, and decorative HUD chatter with no real data behind it. The effects rule bans these for us.

## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | landing still, two wheel probes of the stepper, DOM/runtime/perf probes | stills `02`–`04`; `logs/probe-dom-landing.json`, `probe-runtime-landing.json`, `probe-perf-landing.json`, `probe-dom-after-scroll.json`; run log `run-2026-09-27T12-09-52-323Z.json` (network list). Its clip `01` was shot under contention and deleted |
| `02-journey-a.js` | desktop: cold load → hero sweep → keyboard flight → specs → one clip, still and stop probe per scene | stills `06`, `09`, `12`, `15`, `17`, `21`, `23`, `25`, `27`, `29`, `32`, `34`, `36`, `38`, `40`, `42`; clips `07`, `08`, `26`, `28`, `30`, `31`, `33`, `41` (the others were contended and replaced by `71`–`84`); `logs/probe-stops-desktop.json`, `probe-ready-desktop.json`, `probe-mix-journey-a.json`, `probe-colours3.json`, `probe-perf-journey-a.json`; run log `run-2026-09-27T12-18-36-985Z.json` (audio events, sweeps) |
| `03-journey-b.js` | desktop: tick nav sweep and jumps, stepper burst and back, menu, Contact, post-film page, `/delta` and back | `43`–`70`; `logs/probe-stops-desktop-b.json`, `probe-dom-delta.json`; run log `run-2026-09-27T12-38-26-656Z.json` |
| `06-reshoot.js` | journey A's contended clips again, each with an in-page rAF recorder | `71`–`84`; `logs/probe-raf-reshoot.json`; detail grids `logs/71-cold-load-reveal-detail.png`, `72-cta-hover-detail.png`, `74-specs-sweep-roll-detail.png` |
| `07-post-film-reshoot.js` | post-film sequence with the rAF recorder, the slow landing-sequence scroll | `86`, `87` (`85` deleted: redundant with `61`) |
| `04-mobile.js` | iPhone 13: cold load → one swipe per scene with a stop probe each → tick nav touch-drag → menu → post-film → footer | `88`–`110`; `logs/probe-stops-mobile.json`, `probe-ready-mobile.json`, `probe-dom-mobile.json`, `probe-runtime-mobile.json`, `probe-perf-mobile.json` |
| `05-reduced-motion.js` | desktop with `prefers-reduced-motion: reduce`: cold load, first two steps | `117`–`122` (a first contended run was deleted; its log is `logs/superseded-run-2026-09-27T13-02-45-182Z.json`) |
| `_probe.js` | shared probes: DOM, runtime, perf, scroll, the `__THREE_DEVTOOLS__` scene/renderer hook, Web Audio node hook, readiness timeline, stop probe (text map + type + colour + 3D state), 3D colours | — |

Other logs: `logs/notes.md` (runs, redos, gotchas), `logs/audio-probe.md`, `logs/css-tokens.txt`, `logs/awwwards-page.txt`, `logs/45-nav-jump-detail.png`, `logs/src/` (the site's JS/CSS/HTML; `pretty/` is esbuild-formatted), stills grids `logs/shots-*.jpg`.
