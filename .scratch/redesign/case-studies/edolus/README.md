# Case study: Edolus

Captured 2026-09-27 with headless Playwright (Apple M5, ANGLE Metal, 60 fps) through `research/capture/capture.js`. Evidence lives here:

- `screenshots/` — stills at 1440×900 @2x. Mobile stills use the iPhone 13 preset (390×664 @3x).
- `motion/` — MP4 clips, each with a `.sheet.png` contact sheet.
- `audio/` — the 15 .ogg files plus their spectrograms and waveforms.
- `logs/` — run logs, JSON probes, and the site's own JS in `logs/src/`.
- `scenarios/` — the scripts that drove every run.

Numbers such as `12-intro-flyin` refer to those files. **Measured** means read from the page, runtime, network or files. **Inferred** means my reading of what I saw. I cannot hear, so everything about sound comes from code, runtime sampling and spectrograms.

## 1. At a glance

| | |
|---|---|
| URL | https://edolus.com/ |
| Awwwards | https://www.awwwards.com/sites/edolus. **Honorable Mention**, Aug 9 2026. 15 of 17 community votes are shown, with totals from 5.60 to 10.00 (plain mean 8.70, my arithmetic). No jury score or SOTD. Source: `logs/awwwards-page.txt` |
| Studio | **Vertex3D** (vertex3d.asia). Awwwards credits **Yann Trevelot**, whose avatar is the Vertex3D "V", and its blurb ends with "Engineered by Vertex3D". The ending credits link to vertex3d.asia and studio@vertex3d.asia |
| Awwwards tags | Music & Sound, Technology, Experimental, Animation, Storytelling, 3D, Interaction Design, WebGL, GSAP, GLSL. Its "Elements" list: Planetary Network, Primary Compute Node, AI Data Center, Orbital Intelligence and Quantum Intelligence (all *Mouse Interaction*), plus Autonomous Systems (*Scroll*) |

**Gist.** Edolus is a fictional AI-infrastructure brand that Vertex3D built as a studio showcase. The ending admits it: "Edolus never existed. / The experience did. / Now imagine your own."

The page is one full-window PlayCanvas WebGL scene with an HTML overlay on top. After an "Initiate system" click, the wheel scrubs a single one-take film in seven scenes:

1. a satellite in orbit
2. a dive through the clouds to a city map
3. a data centre, then one rack, then one chip
4. a "quantum" burst
5. a UI-card "intelligence layer"
6. a car, first from the cockpit and then in a studio
7. the credits

Three music stems play in sync the whole way. Their volumes are re-mixed per scene, and short sound effects mark each beat.

**Most memorable thing.** The satellite's "AI CHIP" hotspot. A real-HTML ring and label ride on a 3D point on the hull. Moving the pointer over the satellite opens a soft-edged **x-ray** that follows the cursor and shows the blue internal frame and a glowing gold chip inside. Hovering the ring grows it, lights its label, and starts a quiet data-chirp loop (`19-satellite-chip-revealed.png`, `18-satellite-chip-hover.mp4`, `17-satellite-hover-sweep.mp4`).

## 2. Tech found

| What | Detail | How detected |
|---|---|---|
| Engine | **PlayCanvas 2.21.4**, an editor export: `playcanvas-stable.min.js`, `__game-scripts.js`, `__settings__.js`, `__start__.js`, `__loading__.js`, `config.json`, `__modules__.js` | `pc.version` via `page.evaluate`; network log (`logs/run-*.json`); file names |
| Render approach | **One** full-window WebGL2 canvas (`#application-canvas`, 2880×1800 at DPR 2, fill-mode FILL_WINDOW) with HTML overlays for text and UI. No other canvases | DOM probe (`probe-dom-*.json`, `canvases`); `app.graphicsDevice` in the runtime probe |
| Animation (DOM) | **GSAP 3.12.5** from cdnjs. It tweens overlay fades, the audio envelope and the cursor ring; the 3D is driven by PlayCanvas `update()` loops | `gsap.version`; the network URL; `gsap.to(` calls in the pretty-printed bundle (`logs/src/game-scripts.pretty.js`) |
| Glue | A custom global `EventBus` (`scroll:progress`, `audio:*`, `experience:entered`) and a `TextScramble` global | `window` globals in the runtime probe; the bundle |
| Scene scripts | ~70 `pc.createScript` scripts. Managers: `sceneManager`, `scrollManager`, `transitionManager`, `audioManager`, `cursorManager`, `postFXManager`, `optimizeRetina`. Per-scene scripts include `videoEarth`, `mouseParallax`, `haloSatellite`, `satelliteLabel`, `dataScan`, `textSatellite`, `diamondLabel`, `sceneText`, `worldText`, `hudText`, `rotateObject`, `lightShot`, `cardHover`, `pointerRipple`, `endingCredits`, and the shaders `Aurora`, `Nebula`/`Nebula2`, `Plexus`, `DustLight`, `Matrix` | runtime probe (`app.root` scripts); the bundle |
| Post-processing | `FilmGrainEffect` on the main camera, plus `bloom`, `bokeh` and `chromaticTransition`/`cubesTransition`/`cloudTransition` scripts | the scene-configs probe (`probe-scene-configs.json`); the bundle |
| 3D assets | 12 GLBs, 22.4 MB in total. The largest are `ComputeTrayJOINED.glb` 7.3 MB, `Tesla-ready2.glb` 7.2 MB, `StarlinkV2-1.glb` 3.6 MB, `GDX-3PODS-F2.glb` 1.5 MB and `DiamondV4.glb` 1.4 MB. Textures: 17 Basis (3.6 MB) with a Basis transcoder WASM (0.3 MB), 11 WebP (2.9 MB) and 14 PNG (4.1 MB, incl. 6 General Sans MSDF atlases) | network log; resource timing (`probe-perf-cold.json`) |
| Video | Two muted, looping 1920×1080 `<video>` elements used as textures: `Space-compressNOAUDIO-YTfullHD.mp4` (20 s, 5.9 MB, the Earth behind the satellite, via the `videoEarth` script and `requestVideoFrameCallback`) and `Seedance2-0_r2v_00002YTHD_lowbitrate.mp4` (10.6 s, 5.6 MB) | DOM probe `videos`; the bundle. *Inferred:* the second video is the road footage in the car scene, and its file name suggests it was generated with the Seedance 2.0 video model |
| Fonts | **General Sans** (Indian Type Foundry; Fontshare CDN; free under the ITF Free Font License; 300/400/500/700 loaded) for display, headings and credits. **JetBrains Mono** (Google Fonts, OFL; 400/500/800 loaded) for HUD labels, body and the 3D titles. Canvas titles are drawn with Canvas2D in these same web fonts. Six General Sans MSDF font assets are downloaded but no text element uses them. Details in §9 | network log (`api.fontshare.com`, `fonts.googleapis.com`); `document.fonts`; `app.assets` font assets vs `element.fontAsset`; `fillText` in `textSatellite`/`worldText` |
| Sound | PlayCanvas sound component with 15 slots, 15 Vorbis `.ogg` files. No Howler or Tone | runtime probe `sounds`; capture.js audio hook (`audioEvents`) |
| Framework | None. A static PlayCanvas export with a hand-written `index.html` and `styles.css` | `index.html` in `logs/src/`; no framework globals |
| Analytics | Cloudflare Web Analytics beacon | network log |
| Meta | `<meta viewport>` sets `user-scalable=no, maximum-scale=1`, `<html lang="">` is empty, and there is no meta description | DOM probe `meta` |

## 3. Intro & loading

- **Loader (measured).** First paint at ~0.5 s (a black screen with a small %). The "EDOLUS" wordmark types in, and a percentage counts up below it (`08-cold-load`).
  - The whole 48 MB payload is fetched first: 94 resources, the same count at load and at the end of the film.
  - Then comes a **shader and scene warm-up**. `__sceneWarmup` walks the camera through 2 points of every scene segment for 3 frames each, with frustum culling off, then settles for 2.5 s. The loader % includes this warm-up.
  - A blue horizontal lens-flare line sweeps across the wordmark. Then the Earth hero fades in, the wordmark moves to the top, and the title "INTELLIGENCE / AT PLANETARY SCALE" assembles letter by letter (per-letter spans that scramble in).
- **Time until you can act (measured on two cold loads by polling the CTA's computed opacity every 100 ms from navigation; the poll script was not kept).**
  - Warm-up ran from 1.7–1.8 s to 5.3–5.5 s after navigation.
  - The **"Initiate system" button was fully visible at 8.8 s and 8.9 s**.
- **Skippable?** No. There is no skip, and nothing responds until the loader finishes.
- **Second gate.** Before "Initiate system" is clicked, scrolling is **locked** (`scrollManager._gate = "locked"`). The click:
  - starts the music (§8)
  - plays a click and a text-scramble sound
  - fades out the landing copy while the camera pushes towards Earth
  - scrambles in "ORBITAL INTELLIGENCE"
  - flies the satellite into frame over ~6 s (`10-initiate`)

  The gate then sits in **"hold"**: the first ~1200 px of wheel (`introScrollPx`) feed the fly-in rather than the timeline (`12-intro-flyin`). It opens fully after that, or when `experience:entered` fires ~6.5 s after the click.
- A hint "SCROLL TO BEGIN ↓" (scrambled text, JetBrains Mono) follows the cursor at progress 0–0.02, appearing after a 1.2 s delay.

## 4. Navigation & page transitions

- **A single page with no routes.** The only navigation is the film. The persistent chrome is:
  - the "EDOLUS" SVG wordmark at the top centre (`#pc-overlay-logo`). Its "O" spins and glitches during scene changes; in contact sheets it reads "ED LUS" or "ED`LUS" mid-transition.
  - the "AUDIO" toggle at the top right, a bars icon plus a label.
- **Scene changes** are scroll-scrubbed, not time-based. `sceneManager` enables and disables each scene root around its segment. `transitionManager` drives a DOM `#transition-overlay` with GSAP (fade, wipe up/down, slices), and the WebGL transition scripts add:
  - an RGB-split streak as the satellite turns edge-on and dives into the clouds (`21-scroll-satellite-to-clouds`)
  - a cloud cross-fade
  - a camera tilt from the map to the horizon, then a cut to the dark data-centre corridor (`26-scroll-map-to-datacenter`)
- **Ending.** Letterbox bands close (`bandsCloseAt` 0.87), the scene blurs and dims, and two lines appear and leave in turn: "Edolus never existed." then "The experience did." The Vertex3D logo, "Now imagine your own." and `[ STUDIO@VERTEX3D.ASIA ]` (a mailto link) follow.
- **Replay.** "REPLAY EXPERIENCE" fades in last. Clicking it plays the click sound, stops the music and returns to the landing at progress 0 (`55-replay`, `56-after-replay.png`).
- **Keyboard.** ArrowUp/ArrowDown/PageUp/PageDown move the progress (`keyStep` 0.12; read from the bundle, not exercised).

## 5. Scroll behaviour

- **Virtual scroll (measured).**
  - The document never scrolls. `wheel` is `preventDefault`ed and turned into one normalized progress from 0 to 1, eased with `lerpSpeed` 0.1.
  - A full run is `totalScrollPx` 32 000 px × a stretch factor of 1.225, which is **~39 200 px of wheel travel** for the film. Touch uses `touchScrollPx` 4000.
  - No scrollbar, no URL state, no deep links.
- **Scenes by progress** (`SceneManager.SEGMENTS`):

  | Scene | Progress |
  |---|---|
  | Satellite | 0–0.14 |
  | DiamondMap (clouds + city map) | 0.14–0.28 |
  | Datacenter (corridor, rack, chip) | 0.28–0.54 |
  | Chip / quantum | 0.54–0.57 |
  | UI | 0.57–0.71 |
  | Car | 0.71–0.85 |
  | Ending | 0.85–1 |

- **Stretch bands** slow the pace where there is something to look at. In each band, more wheel is needed per unit of progress:

  | Band | Progress | Stretch |
  |---|---|---|
  | satellite | 0.06–0.085 | ×1.5 |
  | map | 0.205–0.28 | ×1.6 |
  | chip quantum | 0.545–0.57 | ×2.5 |
  | UI | 0.57–0.705 | ×1.5 |
  | car messages | 0.715–0.84 | ×1.5 |

- **Snap points.** After 1 s idle, the timeline settles onto the nearest snap point within ±0.014. The points are 0.06, 0.145, 0.205, 0.44, 0.52, 0.61 and 1. Each is a "hero pose": the chip label, the primary node, the map, the rack, the EDL-72 chip, the intelligence layer, the credits.
- **Scrubbed vs timed.**
  - Scrubbed: camera paths, scene switches, most reveals, the map tilt, the rack fly-in.
  - Timed, fired once when crossing a threshold: text scrambles and typing ("// COMPUTE_CORE_", then the bullet lists and spec lines typing in with an underscore caret), each paired with a one-shot SFX (§8).
- **Velocity effects.** The quantum loop's pitch follows scroll speed (`quantumScrollPitch` 4, sensitivity 0.5, 0.1 s smoothing); observed 1.00–1.61. A fast scroll crosses many thresholds at once, so their SFX pile up (6 SFX within ~1 s in `54-fast-scroll-back-and-forth`).

## 6. Cursor & micro-interactions

Found by clips, hover sweeps (`h.sweep`: a grid of pointer stops that records the element, cursor and `:hover` target at each), and reading each script's listeners and progress window in the bundle.

- **Satellite "AI CHIP" hotspot** (`satelliteLabel` script, progress window 0.045–0.075 around the 0.06 snap point).
  - A DOM `.slabel` is re-projected every frame from a 3D anchor on the satellite's chip bay: an 80 px ring (1 px white border at 50 %) with "AI CHIP" and "AUTONOMOUS INFERENCE CORE" in JetBrains Mono at 50 % opacity beside it. The text scrambles in on entering the window.
  - **On hover (`mouseenter`):**
    - the ring grows to **120 px** and turns solid white, over 0.4 s `cubic-bezier(.22,.61,.36,1)`
    - the label goes to full opacity
    - `audio:satelliteAichip` starts a looping `AICHIP.ogg` at volume 0.1 with a 0.12 s fade-in, fading out over 0.5 s on leave
  - A **click does nothing more**: there is no click listener, and `20-satellite-chip-click-leave` shows only the hover state.
  - Of the 24 points in the 6×4 sweep over the satellite body, **8 hit the hotspot** (`.slabel`, `.sl-ring-wrap`, `.sl-ring`, `.sl-sub`). `AICHIP.ogg` fired 3× during the sweep.
  - The cursor stays `auto` everywhere: no pointer cursor on the hotspot.
  - Evidence: `16-satellite-chip-window.png`, `17-satellite-hover-sweep.mp4`, `18-satellite-chip-hover.mp4`, `19-satellite-chip-revealed.png`, the crop `logs/18-chip-hover-detail.png`, and `logs/probe-dom-chip-hover.json` (ring 120 px, white, text opacity 1).
  - **Mobile:** the label moves below the ring (`sideMobile`) and a tap triggers the same state and sound (`65-mobile-chip-tapped.png`). Touch never sends `mouseleave`, so the hover state sticks after a swipe that starts on the label: the ring stayed at 120 px in the mobile type probe.
- **Cursor x-ray** (`dataScan`, active until progress 0.07). This is the reveal that pairs with the ring; see §7 for the technique. Its circle follows the pointer, grows with pointer speed, lingers 0.7 s and closes over 0.9 s once the pointer stops. When the pointer sits on the ring, the x-ray circle and the ring line up like a scope.
- **Title dissolve** (`textSatellite`). "ORBITAL INTELLIGENCE" is drawn in WebGL. Near the cursor (radius 0.29 of screen height) it blurs and dissolves, and a 0.1 s trail follows the pointer (`14-satellite-title-pointer`). Off on coarse pointers.
- **Satellite parallax** (`mouseParallax`, max tilt 15°), and a halo flare that dims with the cursor's distance from it (`haloSatellite`).
- **"DRAG TO ROTATE" orbit cursor** (`cursorManager`, progress 0.44–0.466).
  - A 120 px spinning ring with a label replaces the hint cursor, growing in with `back.out` over 0.45 s.
  - Dragging (window mousedown/move/up or touch, `rotateObject`) spins the NVX-72 tray with inertia; it springs back to face the camera (`31-rack-drag-rotate`, `30-rack-nvx72.png`).
- **Cursor light bolts** (`lightShot` "Cursor light", chip and intelligence-layer scenes up to 0.64). Golden lightning filaments shoot from the core towards the pointer: up to 24 bolts, 5 per second (`35-chip-cursor-light`, `40-ui-cards-sweep`).
- **Card hover** (`cardHover`, 0.57–0.74). A raycast from the UI camera brightens the glass card under the pointer (`86-ui-card-row-hover-sweep`, `87-ui-card-row-hovered.png`). No DOM hit targets: all 18 sweep points returned the canvas.
- **Pointer ripple** (`pointerRipple`, 0.77–0.98). A 512² fluid sim leaves a refractive, slightly chromatic water trail behind fast pointer moves over the car and its curved screen, and settles in ~1 s (`88-car-ripple-in-window`, `89-car-ripple-trail.png`, `90-car-ripple-settle`).
  - Journey B's clip `45-car-pointer-ripple` was shot at 0.74, **outside** this window, so it shows only the camera drifting with the pointer.
- **CTA** ("INITIATE SYSTEM"). A white pill with corner-bracket ticks. Hover is subtle at contact-sheet resolution (`09-cta-hover`), and it has a pointer cursor.
- **Email link** in the credits: hover changes only colour or underline (`53-ending-email-hover`).
- **Map scene.** The 4×3 sweep found no hotspot: 12/12 canvas hits, and `diamondLabel` listens only to `mousemove`, for parallax.
- All cursor-follow effects switch off on `(pointer: coarse)` or at widths ≤ 768 px.

## 7. 3D / WebGL

**What is rendered, per scene** (models from the network log; behaviour from clips and scripts):

1. **Satellite.**
   - A Starlink-style satellite model (3.6 MB GLB) over an Earth that is a **looping 1080p video texture**, not a 3D globe.
   - Plexus lines drift around it. A halo flare, film grain and chromatic fringing sit on top.
   - The x-ray reveal (`dataScan`):
     - a screen-space circular mask around the cursor, 0.18 of screen height at rest, growing with pointer speed (`speedToSize` 1.4)
     - an fbm-noise soft edge
     - inside the mask, the hull renders nearly transparent (front faces at 8 % alpha, back faces at 20 %), exposing the blue internal frame and the gold chip
     - a depth-erase layer ("DataScanDepthErase") that punches the hull out of the depth buffer so the interior shows through
     - off by progress 0.07

     *Inferred:* the interior is modelled geometry inside the same GLB, normally hidden behind the opaque hull.
2. **Clouds and city map.**
   - The camera dives into volumetric-looking clouds (`cloudTransition`).
   - A glossy "PRIMARY NODE" diamond-chip icon (1.4 MB GLB) arrives under beams of light filaments.
   - Then a 3D terrain tile (`MAP.glb`) inside a HUD frame "URBAN SYSTEMS", which tilts to the horizon with city lights (`22-clouds-descent.png`, `24-map-urban-systems.png`).
3. **Data centre.**
   - A dark corridor of racks with reflective floor.
   - A pyramid light cone over one rack, with 300 dust motes in the light (`DustLight`) (`27-datacenter-compute-core.png`).
   - The NVX-72 tray (7.3 MB GLB, drag-rotatable), then the EDL-72 chip (`processor.glb`) with spec lines (`30`, `33`/`34`).
4. **Quantum.** A golden light burst around a crystal-like core (`37-quantum.png`).
5. **Intelligence layer.**
   - A nebula/aurora shader panel titled "INTELLIGENCE LAYER" (`39-ui-cards.png`: the file names 39 and 42 are swapped relative to their content).
   - Then a sliding row of glass cards ("KNOWLEDGE TOPOLOGY", "MULTI-AGENT ORCHESTRATION", …) rendered by a separate UI camera (`42`, `87`).
6. **Car.**
   - A cockpit POV (7.2 MB GLB) with road footage outside, and the cards on the centre screen (`44-car.png`).
   - Then the car in a white studio in front of a curved screen playing the road video, with DOM messages over it (`48-car-messages.png`).
7. **Ending.** Letterbox, blur, credits (`50`, `52`).

**Technique summary.**

- **Models:** GLB models throughout, with Basis-compressed textures.
- **Custom GLSL passes:**
  - `Aurora`: fbm, 4 octaves, dropped to 2 on mobile
  - `Nebula` / `Nebula2`
  - `Plexus`
  - `DustLight` particles
  - `Matrix` corridor trail
  - the x-ray mask
  - the fluid-sim ripple
  - light-bolt ribbons
- **Post-processing:** film grain, bloom, bokeh, and chromatic transitions.
- **Adaptive resolution:** the `optimizeRetina` script steps the DPR by 0.25, between 1 and 2, on the median frame time. It keeps a pixel budget of 4.6 MP on desktop and 3 MP on mobile, and remembers the result per screen size in `localStorage`.
- **Text split:** most scene copy is real DOM text projected onto 3D anchors (§9). Only the big scene titles are drawn in WebGL.

## 8. Sound

**Default and toggle.**

- **Before the "Initiate system" click: silent.** The landing only says "Experience with headphones" under a headphones icon.
- **The click is the user gesture.** It unlocks audio, and music is **on by default** from then on.
- **"AUDIO" toggle** (`#pc-overlay-audio`, top right):
  - **OFF:** a master envelope fades to 0 over 1 s (`musicToggleFade`), then the stems pause and every SFX stops. SFX stay blocked while it is off (`_muted()`).
  - **ON:** resume, with a 1 s fade back in.
  - Measured with the 200 ms sampler (`28-audio-toggle-off-on`, `probe-sound-timeline-a.json`).
- **Replay** stops the music. It restarts on the next "Initiate system".

**How the music works (measured from the bundle and the runtime sampler).**

- The three stems start **together** on the click and loop in sync:
  - `bass_stemAUDITION30.ogg`
  - `instruments_stemAUDITION305.ogg`
  - `melody_stem_AUDITION302.ogg`

  Each is 61.2 s long.
- Their volumes are **not crossfaded tracks but a mix table.** Each section of progress sets a target level per stem. Levels ease towards the target exponentially (`stemFadeDur` 1.2 s). A stem envelope fades everything in over 2 s at start.
- Per-frame volume = level × `stemVolume` × `masterVolume` × envelope.
- The section targets (melody / bass / instruments):

  | Section (progress) | Melody | Bass | Instruments | Feel (inferred) |
  |---|---|---|---|---|
  | landing 0–0.01 | 0 | 0 | 1 | pad only |
  | satellite 0.01–0.14 | 0.8 | 0.6 | 1 | full but light |
  | clouds + map 0.14–0.28 | 0.6 | 0 | 1 | bass drops out |
  | data centre 0.28–0.54 | 0.8 | 0 | 0.2 | melody alone, sparse |
  | quantum 0.54–0.62 | 1 | 1 | 1 | everything, the climax |
  | UI cards 0.62–0.71 | 0.5 | 0.6 | 1 | |
  | car 0.71–0.85 | 0.2 | 0 | 0.4 | thin |
  | ending 0.85–0.97 | 0.2 | 0 | 0.2 | |
  | logo 0.97–1 | 0 | 0 | 0 | fades to silence |

  The sampled levels settled on exactly these values at every stop, on desktop and on mobile (`probe-sound-timeline-*.json`).
- **Stem structure (spectrograms, waveforms, and an envelope autocorrelation I ran with ffmpeg + node):**
  - **Each 61.2 s stem is the same 30.6 s phrase played twice.** The best self-similarity lag is 30.58 s for all three, with r = 0.89 (bass), 0.71 (instruments) and 0.96 (melody).
  - None of the stems fades at its start or end, so they are built to loop seamlessly.
  - Onsets recur every ~0.77 s in bass and melody. *Inferred:* ~78 BPM, or 156 at double time.
  - **Bass** (RMS −19.9 dBFS, the loudest stem): dense energy from 20 to 400 Hz with regular vertical striations (a pulsing, rhythmic low end). A faint high tone at ~6–7 kHz drifts downwards at ~5 s and again at ~35.7 s, once per phrase.
  - **Instruments** (RMS −23.6): a sustained chord bed from 60 to 1200 Hz with steady harmonic lines, and a slow filter sweep. The top end opens (0–9 s), closes (12–25 s) and reopens (27–40 s), once per phrase. There is a chord change around 23–24 s.
  - **Melody** (RMS −30.6, the quietest): harmonic lines from 200 to 1500 Hz with bright overtones up to ~15 kHz, and **no energy below ~200 Hz**. It swells at 17–25 s, then goes near-silent from ~25 to 30 s (a −42 dB block) before the phrase restarts. That leaves a breath every 30 s.

**One-shot and loop SFX** (all stereo Vorbis 44.1 kHz; loudness from `logs/audio-probe.md`; triggers from `audioEvents` and the slot config):

| File | Slot / volume | Trigger (progress) | Dur | Peak / RMS dBFS, crest | Spectrogram / waveform read |
|---|---|---|---|---|---|
| `BTNclick2.ogg` | `cta_click` 1.0 | "Initiate system" click, "Replay" click | 0.25 s | −9.4 / −37.3, 27.9 dB | a single transient click |
| `Scrambletext.ogg` | `scramble` 0.8 | each text scramble: Initiate, ~0.115, ~0.193, and on mobile each scene title | 1.32 s | −17.0 / −33.9 | ~16 rapid ticks at ~12/s, all in 2–15 kHz with no low end: digital "letters flipping" |
| `AICHIP.ogg` | `satellite_aichip` 0.1, **loop** | hovering or tapping the AI-chip ring at 0.06 | 1.76 s | −16.6 / −24.4, **7.8 dB** (continuous) | a steady ~4 kHz tone chopped into fast blips, with short falling chirps at 5–8 kHz over a soft 200–1000 Hz noise bed: data chatter |
| `diamond2.ogg` | `ring_pulse` 0.4 | ~0.142 (primary node arrives) | 1.70 s | −13.9 / −34.1, 20.2 dB | transient with a tail (from stats) |
| `map.ogg` | `diamond_end` 1.0 | ~0.201 (the map lands) | 4.49 s | −0.7 / −18.4 | a sub-bass boom (20–300 Hz), no highs, decaying over ~4 s: an impact |
| `computecore2.ogg` | `compute_core` 0.2 | ~0.275 (data centre) | 5.73 s | −3.3 / −31.0, 27.7 dB | irregular bursts of chatter in phrases split by short silences |
| `rack.ogg` | `rack_appear` 0.4 | ~0.413 (tray flies in) | 0.79 s | **+0.4** / −14.2 | a loud, short hit. The file peaks above 0 dBFS; played at 0.4 |
| `textrack.ogg` | `text_rack` 0.5 | ~0.433 (rack bullets type in) | 2.46 s | −11.5 / −36.1, 24.6 dB | bursty; *inferred* one burst per typed line |
| `textchip2.ogg` | `text_chip` 0.5 | ~0.503 (EDL-72 spec lines) | 6.60 s | −6.6 / −34.7, 28.1 dB | 7 bursts of 0.5–0.8 s with gaps, matching the typed spec lines |
| `quantum5.ogg` | `quantum` 1.0, **loop** | 0.545 → fades by ~0.609 | 6.19 s | −3.0 / −17.9 | a sub-heavy pulsing drone (20–150 Hz). Swells at ~1.3, 2.4, 3.3 and 5.3 s add partials up to ~4 kHz. **Pitch follows scroll speed**, measured 1.00–1.61 |
| `intelligent.ogg` | `intelligentlayer` 0.5 | ~0.606 (intelligence layer) | 0.80 s | −4.0 / −19.6 | short accent (from stats) |
| `UIscreen.ogg` | `matrixgrid` 0.4 | ~0.687–0.724 (card row, car screen) | 0.93 s | −3.5 / −17.5 | short accent (from stats) |
| 3 stems | see above | Initiate → end | 61.2 s | bass −5.7/−19.9, instr −10.0/−23.6, melody −13.5/−30.6 | see above |

**SFX families (inferred from the above).**

1. **UI clicks:** the button click.
2. **Text-data ticks:** scramble, typing bursts, compute chatter, AI-chip chirps. They are high, dry and granular, each timed to text appearing.
3. **Impacts and accents:** the diamond pulse, map boom, rack hit, intelligence and UI accents, which mark scene arrivals.
4. **One pitched loop:** quantum, which reacts to scroll speed.

**Other notes.**

- Most slots are `overlap: true` with no rate limit. A fast scroll therefore fires every threshold SFX it crosses, 6 within ~1 s in `54`.
- *Inferred, from code:* the scene scripts also emit `audio:play` for tracks named satellite, datacenter, chip, ui, car and ending. No slot exists for these names, so they look like a legacy per-scene music system replaced by the stems.
- **Mobile.** Same files, same mix table. Swipes cross the same thresholds. The AI-chip loop starts on a tap on the ring, and also when a swipe *starts* on it (touch emits `mouseenter`).

**Questions for Janriz** (I cannot hear these; the answers decide the portfolio's *Sound design* item):

1. Is it the **music**, the **SFX**, or the pairing of the two that you like? Name a moment if one stands out (the quantum climax, the map boom, the chip chirps?).
2. The music is **on by default after the first click**. For the portfolio, do you want sound on after a gesture like this, or off until the visitor turns it on?
3. Did you notice the **per-scene re-mix**, such as the bass dropping out over the map and the data centre, and everything coming in at the quantum chip? Should the portfolio's score follow sections, the chat (the agent "thinking" or answering), or both?
4. The quantum loop **rises in pitch as you scroll faster**. Did you notice it, and is scroll-reactive sound something you want?
5. The AI-chip hover loop is very quiet (volume 0.1). Is that the right weight for hover sounds, or would you want hovers silent and only clicks and arrivals to sound?
6. Fast scrolling stacks ~6 SFX in about a second. Rich or messy?
7. Would **code-generated sound** (WebAudio or Tone.js synthesis, which fits the free/self-made asset rule) satisfy you, or do you want real composed stems (which would need their own case)?
8. Is the "Experience with headphones" invitation something you would copy?

**Janriz's answers (2026-09-27):**

1. Both the music and the effects. What he likes most is the transition sounds in general, and specifically the map boom and the quantum climax.
2. Yes: sound on after a gesture.
3. Yes, he noticed. The score can follow both the sections and the chat.
4. Yes, scroll-reactive sound can be incorporated.
5. Hover sounds are in. Their volumes will be tuned later by experimenting.
6. Stacked SFX on fast scroll are fine.
7. Code-generated sound is OK.
8. The headphones invitation is worth trying.

## 9. Type, colour, layout

Values are computed styles read at 13 stops on desktop (1440×900) and mobile (390×664), from `scenarios/08-type-colour.js`, which writes `logs/probe-type-colour.json` and `logs/probe-type-colour-mobile.json`. WebGL colours come from the colour-typed attributes of the scene's scripts, lights and cameras, read in the same run. The few values eyedropped from stills are labelled.

### Fonts

| Family | Weights / styles used | Served from | Free or paid | Where |
|---|---|---|---|---|
| **General Sans** (Indian Type Foundry) | 300, 400, 500, 700, normal only (loaded `FontFace`s). The CSS asks for 200–700 | **Fontshare CDN**: `api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700` (requested twice, by two scripts) | **Free**: Fontshare lists it as "Closed Source / ITF Free Font License", free for personal and commercial use. It is free but not open-source and not on Google Fonts. If the map's rule is read as Google-Fonts-only, the nearest open alternatives are Hanken Grotesk or Instrument Sans (my judgement from letterforms, not measured) | display, headings, credits, UI labels ("AUDIO"). Also drawn into WebGL for "ORBITAL INTELLIGENCE" (below) |
| **JetBrains Mono** (JetBrains) | 400, 500, 800 loaded (700 requested); normal only | **Google Fonts**: 5 separate `css2?family=JetBrains+Mono:…` requests, because each script injects its own `<link>` | **Free** (SIL OFL 1.1) | CTA, labels, bullets, spec lines, the hint cursor, the "DRAG TO ROTATE" ring, and the WebGL 3D titles ("NVX-72", "EDL-72") |

**Fonts inside the canvas.**

- **Canvas2D → texture (what actually renders).** These scripts draw text with Canvas2D `fillText` into a texture (max 4096 px) and show it in WebGL. They use the same web fonts:
  - `textSatellite`: title in `700 "General Sans"` with letter-spacing −0.05 em, line height 0.9, sized 0.08 of screen height (≈72 px at 900 px). Subtitle in `400 "JetBrains Mono"` uppercase at 0.012 of screen height, line height 1.5. Mobile multipliers: title ×1.5, subtitle ×0.4.
  - `worldText` / `hudText`: `JetBrains Mono`, default weight 700.
- **Unused MSDF atlases.** Six PlayCanvas font assets (MSDF, 1024×512 atlases built from `GeneralSans-{Extralight,Light,Regular,Medium,Semibold,Bold}.otf`) are downloaded, ~1 MB in all. **No text element uses them** (`usedByTextElements: 0` for each). *Inferred:* leftovers from an earlier approach.
- **Baked card text.** The card-row copy is not in the DOM and uses no text element. *Inferred:* it is baked into the card textures.

### Type scale (computed)

| Role | Example | Family / weight | Desktop size / line height / tracking | Mobile | Case, colour |
|---|---|---|---|---|---|
| Display (landing) | "INTELLIGENCE AT PLANETARY SCALE" | General Sans 300 | **96 px / 99.84 px (1.04) / 0.96 px (0.01 em)**; per-letter spans | 44 px / 45.76 px / 0.44 px | uppercase, `#ffffff` |
| Display (WebGL) | "ORBITAL INTELLIGENCE" | General Sans 700 | ≈72 px (0.08 × screen height), line height 0.9, −0.05 em | ×1.5 multiplier | uppercase, `#ffffff` |
| Heading L | "PRIMARY NODE" | General Sans 700 | **64 px / 57.6 px (0.9) / normal** | 38 px / 34.2 px | uppercase, `#ffffff` |
| Heading M | "URBAN SYSTEMS", "// COMPUTE_CORE_" | General Sans 700 | **48 px / 67.2 px (1.4)**; 1.92 px (0.04 em) on "URBAN SYSTEMS", normal on "COMPUTE_CORE" | 26–28 px / 36.4–39.2 px | uppercase, `#ffffff` |
| Statement (credits) | "Edolus **never existed.**", "Now **imagine your own.**" | General Sans 400 + 700 in one line | **42 px / 48.3 px (1.15) / 0.21 px (0.005 em)** | 22 px / 25.3 px | sentence case, `#ffffff` |
| Statement (light scene) | "From digital twin / to real-world execution," | General Sans 400 | **36 px / 50.4 px (1.4) / normal** | 22 px / 30.8 px | sentence case, `#333333` on white |
| Email link | "[ STUDIO@VERTEX3D.ASIA ]" | General Sans 400 | 22 px / 25.3 px / **3.08 px (0.14 em)** | 17.16 px | as typed, `#ffffff` at 70 % |
| Sub / caption | landing subtitle, "Experience with headphones" | General Sans 400 | **14 px / normal / 1.68 px (0.12 em)** | 12.48 px / 1.50 px | uppercase, `#c4c7c7` at 67 % |
| UI label | "AUDIO" | General Sans 500 | 12 px / 12 px / 1.68 px (0.14 em) | same | uppercase, `#ffffff` (`#333333` over light scenes) |
| Hotspot title | "AI CHIP" | JetBrains Mono 800 | **22 px / 30.8 px (1.4) / normal** | same | uppercase, `#ffffff` at 50 % → 100 % on hover |
| Hotspot sub | "Autonomous Inference Core" | JetBrains Mono 400 | 16 px / 22.4 px / normal | same | uppercase, `#ffffff` in the computed style (CSS rule `#c4c7c7`) |
| Mono body | scene bodies, bullets, spec lines | JetBrains Mono 400 | **14 px / 22.4–23.8 px (1.6–1.7) / 0.28 px (0.02 em)** | 10–12 px / 16–19.2 px | uppercase, `#ffffff` or `#c4c7c7` |
| Button | "INITIATE SYSTEM" | JetBrains Mono 500 | 12 px / normal / 1.2 px (0.1 em) | 9.6 px | uppercase (typed), `#000000` on `#ffffff` |
| Micro mono | "SCROLL TO BEGIN ↓", "DRAG TO ROTATE", "REPLAY EXPERIENCE" | JetBrains Mono 800 (hint) / 400 | 12 px / 16.8 px / 1.44–1.8 px (0.12–0.15 em) | hint hidden on touch | uppercase, `#ffffff` |

**How the scale is built.**

- Two families.
- On desktop, the sizes step 96 → 64 → 48 → 42 → 36 → 22 → 16 → 14 → 12.
- Headings are tight (line height 0.9) when stacked and 1.4 when single-line. Mono text runs at 1.6–1.7.
- Tracking is wide only on small uppercase (0.12–0.15 em) and on the email.
- Mobile sizes come from per-script `*Mobile` attributes rather than a fluid clamp, so the ratios differ per role (e.g. 96 → 44 but 64 → 38).

### Colour

**DOM palette** (computed styles and stylesheet rules; no CSS custom properties exist):

| Hex | Role |
|---|---|
| `#ffffff` | primary text, CTA fill, hotspot ring (2 px at 50 % → solid on hover), replay underline, logo on dark scenes |
| `#c4c7c7` | secondary text: landing subtitle, headphones icon and label, `.sl-sub`, data-centre body |
| `#000000` | CTA text; letterbox bands (`#custom-band-*`, `#ec-band-*`), the ending dim (50 %), splash background |
| `#333333` | text and logo over the light car scene (`textCenterFade.color`, `overlayManager.logoDarkColor`) |
| `#1d292c` | `html`/`body` background, visible only before the canvas paints |
| `#de4959` | the Vertex3D logo in the credits: the studio's colour, not Edolus's |

**WebGL palette** (declared colours from the scene's script attributes, lights and cameras; not eyedropped):

| Scene | Hex values | Role |
|---|---|---|
| All | camera clear `#1e1e1e`; ambient `#202020`; lights `#ffffff`, `#faf6ee`, `#fff7df`, `#ffe9bf`, `#ffe7b6` | neutral base and warm-white key lights |
| Space | `#000b1b` → `#10305c` → `#3d5f8e` (`gradientPlane` A→B→C; `videoEarth.fadeColor` `#000b1b`); clouds `#aab4cc`, `#c8cfe1`; `centerDissolve` `#7a859f` | navy-to-blue sky; blue-grey clouds |
| Map | `#5e5344` → `#978e82` (`gradientPlane`); `mapHud.bgColor` `#010101` | dusty ochre-brown ground |
| Gold "compute light" | `#ffb84d` (glow A), `#ffd973` (glow B), `#fffaeb` (core), shared by `infraGridMap`, `dataLights`, `datalightDiamond` and `lightShot`; plus `#ff9800`, `#ffcf70`, `#ffe0ae`; dust `#fbe08d`, `#ffe095`; nebula `#ffd293` / sun `#ffb46e`; UI wallpaper lights `#ff9e42`, `#ffc76b` on `#777777`; `rackDissolve.burnColor` `#ff731f` | **the accent**: every data and energy element from the map to the intelligence layer |
| Cards | fill `#272727`, glow `#3e3e3e`, hover `#424242` + `#ffd173`, bullets `#c4c7c7` | dark glass cards with a gold hover |
| Car studio | `#fae5ba` → `#c5c5c5` → `#888888` (`gradientPlane`); `solidBackground` horizon `#c8c8c8`, bottom `#232323`; tail-light fresnel `#ff0000` / `#ff3737` / `#ffedd1` | warm white studio; the only red |
| Chrome in WebGL | `#ffffff` (plexus, halo, satellite label, chromatic dip); `dataScan.holeColor` `#000000` | lines and flares |

**Eyedropped (64 px patch averages from stills; the Earth is a video, so it has no declared colour):**

| Patch | Hex |
|---|---|
| Space | `#060f1d` |
| Earth, satellite hold | `#243453` |
| Earth limb, landing | `#475166` |
| Clouds, mobile landing | `#5a6d7f` |
| Map terrain | `#9c9180` |
| Data-centre light cone | `#e7cc94` |
| Corridor floor | `#10100f` |
| Card-row background | `#1e1a15` |
| Car studio floor | `#eee8d8` |
| Car studio wall | `#ededed` |

**Reading (inferred).**

- The UI is strictly black, white and one grey (`#c4c7c7`).
- Colour lives only in the light: cold blue in orbit, gold from the map to the intelligence layer, white in the car studio.
- Awwwards lists the palette as just `#000000`.

### Layout

Measured boxes at 1440×900.

- **No column grid.** The composition is either centred on the viewport or pinned to 3D anchors.
- **Fixed chrome:**
  - the wordmark SVG, top centre (155×27 px at y 40)
  - "AUDIO", top right (right edge 60 px from the viewport edge, y 48)
  - the landing subtitle spans 64 px → 1376 px (64 px side margins)
- **Centred moments:**
  - landing title (top at y ≈ 265)
  - CTA 222×54 px at y 570
  - headphones hint at the bottom (y ≈ 782–860)
  - the car statement (700 px wide, y 200)
  - the credits lines (y 424), email (y 574), replay (y ≈ 819)
- **Anchored moments (HTML re-projected every frame onto a 3D point, with fixed pixel offsets):**
  - "AI CHIP" 100 px to the right of its 80 px ring (x 875)
  - "PRIMARY NODE" at x 305 with its body at x 454
  - "URBAN SYSTEMS" top-left (x 248, y 117) with its body bottom-right (x 610–1190)
  - "// COMPUTE_CORE" at x 85 low on the left
  - the rack bullets at x 384, left of the tray
  - the chip specs at x 534, above the chip
- **Mobile:**
  - labels flip below their anchors (`sideMobile`)
  - bodies narrow to 250–280 px with ~24–55 px side insets
  - the CTA shrinks to 178×44 px
- **Full-viewport devices:**
  - the letterbox bands are two 450 px halves (50 vh each) that slide in from above and below to frame the loader and the ending
  - the ending dim is a 50 % black layer

## 10. Performance & degradation

- **Transfer (measured, resource timing).**
  - **48.1 MB transferred in 94 requests** (51.9 MB decoded), all before the landing. Breakdown:

    | Type | Size |
    |---|---|
    | GLB | 22.4 MB |
    | MP4 | 11.2 MB |
    | PNG | 4.1 MB |
    | Basis | 3.6 MB |
    | WebP | 2.9 MB |
    | OGG | 2.5 MB |
    | JS | 0.9 MB (3.5 MB decoded) |
    | WASM | 0.3 MB |

  - **The mobile preset downloads exactly the same 48.1 MB.** There is no asset tier.
- **Paint and LCP.**
  - First (contentful) paint at ~0.5 s. It is the loader.
  - The reported **LCP is 7.9 s on desktop and 2.9 s on mobile**. Both name a *hidden* car-message `<div>` ("AI systems bridge perception…"), because the canvas is not an LCP candidate. So the metric misleads here: the real "can act" moment is the CTA at ~8.8 s (§3).
- **Frame feel (headless M5, GPU).** rAF held 60 fps. Capture fps was 60 in nearly every clip. The map sweep and the slow quantum scroll captured at ~47–50 fps, which is *possibly* real load in the two heaviest shaders (inferred).
- **Mobile tier (iPhone 13 preset, measured).**
  - `pc.platform.mobile` is true and `(pointer: coarse)` matches.
  - The canvas is capped at **DPR 2** (780×1328 for a DPR-3 phone; `maxPixelRatio` 2), under the 3 MP budget.
  - The Aurora shader drops from 4 to 2 fbm octaves.
  - Cursor effects are off.
  - Layout re-flows: centred stacked landing title, labels moved below their anchors, narrower bodies.
  - The whole film works by swipe (`57`–`77`). Every scene rendered at a 60 fps capture on this machine; real phones were not tested.
  - Swipes map at 4000 px per film, so ~6 phone-heights of swiping reach the end. The first 1400 px of swipe, meant for the intro, carried the timeline to 0.31 (`61-mobile-intro-swipe`).
- **Reduced motion (measured, `05-reduced-motion.js`).** `matchMedia("(prefers-reduced-motion: reduce)")` returned true, and **nothing changed**:
  - same loader, same fly-in, scrambles, parallax, chromatic streaks and x-ray (`78`–`85` vs `08`–`24`)
  - the bundle has 0 references to `reduced-motion` or `prefers-reduced`
- **Other degradation.** Pinch zoom is disabled. `lang` is empty. There is no meta description. The hotspot is hover-only with no focus state. Wheel-hijack means no native scrollbar and no scroll restoration.

## 11. Ideas worth taking

The standing constraints are numbered as in the map Notes:

1. GSAP-only animation
2. real-HTML text
3. chat usable within 1 s
4. reduced-motion and mobile tiers, with lazy 3D and audio
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free/self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **A real-HTML hotspot pinned to a 3D object, with a reveal of what is inside** (the AI-chip ring plus the cursor x-ray).
   - **Why it fits:** it is the most direct answer to Janriz's roaming-bot seed. A projected, focusable `<button>` on the bot's core, labelled in real text, could open the chat, with an x-ray-style reveal of the bot's "insides" (the wiki behind the agent) on hover or focus.
   - The label is HTML, so it satisfies constraint 2. The reveal is bespoke to the concept, not a template effect.
   - **Strains:**
     - Constraint 4: it needs a tap/focus mobile branch and a static reduced-motion reveal.
     - Constraint 5: an extra mask pass and a transparent-hull render.
     - Accessibility: Edolus's version is `mouseenter`-only, windowed to a narrow scroll range, and has no focus state; ours must be a keyboard-reachable button that does not chase a moving target.
2. **A stem mix table instead of tracks.**
   - **Why it fits:** a few synced loops whose volumes ease to per-state targets give a score that follows the story from a small set of files. For the portfolio the "sections" could be State 1 / State 2 / sections, *and* chat states (idle, the agent typing, a tool effect firing). The volume tweens can be GSAP tweens on gain values, which satisfies constraint 1.
   - **Strains:**
     - Assets: the stems must be self-made or code-generated.
     - Constraint 4: audio must load lazily after first paint, and default off or wait for a gesture.
     - The 2.5 MB of Edolus audio would be too heavy on a phone.
   - Needs Janriz's answers in §8 first.
3. **Progress windows with hero-pose snap points.**
   - **Why it fits:** every effect declares a start/end window on one normalized progress, and the timeline snaps to "hero poses" after 1 s idle. This maps cleanly onto GSAP ScrollTrigger (`snap`, labels) with ScrollSmoother on *native* scroll. The poses double as stable anchors for screenshots, `#section` links and the chat's `scroll_to` tool effects.
   - **Strains:** constraint 1 only if copied literally. Edolus hijacks the wheel; ours must use ScrollSmoother, keep the native scrollbar, and keep snap gentle.
4. **Speed-reactive sound: pitch follows scroll or pointer velocity** (quantum loop 1.0–1.6×), alongside the speed-grown x-ray.
   - **Why it fits:** a cheap way to make input feel physical. In a chat-first site, the typing rate or stream speed of the agent's reply could drive it.
   - **Strains:** constraint 4 (it needs a quiet, static reduced-motion branch). It risks feeling like a gimmick if it is not tied to the concept.
5. **Sound and text as one gesture.** Each text reveal has its own matched SFX: scramble ticks for scrambles, typing bursts sized to the number of lines.
   - **Why it fits:** the agent's streamed answers could carry a very quiet typing texture.
   - **Strains:**
     - The effects rule: the text scramble is common, and Edolus's blinking "_" caret is on the banned list.
     - The scramble must run on real HTML text (GSAP ScrambleText is fine) and be skipped under reduced motion.
6. **Adaptive DPR by measured frame time, remembered per screen** (`optimizeRetina`).
   - **Why it fits:** a small, invisible way to hold constraint 5 on unknown laptops.
   - **Strains:** none.
7. **The honest ending** ("Edolus never existed. The experience did. Now imagine your own.") ends in one contact line and a replay.
   - **Why it fits:** it is a useful model for a portfolio's close: one sentence of voice, then the email.
   - **Strains:** none. It is copy, not effects.

**What to avoid:**

- **A gating loader plus a shader warm-up in front of everything.** The CTA only appears at ~8.8 s, after all 48 MB (including 22 MB of GLB and 11 MB of video) has loaded, and phones get the same payload. This breaks constraints 3, 4 and 5 outright.
- **Wheel hijack with no native scroll.** 39 200 px of wheel for the film, no scrollbar, no deep links, no restoration.
- **Canvas-only hero titles** ("ORBITAL INTELLIGENCE", "NVX-72", "EDL-72", "INTELLIGENCE LAYER", all card copy) and a title split into per-letter spans. This breaks constraint 2.
- **No reduced-motion branch at all.** It was verified to ignore the setting.
- **Pinch zoom disabled**, empty `lang`, no meta description.
- **Hotspots that exist only in a 0.03-wide progress window**, are hover-only, and show no cursor change. Janriz found one my first pass missed. Ours should be persistent and discoverable.
- **Unthrottled overlapping SFX on fast scroll.** Rate-limit or duck them.
- **The generic layer on top:** film grain, bloom, lens halo, chromatic streaks, plexus lines, the blinking caret. The effects rule bans these for us, and they are the least Edolus-specific part of Edolus.
- **Trusting LCP on a canvas site.** Measure the moment the chat is usable instead.

## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | landing, initiate at 2/4/6/8 s, two scrolls | `screenshots/01`–`07` |
| `02-journey-a.js` | desktop: cold load → chip hotspot → clouds → map → data centre (audio toggle) → rack drag → chip | `08`–`33` |
| `03-journey-b.js` | desktop: chip → quantum (slow) → UI (fast) → card sweep → car → credits → fast back-and-forth → replay | `34`–`56` (39/42 names are swapped relative to content; 45 is outside the ripple window, see 88–90) |
| `04-mobile.js` | iPhone 13: cold load → tap → swipes through every scene | `57`–`77` |
| `05-reduced-motion.js` | desktop with reduce: cold load → initiate → chip hover → fast to map | `78`–`85` |
| `06-windows.js` | re-shoots inside the effect windows: card-row hover sweep at 0.68, pointer ripple at 0.8 | `86`–`90` |
| `07-text-map.js` | DOM vs WebGL text at 14 stops (no media) | `logs/probe-text-map.json` |
| `08-type-colour.js` | computed type and colour at 13 stops, plus the WebGL colour attributes; desktop, and mobile with `MOBILE=1` (no media) | `logs/probe-type-colour.json`, `logs/probe-type-colour-mobile.json` |
