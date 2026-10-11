# Pilot log — Case study Edolus

Written as the run goes. Times are local wall clock (2026-09-27).

## Phases

| Phase | Start | End | Minutes | Notes |
|---|---|---|---|---|
| Reading brief (ticket, FORMAT, capture-setup, capture.js, map Notes, smoke log) | 18:44 | 18:45 | ~1 | smoke `run-*.json` network list was the most useful single read: it already names PlayCanvas, GSAP 3.12.5, fonts and all 15 .ogg files |
| Preflight | 18:45 | 18:45 | <1 | ffmpeg/ffprobe in /opt/homebrew/bin; headless shell 1217 + 1243 present; Playwright 1.59.1 |
| Chrome look | 18:45 | 18:47 | ~2.5 | cut short: the tab was `visibilityState: "hidden"` with rAF at 0 fps (see "Claude in Chrome vs headless") |
| Recon run + probes | 18:47 | 18:50 | 3 | stills + JSON probes (DOM overlay, runtime globals, PlayCanvas scene/sound slots, resource timing); no clips |
| Reading the site's own JS | 18:49 | 18:52 | 3 | fetched `__game-scripts.js` etc. with Playwright `request`, pretty-printed with the repo's esbuild; the manager scripts answered scroll, sound, cursor and adaptive-DPR questions outright |
| First journey run (superseded) | 18:52 | 18:55 | 3 | wheel deltas arrived halved (dsf 2) → every progress target landed ~half way; media deleted, run log kept as `superseded-run-*.json` |
| Fixes + chip hotspot research | 18:55 | 18:58 | 3 | `wheel-test.js`, `wheelScale`, `h.sweep`; read `satelliteLabel` + `dataScan` sources after Janriz's note |
| Journey A v2 | 18:58 | 19:01 | 3 | 25 clips/stills, all progress targets exact (0.06, 0.145, 0.205, 0.33, 0.44, 0.52) |
| Journey B | 19:03 | 19:05 | 2.5 | quantum → UI → car → credits → fast scroll → replay; 200 ms sound sampler across the second half |
| Sound analysis | 19:05 | 19:10 | 5 | `audio.sh` (4 s for 15 files), spectrograms of the 3 stems and 4 SFX, an envelope autocorrelation (ffmpeg → f32 → node) to find the 30.58 s phrase repeat |
| Mobile run | 19:10 | 19:12 | 1.5 | iPhone 13 preset, touch swipes via `h.scroll` chunks (≤ 350 px each); all progress targets reached |
| Reduced-motion run | 19:12 | 19:14 | 1 | emulation confirmed (`matchMedia` true); output identical to desktop |
| Window re-shoots | 19:14 | 19:16 | 1.5 | the card hover and the pointer ripple, which journey B had shot outside their progress windows |
| Awwwards + readiness timing | 19:16 | 19:18 | 2 | headless page read (no cookie click); CTA-ready time measured twice (8.8 s / 8.9 s) |
| Concurrency test | 19:18 | 19:23 | 5 | solo, par2, par3, plus a par3 rerun for variance |
| Text map + README draft | 19:23 | 19:31 | 8 | `07-text-map.js` (DOM vs WebGL text); README sections 1–11 |
| Type & colour pass (coordinator request) | 19:31 | 19:37 | 6 | `08-type-colour.js` desktop + mobile, WebGL colour attributes, Fontshare licence check, eyedropped patches; §9 rewritten |
| Pilot log + hand-off | 19:37 | 19:42 | 5 | |

**Total: ~58 min wall clock**, 18:44–19:42. Capture runs took ~17 min of that; reading code and media, and writing, took the rest.

## Capture runs

| # | Scenario | Purpose | Redo? | Why |
|---|---|---|---|---|
| 1 | `01-recon.js` | landing still, click "Initiate system", 4 timed stills, 2 wheel scrolls; DOM/runtime/perf probes | no | 37 s wall. Gave the whole architecture: PlayCanvas 2.21.4 app, 15-slot sound component, 7 scene roots |
| 2 | `02-journey-a.js` v1 | desktop journey to the chip, per-scene clips, 200 ms sound sampler | **yes** | progress landed at ~50 % of each target: Chrome delivers wheel `deltaY / dsf` to JS listeners at dsf 2 (proved with `research/capture/wheel-test.js`). Also missed the satellite chip hotspot: its DOM ring only exists inside a progress window I had not reached (Janriz spotted the miss in clip 14) |
| 3 | `02-journey-a.js` v2 | same journey + `wheelScale: 2`, chip-window stop at 0.06, 6×4 hover sweep over the satellite body, chip hover/click/leave clips, rack drag, map sweep | no | 3 min wall. Sweep hit `.slabel`/`.sl-ring*` on 8 of 24 points; AICHIP.ogg fired 3× during the sweep and once on the deliberate hover. The frame crop (`logs/18-chip-hover-detail.png`) showed what the hover reveals |
| 4 | `03-journey-b.js` | second half of the film from a fast-forward to 0.52; UI card sweep; car ripple; credits; fast back-and-forth; replay | partly (see 7) | 2 min 17 s wall. Two clips (`39`/`42`) have content swapped relative to their names because 0.61 is the intelligence layer and 0.68 the card row. `45-car-pointer-ripple` was shot at 0.74, **outside** the ripple's 0.77–0.98 window |
| 5 | `04-mobile.js` | iPhone 13: cold load, tap, swipes to every stop, chip tap | no | 1 min 28 s. The intro swipe overshot to 0.31 (the gate had already opened), then `swipeTo` corrected back to 0.06 |
| 6 | `05-reduced-motion.js` | desktop + `reducedMotion: "reduce"` | no | 52 s. Identical to desktop |
| 7 | `06-windows.js` | card hover sweep at 0.68 and pointer ripple at 0.8, inside their windows | — (the redo of 4's misses) | 1 min 15 s. Found by reading the `activeStart`/`hoverStart` attributes in `probe-scene-configs.json` *after* the fact |
| 8 | `07-text-map.js` | DOM vs WebGL text at 14 stops, no media | no | 57 s |
| 9 | `08-type-colour.js` ×2 | computed type/colour at 13 stops, desktop and `MOBILE=1` | no | 59 s + 1 min 34 s. Added for the coordinator's §9 request |
| — | `research/concurrency-test/landing.js` ×9 | solo, par2 ×2, par3 ×3, par3 rerun ×3 | rerun of par3 | par3's first result was mixed (two copies near 53 fps, one at 33), so I ran it again: uniformly ~30 fps. See `research/concurrency-test/README.md` |

## Changes to capture.js / audio.sh

1. **AUDIO_HOOK: tag XHR ArrayBuffers on `xhr.response` read** (getter wrap). PlayCanvas decodes inside `onreadystatechange`, before the hook's `load` listener, so play events said `arraybuffer 890451 B` instead of a URL. Byte sizes could be matched by hand, but the next engine might not be so easy.
2. **Stills grid per run** (`logs/shots-<stamp>.jpg`, 480 px cells, 3 columns). One Read of a ~150 KB JPEG instead of N full 2880×1800 PNGs. This ffmpeg has no `drawtext`, so cells are unlabelled; order = the `shot` lines printed.
3. **`wheelScale` option** (default 1, no behaviour change). At dsf 2 Chrome hands wheel listeners half the delta while native scroll moves the full amount (`wheel-test.js`: sent 1000 → `deltaSum` 500, `scrollY` 1000). Virtual-scroll sites (Edolus, anything on Lenis or a custom wheel handler) need `wheelScale: 2`.
4. **`h.sweep(box, {cols, rows, pause, name})`**: serpentine hover grid over a 3D object; logs element, computed cursor and deepest `:hover` element per point into `log.sweeps`; audio events during it are labelled `sweep <name>`. Added after Janriz found the satellite-chip hover I missed.
5. **`log.wallSeconds`** in the run log (launch → log written). Needed to tabulate the concurrency test without wrapping every run in `time`. audio.sh: unchanged, and it worked first time.

## Gotchas

### Site-specific (Edolus)

- The page never scrolls: wheel is `preventDefault`ed and turned into one normalized 0→1 "progress" over 7 scene roots (32 000 px × 1.225 stretch = 39 200 px of wheel for the whole film). Aim scenarios at progress values (read `SceneManager.SEGMENTS`, `scrollManager.snapPoints`), not pixels.
- Snap points (0.06, 0.145, 0.205, 0.44, 0.52, 0.61, 1; ±0.014, after 1 s idle) pull the timeline, so a target just off a snap point drifts onto it.
- The CTA gate: nothing scrolls until "Initiate system" is clicked; then a 1200 px intro gate flies the satellite in before the timeline moves.
- Hotspots are DOM elements projected from 3D anchors and only exist inside a progress window (`.slabel` for the satellite chip). They are `display:none` outside it, so a `.filter({visible:true})` locator finds nothing if you are at the wrong progress.
- Effects have **progress windows** in their script attributes (`activeStart`/`activeEnd`, `hoverStart`/`hoverEnd`, `winStart`/`winEnd`, `fadeOutStart`). Journey B shot the pointer ripple at 0.74, just before its 0.77 start, and the clip shows nothing. Read every script's window from a config probe *before* planning the stops.
- Scene copy is mostly real DOM text, but it is built and removed per window, so a DOM probe at one stop sees only that stop's text. `07-text-map.js` walks the stops.
- The Earth is a looping video texture, so its colours have no declared value and must be eyedropped. Everything else in the WebGL palette is in colour-typed script attributes, so read those rather than eyedropping.
- Touch has no `mouseleave`: on mobile a swipe that starts on the chip label leaves the hover state (and the AICHIP loop) on.

### Any site

- **Wheel deltas are halved at dsf 2** for JS wheel listeners (see change 3). Any smooth/virtual-scroll site will under-scroll by half without `wheelScale: 2`. Check with a progress/scroll probe after the first scroll clip.
- **Reading the site's own bundle beats guessing.** Fetch the JS with Playwright `request` (or `page.evaluate(fetch)`) into `logs/src/`, pretty-print with `node_modules/.bin/esbuild <in> --outfile=<out>`, then grep for `addEventListener("mouseenter"`, `EventBus`, `play(`, `matchMedia`, `reduced-motion`. Never print lines of a minified file: one line can be 1 MB (one accidental print of a 978 KB line was among the costliest reads of the pilot).
- Chrome-extension `javascript_tool` output truncates at a few KB; do structural dumps in Playwright into JSON files.
- **LCP is meaningless on a canvas site.** Chrome picked a hidden DOM `<div>` (7.9 s). Measure "time until the first real action is possible" with a poll instead (`ready.js`-style: poll the CTA's computed opacity every 100 ms from `goto(commit)`).
- **Touch virtual scroll works with `Input.synthesizeScrollGesture`** (what `h.scroll` does on the mobile preset), but split long distances into ≤ 350 px strokes. One stroke starts at 60 % height, and a longer one runs the finger off-screen.
- **Colour-typed script or uniform attributes are a free, exact palette** for WebGL scenes (PlayCanvas `__attributes`; for Three.js, walk materials' `.color`/`.emissive` and uniform values). Eyedrop only video or baked textures.
- Several scripts each inject their own Google Fonts `<link>`: 5 requests for one family. Count font requests by family rather than by URL.
- zsh: an unmatched glob aborts the whole command (`rm *.x` with no match), and a leading `=` in `echo =====` is expanded. Use `find … | xargs` and quote.

## Lesson: the satellite-chip hotspot (missed in v1, found by Janriz)

- **What I missed:** at progress 0.06 (a snap point) a DOM ring (`.slabel`, 80 px) sits on the satellite's chip, projected from a 3D anchor every frame, with "AI CHIP / Autonomous Inference Core" beside it at 50 % opacity. Hovering it grows the ring to 120 px and turns it white, brings the text to full opacity, and starts a looping `AICHIP.ogg` at volume 0.1. Separately, a **cursor x-ray** (`dataScan`: a screen-space circular mask that follows the pointer, grows with pointer speed, lingers 0.7 s and closes over 0.9 s after the pointer stops) turns the hull almost transparent (front faces 8 % alpha, back faces 20 %) and shows the blue internal frame and a glowing gold chip. Over the ring the two line up, so the ring reads like a scope.
- **Why v1 missed it:** (1) the ring only exists in a narrow progress window (0.045–0.075); v1 sat at 0.02 because of the halved wheel deltas, so `.slabel` was `display:none`; (2) v1 hovered one path across empty space next to the satellite, never over the hull; (3) I had read `satelliteLabel`'s `mouseenter` in the bundle but did not follow it to *where and when* the element is on screen.
- **Rule for the parallel five:** for every 3D object that looks interactive, (a) stop the scroll where the object is in its "hero" pose (a snap point, a pinned section), (b) run `h.sweep()` over the object's screen box inside a clip, (c) grep the bundle for `mouseenter|pointerenter|mousedown|raycast|screenToWorld|cursor` and list each hotspot's element and its visibility window, (d) crop a frame grid around anything the sweep or grep turns up. A sweep takes ~20 s of clip for 24 points.

## Claude in Chrome vs headless

**Chrome showed nothing the headless run could not, and could not show motion at all in this session.**

- Both extension tabs I used reported `document.visibilityState === "hidden"`, `document.hasFocus() === false`, and a 2 s requestAnimationFrame probe counted **0 frames** (probe timed out). Janriz's Chrome window was not frontmost (another app covered it, or it sat on another Space), and macOS occlusion makes Chrome treat the tab as hidden.
- Consequence: the page only advanced when the extension took a screenshot (CDP capture forces a frame). The loader read 28 % → 81 % → 100 % across three screenshots about 20 s apart and then **stayed on "100 %" forever**: its reveal is rAF/GSAP-driven, so it never ran. The DOM already held the landing copy ("INTELLIGENCE AT PLANETARY SCALE", "EXPERIENCE WITH HEADPHONES", "AUDIO") behind the splash.
- The smoke test's extension screenshot (capture-setup §1) did show the Earth hero, so the window was presumably frontmost then. It depends on what Janriz has in front, which an AFK agent cannot control. Bringing Chrome forward would need computer-use `request_access` (a blocking approval dialog) and would steal focus from Janriz, so I did not.
- `javascript_tool` output is truncated at a few KB (a DOM walk got cut at ~25 lines), so structural dumps belong in Playwright, where they go to a file.
- Tab-group quirk: I closed the blank tab that `tabs_context_mcp {createIfEmpty}` had made, while my Edolus tab was still in the group. The tool said "1 tab remains", but the next call reported **no tab group**, and the Edolus tab (id 1837183947) could no longer be closed ("not in Claude's tab group"). **It may still be open in Janriz's Chrome** (muted: no gesture ever reached it). Lesson: never close the group's seed tab first; navigate the seed tab instead of creating a second one.
- Verdict for the parallel five: **do not use Chrome.** Five agents sharing one window would get at most one visible tab, and here even that one was hidden. Headless + `--enable-gpu` is the fidelity reference now (capture-setup §2 already showed it matches real Chrome).

## Skipped or not verified

- **No real phone.** Mobile is the iPhone 13 emulation preset in headless Chromium (touch events, dsf 3). iOS Safari's WebGL and audio unlock behaviour are untested.
- **Four SFX spectrograms not viewed** (`diamond2`, `intelligent`, `UIscreen`, `textrack`). Their PNGs are in `audio/`, and §8 describes them from `audio-probe.md` stats (duration, loudness, crest) and their triggers.
- **No throttled-network or low-end-GPU run.** The degradation notes in §10 come from the code (DPR cap, shader octaves, mobile flags), not from a slow device.
- **Sound was never heard.** All sound findings come from the files, the engine hook and the mix sampler. The questions at the end of §8 cover what only listening can answer.

## Context cost

- The token counter moved from 15.0 M to ~14.4 M left, so about **0.6 M tokens** went through this run, and it **ran out of context twice** (once mid-run, once during the final pilot-log write-up).
- **What cost the most:**
  1. One 978 KB minified line printed by accident (see Gotchas).
  2. ~40 image reads: contact sheets, spectrograms, stills grids, crops. Each is roughly 1.5–2 k tokens.
  3. Long JSON probe dumps printed before I learned to summarise them in `node -e`.
- **What was cheap and high-value:**
  - `grep`/`sed -n` on the esbuild-pretty bundle, with line anchors noted once.
  - `node -e` one-liners that reduce a probe to a table.
  - The per-run stills grid: one read instead of 10–20.
- **Advice for the five:**
  - Never `cat` a probe; summarise it with `node -e`.
  - Read at most one contact sheet per scene transition, plus the stills grid per run.
  - Read spectrograms only for stems and the 3–5 SFX that matter; for the rest, use `audio-probe.md` crest/duration.
  - Write the README progressively, section by section, rather than at the end.
  - Expect one or two compactions for a site of this size, and keep the pilot log current so nothing is lost.

## Brief delta (draft)

Changes I would make to the brief for the parallel five:

1. **Preflight a scroll probe.** After the first scroll clip, check the site's progress/scroll value against what you sent. If it moved half as far, set `wheelScale: 2` (any virtual- or smooth-scroll site at dsf 2).
2. **Map effect windows before planning stops.** Dump every script's or ScrollTrigger's start/end, window and snap attributes into a config probe, pick stops at the hero poses (snap points, pinned sections) *inside* each window, and name clips after the content at that progress, not the intended scene.
3. **Sweep rule (from the missed satellite chip).** For every 3D object that looks interactive:
   - stop at its hero pose
   - run `h.sweep()` over its screen box inside a clip
   - grep the bundle for `mouseenter|pointerenter|mousedown|click|raycast|screenToWorld|cursor` and list each hotspot with its element, trigger and visibility window
   - crop a frame grid of anything the sweep or grep finds

   A single hover path across a 3D object misses hotspot-bound reveals.
4. **Read the site's own JS early.** Fetch it with Playwright `request` into `logs/src/`, pretty-print with the repo's `node_modules/.bin/esbuild`, and grep. Never print a line of a minified file.
5. **Sound method:**
   - Hook the engine (`audioEvents`).
   - Run a 200 ms `page.evaluate` sampler of the mix (volumes, playing SFX, pitch) across the journey.
   - Run `audio.sh`.
   - Check loops for repeats with an envelope autocorrelation.

   Describe the mix design (tracks vs stems vs a mix table), not just the files. End §8 with "Questions for Janriz".
6. **§9 needs exact values.**
   - Run a type/colour probe (computed styles per text role at every stop, desktop and mobile), plus a font-request list with the licence of each family (for a paid one, give the nearest free alternative).
   - Read WebGL colours from declared attributes or uniforms, and eyedrop only videos and baked textures, labelled.
   - `08-type-colour.js` is a template.
7. **Measure "time to first action" by polling, not LCP**, on canvas sites. Also list which text is DOM and which is canvas at each stop (`07-text-map.js` is a template).
8. **Mobile and reduced motion are their own runs** (`mobile: true`, `reducedMotion: "reduce"`). On mobile, split swipes into ≤ 350 px strokes and verify progress after each stop.
9. **Do not use Claude in Chrome.** In this session the tab was hidden (rAF 0), and five agents would fight over one window. Headless GPU is the reference.
10. **Concurrency: at most 2 capture runs at once** on this machine (`research/concurrency-test/README.md`). Reading, writing and analysis can run in parallel; capture should take a turn.
11. Use the stills grid (`logs/shots-<stamp>.jpg`) as the first look at each run. Write the pilot log as you go, and write the README section by section.
12. Housekeeping: every scenario writes into its own case-study folder (`out: ".."`), and superseded media are deleted with their run log renamed `superseded-*`. In zsh, avoid bare globs in `rm`.
