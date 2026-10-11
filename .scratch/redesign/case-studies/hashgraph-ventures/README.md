# Case study: Hashgraph Ventures

Captured 2026-09-27 with headless Playwright (Apple M5, ANGLE Metal, WebGPU, 60 fps) through `research/capture/capture.js`. Evidence lives here:

- `screenshots/`: stills at 1440×900 @2x. Mobile stills use the iPhone 13 preset (390×664 @3x).
- `motion/`: MP4 clips, each with a `.sheet.png` contact sheet.
- `audio/`: the 23 `.webm` (Opus) files from the site's sound table, plus spectrograms and waveforms. capture.js does not save them (see the note in §8), so `scenarios/_fetch-audio.js` downloaded them.
- `logs/`: run logs, JSON probes, `notes.md`, the site's own JS in `logs/src/` (pretty-printed in `logs/src/pretty/`), and the baked Theatre.js state as `logs/theatre-state.json`.
- `scenarios/`: the scripts that drove every run.

Numbers such as `14-gate-hover-then-enter-with-audio` refer to those files. **Measured** means read from the page, runtime, network or files. **Inferred** means my reading of what I saw. I cannot hear, so everything about sound comes from code, runtime sampling and spectrograms.

## 1. At a glance

| | |
|---|---|
| URL | https://hashgraphvc.com/ (home, `/companies/<slug>` portfolio pages, `/privacy-policy`) |
| Awwwards | https://www.awwwards.com/sites/hashgraph-ventures. **Site of the Day, Jun 1 2026, 7.5/10**: Design 7.65, Usability 7.17, Creativity 7.78, Content 7.35, from 18 jury votes (individual totals 6.20–8.70). **Developer Award 7.42**: Semantics 6.8, Animations 8.6, Accessibility 6.4, WPO 7.8, Responsive 7.6, Markup 7.0. an "Awwwards Users – Pro and Chief" row gives 9.12. Source: `logs/awwwards-page.txt` |
| Studio | **rbxgc** (rbxgc.co; the footer says "Made by rbxgc"). Awwwards credits Glenn Catteeuw (PRO), Rogier de Boevé, Thomas Aufresne and arpeegee |
| Awwwards tags | Business & Corporate, Technology, Animation, Storytelling, 3D, Three.js, Nuxt.js, Sanity. Its palette: `#EEEEEE`, `#000209` |

**Gist.** The site is for a venture fund backing AI and blockchain startups (pre-seed to Series A). The home page has five short HTML blocks of copy. Behind them runs a single WebGPU canvas holding five Three.js scenes on one Theatre.js timeline, which the wheel scrubs:

1. **Hero**: a night ocean with a faceted, glowing rock hovering above it, under "The next wave of venture capital"
2. **//01 Manifesto**: a dive under the surface, where a human figure made of points reaches up through a bright opening
3. **//02 Investors**: the same figure, seen from below, stepping onto a floating slab
4. **//03 Team**: particle busts of each partner, morphed with arrow buttons
5. **Outro and footer**: the logo glyph as a particle sculpture over a moonlit seabed

A hard diagonal wipe cuts between scenes, and each HTML block appears only near its snap pose. A gate asks for "Enter with audio" or "Enter without audio". With audio, a 2-minute pad plays under per-scene sound beds that crossfade with the scroll, and grinding-stone and shimmer SFX answer the pointer. Portfolio companies open as their own routes over the same 3D scene.

**Most memorable thing.** The hero rock **cracks open around your pointer**. Its blocks push outward radially from the cursor, opening seams onto a white-hot core, with a stone-grinding sound. When you move away, it re-seals over about 2 s (`logs/17-crystal-open-detail.png`, `17-hero-spire-enter-hold-leave.mp4`, `18-hero-spire-extended.png`). Because the "Enter" button sits in the middle of the gate, the pointer is usually already resting on the rock when it arrives, so most visitors trigger it without looking for it. The runner-up is the **team portrait morph**: 40 000 particles re-form from one partner's face into the next (`46-team-portrait-morph-next-next-prev.mp4`).


## 2. Tech found

| What | Detail | How detected |
|---|---|---|
| Framework | **Nuxt 3** (Vue **3.5.30**), prerendered (`serverRendered`, `prerenderedAt` in the payload), with Pinia stores. Content from **Sanity** (project `diak0tmr`, dataset `production`, API `2026-04-02`, images from `cdn.sanity.io`) | `window.__NUXT__`, `/_nuxt/` chunks, `_payload.json`; `version$2 = "3.5.30"` in the entry chunk; Sanity config in `__NUXT__.config` |
| 3D engine | **Three.js r182** with the **WebGPURenderer** and TSL node materials (`MeshBasicNodeMaterial`, `MeshPhysicalNodeMaterial`, `NodeMaterial`, WGSL caustics). The canvas asked for a `webgpu` context. The renderer is created with `forceWebGL: !isWebGPU`, so three's WebGL2 backend is the fallback, and `?forceWebgl` forces it | `window.__THREE__ = "182"`; `REVISION = "182"`; my `getContext` hook logged `webgpu` at ~16 s; `DqcYvDA3.js` (the Renderer) |
| Render approach | **One** full-window canvas (1800×1125 for a 1440×900 viewport, so DPR 1.25), plus a hidden 800×600 `#debug-view-canvas`. Five Three.js scenes, one per section, each with its own camera and post-processing, are rendered to targets and composited by a `MultiSceneCompositor`. A hard-edged diagonal wipe blends each scene into the next. HTML carries all text | DOM probe `canvases`; `MultiSceneCompositor.createCompositor()`; `store.dpr = 1.25` |
| Timeline | **Theatre.js** (core; the studio loads with `?studio`). One sheet per section plus a `Main` sheet. The scroll value (0–8.5) *is* the sequence position of every sheet. Theatre keyframes switch scenes on and off, drive the wipes, show and hide the HTML sections, set snap points, move cameras, fade the sound loops and toggle pointer interactions | `window.__TheatreJS_CoreBundle`, `exportTheatreState`; `updateScroll()` sets `sheet.sequence.position`; the baked state in `Bw-OgUHK.js` (extracted to `logs/theatre-state.json`) |
| Animation (DOM) | **GSAP 3.14.2** with ScrollTrigger, Observer, **SplitText** and CustomEase (`expoOut` etc.). GSAP runs the loader, the text reveals, the auto-snap tween, the intro tween of the scroll value, the post-FX preset mix and the master-volume fades | version strings in the entry chunk (`Tween.version = … "3.14.2"`); `window.gsapVersions` |
| Scroll | Home: a custom `HomeView` on **VirtualScroll** (wheel ×1, touch ×3.25). It adds `deltaY × 6e-4` to a target value, damps it with λ 4.5, and snaps after 1 s idle. It is exposed as `window.homeView`. The one long native-scroll page (privacy policy): **Lenis 1.3.20** (`lerp 0.2`, `wheelMultiplier 1.25`) with ScrollTrigger | the entry chunk (`class HomeView`, `new Lenis(`); `window.lenisVersion`; `html.lenis` class |
| Frame loop | **Tempus 1.0.0-dev.17** (darkroom.engineering) as the shared rAF, plus a `Dispatcher` event bus (`playSound`, `scrollRaf`, `portfolioCompanyEnter` …) | `window.tempusVersion`; the entry chunk |
| Sound | **Howler 2.2.4**, 23 files, `.webm` (Opus) first with `.mp3` fallback. A Vue `v-sound` directive plays hover and click sounds on buttons | `window.Howler`, `howler.js v2.2.4`; the `SOUNDS` table in the entry chunk |
| Simulation | Pointer **smoke fluid sim** over the composite (`smokeRTT`: 128² sim, 512² dye; desktop, not Firefox). GPU **particles bound to a mesh SDF** (compute SDF generator, BVH sampler, `MeshParticles`), displaced by the pointer ray. Team portraits: particles sampled from photos in a worker (`particleWorker`, OffscreenCanvas). Ocean: Gerstner/FFT-cascade waves (`WaterPro`, `WebGPUWaveSimulation`), SSR, foam, caustics, Rayleigh sky | class names in `cAef_3ex.js` (Site) and `DqcYvDA3.js` (Renderer) |
| Post-processing | Per section: vignette, a blue overlay in "dodge" blend, fluid distortion and brightness, bloom (intro), and a gradient map (team, off). Global: bloom (threshold 0.247, strength 1.405, radius 0.465), film grain (0.94), chromatic aberration (0.95, min 0.10), vignette blur, ACES Filmic tone mapping at exposure 1. A "company" preset raises CA and vignette blur on company pages | Theatre static overrides (`logs/theatre-state.json`); `MultiSceneCompositor` |
| 3D assets | 9 GLBs (Draco and KTX2/Basis): `outro_compressed` 705 KB, `intro_compressed` 681 KB, `rocks` 244 KB, `investors_compressed` 139 KB, `human_2` 129 KB, `legs-fixed` 126 KB, `logo` 47 KB, `bg` 39 KB, `portfolio` 38 KB (≈2.1 MB in total). Textures: 8 KTX2, `waternormals.jpg` 243 KB, `perlin.webp`, `blue-noise.png`, `bubbles.png`. Draco and Basis WASM decoders ≈0.84 MB decoded | network log (`logs/run-*.json`); resource timing (`probe-perf-landing.json`) |
| Fonts | Three self-hosted WOFF2 files: **Hashgraph-Title** (a custom display face, 7 KB), **PP Neue Montreal SemiBold** (Pangram Pangram, paid), **Parabole Bold Text** (paid). Details in §9 | network log (`/fonts/*.woff2`); `document.fonts`; the `wf-*-active` classes on `<html>` |
| Studio | **rbxgc** ("Made by rbxgc" in the footer, rbxgc.co). Awwwards credits Glenn Catteeuw (PRO), Rogier de Boevé, Thomas Aufresne and arpeegee | footer link; `logs/awwwards-page.txt` |
| Meta | `lang="en"`, a proper description, OG and Twitter tags with a 1200×630 image, `robots index, follow`. The viewport meta allows zoom | DOM probe `meta` |

## 3. Intro & loading

- **First paint** is a plain `#000209` screen at 0.5–1.7 s (FCP 520–1 732 ms across runs, depending on load). The prerendered HTML already holds every section's copy, but a fixed `.loader` (z-index 90) covers it.
- **Loader** (`12-cold-load`, measured):
  - A huge thin outline of the logo glyph (stroke `#576676` at 35 % opacity, wider than the screen) eases in.
  - "HASHGRAPH VENTURES" fades in letter by letter in the display face.
  - Under it, "LOADING" sits over a 120 px progress line (`#576676` track, a gradient fill scaled by `loadProgress`).
  - The Nuxt `Canvas` component waits **1.2 s after mount** before it even starts the WebGPU app. The app then fetches ~2.1 MB of GLB, KTX2 and Draco/Basis decoders, builds all five scenes, **compiles every scene's pipelines and warms up post-processing** (`compileEnd`), and waits a further 300 ms.
- **Reveal of the choice:** 1 s after `compileEnd`:
  - The progress line clips away and "Loading" rolls up.
  - The outline glyph shrinks to 40 % and rotates 120° into a frame around the title (2.4 s `cubic-bezier(.14,1,.34,1)`).
  - The "ENTER WITH AUDIO" button draws in, and "Enter without audio" plus the disclaimer ("This experience includes sound. For the intended atmosphere, enable audio.") appear at the bottom.
- **Time to first action** (the Enter button clickable: visible, fully opaque, wrapper enabled; polled every 50 ms): **4.33 s**, **4.56 s**, **4.57 s** and **5.62 s** in the quieter runs, and 14.3 s (desktop) and 15.8 s (iPhone preset) while other agents' captures loaded the same machine.
- **Not skippable.** Nothing is clickable until compilation ends. There is no "skip" and no remembered choice: every visit, and every cold deep link, meets the gate again.
- **After the choice** (`14-gate-hover-then-enter-with-audio`, 5 s):
  - The loader fades out (0.6 s) onto the ocean.
  - The timeline tweens 0 → 3.5 over 3.5 s: the camera flies in over the waves towards a point of light on the horizon, which grows into the glowing rock.
  - The HTML hero copy fades in per letter at 3.07.
  - With audio, `sfx_intro` (rise, impact, ring) starts at the click, and the music and sea bed fade in.
  - Scrolling down during the fly-in cuts it short, but only after 2.3 s.
- **LCP is misleading here:** it picks `p.loader__copy`, the disclaimer (1.7–4.9 s). Readiness is the Enter button, above.


## 4. Navigation & page transitions

- **Routes:** `/` (the scroll film), `/companies/<slug>` (one per portfolio company, from Sanity), and `/privacy-policy`. There is no menu. The logo glyph links home, the 02 section's "Explore our portfolio" button opens the first company, and the footer links email, X, LinkedIn, the privacy page and the studio.
- **Home → company page** (`56-explore-portfolio-to-company-page`, measured):
  - The URL changes to `/companies/debyt` without a reload (Nuxt router).
  - The home copy fades out. The **same WebGL scene keeps running**: the 02 camera pushes in past the particle figure, which streaks out to the upper left with chromatic smear.
  - The post-FX "company" preset tweens in over 2 s (`power1.inOut`): vignette blur 0.02 → 0.12 and chromatic aberration 0.95 → 1.52 (Theatre values). The scene becomes a soft blue defocus behind the text.
  - The company logo (an image), the URL, a two-line meta row and the blurb fade in, centred. "Return to homepage" appears bottom left, ‹ › bottom right.
  - Home scrolling is disabled (`portfolioCompanyEnter` → `disableScroll`), and the timeline is pinned at the 02 snap (6.5). About 2 s in all.
- **Page transition mechanics:** a Nuxt `<NuxtPage>` transition in `out-in` mode, with no CSS. GSAP fades the outgoing page to 0 and the incoming one from 0 → 1, with the 3D doing the real work underneath.
- **Company → next company** (`83-company-next-twice`): the text fades out, the defocused camera drifts to a new angle among the shards, and the next company fades in, about 1.5 s each (debyt → rava → 100s). The ‹ › controls are `<a>` links with real URLs, so every company is linkable and crawlable. Company pages do not scroll (document height 900 px).
- **Company → home** ("Return to homepage", `85-company-return-to-home`): the reverse move. The text fades, the camera pulls back and the particle figure streaks back into frame, and the 02 copy re-forms letter by letter. Home scrolling resumes at 6.5, about 2.5 s in all.
- **Cold deep link** (`87-cold-deep-link-company`): `/companies/debyt` shows the **same gate** (Enter clickable at 4.56 s). After it, the intro fly-in is skipped (`pendingSnapId = "portfolio"`), and the page opens straight on the company over the 02 scene.
- **Privacy page** (`89-privacy-page-scroll`): also behind the gate on a cold load. It is a long native-scroll page (8 139 px) on Lenis: 1 200 px of wheel moved it 1 498 px (`wheelMultiplier 1.25`).
- **Within home**, "navigation" is the timeline itself (§5). The hero CTA tweens to 01 (`55-hero-cta-click-scrolls-to-01`), and Home/PageDown jump between snap points (`54-keyboard-home-then-pagedown`). No URL or hash changes, so no home section can be linked or restored on reload.


## 5. Scroll behaviour

**There is no page scroll on the home page.** The document is 900 px tall, `body` has `overflow: hidden`, and `scrollY` stays 0 (`01-recon`). The wheel drives one number instead: `homeView.scroll`, a position on a Theatre.js timeline from 0 to 8.5. Everything on screen is a function of that number.

- **Input (measured from the bundle, `HomeView` in `logs/src/pretty/CEHeSSSx.js`):**
  - VirtualScroll on `body`: wheel ×1, touch ×3.25, no wheel normalisation.
  - Each event adds `deltaY × 6e-4` to `targetY`, so the five sections take 8 333 CSS-px of wheel at DPR 1. On this Retina capture, Chrome hands wheel listeners half the delta, so 400 px of wheel moved the target 0.12, not 0.24 (`02-recon-sections`), and the scenarios use `wheelScale: 2`.
  - `currentY` follows `targetY` by exponential damping at λ 4.5 (about 0.5 s to cover 90 % of a jump). A velocity value, clamped to ±1, feeds the transition shader.
  - Keyboard: arrows and space ±0.3, PageUp/PageDown jump a section, Home/End go to the ends.
- **The intro is a tween of the same number.** "Enter" starts a 3.5 s linear GSAP tween from 0 to 3.5, so the fly-in and the "scroll" are one timeline. Scrolling down during the intro skips it, but only after 2.3 s; scrolling up is ignored. After the intro the range is clamped to 3.5–8.5, so the fly-in cannot be scrolled back to.
- **Snap: hero poses after 1 s idle.** After 1 s without input, the value tweens to the nearest snap point over 1.6 s (`power2.inOut`). The snap points are 3.5 (hero), 4.8 (01), 6.5 (02), 7.5 (team) and 8.5 (outro), and the thresholds that pick one are 4.05 / 5.35 / 7 / 8. These values come from a Theatre "Snap Settings" object per section, so the animator moves them in the Theatre editor. In the `02-recon-sections` run, a scroll that stopped at 3.915 slid back to 3.5.
- **Effect windows (Theatre keyframes, `logs/theatre-state.json`):**

  | Section (HTML label) | Scene renders | HTML copy visible | Wipe in (mask 0→1; visible part) | Snap | Pointer effect live |
  |---|---|---|---|---|---|
  | Hero "The next wave of venture capital" | 0–4.4 | 3.067–3.6 | none | 3.5 | crystal "spire" 2.833–3.933 |
  | //01 Manifesto "Capital with conviction" | 3.567–5.8 | 4.567–5.067 | 3.033–5.033 (3.40–4.67) | 4.8 | particle figure 3.767–5.2 |
  | //02 Investors "Early access, permanent advantage" | 4.867–7.467 | 5.7–6.633 | 4.3–6.3 (4.67–5.93) | 6.5 | particle figure 5.333–6.8 |
  | //03 Team "Experience you can build on" | 6.333–8.267 | 7.3–7.667 | 6–8 (6.37–7.63) | 7.5 | none (buttons only) |
  | Outro "We prioritize warm introductions…" + footer | 7.567→ | 8.4→ | 7–9 (7.37–8.63) | 8.5 | particle logo 8.333→ |

  The "visible part" is my arithmetic: the wipe edge crosses the frame only while the mask runs 0.18–0.82. Each HTML block is shown for a narrow band around its snap point and hidden outside it. The HTML is not scrolled at all: each section is a `fixed-section` whose copy animates in and out when Theatre flips its "Scene UI Activation" flag.
- **Scroll-linked vs time-based.** The camera paths, the wipes, the scene switches and the loop volumes are scroll-linked (scrubbed). The HTML text reveals are time-based: they play when the band is entered, and reverse when it is left. The crystal, the water and the particles animate continuously on their own clocks.
- **Fast scrolling** (`51-fast-scroll-up-to-hero`, `52-fast-scroll-down-to-02`) chains the wipes. Two wipe edges can be on screen at once, and scrolling up runs them top-to-bottom. The copy of a skipped section never appears, because its visibility band is only 0.4–0.9 units wide.
- **Other pages:** the privacy policy scrolls natively with **Lenis 1.3.20** (`lerp 0.2`, `wheelMultiplier 1.25`) and ScrollTrigger. Company pages are one screen and do not scroll, and while one is open, home scrolling is disabled (`portfolioCompanyEnter` → `disableScroll`).
- **No scrollbar and no deep links** on home. A custom `Scrollbar` component (the thin vertical line at the right edge) shows progress. Company pages have real URLs (`/companies/<slug>`), and a cold load of one opens straight at the portfolio snap point (`pendingSnapId = "portfolio"`).

## 6. Cursor & micro-interactions

I found these with clips, eight hover sweeps (127 points) (`h.sweep`: a grid of pointer stops that logs the element, cursor and `:hover` target under each), and by reading each handler and its Theatre window. The site has **no custom cursor**: the cursor is `auto` everywhere on the canvas and `pointer` only on buttons.

- **The crystal opens around the pointer** (`MainModel.handleMouseMove`, hero only, timeline 2.833–3.933). This is the signature interaction.
  - A raycast hits an invisible "interaction plane" in front of the rock. On entering it, a GSAP tween (0.5 s `power2.out`) raises a mouse-influence value, and the blocks near the cursor push outward radially, opening seams onto a white-hot core. Blocks far from the cursor barely move. It opens over ~1.5 s, and it follows as the pointer slides (`logs/17-crystal-open-detail.png`, `18-hero-spire-extended.png`).
  - Sound: 200 ms after entering, a random `rock_extend1–5` plus the `rock_opened_loop`. On leaving, a random `rock_retract1–5`, and the rock re-seals over ~2 s.
  - The 6×4 sweep over the rock and sea (`16-hero-spire-sweep`) entered the plane about 4 times and left it 5 times (audio events at t 41–57 s), so the plane is roughly the rock's silhouette plus a margin, not the whole sea. There is no DOM element, no cursor change and no hint. The pointer finds it by accident, although in practice it rests there right after the gate click, because the "Enter" button sits in the middle of the screen where the rock then appears.
- **Particle figures part under the pointer** (`MeshParticles.updateMouseRay`; 01 at 3.767–5.2, 02 at 5.333–6.8, outro at 8.333→).
  - The pointer ray pushes particles out of a radius (`mouseRadius`, `mouseStrength` 1.5 in 01/02, 1 on the outro logo), and the SDF constraint pulls them back.
  - On the thin human figure the effect is subtle (`logs/22-figure-pointer-detail.png`). On the outro logo it is strong: particles herd into bright clumps like pushed sand and flow back into the glyph over 2–3 s (`logs/48-outro-scatter-detail.png`, `36-outro-after-pointer.png`).
  - While the ray hits the mesh, the shimmer loop's volume follows pointer speed.
- **Smoke-fluid distortion** (all scenes, desktop and not Firefox): the lerped pointer stirs a 128² fluid sim, whose texture slightly offsets and brightens the image. It is strongest on the team scene (`fluidDistortion 2e-3`, `fluidBrightness 0.5`), where it reads as the haze around the bust moving.
- **Team portrait morph** (`46-team-portrait-morph-next-next-prev`).
  - The arrow buttons beside the member's name (stacked on desktop, ‹ › on mobile) dispatch `portraitNext`/`portraitPrev`. The 40 000-particle bust dissolves and re-forms as the next face over ~2 s, with a `faceMorph` SFX.
  - The name and role scramble out and in, letter by letter.
  - A click during a morph is ignored (`isTransitioning`), so the buttons cannot be spammed.
- **Buttons** (`.btn`, entry CSS):
  - A 2 px `#9bb8e1` border blurred by 0.4 rem fades in as a glow (0.6 s `cubic-bezier(.14,1,.34,1)`).
  - The label rolls up out of view, and a duplicate rolls in from below (0.6 s `cubic-bezier(.9,0,.1,1)`).
  - The idle button runs a **shimmer**: a blurred `#9bb8e1` bar tilted **19.92°** sweeps across every 5 s. That is close to the ~18° tilt of the scene wipes, so the button and the transitions share one diagonal.
  - Hover plays `sfx_UI_hover` and click plays `sfx_UI_click`.
  - The outlines are SVG strokes with a deliberate gap at one corner (`logs/14-gate-button-hover-detail.png`).
- **"Enter without audio"** has a gradient underline (`#9bb8e1` → `#2c4e73`) that draws in after load. On hover it wipes out to the right while a second line wipes in (0.8 s).
- **Hero CTA** "Scroll down to discover more", bottom right: a label with a short vertical line. A click tweens the timeline to 01 over 1.6 s (`power2.out`).
- **Header wordmark:** "HASHGRAPH VENTURES" beside the logo glyph scrambles out once you leave the hero, leaving only the glyph, and returns at the outro (`41-scroll-hero-to-01-wipe`, `51-fast-scroll-up-to-hero`).
- **Text reveals** (SplitText via a `TextSplitter` component):
  - Titles fade in per character with `anim-fade` (0.6 s linear, staggered), while lines slide ±20 px with `expoOut` over 1.2 s.
  - Body copy fades in line by line.
  - Section labels (`//01 MANIFESTO`) sit bottom left.
- **Footer links** fade opacity on hover (0.3 s). **Company URL** links wipe their underline with a clip-path.
- **Focus and selection:** the reset sets `button { outline: 0 }` and `a:hover { outline: 0 }`, and I found no `:focus-visible` style, so keyboard focus is invisible. `::selection` is transparent: selecting text shows nothing.

## 7. 3D / WebGL

**One WebGPU canvas, five scenes, one timeline.** Each section is its own Three.js scene with its own camera, lights, fog and post chain (`SectionPostProcessing`: vignette, a blue "dodge" overlay, fluid distortion, and bloom in the intro). A `MultiSceneCompositor` renders the active scenes to render targets and blends them with a straight-edged mask. While two scenes are active, each renders on alternate frames ("ping-pong"), and the DPR is capped at 1.25 during a transition. Global post on the composite: bloom, film grain, chromatic aberration, vignette blur and ACES Filmic tone mapping.

| Scene | What is rendered | Reacts to | Technique (from class names and assets) |
|---|---|---|---|
| **Hero** (`IntroScene`) | A night ocean to the horizon under a blue sky. A faceted rock "crystal" hovers above it, with glowing cyan seams (`15-hero.png`) | **Pointer:** a raycast against an invisible "interaction plane" pushes the rock's blocks outward around the cursor and brightens the seams, like a geode opening. Leaving the plane closes it over ~1.5–2 s (`17-hero-spire-enter-hold-leave`, `18-hero-spire-extended.png`) | `WaterPro`: FFT/Gerstner wave cascades on WebGPU compute (`WebGPUWaveSimulation`), SSR, foam, waterline, Rayleigh sky with sun, clouds and stars, fog. `MainModel` / `FloatingRocks` from `intro_compressed.glb` and `rocks.glb`, with a Theatre-driven "Reveal Mask" (`revealY`) and "Floating Animation" |
| **01 Manifesto** (`InvestorsScene`) | An underwater view up at the surface, around a glowing opening. A human figure made of points reaches up through it, with dark rock shards drifting (`21-01-capital-with-conviction.png`) | Pointer ray: particles are pushed off the figure (`mouseStrength` 1.5), and the particle loop's volume follows pointer speed over the figure | `MeshParticles`: 8 000 octahedron particles (`MeshPhysicalNodeMaterial`), held to the SDF of `human_2.glb` by a compute SDF generator and BVH sampler. Caustics spotlight, height and distance fog |
| **02 Investors** (`PortfolioScene`) | The same particle figure seen from below, stepping onto a floating slab among dark shards, with light shafts (`25-02-early-access.png`) | Pointer ray, as in 01 | `MeshParticles` on `legs-fixed.glb`, plus `BoxParticles` (the shards) and `portfolio.glb`. The camera eases to a close-up for company pages |
| **03 Team** (`TeamScene`) | A particle bust of the selected team member in a blue haze (`29-team.png`) | Prev/next buttons morph the particles to the next face (`46-team-portrait-morph-next-next-prev`). The pointer only moves the fluid distortion | `TransitionParticles`: 40 000 particles (20 000 on mobile), sampled from each Sanity portrait photo by a worker (`particleWorker`, OffscreenCanvas brightness sampling) |
| **Outro** (`OutroScene`) | The Hashgraph logo mark as a particle sculpture above a moonlit seabed (`34-outro.png`) | Pointer ray: the particles scatter and bunch strongly, then re-form (`48-outro-logo-sweep`) | `MeshParticles` on `logo.glb`, with `outro_compressed.glb` as the seabed |

- **Across all scenes:** a 128² smoke fluid sim, driven by the lerped pointer, bends and slightly brightens the image under the cursor (`smokeRTT`; off on mobile and Firefox). It is barely visible at contact-sheet scale.
- **The wipe** (`TransitionEffects.createDiagonalWave`): its Theatre settings are angle 251.8°, amplitude 0, frequency 0 and edge softness 0.001, so it is a hard straight line tilted about 18° from horizontal that rises through the frame (`41-scroll-hero-to-01-wipe`). The shader supports a wavy edge and velocity-bent angles, but both are set to 0.
- **Continuity through the cuts:** the particle figure is the subject of both 01 and 02 (reaching up, then stepping onto the rock), and the logo glyph in the header also appears as the outro sculpture. The wipes cut between camera set-ups of one story: surface, dive, figure, faces, logo.
- **No DOM hotspots.** Eight hover sweeps (127 points in all) found only the fixed HTML section under the pointer, with cursor `auto` everywhere. Every 3D reaction is a raycast inside the canvas, with no cursor change or visible affordance. The crystal's plane is only live while the hero UI is shown.

## 8. Sound

**Default off, chosen at the gate.** The loader offers "Enter with audio" (the big button) or "Enter without audio" (small text below it), with the line "This experience includes sound. For the intended atmosphere, enable audio." In the header, a "SOUND ON / OFF" toggle with a small wave glyph switches it later. Audio is **Howler 2.2.4**. Files are `.webm` Opus (Chrome's pick), with `.mp3` fallbacks. All 23 are stereo 48 kHz at 38–53 kbit/s, 1.3 MB for the webm set (`logs/audio-probe.md`).

**Capture note:** capture.js saves only responses whose URL ends in an audio extension or whose MIME is `audio/*`. This site serves `.webm` as `video/webm`, so no files were saved automatically. The hook still logged every play (`audioEvents`). `scenarios/_fetch-audio.js` downloaded the files from the bundle's `SOUNDS` table.

### Mix design (measured: `SOUNDS` table, Theatre audio tracks, and a 200 ms sampler of every playing Howl, `logs/probe-sound-timeline-a.json`)

| Layer | File (duration) | When it plays | Level |
|---|---|---|---|
| Master | Howler global volume | GSAP tween 0 → **0.5** on "Enter with audio". The toggle tweens it to 0 (~0.5 s, `53-sound-toggle-on-off`) and then mutes. A hidden tab mutes at once and restores on return | 0.5 |
| Music bed | `Music_Ambient_Loop` (126.2 s) | From the gate click, forever. Fades in 0 → 0.5 over 0.5 s. Independent of scroll | 0.5 |
| Section loops, crossfaded **by scroll position** | `sfx_Hero_Loop` (46.7 s), `sfx_Investors_Loop` (39.0 s), `sfx_Portfolio_Loop` (26.1 s), `sfx_TeamFooter_Loop` (29.3 s) | Theatre `volume` and `muted` tracks per section. Hero: up 0.533→1.367, down 3.8→4.133. 01: up 3.7→4.4, down 5→5.567. 02: up 5.133→5.533, down 6.9→7.167. Team and outro: up 6.933→7.4, then held. Outside its window a loop is paused, not just silent | 0 → 1.0 (× master) |
| Interaction loops | `sfx_rock_opened_loop` (12.8 s) | While the pointer is on the crystal's plane (starts 200 ms after entering) | 0.8 |
| | `sfx_particles_loop` (8.5 s), four separate Howls (01, 02, outro, spare) | While the pointer ray hits a particle figure. Volume = `0.25 + min(1, pointerSpeed / 0.03 × 1.25)`, lerped up fast (0.3) and down slowly (0.05). Paused 1 s after it falls below 0.01. Sampled at 0.13–0.76 during the sweeps | 0 – ~1.25 |
| One-shots | `sfx_intro` (8.6 s) | "Enter with audio", home route only | 0.8 |
| | `sfx_rock_extend1–5` (2.6 s) / `sfx_rock_retract1–5` (2.6–4.0 s) | Random pick of five on entering / leaving the crystal plane. Up to five overlapped during the sweep (`probe-sound-timeline-a.json`, t 44.5–45.3) | 0.8 |
| | `sfx_UI_faceMorph1–3` (1.77 s) | Team prev/next, cycled 1→2→3. They load on first use, so the first one played **1.6 s after the click** | 1.0 |
| | `sfx_UI_hover` (0.06 s), `sfx_UI_click` (1.67 s) | `v-sound` directive: `mouseenter` / `click` on buttons (hero CTA, Explore, team arrows, sound toggle) | 0.8 |

At each snap pose the mix is: music 0.5 plus that section's loop at 1.0. Between poses, two section loops overlap at scroll-scrubbed levels. When a scroll stopped at 3.91 and slid back, the samples read hero loop 0.66 plus 01 loop 0.30 (`probe-sound-recon.json`). The sound design is a **stem-per-scene crossfade driven by the same timeline as the picture**. Pointer-driven layers sit on top.

- **Sound turned on later** (entered without audio, then the toggle at 02, `53-sound-toggle-on-off`) started only the music bed, not the 02 loop. Section loops start only on their Theatre `muted` flag changing, so the scene's bed stays silent until you cross into another section (`logs/run-2026-09-27T12-53-24-095Z.json`: only `Music_Ambient_Loop` and the click played).
- **Bug seen:** the crystal's `rock_opened_loop` kept playing after scrolling to 01 (y 4.25), until the next pointer move (`probe-sound-recon.json`, t 12.7–21.7 s). The plane's enable flag is only checked on `pointermove`.

### Reading the files (spectrograms and waveforms in `audio/`; loop repeats in `logs/loop-autocorrelation.txt`)

- **`Music_Ambient_Loop`:** a slow pad and drone. A dense sub-bass floor below ~120 Hz, and sustained tonal lines at 300–1 300 Hz that change every 5–10 s, with no percussion. Envelope autocorrelation finds no long repeat: only a weak ~2 s pulse (r 0.31). It is a through-composed 2-minute bed, not a short loop.
- **`sfx_Hero_Loop`:** broadband noise with swells every **~11.6 s** (r 0.68 at 11.5 s and 23.5 s), energy mostly below 700 Hz. An ocean or wind wash that matches the hero's sea.
- **Other section loops:** noise-textured beds with weaker periodicity: 01 ≈22 s (r 0.43), 02 ≈9.6 s (r 0.43), team ≈14.7 s (r 0.38). The files are 26–39 s, so each contains roughly two cycles of its texture.
- **`sfx_intro`:** 0–1.9 s is a broadband whoosh with a rising pitched sweep at 1–2 kHz. At 1.9 s comes a sub-bass hit (20–100 Hz, the loudest moment), then a single ~640 Hz tone with faint partials at ~2 and ~4.8 kHz, ringing out over ~5.5 s. Structure: rise, impact, ring.
- **`sfx_rock_extend*`:** dense granular crackle. Hundreds of short transients at 200 Hz–1.5 kHz with gliding streaks, densest 0.3–1.2 s: grinding stone or cracking crystal. `rock_opened_loop` is the same texture as a steady 12.8 s bed.
- **`sfx_UI_faceMorph1`:** a low buzz at 60–180 Hz pulsing in fast bursts for ~0.5 s, with a granular upper layer, decaying by 1.3 s. A digital "dissolve".
- **`sfx_particles_loop`:** a steady narrow hum at ~260–300 Hz under fizzing noise up to 12 kHz, gently modulated. A shimmer.
- **UI:** `hover` is a 60 ms two-tone blip (~3.5 kHz and ~8 kHz). `click` is two sub-bass thumps (0 and 0.2 s) with a fast burst of high ticks, crest 24.6 dB, then a low tail.

### Questions for Janriz

1. **The gate → intro:** does the intro's impact (1.9 s after the click) land with the crystal appearing on the horizon? The picture reaches it at about 2–3 s (`14-gate-hover-then-enter-with-audio`).
2. **Hero:** do the sea loop's ~11.6 s swells feel like the visible waves, or like a generic loop?
3. **Crystal hover:** does the stone-grind extend/retract feel physically tied to the blocks moving? Or is it noisy when a quick pass stacks several?
4. **Particle figures:** can you hear your pointer speed in the shimmer (it follows speed, not position)? Is that the "touching it" feeling worth copying?
5. **Section crossfades:** are the scroll-scrubbed crossfades seamless? Can you hear the loop seams of the shorter beds (02: 26 s, team: 29 s)?
6. **Levels:** the music sits at 0.5 × master 0.5, and the section loops at 1.0 × master. Does the bed get lost under the loops, and are the 0.8 UI blips too loud?
7. **Late first morph:** is the 1.6 s delay on the first team morph sound noticeable?

## 9. Type, colour, layout

### Fonts (network log, `document.fonts`, `@font-face` rules in `entry.D6d7nGTd.css`)

All three are self-hosted WOFF2 files at a single weight each, loaded with `font-display: swap`. No font is drawn inside the canvas: the bundle has no `fillText`, text geometry or MSDF, and every word on screen is HTML.

| Family (CSS name) | File, size | Used for | Licence | Nearest free alternative |
|---|---|---|---|---|
| **Hashgraph Title** (`HashgraphWeb`, 700) | `/fonts/Hashgraph-Title.woff2`, 7 KB (a small subset) | Display and headings (`h1`–`h5`, `.ff-title`), the loader title, team names | **Custom brand face**, not for sale. A wide geometric grotesk in capitals with stencil-like cuts: split crossbars on H, a joined "TI" (`logs/15-hero-title-crop.png`, `logs/21-01-copy-crop.png`) | **Space Grotesk 700** in capitals (Google Fonts, OFL) for the skeleton. The stencil cuts are bespoke |
| **Parabole Text Bold** (`ParaboleWeb`, 700) | `/fonts/Parabole-BoldText.woff2`, 31 KB | Body copy (`.body-copy`), `body` default, buttons' base family | **Paid**: ECAL Typefaces (Dávid Molnár, 2019; free for students only) ([ECAL Typefaces](https://ecal-typefaces.ch/typeface/parabole/), [Fonts In Use](https://fontsinuse.com/typefaces/212034/parabole-text)) | **Inter** or **Instrument Sans** (Google Fonts, OFL) |
| **PP Neue Montreal SemiBold** (`NeueMontrealWeb`, 600, used at 700 via `.btn-label`) | `/fonts/PPNeueMontreal-SemiBold.woff2`, 53 KB | Labels, buttons, section labels, the sound toggle, footer (`.ff-detail`, `.btn-label`), in capitals | **Paid** for commercial use: Pangram Pangram, free to try for personal use only ([Pangram Pangram](https://pangrampangram.com/products/neue-montreal)) | **Inter SemiBold** or **Hanken Grotesk** (Google Fonts, OFL) |

### Type scale (computed styles at every stop, 1440×900: `logs/probe-type-colour.json`)

On desktop the root size is fluid: `html { font-size: calc(1000vw / 1440) }` from 1024 px up, so 1 rem = 10 px at 1440 wide and every size below scales with the window. Below 1024 px the root is 62.5 % (10 px) and `--size` is 390.

| Role | Family | Weight | Size / line height | Tracking | Case | Colour | Where |
|---|---|---|---|---|---|---|---|
| Display (h1) | Hashgraph Title | 700 | 36 px / 36 px (3.6 rem / 1) | −0.02 em (−0.72 px) | as set (the face is capitals-only) | `#eeeeee` | hero, 01, 02, team titles. Lines staggered: the 2nd line is indented, and the 3rd sits between |
| Loader title | Hashgraph Title | 700 face (asked at 400) | 32 px / 32 px | 0 | — | `#eeeeee` | gate "HASHGRAPH VENTURES" |
| h2 | Hashgraph Title | 700 | 24 px / 27.6 px (2.4 rem / 1.15) | −0.02 em (−0.48 px) | — | `#eeeeee` | team member name, outro tagline |
| Body | Parabole Text | 700 face (asked at 400) | 13 px / 20.8 px (`clamp(13px, 1.3rem, 1.3rem)` / 1.6) | 0 | none | `#b7c6d4` | section copy, company blurbs |
| Labels / buttons | PP Neue Montreal | 700 (600 face) | 10 px / 12 px (`clamp(10px, 1rem, 1rem)` / 1.2) | 0 | uppercase | `#eeeeee`; the team role is `#9bb8e1` | buttons, sound toggle, section ids (`//01 MANIFESTO`), the hero CTA, footer |
| Micro | Parabole Text | 700 face | 8 px / 8 px | 0 | uppercase | `#576676` | the loader's disclaimer |

Two families at one weight each carry everything. Hierarchy comes from size, case and colour (`#eeeeee` vs `#b7c6d4` vs `#576676`), never from weight.

### Colour

**UI (CSS, measured from computed styles and colour rules):**

| Hex | Role |
|---|---|
| `#000209` | page and loader background (a near-black navy). `rgba(0,2,9,.8)` for scrims |
| `#eeeeee` | titles, labels, icons (the logo SVG fill) |
| `#b7c6d4` | body copy |
| `#576676` | muted: the loader disclaimer, the loader's logo outline (at 35 %), the progress track |
| `#9bb8e1` | the one accent: button glow and shimmer, gradient starts, team roles |
| `#2c4e73` / `#235792` | gradient ends (button border `#9bb8e1 → #2c4e73`, nav arrows `#9bb8e1 → #235792`, section-id underline) |
| `#5f87b9`, `#e3f4ff` | minor (one rule each) |

**WebGL (declared Theatre values in `logs/theatre-state.json`, converted from 0–1 RGB; not eyedropped):**

| Scene | Values |
|---|---|
| Hero | fog `#62697a`, sky fog gradient `#002194`, overlay `#004972` in "dodge" blend at opacity 1, vignette 0.74 |
| 01 | fog `#3f5564`, distance fog `#b3e2ff`, height fog white, overlay `#000573` "dodge" |
| 02 | fog `#161c2b`, overlay `#000573` "dodge" at 0.68 |
| Team | overlay `#000573`. A gradient map `#00092d → #00e0ff` is present but disabled |
| Outro | fog `#0b1828`, overlay `#000573` |
| Global | ACES Filmic at exposure 1, bloom threshold 0.247 / strength 1.405, film grain 0.94, chromatic aberration 0.95 |

The whole site is monochrome navy-to-ice-blue: the "dodge" overlays push every scene towards blue, and the only highlights are the cyan-white of the rock's core and the particles. There is no warm colour anywhere.

### Layout

- **Grid:** 12 columns from 1024 px up, with 64 px side padding (6.4 rem) and 20 px gutters. Below 1024 px, 10 columns with 28 px padding and 16 px gutters. `.gutters` use the same padding.
- **Chrome:** the logo glyph (plus the wordmark on hero and outro) sits top left at 64 px. "SOUND ON/OFF" with a wave glyph sits top right. The section id (`//01 MANIFESTO`) is bottom left. A thin vertical progress line runs at the right edge. On company pages, "Return to homepage" is bottom left and ‹ › bottom right.
- **Content vs 3D:** the 3D subject always takes the centre of the frame (the rock, the figure, the bust, the logo). The copy sits beside it in a third of the width:
  - hero: title bottom left, CTA bottom right
  - 01: title and copy left (x ≈ 155–490)
  - 02: title left, copy right (x ≈ 950–1260)
  - team: title and copy left, name and arrows bottom centre
  - outro: tagline bottom centre above the footer
- **HTML sections** are `position: fixed; inset: 0; height: 100svh` layers stacked over the canvas. All five are in the DOM at once, and each fades in only inside its band.
- **Mobile (390 px):** `--size: 390` and a 62.5 % root, so the sizes are fixed px.
  - h1 28 px / 30.8 px (−0.56 px tracking), h2 24 px, and 10 px labels, the same as desktop.
  - A 10-column grid with 28 px padding.
  - Titles move to the bottom left, with a "READ MORE" button beside them. The body copy moves into a full-screen overlay. Team names and the outro tagline are centred. The 3D subject stays centred behind.


## 10. Performance & degradation

- **Transfer** (resource timing, `probe-perf-*.json`; cross-origin Sanity portraits, ~250 KB, report 0 and are not included):
  - **4.19 MB** by the time the gate is ready (71 requests).
  - **6.07 MB** after a full tour with sound (99 requests, 11.9 MB decoded).
  - Split: JS 1.46 MB compressed (6.8 MB decoded, the main pieces being the app shell with GSAP/Lenis/Howler 2.19 MB raw, three.webgpu 1.96 MB, the scenes 1.29 MB, loaders 0.42 MB, Theatre 0.34 MB); GLB 2.15 MB; audio 1.93 MB (webm, only after "Enter with audio"); WASM decoders 0.26 MB; the water normal map 243 KB; fonts 91 KB; CSS 14 KB.
  - The mobile preset downloads the same 5.96 MB: there is no lighter asset set.
- **Paint and readiness:**
  - TTFB 0.4–1.3 s, FCP 0.52–1.73 s, CLS ≈ 0 (0.02 after the tour).
  - LCP 1.66–4.9 s, but always the loader's disclaimer `<p>`, so it measures nothing useful.
  - **Time to first action** (Enter clickable): 4.33 s, 4.56 s, 4.57 s and 5.62 s in quieter runs, and 14.3 s (desktop) and 15.8 s (iPhone preset) while other agents' captures loaded the machine. The gate waits for five scenes to compile, so it scales with CPU and GPU load.
- **Frame feel (Apple M5, WebGPU, DPR 1.25):**
  - The page's own requestAnimationFrame held **16.7 ms median, p95 ≤ 17.5 ms, with zero frames over 25 ms** through the intro, every wipe, the team morphs, the particle sweeps and fast scrolls (`logs/probe-raf-reshoot.json`).
  - The one exception is a **one-time hitch on first entering 02**: long frames of 84 + 33 ms in one session and a 667 ms stall in another, and none on a second pass (`logs/probe-raf-hitch-02.json`). My inference is a lazy pipeline or buffer set-up on the scene's first activation.
  - The first capture of each transition (`03-journey-a`) looked like dropped frames, but that was capture contention (see `logs/notes.md`). The 01→02 wipe stayed at 43–45 fps *captured* in three attempts while the page held 60, so `81-scroll-01-to-02-wipe.mp4` plays slightly choppy where the site is not.
- **Mobile tier** (iPhone 13 preset: 390×664, touch, mobile UA; `58`–`74`, `probe-type-colour-mobile.json`):
  - **Same scenes, lighter settings:** render DPR 1 (canvas 390×664), particles 4 000 instead of 8 000 on the figures and 20 000 instead of 40 000 on the portraits, shadow maps 512 instead of 1 024, water quality "low", and no fluid sim. The same GLBs, audio and gate. rAF held 60 on this machine; a real mid-range phone is untested.
  - **A mobile layout:**
    - Titles at 28 px, bottom left, with a "READ MORE" button beside them. The body copy exists only in a full-screen overlay that "Read more" opens, dimming the scene, with a "Back to homepage" button (`66-m-01-read-more`).
    - The team name and arrows sit centred.
    - The outro tagline sits centred over the footer links.
  - Touch: swipes drive the timeline (VirtualScroll touch ×3.25, so a 350 px swipe moves 0.68 units). A tap on the rock does nothing, but a swipe that crosses it opens it, because touch drags fire `pointermove` (rock extend at t 37.2 s in the mobile run log).
- **Reduced motion: no branch at all.** Nothing in the JS or CSS reads `prefers-reduced-motion`. With the setting emulated (`matchMedia` true), the fly-in, the rock opening, the wipes and the per-letter text reveals all ran exactly as without it (`76-rm-enter-intro`, `91-rm-crystal-hover`, `92-rm-scroll-hero-to-01`).
- **Other degradation:**
  - Without WebGPU, the site shows "Your device is not supported" / "This experience requires a modern browser" (its fallback copy). Three's WebGL2 backend exists behind `?forceWebgl`, but nothing selects it automatically, as far as I can see in the fetched chunks.
  - Firefox is treated like mobile (DPR 1, no fluid).
  - A hidden tab mutes the audio immediately.

## 11. Ideas worth taking

The standing constraints, numbered as in the map Notes:

1. GSAP-only animation, with ScrollSmoother rather than Lenis
2. real-HTML text
3. chat usable within 1 s, with no gate
4. reduced-motion and mobile tiers, with lazy 3D and audio
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free/self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **An object that opens around the pointer to show its core** (the hero rock).
   - **Why it fits:** it answers the roaming-bot seed better than a hotspot does. The bot's shell could part radially where the pointer is and show a lit core, the agent's "mind" (the wiki behind the chat). Opening it fully could be the way into the chat. The reaction lives on the object itself, so it needs no glow layer, and it is tied to the concept rather than a template.
   - It also rewards an idle pointer: Hashgraph centres its gate button over where the rock appears, so the effect triggers itself, a trick worth copying for the first second of State 1.
   - **Strains:**
     - Constraint 4: touch has no hover, so it needs a tap-to-open branch. Reduced motion needs a static "open" pose, or a crossfade.
     - Constraint 5: modest. The pieces are one GLB of chunks plus an emissive core. The cost is the pieces' transforms, not a simulation.
     - Accessibility: Hashgraph gives the effect no cursor change, no focus target and no HTML equivalent. Ours needs a real, focusable `<button>` over the object ("Ask me") that triggers the same opening.
   - Keep the core's brightness in the material (emissive), not in a screen bloom, to stay inside the effects rule.
2. **One timeline value drives picture, copy and sound together, and sound crossfades by *position*, not time.**
   - Here, the Theatre sequence position *is* the scroll. Scene activation, the wipes, the copy's visibility bands and each section's sound bed are all keyframes on it. A scroll that stops halfway therefore holds a half-mix (hero 0.66 + 01 0.30), and scrubbing back rewinds the sound as well as the picture.
   - **Why it fits:** it is the natural GSAP shape: one master timeline scrubbed by ScrollTrigger on ScrollSmoother, with labels as snap poses. The per-section volumes become tweens on gain values in the same timeline, so the score cannot drift from the picture. It extends Edolus's "stem mix table" idea: the mix follows the scroll exactly, not just the section.
   - **Strains:**
     - Constraint 1, if copied literally. Hashgraph uses Theatre.js keyframes on a wheel-hijacked value. Ours must be GSAP on native scroll.
     - Constraint 4: audio loads lazily after the first gesture and is off by default.
     - Assets: the beds must be self-made or code-generated.
3. **One diagonal for the whole motion system.**
   - The scene cuts are a hard straight wipe tilted about 18°. The idle button shimmer sweeps at 19.92°. The logo glyph's own geometry is triangular.
   - **Why it fits:** a single signature angle, shared by the page transitions (State 1 → State 2, section changes, a chat tool effect) and the micro-interactions, makes the motion read as a system rather than a pile of effects. It is cheap too: an HTML-layer version is a GSAP-tweened `clip-path: polygon()`, with no second 3D scene.
   - **Strains:**
     - Constraint 4: the reduced-motion branch is a plain crossfade.
     - The angle should come from our concept's own geometry, not be copied, or it becomes decoration.
4. **Particle figures made from real content.**
   - Team photos are sampled into 40 000 particles in a worker, and next/prev morphs one face into another. The outro logo is a particle sculpture that the pointer pushes around like sand.
   - **Why it fits:** Janriz's portrait or project imagery could re-form in the same way when the chat's `highlight_project` tool fires. The content is real (from the CMS), not decoration.
   - **Strains:**
     - The effects rule: generic unless the concept needs particles.
     - Constraint 5: compute particles need WebGPU, or a lighter WebGL points version. Mobile halves the count here.
     - Constraint 4: reduced motion needs a still.
5. **Performance craft that holds 60 fps.**
   - A fixed render DPR (1.25 on desktop, 1 on mobile and Firefox) whatever the screen's DPR.
   - During a transition, the two active scenes render on alternate frames.
   - Mobile halves particle counts and shadow maps and drops the water quality and the fluid sim.
   - Master volume is a GSAP tween, and a hidden tab mutes at once.
   - **Why it fits:** each of these directly serves constraint 5 on unknown laptops.
   - **Strains:** none.
6. **An honest, equal-weight sound choice** ("Enter with audio" / "Enter without audio", with one line of why).
   - **Why it fits:** Janriz wants sound after a gesture and liked the headphones invite. The *wording* and the equal choice are worth keeping.
   - **Strains:** constraint 3 if used as a gate, as it is here. Ours must be a non-blocking invite beside the chat, not a door in front of it.
7. **Fluid rem** (`html { font-size: calc(1000vw / 1440) }` from 1024 px up).
   - **Why it fits:** the whole desktop composition scales as one piece with the window, which suits a layout framed around a 3D object.
   - **Strains:** accessibility. A vw-based root size ignores the user's font-size setting, so clamp it, or use it only for spacing.

**What to avoid:**

- **A WebGPU-only gate in front of everything.**
  - The canvas starts 1.2 s after mount, and "Enter" waits until all five scenes are loaded and compiled (4.3–5.6 s in quiet runs, 14–16 s under load).
  - LCP lands on the loader's disclaimer paragraph, so the metric says nothing about readiness.
  - Without WebGPU, the site shows "Your device is not supported" copy (the setters are never called in the chunks I fetched, and three's WebGL2 backend exists as `?forceWebgl`).
  - This breaks constraints 3 and 5 outright.
- **Wheel hijack with narrow visibility bands.**
  - There is no native scroll and no scrollbar, and home sections have no deep links.
  - Each block of copy is visible only in a 0.4–0.9-unit band around its snap point, so reading means parking, and a fast scroll skips the copy entirely (`51`, `52`).
  - The text is real HTML (good for constraint 2 and SEO), but a visitor only sees it in those windows.
- **Hidden, affordance-free interactions.** The rock and the particle pushes are raycasts with no cursor change, no DOM target and no keyboard or touch equivalent. Eight sweeps (127 points) found nothing in the DOM.
- **Invisible focus** (`button { outline: 0 }`, no `:focus-visible`) and a transparent `::selection`.
- **The generic post stack:** bloom, film grain, chromatic aberration, vignette blur and a blue "dodge" overlay on every scene. The effects rule bans these for us, and they are the least Hashgraph-specific part of Hashgraph.
- **SFX that load on first use** (the first morph sound came 1.6 s late) and **loops tied to `pointermove`** (the rock loop kept playing after scrolling away). Preload interaction sounds after the first gesture, and tie their state to the timeline.
- **No reduced-motion branch.** It was verified to ignore the setting entirely: the fly-in, the rock, the wipes and the letter reveals are unchanged.
- **A mobile tier that only lowers quality, not cost:** the same 6 MB, the same gate and the same compile wait. On mobile, the body copy of every section is hidden behind a "Read more" overlay.
- **The gate on every route and every visit,** including deep links and the privacy page, with no remembered choice.

## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | cold landing, DOM/runtime/perf probes, a scroll check (no effect before the gate) | `screenshots/01`–`02`; `probe-dom-landing`, `probe-runtime-landing`, `probe-perf-landing` |
| `02-recon-sections.js` | gate → enter with audio → wheel-scale check → company page (its section stops were mis-aimed and deleted) | `screenshots/05`, `06`, `11`; `probe-sound-recon.json` |
| `03-journey-a.js` | desktop with sound: cold load → gate → intro → hero sweep and hold → each section → team morphs → outro → fast scroll → toggle | `12`–`23`, `25`, `29`, `31`, `34`, `36`; `probe-sound-timeline-a.json`. Its contended clips were deleted and reshot in 04/09 |
| `04-journey-b.js` | desktop without audio: reshoots with page-rAF logging, type/colour at every stop, keyboard, hero CTA, company page | `40`–`57`; `probe-raf-reshoot.json`, `probe-type-colour.json`. It failed at the company arrows (they are `<a>`, not `<button>`); run 09 finished those steps |
| `06-mobile.js` | iPhone 13: cold load → tap enter → touch the rock → swipes through every section → Read more → team next | `58`–`75`; `probe-type-colour-mobile.json`, `probe-sound-timeline-mobile.json` |
| `07-reduced-motion.js` | `prefers-reduced-motion: reduce`: intro, rock hover, one wipe | `76`, `77` (the 78/79 clips were reshot as 91/92) |
| `09-hitch-02.js` | 01→02 twice with page rAF (one-time hitch test), 02 sweep, company next ×2, return, cold deep link, privacy page | `81`–`90`; `probe-raf-hitch-02.json` |
| `10-rm-reshoot.js` | reduced-motion rock hover and wipe, reshot | `91`–`93` |
| `08-type-colour.js` | the type/colour probe functions (run inline by 04 and 06; standalone with `MOBILE=1` optional) | — |
| helpers | `_probe.js` (DOM/runtime/perf probes), `_hv.js` (timeline state, `toY`, mix sampler, first-action poll), `_fetch-src.js`, `_fetch-audio.js`, `_envelope-ac.js` | `logs/src/`, `audio/`, `logs/loop-autocorrelation.txt` |

Detail crops in `logs/`: `17-crystal-open-detail.png`, `22-figure-pointer-detail.png`, `48-outro-scatter-detail.png`, `14-gate-button-hover-detail.png`, `15-hero-title-crop.png`, `21-01-copy-crop.png`, `spectro-minor-sfx.png`. `superseded-05-reshoot-transitions.js` never got a capture slot and was folded into 04.
