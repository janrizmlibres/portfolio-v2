# US Avionix — working notes

Started 2026-09-27 20:07 PST.

## Runs
- 20:09 run 01-recon starting
- 20:09 run 01-recon (run-2026-09-27T12-09-52-323Z): loads fine headless (ANGLE Metal). 01-cold-load p95 41.8 ms (page busy during load; reshoot in journey). Stills 02-04.
  Scroll probe: wheel +900 → scrollY 4501; +2000 more → 13501. NOT a wheelScale issue: a scroll *stepper* (see below).

## Source findings (logs/src/pretty, app_home_page / 2245 / app_layout chunks)
- Next.js App Router, R3F (@react-three/fiber) on three r180 (`__THREE__`), Lenis 1.3.17 (`lenisVersion`, html.lenis), Motion (framer-motion; `MotionIsMounted`, `to.P.div` motion components), zustand stores. NO GSAP. Vercel analytics (va/vaq), blob-storage mp3s.
- Scenes (module 36745): intro-scene (1 px), then 500vh each: delta-drone, swarm-scene, mission-preset, flock-scene, real-time-detection, thermal-irregularity, ignition-verified, phalanx-ai, analysis-evaluation, integrated-notifications, interdrone-coordination, extra-support; zone-stabilized 100vh; multi-threat-response 500vh. Per scene: progress, isActive, showRatio, hideRatio from Lenis scroll.
- Stepper (module 82245): Lenis root {lerp 0.95, syncTouch}. wheel/ArrowUp/Down/touch direction → target = current scene end (or next if ≥0.99); rAF loop moves scroll 2 px/ms (immediate scrollTo) while user velocity low. So each gesture auto-plays one scene (~2.25 s at 900 px tall). Lock via 'lenis-lock-change' counter (menu open).
- Loader: OffscreenCanvas worker (chunk 4867) renders loading-delta.glb (#2d302e) ; LoadingStatus labels Initializing 0.18 / Loading assets 0.52 / Calibrating 0.84 / Ready 1 / Slow connection. Timeouts 12 s (degraded), 20 s force, 3 s hide. BootSplash radial #0d1014→#06070a→#000.
- Keyboard easter egg at hero (delta-drone progress<0.001): ←/A, →/D move drone laterally (±200 clamp, roll from velocity); ShiftLeft = boost (terrain speed ×6) + sound. Sound = 4 looping mp3 (delta-jet engine 0.54, jet-wind 0.67, wind-left 0.67, wind-right 0.65) via Web Audio, gain eases in 0.05/frame, out 0.18/frame; engine playbackRate 0.85→1.25. AudioContext created on first key. NO other sound.
- Center nav (app_layout k): 10 ticks (Specs, Swarm, Mission, Sync, Detection, Phalanx AI, Sys Analysis, Int Alerts, Coordination, Response); active label width-animates open (Motion 0.5 s); hover opens hovered label; click = #scene-container opacity 0 in 150 ms → lenis.scrollTo(scene end, 0.75 s) → fade in. Touch: drag along ticks, release to jump.
- Headings: Motion initial {opacity 0, y 8, color #FF2200} → {1, 0, #FFFFFF}; exit to y -8, #FF2200.
- Specs callouts: drei Html (transform false) pinned to drone points; SVG line pathLength draw 0.8 s ease [0.33,1,0.68,1] when delta-drone>0.9 && swarm<0.01; staggered.
- Telemetry log lines (BOOT SEQUENCE…, THERMAL / LIDAR / RGB / IR [ONLINE] …) keyed to scene progress.
- LandingSequence: 96 AVIF frames on a shader plane, 2-frame crossfade (uRatio), progress-remapped.
- Menu: sheet bg-black/70 backdrop-blur-xl, links Delta, Phalanx AI, SARA, Athena, About Us (+Notes external).
- 20:16 run 02-journey-a starting
- Awwwards (logs/awwwards-page.txt via Playwright request): SOTD Sep 9 2026, basement studio (PRO). Score 7.41 (Design 7.38, Usability 7.03, Creativity 8, Content 7.47). Dev award block 7.74 (Semantics/SEO 8.00, Animations 8.20, Accessibility 7.00, WPO 7.60, Responsive 7.60, Markup 7.80). Tags: Startups, Storytelling, 3D, WebGL, Next.js. Palette listed #000 / #fff.
- Journey A clips are 20–95 MB each at CRF 16 (terrain texture moves every frame) and encode ~1 min each → later runs set crf: 20.
- audio.sh done (logs/audio-probe.md). 4 mono 48 kHz MP3 ~325 kbps. delta-jet 3.27 s broadband rumble <300 Hz, dense to 1.2 kHz, no tonal whine; jet-wind 12.13 s rumble <100 Hz + resonant band sweeping 300–700 Hz (gusts ~0.6 s and ~9 s); wind-left 3.54 s one gust band 400→800→400 Hz; wind-right 3.92 s brighter gust ~900 Hz–1.3 kHz. Mono, no panner in code: left/right differ by timbre only.
  Loop check (scratchpad loop.js): no leading silence; env autocorr r≤0.31 (no internal repeat) → period = file length. Seam: jet-wind RMS 0.097 start vs 0.034 end (~9 dB step); wind-right sample jump 0.173 (likely click); gusts swell mid-file (RMS 0.31/0.68 vs 0.1 at ends) → held key pulses every 3.5/3.9 s.
- Loader wipe: worker Efx shader uHideRatio 0→1 over 0.75 s, screen uv rotated 225° (diagonal). Loader silhouette in the same pose as hero drone = match cut. Ready timeline (journey A): FCP 324, Loading assets 1194, Calibrating 2384, Ready 3795, nav fade 4094–4695, unlock y=1 + H1 4595–4995, CTA 4995–5395 ms. LCP 4608 (H1).
- 20:36 run 02-journey-a finished (run-2026-09-27T12-18-36-985Z, ~20 min, encodes dominate). run 03-journey-b starting
- 20:42 run 03-journey-b finished. run 06-reshoot starting (journey A clips over the frame limit, with in-page rAF recorder)
- Journey A clip stats (run-…12-18-36-985Z): terrain transitions over the limit (11 p95 48, 14 p95 54, 16 p95 64, 20 p95 111, 22 p95 71, 24 p95 118, 39 p95 34; 05 cold load p95 25.8; hovers 10/19 and sweeps 13/18 p95 33–49). Map scenes clean. → 06-reshoot.js with in-page rAF recorder (probe-raf-reshoot.json).
- Journey B (run-…12-38-26-656Z): all clips ok except 61 post-film sequence (p95 33.8) → 07-post-film-reshoot.js. Fast burst 3000 px/0.6 s = one scene; back-up gesture = one scene. /delta = info overlay (html.info-open, home canvases 0×0, 4th canvas 843×844 turntable); logo back → same scroll, no loader.
- Sweeps: no 3D hotspots anywhere (all canvas, cursor auto). Nav ticks cursor pointer. Menu li cursor auto.
- README §2–9 and §11 drafted; §1, §10 and mobile type pending.
- 06-reshoot gotcha: startRaf re-arms window.__fiOn, so earlier rAF loops resume and all push into __fi → frame COUNTS (frames, over25, over50) are inflated by the number of live loops; median/p95/max are still true per-frame intervals. Report over25 as a fraction of frames.
- Reshoot first results: 71 cold-load capture p95 23.2 (page rAF p95 17.8, max 2300 ms = the loader→film handoff hitch), 72 hover p95 18.7, 73 click-to-specs p95 23.0 (page p95 17.9). → journey A's bad stats were capture contention, not the site.
- 20:50 run 06-reshoot finished (run-…12-45-56-306Z). run 07-post-film-reshoot starting
- 07-post-film-reshoot (run-…12-55-18-392Z): 85 capture 31 fps / p95 67.6 but page rAF p95 17.5 (one 417 ms hitch) → the post-film DOM section is static between scroll strokes, so the screencast emits few frames (not contention). Same explains 61 (p95 33.8). Kept 61, deleted 85 as redundant. 86-landing-sequence-slow ok (p95 22.1; ends at y 61854 = sequence start, not the footer). Renamed still 87-footer-landed.png → 87-autonomy-in-real-operations.png (run log still lists the old name).
- Superseded & deleted (journey A / recon): 01, 05, 10, 11, 13, 14, 16, 18, 19, 20, 22, 24, 35, 37, 39 (mp4 + sheet); replaced by reshoot 71–84. Their run logs keep their names because they still hold the kept clips (07/08/26/28/30/31/33/41), stills, sweeps, audio events and the network list.
- 20:56 run 04-mobile starting
- 21:01 run 04-mobile finished (run-…12-57-19-006Z; 88 cold load p95 29.9 = page load hitch, median 16.7; 108 post-film 37 fps capture = static page, median 16.7 p95 21.1). run 05-reduced-motion starting
- 21:04 run 05-reduced-motion (run-…13-02-45-182Z): matchMedia reduce true, nothing changes (113 sheet). 111 p95 61.8 and 115 p95 50.6 over the limit → rerunning 05 once; keep the passing clip of each pair
- 21:08 05 rerun (run-…13-07-03-061Z): 117 p95 23.3, 119 p95 17.5, 121 p95 18.1, all ok. First RM run (111–116) deleted, log renamed superseded-run-…13-02-45-182Z.json.
- 21:09 README complete (§1–11 + media index). Wall clock ~62 min from 20:07; 0 compactions. Capture was ~45 min of it, mostly x264 "slow" encodes of CRF-16 terrain clips and waiting for slots.
- Helpers I wished capture.js had: (1) an h.raf(name) wrapper that records the page's own rAF intervals alongside each clip's capture stats (tells contention from site jank); (2) scene-aware capture for 'static page' clips (the screencast emits no frames when nothing changes, which fails the p95 rule falsely); (3) a per-scenario encoder preset option (preset slow at CRF 16 made 20–95 MB clips and ~1 min encodes each on busy terrain).
