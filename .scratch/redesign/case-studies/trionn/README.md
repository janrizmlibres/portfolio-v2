# Case study — Trionn

Captured 2026-09-27, headless Chromium with the GPU (ANGLE Metal, Apple M5; every run printed the Metal renderer), 1440×900 at DPR 2 for desktop and the iPhone 13 preset for mobile. Every clip in `motion/` has a median frame interval of 16.6–17.1 ms (60 fps); stats per clip are in `logs/run-*.json`. Five have a p95 above 25 ms, and none of them is from contention:
- 21, 23 and 25: the screencast idles during scroll pauses while the page itself holds 60 fps (a page-side rAF probe measured p95 18.3 ms; §10).
- 41 and 55: each includes a full page load.

Working notes, including each run and every gotcha: `logs/notes.md`. The site's own JS is saved in `logs/src/` (pretty-printed in `logs/src/pretty/`); line numbers below refer to those pretty files.

## 1. At a glance

| | |
|---|---|
| URL | https://trionn.com/ |
| Awwwards | https://www.awwwards.com/sites/trionn-2. **Site of the Day, 27 Jul 2026 (7.42)** and **Developer Award (7.05)**. SOTD categories: design 7.4, usability 7.15, creativity 7.77, content 7.63. Dev categories: semantics/SEO 6.80, animations 7.60, accessibility 6.60, WPO 7.00, responsive 7.20, markup 7.00. Source: `logs/awwwards-page.txt` (a WebFetch extract, not a verbatim copy) |
| Studio | **Trionn** itself (an independent design and development studio in Rajkot, India; this is its own site). Awwwards credits Trionn (PRO) and **Sunny Rathod** |
| Awwwards tags | Design Agencies, Technology, Web & Interactive, Animation, Portfolio, 3D, Interaction Design, Microinteractions, 404 pages, GSAP, Three.js, Next.js. Its "Elements" list: footer hover interactions, culture section, 3D curved Dribbble showcase, interactive lion, draggable team section, floating project gallery, 3D hero, preloader, page transitions, 404 typography |

**Gist.** A studio portfolio built as a Next.js app with a long, pinned GSAP ScrollTrigger home page on Lenis smooth scroll. The hero is the studio's own logo mark, extruded in Three.js into dark, glassy metal shards that assemble on arrival, fly apart as you scroll, and reassemble. Everything above the fold is real HTML text over that canvas. Below the hero, the page moves from black to light grey sections: a marquee, a stripe wipe, flip-up key-fact cards, a horizontal work track, a services section with an image-sequence "stone" and a thunder bed, testimonials, a curved 3D "Dribbble" gallery and a footer whose hairlines are a playable harp. Sound is off by default; one toggle turns on a small, carefully mixed palette of samples plus code-synthesized sound (a brown-noise rumble, a sine-tone harp), plus a robot voice for the team scanner.

**Most memorable thing.** **"Hold to blast."** Press and hold anywhere on the hero:
- for half a second the whole page trembles: the headline, CTAs and nav shake by a couple of pixels while a synthesized sub-bass rumble builds;
- at 0.5 s the logo **shatters** (a glass-shatter sample, a whoosh swelling to full volume) and the entire HTML layout comes loose and floats in 3D perspective, tilting up to 25°;
- on release the UI springs back in 0.6 s, the shards fly home and a low "join" thud lands.

It turns the page's own text into part of the explosion, and it is pure play with no content behind it (`10-hold-to-blast.mp4`, `11-blast-peak.png`). Its sibling, **"Dare to touch the lines"**, puts three faint curves across the hero; touching one throws blue lightning between the lines with an electric crackle (`08-touch-the-lines.mp4`, `logs/08-lines-weld-detail.png`). Two more moments reward the hand: on /about, dragging a lion-masked team portrait onto a scanner makes a robot voice say "Identifying… Detected." before the person lifts off the mask (`77-rm-about-team-drag-to-scanner.mp4`), and the footer's hairlines are a harp of synthesized notes (`31-footer-lines-hover-click.mp4`).

## 2. Tech found

| What | Found | How detected |
|---|---|---|
| Framework | **Next.js App Router with Turbopack** (React Server Components payloads `?_rsc=…`, `self.__next_f`, `TURBOPACK` chunk arrays), React | globals in `logs/probe-runtime-landing.json`; `/_next/static/chunks/*.js` requests |
| Animation | **GSAP 3.15.0** + ScrollTrigger (pins, scrubs), SplitText (the aria-aware 3.13+ build), `@gsap/react` `useGSAP`. ScrollSmoother, Flip, Observer, Draggable and InertiaPlugin are bundled too, but the home page drives scroll with Lenis | `version: "3.15.0"` in the chunks; `e.s(["SplitText"…])`, `e.s(["ScrollSmoother"…])` exports; `window.gsapVersions` |
| Smooth scroll | **Lenis 1.3.23** via `ReactLenis root`: `lerp 0.105`, `duration 1.05`, easeOutCubic, `smoothWheel`, `syncTouch`, **`wheelMultiplier 0.6` on Mac, 0.85 elsewhere**, touch 1.1–1.2. `html.lenis` class, native scrollbar kept | `var t = "1.3.23"` in `0z-5e_9x.n-.p.js`; options object in `0.t3mu8kba_-e.js:736`. Measured: 900 px of wheel moved `scrollY` 270 at DPR 2 (÷2 synthetic-wheel quirk × 0.6) |
| 3D | **Three.js r128** (`window.__THREE__ = "128"`), several independent `WebGLRenderer`s: the hero logo (`TrionnSymbolAnimation`, `1233qowaitufq.js`), the curved Dribbble gallery (`0.924d2y-5_87.js`), the footer canvas, the 404 hero (a copy of the home hero), plus WebGL/2D canvases on /about (lion shader + curtain), /services (orbit) and /trionn-story (galaxy, line canvas). A shared `getCanvasManager()` registers each render loop and pauses it with an IntersectionObserver when off screen | bundle grep for `WebGLRenderer`, `getCanvasManager`; 3 canvases in the home DOM probe |
| Image sequence | **371 WebP frames** (`/images/stone/frame_0001–0371.webp`) drawn to a canvas, scrubbed by the services progress | network log; `0sue_k2sp00no.js` (`/images/stone/frame_${…}.webp`, `370 * scrollT`) |
| Video | 6 `<video>`s (awards card, team portrait, services loop), each shipped in a desktop and an `_m` mobile encode, **both downloaded on desktop** | DOM probe + network log |
| Audio | **Raw Web Audio** (`AudioContext`, `AudioBufferSourceNode`, `GainNode`, `BiquadFilter`, a `ScriptProcessor` noise generator, `OscillatorNode` synth voices) plus `<audio>` elements for the thunder bed and the robot voice. No Howler or other library | `useTrionnSymbolAudio` (`1233qowaitufq.js:5–201`), footer synth (`0.t3mu8kba_-e.js:470–560`), voice (`150d1p-43jycd.js:137–176`); play hooks in the run logs |
| Fonts | **Neue Haas Display Roman**, **PP Editorial New Ultralight**, **Martian Mono Light**, **Familjen Grotesk Variable**, self-hosted through `next/font` (`/_next/static/media/*.woff2`, 98 KB total). Roboto arrives with reCAPTCHA | `document.fonts`; network log. Licences in §9 |
| Other | Tailwind CSS v4 (utility classes, `--color-*` tokens), Swiper (CSS vars), Google Analytics (gtag), **reCAPTCHA v3 loaded on every page** (346 KB of JS) for the contact form | class names, CSS vars, network log |
| Rendering | DOM-first: all copy is HTML; canvases sit behind (`z-0`, `pointer-events: none`) with a `mix-blend-mode: difference` text layer over the hero | DOM probe, `logs/probe-hero-pointer-events.json` |

## 3. Intro & loading

`01-cold-load.mp4` (sheet: `01-cold-load.sheet.png`), times from navigation start on a cold cache:

| t (s) | What is on screen |
|---|---|
| 0–2.0 | Blank white (FCP 2.04 s, TTFB 0.98 s) |
| 2.0–2.5 | Grey (#d2d2d2) full-screen loader: a single "+" at the centre |
| 2.5–5.5 | A square frame with corner ticks draws itself around the Trionn mark. The mark's three strokes slide in, then the tagline **INSPIRE · INNOVATE · IMPACT**. At the bottom a **three-reel slot-machine counter** spins up to 100 |
| 5.5–6.5 | Tagline and counter fade out (0.4 s). The logo pieces fly apart, and the grey overlay fades out over 0.7 s onto black |
| 6.5–8.4 | The header appears; the 3D shards **fly in from the exploded pose and assemble** (`introAmt` decays ×0.975 per frame). The headline "Designed to / mean something." blur-reveals character by character (delay 1.2 s, stagger 0.08); the lines draw outwards from the logo |
| **8.40** | `html[data-trionn-ready="true"]` (`trionn-loader:complete`), Lenis starts, scroll unlocks. The headline was visible from 8.18 s (`logs/probe-ready-desktop.json`) |
| 9.9 | LCP, one headline character `div.chars` (47 498 px²) |

- **What it covers:** fonts, the first JS and React hydration, the hero's Three.js set-up and shader compile, and the first frames of the home videos. It does **not** cover the heavy assets: the 371 stone frames keep downloading until about 28 s.
- **Skippable?** No. There is no skip control, and scroll is locked (`stopped: true` in Lenis) until it ends.
- **Once per visitor?** No. The provider keeps nothing in storage, so it plays on **every full page load**, including direct visits to /work (about 3 s there with a warm cache, `41-work-page-gallery.mp4`) and the 404. Client-side navigations reuse the same overlay as a page transition (§4).
- **Before the loader hands over**, the header's sound button already answers `elementFromPoint` at 1.29 s: the grey overlay lets pointer events through, but the button is covered and invisible. There is nothing to act on until about 8.2 s.
- **Mobile:** see §10.

## 4. Navigation & page transitions

- **Structure:** a multi-page Next.js app: Home, Work (+ case pages), Services, About, Contact, "Trionn Name Story", and a 404. In-app links are `TransitionLink`s that wrap `next/link` with a transition. A full reload of any URL replays the loader (§3).
- **Page transition, home → about** (`45-transition-home-to-about.mp4`) and **about → home** (`52-transition-about-to-home.mp4`), about 3 s each way:
  1. On click, the link cancels navigation, sets the transition label (the page name) and dispatches `trionn-transition:start`. That event mutes the site sound and closes the menu.
  2. **Ten grey (#d2d2d2) horizontal "belts"** slide in from alternating sides and close over the page (`pl-belt`, hand-written rAF easing, easeOutCubic).
  3. When the belts are shut (`belts-closed`), the router pushes the new route with `window.scrollTo(0, 0)`. The label ("ABOUT") sits at the centre between four "+" marks, the same frame as the loader.
  4. The belts part, the new page's headline blur-reveals word by word, and `trionn-transition:complete` restores the sound.
  - Both directions use the same cover; only the label changes. It is the loader's overlay reused, so the site has one transition language from first load to every route change.

- **Menu** (`37-menu-open-hover-close.mp4`, `37-menu-open.png`). The "MENU ≡" pill opens a white panel at the top right.
  - **Open:** `clip-path: circle(0% at 95% 5%)` → `circle(150% at 0% 5%)` with `scale 0.9 → 1` and `rotation 2° → 0`, 1.2 s `expo.inOut`. The items (Work, Services, About, Contact) then rise 20 px and fade in with a 0.1 s stagger, followed by "✦ THE TRIONN NAME STORY", the email, phone and socials.
  - **Hover:** hovering an item dims the others to 0.4 opacity (0.45 s `power3.out`), and its `HoverBlur` text blurs out and back in letter by letter.
  - **Close:** the same timeline reversed at 1.75× speed. The menu also closes when you scroll 50 px, press outside it, resize, start a blast or start a page transition.
  - **Mobile:** a full-screen black sheet slides in from the right (0.8 s `expo.inOut`), and the burger lines redraw into a cross with `strokeDashoffset`.
- **HoverBlur** (`0_-x7hddx_1l6.js`, module 3918), used on every nav label and pill. The label is split into one `<span>` per character, twice: an original layer and a clone layer.
  - **On `mouseenter`:** the original letters fly ±10 px (alternating up and down), fade and blur to 5 px (0.3 s, stagger 0.025, `power2.in`) while the clone letters fade in (0.4 s, stagger 0.04).
  - **The accessibility cost:** neither layer has `aria-hidden` and the link has no `aria-label`, so each link's accessible name is the text twice: `textContent` reads "AboutAbout" and "let's talklet's talk". It also broke the text selectors in the first pages run.

## 5. Scroll behaviour

**Native scroll, smoothed by Lenis.** The document really is 24 597 px tall at 1440×900 (max `scrollY` 23 697, because the footer is pulled up 100 dvh over the last pin). The scrollbar, `scrollY`, find-in-page and keyboard scrolling all work. Lenis eases wheel input (`lerp 0.105`) and, on Mac, **scales the wheel to 0.6**, so the page moves 60 % as far as a trackpad on a native page. That makes the long pins feel heavier. ScrollTrigger runs on the same native scroll. No snapping anywhere. Desktop layout, from `layout` in the journey run log and the bundle's triggers:

| scrollY | Section | What scroll does | Clip / still |
|---|---|---|---|
| 0–900 | **Hero** (`#hero-section`, dark #0c0c0c) | Canvas pinned `+=400 %` with `pinSpacing: false`. The logo bursts apart from 0.1 vh to 1 vh and reassembles by 1.8 vh; the lines un-draw over 0.08–0.52 vh; the woosh bed follows the burst | `13-hero-scroll-explode-reassemble.mp4` |
| 900–1800 | **About** ("Trionn is an independent digital studio…") | Scrubbed per-word blur reveal (`BlurTextReveal`, `scrub`, start "top 80 %"), over the exploded logo. The text layer uses `mix-blend-mode: difference` | `15-about-exploded.png` |
| 1800–4500 | **Vision** (pinned `+=200 %`, `scrub 0.6`) | "IMPACT + INSPIRE + INNOVATE" marquee over the reassembled logo. Then **5 grey (#d2d2d2) stripes scale up from the bottom**, each growing over 0.3 of the timeline and starting 0.075 after its neighbour (bottom-most first), and wipe the page from black to light grey. The keyfacts section is pulled up under it with a negative margin | `17-vision-marquee-stripes.mp4`, `14-vision-reassembled.png` |
| 3600–4679 | **Key facts** (gradient #d2d2d2 → #ffffff) | "Key facts" blurs in; three cards **flip up from `rotateX`** one after another (`scrub 2`, stagger 0.6): a lion mascot in a red suit holding a trophy (50+ awards), "1.5K+" projects, the lion again (20+ team). Partner logos follow | `19-keyfacts-cards.mp4`, `18-keyfacts.png` |
| 4679–17 729 | **Work → Services** (one pin, **13 050 px**) | First a **horizontal track** of project cards (MyWorker AI, Pulse Studio, Loftloom…) with vertical hairline dividers. Each card rises 550 px into place as it nears the centre, and its rule lines draw in. Then a white services panel slides over from the right ("A.I. / DESIGN / DEVELOPMENT / BRANDING" in huge condensed caps), which fades into a **storm-cloud video** with a falling rock. The service words break into flying letters, and a **371-frame WebP sequence** turns the rock into a stone slab with the Trionn logo carved into it. Floating service cards (Web Development, Branding, Product Design…) circle it in 3D. The thunder bed fades in at y ≈ 8100 and out by y ≈ 16 300 | `21-work-track.mp4`, `23-services-thunder-stone.mp4`, `25-services-to-testimonials.mp4`, stills 20, 22, 24 |
| 17 729–18 712 | **Testimonials** (gradient #ffffff → #c3c3c3) | Ordinary reveal | `26-testimonials.png` |
| 18 710–23 697 | **"Design in motion"** Dribbble gallery (pinned `vh × 6.5`, #c3c3c3) | Two huge words slide in from the sides. A **curved WebGL ribbon** of Dribbble shots (textured planes with 116 segments, bent on the CPU) sweeps through space towards the camera, then settles into a flat floating grid of cards | `27-testimonials-to-3d.mp4`, `29-3d-section-to-footer.mp4`, `28-3d-section-mid.png` |
| 23 697 (end) | **Footer** ("Ready to build something bold?") | Slides up over the gallery. Smoke shader plus the harp lines (§6) | `30-footer.png`, `31-footer-lines-hover-click.mp4` |

- **Scroll-linked vs time-based:** everything structural is scrubbed to scroll (logo burst, stripes, cards, track, image sequence, ribbon). Time-based: the intro, the headline's rotating word, the logo's auto-spin, the line pulses, the smoke and every sound.
- **Velocity:** no velocity effects (no skew, no stretch). A fast 25 000 px flick back to the top (`33-fast-scroll-to-top.mp4`) just replays every scrubbed state in reverse, and the thunder pops back in for a moment on the way through.
- **Scroll lock:** Lenis starts `stopped` until the loader finishes, so you cannot scroll during the intro.

## 6. Cursor & micro-interactions

No custom cursor: the system arrow everywhere (the arrow in the clips is the capture overlay). Found by clips, hover sweeps (`h.sweep`, a grid of pointer stops logging the element, cursor and `:hover` target), a listener registry (`probe-listeners-*.json`), and reading each handler in the bundle.

### Hero (all inside `#hero-section`, scroll < 0.15 vh)

- **Hold to blast** (`1233qowaitufq.js:611–622`, and the per-frame block at 428–447).
  - **Trigger:** a left `mousedown` on `window` whose target is inside `#hero-section` but not a link, a button, `#sound-toggle` or `#keyfacts-section`. It only works while scroll is below 0.15 vh and the vision text is off screen; a press at 1 vh does nothing (`16-hold-when-scrolled.mp4`). It dispatches `trionn-blast:start`, which also closes the menu.
  - **0–0.5 s, the tremor:** `vibrateAmt = 1`. The HTML elements listed in `vibrateElementIds` get `translate(sin·2.5 px, cos·1.5 px)` every frame, the shards jitter by 0.018 units, and a synthesized rumble fades in (§8).
  - **At 0.5 s, the blast:** the rumble stops, the shatter and whoosh start, and `clickBurst` climbs 0.02 per frame, reaching 1 in about 0.83 s. From 0.7 s of holding, each HTML element floats on its own phase: `perspective(600px) translate(≤30 px, ≤20 px) rotateX(≤25°) rotateY(≤20°) rotateZ(≤15°)`. The headline, CTAs, nav pills and the stats card drift like debris (`11-blast-peak.png`, middle rows of `10-hold-to-blast.sheet.png`).
  - **Release:** the elements spring home with a 0.6 s CSS transition, `cubic-bezier(.25,.46,.45,.94)`. `clickBurst` falls 0.025 per frame (about 0.67 s), so the shards reassemble. A "join" thud plays only if the blast was at full strength (`clickBurst ≥ 0.98`).
  - A **0.3 s tap** gives only the tremor and rumble, no blast (`09-hold-short-0.3s.mp4`). **Dragging while blasted** changes nothing: the canvas's own drag-to-rotate listener sits on a canvas whose wrapper is `pointer-events: none`, so it never fires on desktop (`logs/probe-hero-pointer-events.json`, `12-blast-drag.mp4`).
  - The copy says "HOLD TO [blast icon] BLAST" under the CTA block. It is `hidden lg:flex`, so it is **not shown below 1024 px**. On touch the handler needs a `mousedown`, which a long press never sends, so the blast is desktop-only (§10).
- **Shard hover** (lines 420–424, 448–455). Every frame (scroll < 0.08 vh, no blast running) a `Raycaster` tests the pointer against the shard meshes. Entering a new shard **flashes that face**: env-map intensity 3 → 4.6, roughness 0.08 → 0.02, transmission 0.35 → 0.67, opacity 0.88 → 0.72, decaying ×0.92 per frame. It also plays `hover-beep.mp3` at 0.7. In the 19 s, 6×5 sweep over the logo the pointer entered a new shard 44 times, each with a beep (128 beeps over the whole run, since every glide across the hero hits shards) (`07-logo-hover-sweep.mp4`, crop `logs/07-logo-sweep-detail.png`). **The DOM never knows**: all 30 sweep points returned HTML container divs with cursor `auto`, so nothing signals that the logo is touchable.
- **Touch the lines** (lines 472–534). The proximity test (14 px) runs against the three projected curves. Crossing one triggers the lightning weld with `hero-spark.mp3` (§7, §8). Four vertical passes in `08-touch-the-lines.mp4` fired it 13 times. The lines also pass through the logo, so the logo sweep fired it 11 more times.
- **Pointer lean:** the logo group eases (0.06) towards `0.22 × pointer` on both axes.
- **Headline word rotation** (`13xgo04nefn8q.js:20–24`). "Designed to / mean ___." cycles through *something. → depth. → impact. → purpose. → intention.* Each swap blurs the old word's characters out (`autoAlpha 0`, `blur(12px)`, `power2.in`, random-order stagger) and blurs the new one in. This is time-based, not interactive.

### Elsewhere

- **Footer harp** ("SOUND ON ♪ HOVER THE LINES."). The giant "TRIONN" at the foot of the page is drawn entirely in short horizontal SVG hairlines (#d8d8d8, 0.6 px, `vector-effect: non-scaling-stroke`). Each visible stroke has a transparent 12–18 px-wide clone on top as its hit area, with `mouseenter` and `click` listeners (350 paths in all).
  - **Hover** sets the string's `amp` to 7 px and `speed` to 18, then GSAP tweens both to 0 over 0.9 s `expo.out`. Every frame the path's `d` is rebuilt as a 26-point sine with 2.2 cycles, so the string visibly vibrates and settles (crop `logs/31-footer-harp-detail.png`).
  - **Click** plucks harder: amp 11, speed 26, 1.1 s.
  - Each pluck plays a synthesized note and pulses the smoke shader behind (§7, §8).
  - Four zig-zag passes across the footer triggered 508 notes (`31-footer-lines-hover-click.mp4`). Cursor: `tw-cursor-pointer` class on the strings.
- **About: "Dare the lion. Drag the strips with sound on."** (`0579sn.qr398q.js`, `47-about-lion-curtain.png`, `48-about-lion-curtain-drag.mp4`).
  - **Set-up:** a WebGL lion portrait with an orange glowing visor sits under a full-width 2D canvas of horizontal grey strips (`cursor: ns-resize`).
  - **Drag:** press and drag vertically and the strip nearest the pointer follows it, bending its neighbours and parting the curtain to show the lion's face.
  - **Sound:** `curtain.mp3` loops (between 0.1 and 1.5 s of the file) while you drag, measured at gain 0.93. Once a strip has been bent more than 15 px for 0.5 s, **`lion-growl.mp3`** plays from a random offset: 0.6 s into our drag. Release plays a 0.4-gain curtain tail.
  - Moving the mouse without pressing only eases the lion's shader towards the pointer (`mouseEase`, 0.07 lerp).
- **About: team scanner** ("Our team", **"DRAG A MEMBER TO IDENTIFY"**; on touch "TAP A MEMBER TO IDENTIFY").
  - Fourteen portrait cards (`.vcard`, every member wearing a lion mask) float and drift. Each can be picked up (`mousedown` on the card, document `mousemove`/`mouseup`). Dropped anywhere but the scanner, it floats back to its place (`50-about-team-drag.mp4`).
  - Dropping one on the scanner box runs a GSAP sequence: scan grid, glitch, corner brackets, a typewriter name and role. The site's **robot voice** says "Identifying." then "Detected." (`speakRobotic`, the same clips as the contact form).
  - **Captured** (`77-rm-about-team-drag-to-scanner.mp4`, crop `logs/77-team-scanner-detail.png`, stills 76 and 78, shot with reduced motion on; the sequence ignores it). The card snaps into the box and dims, and a red corner bracket sweeps it while "IDENTIFYING…" types in and `identifying.mp3` plays. 3.7 s later two synth oscillator blips and `detected.mp3` mark the match. Then the portrait becomes a short video of **that team member lifting off the lion mask** (`/video/team/prabhat.mp4`, `gaurav.mp4`, …).
  - It is the site's best drag moment: a real reward (a face and a name) for a physical gesture, voiced like an AI scan.
- **Key facts cards:** the first card is a looping video of the lion mascot roaring and lifting a trophy (`awards-card-video.mp4`, `39-keyfacts-lion-video-card.mp4`). The cards do not respond to hover or drag.
- **/work "Our work"** (`41-work-page-gallery.mp4`, `42-work-page.png`). Project thumbnails float at different depths around the title. Scrolling pulls them past the camera like a tunnel, and a looping `work-listing.mp3` plays at 0.6 with sound on. The 4×2 hover sweep found only the title container and cursor `auto`.
- **Buttons and links:** nav labels use HoverBlur (§4). The mono CTAs ("DISCUSS YOUR PROJECT →") are a `WordShiftButton` with a 1 px underline; its hover was not captured in close-up. The sound toggle brightens its background from 10 % to 20 % #d9d9d9.

## 7. 3D / WebGL

### The hero logo (`TrionnSymbolAnimation`, `logs/src/pretty/_next_static_chunks_1233qowaitufq.js:202–675`)

**What is rendered.**
- The Trionn mark is three hand-coded bezier `Shape`s (the three strokes of the logo) passed to `ExtrudeGeometry` (depth 0.42, bevel 0.008/0.006, one segment). No model file is loaded.
- Each extrusion is then **split by face normal**: triangles are grouped by their rounded normal, and every group becomes its own mesh. That is where the "shards" come from. Each shard stores an explode direction (60 % away from the shape's centre, 40 % along its normal), a random spin axis and speed, and a random delay of 0–0.25.
- Two `EdgesGeometry` outlines per shape (#363e4d at 8 % and 5 % opacity, the second scaled 1.004) give the hairline edges.
- Material: `MeshPhysicalMaterial` #3a3d42, emissive #1a2030 at 0.15, metalness 1, roughness 0.08, **transmission 0.35, ior 2.4**, clearcoat 1, opacity 0.88, double-sided. Its environment map is a **256 px `CubeCamera`** of the scene itself, refreshed only every 6th frame and only while blasting, dragging or holding.
- Lighting does the colour work: ambient #2a3040 ×2.8, eight directional lights (white, #8899aa, #ccddee, #aabbcc, four #6677aa rims) and **three orange point lights** (#ff3300 ×12, #ff2200 ×9, #ff5500 ×6) that orbit on sine paths. The orange glints sliding across the dark metal are these lights, not textures.
- 200 orange points (#ff3300, 0.022, 35 %) float behind, hidden below 768 px.
- Renderer: antialias, clear #0c0c0c, ACES Filmic tone mapping at exposure 1.1, **DPR capped at 1.5 on desktop and 1 below 768 px**. Camera by breakpoint: fov 42 / z 6 above 1440 px, 40 / 6.28 at 1024–1440, 38 / 7.55 at 768–1024, 36 / 9.35 on phones.

**One number drives it.** Every frame each shard sits at `explodeDir × 5.5 × max(0, p − delay)`, with its spin scaled the same way, where `p = max(scrollProgress, clickBurst, introAmt)`:
- `introAmt` starts at 1 and decays ×0.975 per frame, so on arrival the shards fly *in* from the exploded state (the assembly in `01-cold-load.mp4`).
- `scrollProgress` follows scroll ÷ viewport height: 0 up to 0.1 vh, rising to 1 at 1 vh, held to 1.2 vh, back to 0 at 1.8 vh, eased with a 0.06 lerp. The logo bursts as the about text arrives and reassembles for the vision marquee (`13-hero-scroll-explode-reassemble.mp4`, `15-about-exploded.png`, `14-vision-reassembled.png`).
- `clickBurst` is the hold-to-blast value (§6).
- The group auto-rotates 0.0042 rad per frame (0.0015 with reduced motion) and leans up to 0.22 rad towards the pointer.

**The lines.** A full-screen 2D canvas is uploaded as a `CanvasTexture` onto an orthographic quad drawn over the 3D scene each frame.
- It holds three quadratic curves. Each runs from the left edge of the screen to the right edge and passes through an anchor point on the logo, re-projected every frame, so the lines stay pinned to the turning mark.
- The curves wobble slowly (two sines), draw outwards from the logo after the intro (+0.0205 per frame), and un-draw as you scroll from 0.08 to 0.52 vh.
- Pulses travel along them with an orange-to-blue gradient, and small node dots with breathing rings sit at their midpoints.
- **Weld sparks:** when the pointer comes within 14 px of a line, 5–6 bursts of 3D lightning jump from that point to the nearest points on the other lines. Each bolt is a 10-point jagged `Line` in a random blue-white (#ffffff, #88ddff, #44aaff, #0066ff, #00ccff, #aaddff, #0044cc), with three additive glow lines (#0033cc, #3399ff, #99ddff) and six additive cylinder "glow tubes" (#000d33 → #bbddff). A point light (#aaccff, 12–20) travels along the bolt. Each bolt lives 50–140 ms.

**Technique summary:** procedural geometry, a physical material with a self-reflecting cube map, orange lights as the only accent, and a 2D-canvas overlay composited in the same WebGL pass. No post-processing (no bloom, no composer) and no custom shaders in the hero. The glow is layered additive geometry.

**Reacts to:** time, scroll, pointer position (lean and raycast), press-and-hold, and the lines' proximity test. It pauses (loop suspended, sounds stopped) once its ScrollTrigger passes 80 % of its +400 % pin.

### The other scenes

- **"Design in motion" Dribbble gallery** (`0.924d2y-5_87.js`, pinned `vh × 6.5`). A second `WebGLRenderer` on a transparent canvas over the #c3c3c3 section.
  - Dribbble shots are `PlaneGeometry(1, 1, 116, 1)` strips whose vertices are bent on the CPU into a ribbon. A two-line `ShaderMaterial` samples the texture and mirrors the UV on front faces, so the ribbon reads correctly from both sides.
  - Six `/images/orbit/*.jpg` cards use a rounded-corner fragment shader (`uRadius 8`).
  - The whole scene is scrubbed by the pin and moved by `gsap.ticker`. There is no pointer interaction (`27-testimonials-to-3d.mp4`).
- **Services stone** (`0sue_k2sp00no.js`). This is not 3D: a storm-cloud `<video>` (`homepage-services-video.mp4`, 1280×720, 10 s loop, with a separate `_m` encode for phones), plus the **371-frame WebP sequence** drawn to a canvas, with `videoIdx` easing (0.12) towards `370 × progress`. The frames are only visible between progress 0.35 and 0.53. The 3D feel of the floating service cards is CSS `perspective: 93.75rem` on HTML.
- **Footer smoke** (`0.t3mu8kba_-e.js:125–145` and around character 24 400). A raw WebGL1 context, no Three.js, draws a full-screen fbm-noise fragment shader. **It listens to the harp:** an `AnalyserNode` (fftSize 64) sits on the harp's output. The average of the lower half of its spectrum, plus a pulse (0.4 per hover pluck, 0.9 per click) that decays ×0.9 per frame, drive the smoke's density and speed. Playing the strings makes the smoke swell (`31-footer-lines-hover-click.mp4`).
- **404 page** (`04srvx.z7_jun.js`) repeats the whole hero with its own `vibrateElementIds` (the nav and the 404 text), so the error page can be blasted too.
- **Other pages** (their chunks are in `logs/src/`, and `04-pages.js` plus `07-about-contact.js` visit /about, /work and the 404): /about has a WebGL lion portrait under a 2D "curtain" canvas (§6), /services an orbit canvas with its own spark and whoosh samples, /trionn-story a galaxy background, a line canvas and a mascot.

## 8. Sound

**Default off.** `SiteSoundProvider` starts with `soundEnabled = false` and never persists it: every page load starts silent, and so does every full navigation. The toggle is a 32 px round button (`#sound-toggle`, speaker icon, `aria-pressed`, "Enable sound" / "Mute sound") in the header, next to "Let's talk". Sound is also muted during page transitions and while the tab is hidden, and comes back afterwards. **Turning it on loads 9 files at once:** `woosh-loop.mp3` plus all eight robot-voice clips (`primeRoboticSpeech`, which also plays a silent WAV to unlock `<audio>` on iOS). The hero's `hero-spark.mp3` and `hover-beep.mp3` are prefetched at about 9 s whether sound is on or not; `thunder.mp3` is fetched by its `<audio preload="auto">` at about 5 s.

Measured by hooking `AudioBufferSourceNode.start`, `AudioNode.connect` and `ScriptProcessor`, then sampling every live source and the gain node it feeds every 200 ms (`logs/probe-mix-*.json`), plus the play log in `logs/run-*.json`.

### Hero mix (all gains are the site's own `GainNode` values)

| Layer | Source | Level | Behaviour |
|---|---|---|---|
| Bed | `woosh-loop.mp3` (4.58 s stereo loop) | **0.07** at rest | Fades in on the first gesture after sound is on (the code asks for a 2 s ramp; the per-frame lerp gets there in about 1 s, measured). Its gain is re-aimed every frame at `0.07 + 0.93 × max(scrollProgress, clickBurst)` with a 0.05 lerp, so the same loop **swells to 1.0** as the logo bursts on scroll (0.07 → 1.0 between 0 and 1 vh, back to 0.07 by 1.8 vh) or on a blast. It fades out as the vision section covers the hero |
| Rumble | code: white noise → leaky integrator (brown noise, ×3.5) in a `ScriptProcessor` → **low-pass 80 Hz** → gain | 0 → **0.18** in 0.1 s | Only during the first 0.5 s of a hold; ramps to 0 in 0.15 s when the blast starts or on release |
| Blast | `glass-shatter.mp3` (2.78 s) | **0.9** | At 0.5 s of holding. Cut with a 0.1 s fade on release |
| Blast swell | the same woosh loop | 0.07 → **~1.0** in about 1.2 s | Follows `clickBurst` (ramps 0.7 over 0.8 s, then tracks) |
| Release | `join-zoom.mp3` (2.62 s) | **0.7** | On release, only if the blast reached full strength |
| Shard hover | `hover-beep.mp3` (0.08 s) | **0.7** in its own `AudioContext` | Each time the raycast enters a new shard. No throttle: 44 beeps in one 19 s sweep |
| Line weld | `hero-spark.mp3` (1.13 s) | **0.16** | Once per touch of a line, cut after the 5–6 bolt bursts with a 0.05 s fade, a 0.08 s cooldown between starts |

A full 3 s hold, from `logs/probe-mix-hero.json` (t in seconds from the press):

| t | rumble | shatter | woosh | join |
|---|---|---|---|---|
| 0.0 | 0.18 | | 0.07 | |
| 0.4 | 0.012 (fading) | | 0.17 | |
| 0.8 | | | 0.54 | |
| 1.6 | | 0.9 | 0.94 | |
| 2.4 | | 0.9 | 0.995 | |
| 3.0 (release) | | 0.05 (cut) | 0.997 | |
| 3.8 | | | 0.31 | 0.7 |
| 5.2 | | | 0.07 | 0.7 (tail) |

This was the **first** blast of the session, and it shows a flaw: `glass-shatter.mp3` and `join-zoom.mp3` are only fetched when first needed (`firstSeen` 64.2 s and 66.0 s in the run log), so the first shatter lands about 1 s after the visual blast and the first join about 0.8 s after release. On the second blast the shatter started within 0.4 s of the rumble (sampled at 72.18 → 72.58 s).

### Below the hero

- **Thunder bed** (`<audio src="/audio/thunder.mp3" loop>`, services section). Its `volume` is set every frame from the services progress: it fades in over progress 0.04–0.20 and out over 0.85–0.95. Measured: y 8139 → 9238 takes it from 0.01 to 0.97, it holds through the stone sequence, and y 15 088 → 16 286 takes it back to 0 (`probe-mix-journey.json`). The hero's woosh bed has already faded out by y ≈ 2700, so the two beds never overlap. The code **forces the loop at 14 s** (`currentTime >= 14 → 0`) of a 17.45 s file.
- **Footer harp: synthesized, no files.** Each of the ~175 hairlines that spell TRIONN is a string tuned to the **G-major pentatonic scale**: G3, A3, B3, D4, E4, G4, A4, B4 (196–494 Hz), with every other line an octave down.
  - **Voice:** a sine at the note, with a 4.9 Hz vibrato only ±0.18–0.43 Hz deep (a shimmer, not a wobble), a 2nd harmonic at 0.1 and a 3rd at 0.03.
  - **Envelope:** peak `0.015 + 0.07 × intensity`, exponential attack of 0.10–0.15 s, a slight dip to 82 % over 0.22 s, then an exponential decay to silence 2.8–3.5 s after the pluck. Intensity rises along the string order, so lines further into the word pluck louder and brighter.
  - **Chain:** high-pass 120 Hz → low-pass 1800–2600 Hz → a +1.2 dB bell at 700 Hz, plus a **0.14 s feedback delay** (feedback 0.32–0.44, low-passed at 1.6 kHz) for a small-room echo. A 0.1 s low-passed noise burst adds the pluck's attack.
  - **Triggers:** hover plucks at `intensity`; a click plucks 1 % sharper and 0.12 louder, with a bigger wobble. Each string is rate-limited to one pluck per 100 ms. The string's SVG path wobbles as a travelling sine, `amp` 7 px (hover) or 11 px (click) → 0 over 0.9–1.1 s `expo.out`.
  - One sweep across the footer started **508 oscillators** (`run-*.json`, `footer lines`). The site's hint is the footer line "SOUND ON ♪ HOVER THE LINES."
- **Robot voice** (`/audio/voice/*.mp3`, 24 kHz mono, 1.9–2.9 s each). The /about **team scanner** plays "Identifying." on drop and "Detected." (with two synth blips) 3.7 s later; this was captured. The other six lines are written for the contact form's step-by-step mode. The "Let's talk" popup is a plain form, and nothing played in it (`75-rm-lets-talk-contact-voice.mp4`, `75-rm-contact-popup.png`). All eight: "Identifying." "Detected." "Let's start with the basics." "What would you like to create?" "Tell us about your vision." "What's the investment range?" "Ready to connect." "The conversation begins." One `<audio>` per phrase (`speakRobotic`), all preloaded the moment sound is switched on. The spectrogram of `identifying.mp3` shows clean speech harmonics with the fundamental falling from about 180 Hz to 120 Hz, like a TTS voice rather than a vocoder.
- **/work** plays `work-listing.mp3` as a looping `<audio>` at 0.6. **/about** has `curtain.mp3` (looped between 0.1 and 1.5 s while you drag the curtain) and `lion-growl.mp3` (played from a random offset once a drag has bent a string more than 15 px for 0.5 s). /services and /trionn-story have their own spark, whoosh and name-story samples. The /about and /work files were saved and are in the table below; /services and /trionn-story were not visited, so their samples are known only from the bundle.

### Files (`logs/audio-probe.md`)

| File | Trigger | Format | Dur s | Peak / RMS dBFS | Read |
|---|---|---|---|---|---|
| `woosh-loop.mp3` | bed, sound on (§ hero mix) | MP3 stereo 24 kHz 160 kbps | 4.58 | −4.0 / −19.4 | Low drone: most energy 20–200 Hz, harmonic bands up to about 1 kHz, a band near 170 Hz pulsing every 0.56–0.70 s (envelope autocorrelation peaks 0.56 and 0.70 s, r ≈ 0.26). Nothing repeats inside the file, so the loop period is the file itself, 4.58 s. Seam: head/tail RMS 0.057/0.073, sample jump 0.054 |
| `glass-shatter.mp3` | blast | MP3 stereo 24 kHz | 2.78 | −6.1 / −30.8 | Broadband burst of narrow high partials (1.4–8 kHz, ringing glass), a low thump at 0.45 s, a decay to about 1.9 s |
| `join-zoom.mp3` | release after a full blast | MP3 stereo 24 kHz | 2.62 | −7.9 / −28.7 | Low impact and whoosh: 20–300 Hz peak at 0.1–0.5 s, a rising broadband sweep to about 4 kHz at 0.35 s, a long sub tail |
| `hero-spark.mp3` | line weld | MP3 stereo 48 kHz 340 kbps | 1.13 | **+0.3** / −12.6 | Full-band electric crackle to 16 kHz, with dropouts at 0.30, 0.38, 0.60 and 0.76 s. Clips at the source, so it is played at 0.16 |
| `hover-beep.mp3` | shard hover | MP3 stereo 44.1 kHz | 0.08 | −29.4 / −34.5 | An 80 ms blip, quiet at source (crest 5 dB). The code carries a base64 copy as a fallback |
| `thunder.mp3` | services bed | MP3 stereo 24 kHz 64 kbps | 17.45 | −0.7 / −26.0 | A rolling rumble 0.3–7.5 s (energy below 500 Hz), a crack at about 8.0 s (broadband to 8 kHz), a second clap at 12.2 s, decaying to silence by 15.5 s. The code's 14 s loop point cuts the second clap's tail mid-decay and jumps to the file's 0.3 s of leading silence |
| `identifying`, `detected`, `intro`, `create`, `vision`, `budget`, `review`, `submitted` `.mp3` | team scanner (2 of them), contact stepper | MP3 mono 24 kHz 96 kbps | 1.92–2.86 | −1.9…−5.4 / −22…−26 | Spoken phrases (see above) |
| `curtain.mp3` | /about curtain drag (looped 0.1–1.5 s) | MP3 stereo 24 kHz | 9.02 | −2.6 / −36.7 | Sparse transients (crest 34 dB): cloth or strip rustle, mostly quiet between hits |
| `lion-growl.mp3` | /about, a hard drag held for 0.5 s | MP3 mono 48 kHz 256 kbps | 15.77 | 0.0 / −11.0 | About ten growl phrases in a row (waveform), so starting at a random offset gives a different growl each time; hot, peaking at 0 dBFS |
| `work-listing.mp3` | /work bed, `<audio loop>` at 0.6 | MP3 stereo 44.1 kHz | 17.89 | −8.0 / −22.2 | A music bed (not analysed further) |

Spectrograms and waveforms sit next to each file in `audio/`.

### Questions for Janriz (listen with sound on; the agent cannot hear)

1. **Hold to blast** (`10-hold-to-blast.mp4` has no audio; do it live on trionn.com). Hold for 3 s, twice:
   - Does the 80 Hz brown-noise rumble in the first half-second read as "pressure building", or is it inaudible on laptop speakers? (80 Hz sits below most laptop speakers.)
   - On the first try, does the shatter arrive noticeably late? It is fetched only at the moment of the first blast. The second try should be tight.
   - Is the woosh swell to full volume exciting or too loud against the rest of the site?
2. **The woosh bed** (`woosh-loop.mp3`, 4.58 s at 0.07). Can you hear the loop point every 4.6 s: a tick, a gap, or a repeating pulse? Its seam does not quite match (head RMS 0.057 vs tail 0.073), and MP3 loops in Web Audio often carry a few ms of encoder padding.
3. **Thunder in services.** The code loops it at 14 s, mid-decay of the second thunderclap. Do you hear an abrupt cut every 14 s while you sit in the services section?
4. **Footer harp.** Sweep across "TRIONN":
   - Does the pentatonic scale make any sweep sound musical, or does it read as random plinks?
   - Is the 0.14 s echo pleasant or muddy when many strings ring together?
   - Would you want this kind of code-made sound for our hairlines, or for the chat's streaming text?
5. **Shard beeps.** Moving across the logo fires a beep for every face entered, unthrottled (44 in 19 s). Charming, or nagging after ten seconds?
6. **Robot voice** (/about, drag a member onto the scanner). Does "Identifying… Detected." feel like a fun AI moment or a gimmick? Would a voice like this suit our agent, and how much of it (one word per state, or none)?
7. **Line welds.** Is the spark crackle (`hero-spark.mp3`, played at 0.16) in proportion to the tiny lightning, or harsh?

**Janriz's answers (2026-09-27):**

1–3, 5, 7. Not answered.
4. He likes the harp: it sounds musical, the echo is pleasant, and playing it made him smile. If the portfolio has something like it, it goes in **one place** (as Trionn does), not all over the site.
6. The spoken robot voice feels more like a gimmick. A voice for the agent is worth experimenting with. So are non-verbal sounds the agent makes, if it takes a creature persona (a cute robot, a cyber animal and so on; the persona is open).

## 9. Type, colour, layout

### Fonts

All four are self-hosted through `next/font` as single WOFF2 files, one weight each (`/_next/static/media/`, 98 KB in total). There is no text in the canvases, so no canvas fonts; the loader, marquee and footer "TRIONN" are HTML or SVG.

| Family (CSS name) | File | Weights / styles used | Licence | Free alternative |
|---|---|---|---|---|
| **Neue Haas Display** (`neueHaas`) | `NeueHaasDisplay_Roman` 25.6 KB | Roman (400), **body copy only** (16.2 px paragraphs, contact details) | **Paid** (Neue Haas Grotesk Display, Monotype/Linotype; web licence required) | **Inter Display** or **Inter Tight** (OFL, Google Fonts). The same neo-grotesk skeleton; Inter Display's tighter spacing at large sizes is closest to Haas Display |
| **Martian Mono** (`martianMono`) | `MartianMono_Light` 20.1 KB | Light (300), uppercase labels and CTAs ("DISCUSS YOUR PROJECT →") | **Free, OFL** (Evil Martians; on Google Fonts) | itself |
| **Familjen Grotesk** (`familjen`) | `FamiljenGroteskVariable_Regular` 23.7 KB | 400 and 500: **all display and headings, plus the uppercase labels, nav and pills**. This is the face you notice | **Free, OFL** (Google Fonts) | itself: available on Google Fonts |
| **PP Editorial New** (`ppeditorial`) | `PPEditorialNew_Ultralight` 30.5 KB | Ultralight (200), **preloaded on every page but used by no text on home, /about or /work**, and absent from `document.fonts` there | **Paid for commercial use** (Pangram Pangram; free trial fonts are personal-use only) | **Instrument Serif** (OFL) or **Cormorant Garamond Light** (OFL), for the same thin high-contrast editorial serif |
| Roboto | via reCAPTCHA | — | Apache 2.0 | — (third-party widget, not part of the design) |

### Type scale

Computed styles at 14 stops down the home page plus /about and /work (`logs/probe-type-colour.json`, mobile `…-mobile.json`, from `scenarios/08-type-colour.js`). Split text (one span per character) is resolved to the element that owns the line. The root font size is fluid (it computes to 14.4 px at 1440 and about 12.2 px at 390), and the CSS sizes are `clamp()`s: `.h1 { font-size: clamp(3.75rem, 6.614vw, 6.25rem); line-height: clamp(3.5rem, 5.952vw, 5.625rem); letter-spacing: -.06em }`.

| Role | Family | Desktop 1440: size / line-height / tracking | Mobile 390 | Case | Colour | Examples |
|---|---|---|---|---|---|---|
| Mega caps (marquee, services, gallery) | Familjen 400 | **131.96 / 88.7–132 / −10.56 px (−0.08 em)** | 60.94 / 41–61 / −4.88 | UPPER | #d8d8d8, #ffffff, #434343 on light | IMPACT + INSPIRE, A.I. DESIGN DEVELOPMENT BRANDING, DESIGN IN MOTION |
| Display (h1) | Familjen 400 | **90 / 81 / −5.4 px (−0.06 em)** | 45.7 / 42.7 / −2.74 | sentence | #d8d8d8 | "Designed to mean depth." |
| Section heads (h2) | Familjen 400–500 | 85.5–86.4 / 79–81 / −5.13 px | 30.5–42.7 / 26.8–39.6 | sentence | #d8d8d8, #434343 | "Trionn is an independent…", "Ready to build something bold?", "Selected work" (500) |
| Counters | Familjen 400 | 50.4 / 45 / −3.02 | 42.7 / 38.1 | — | #d8d8d8, #434343 | slot-reel digits (1.5K+, 50+) |
| Card titles (h3) | Familjen 400 | 32.4 / 32.4 / −1.30 (−0.04 em) | 21.3 / 21.3 | sentence | #434343, #ffffff | MyWorker AI, Loftloom |
| Body | **Neue Haas Display 400** | **16.2 / normal / 0** | 15.2 / normal | sentence | #d8d8d8, #434343, #d8d8d8 at 50–60 % | "Websites, AI products, brands…" |
| Labels, nav, pills (`.title`) | Familjen 400 | **15.3 / 15.3 / −0.31 px (−0.02 em)** | 13.7 / 13.7 | UPPER | #d8d8d8, #434343, #000 on white pills | LET'S TALK, MENU, HOLD TO BLAST, ABOUT |
| CTAs (mono) | Martian Mono (Light file, declared 400) | **12.6 / normal / −0.76 px (−0.06 em)** | 12.2 | UPPER | #d8d8d8, #434343 | DISCUSS YOUR PROJECT →, BOOK A 30-MINUTE CALL → |
| Micro labels | Familjen 400 | 12.6 / 12.6 / −0.25 | 10.7 | UPPER | #d8d8d8 | EST. 2012, 14+ YEARS SHAPING DIGITAL DIRECTION |

The system is one grotesk (Familjen) at every size with **tight negative tracking scaled to size** (−0.02 em for labels, −0.04 em for h3, −0.06 em for display, −0.08 em for the mega caps), and line-height ≤ 1 above body size. A second grotesk (Haas) is used only for reading text, and a mono only for CTAs. Everything is weight 400 except one 500.

**Text map (HTML vs canvas):** at every one of the 14 home stops, all words are HTML (`canvases` and `text` per stop in the probe). Canvases on screen: the hero (0–2706), the gallery (17 710–22 137), and the gallery plus the footer smoke at the end. None of them draws text. The only non-HTML words are baked into images and video: the Dribbble shots, the work thumbnails and the stone.

### Colour

A near-monochrome system; **the only chromatic colour lives in the 3D and the imagery**, never in the CSS UI. From computed styles and `:root` custom properties (`--color-*`):

| Role | Value | Where |
|---|---|---|
| Page background | **#040508** (`--bg`, `theme-color`) | body, footer, header menu sheet on mobile |
| Hero / 3D background | **#0c0c0c** | `#hero-section`, the Three.js clear colour, 404 |
| Light-section greys | **#d2d2d2** (vision stripes, loader), **#c3c3c3** (gallery), gradients #d2d2d2 → #ffffff (key facts), #ffffff → #c3c3c3 (testimonials), #c8c8c8 (loader panel) | light half of the page |
| Text on dark | **#d8d8d8** (`--color-light-font`, also `--color-cream-line`), 50–60 % for secondary | everywhere dark |
| Text on light | **#434343** (`--color-dark-font`, `--color-grey-line`), #272727 (`--color-black`) | light sections, cards |
| Pure | #ffffff (pills, borders, SVG icons), #000000 (pill text, mobile menu) | UI chrome |
| Hairlines | #d8d8d8 1 px (CTA underlines `span.h-px`), #2f323b and #434343 borders, `rgba(… / 0.15)` card dividers, #303640 SVG strokes | chrome |
| Muted | #9c9c9c (`--color-grey-light`), #e6e4e2 (`--color-cream`, project card) | rare |
| Accent (WebGL only) | **orange #ff3300 / #ff2200 / #ff5500** point lights and particles; blue-white lightning #88ddff → #0044cc (§7). One CSS trace: a `#ff501e99` gradient stop | hero, 404 |
| Mascot and imagery | the red suit of the lion mascot, the orange lion visor on /about | photos, video, WebGL texture (eyedropped look, not measured) |
| Blend | the hero text layer (`#sticky-wrap`, `#s3-text`) uses `mix-blend-mode: difference` over the canvas | hero, about, vision |

### Layout

- **Grid:** Tailwind `grid-cols-12 gap-6` inside `.tr__container`, whose side padding is `spacing × 10` from 768 px (**36 px** at 1440) and `spacing × 6` below (**18 px** at 390). The logo, headline and CTAs sit on that 36 px margin.
- **Hero composition (desktop):**
  - The h1 spans columns 1–8 top-left, with the two mono CTAs under it.
  - The "EST. 2012 / 14+ YEARS" box and a three-line description sit bottom-right in columns 9–12.
  - "HOLD TO BLAST / DARE TO TOUCH THE LINES" is centred at the bottom; the sound toggle is a small circle bottom-left.
  - The 3D logo is **centred in the viewport behind everything** (`z-0`, `pointer-events: none`). Text never overlaps the logo's core at rest. At the burst the shards fly through the text layer, and the difference blend keeps the text legible over them.
- **Header:** fixed and transparent. The logo is top-left; a cluster sits top-right: the sound toggle (32 px circle), the "LET'S TALK" white pill and the "MENU ≡" outline pill (15.3 px uppercase Familjen). Its colours invert on the light sections.
- **Rhythm:** each section is one viewport (`min-h-dvh`), and the long sections are pins. The page alternates dark (hero, services, footer) and light (key facts, work, testimonials, gallery). The transitions between them are wipes (stripes, a slide-over panel, the footer rising 100 dvh) rather than cuts.
- **Mobile:** one column. The h1 is 45.7 px, the CTAs stack, the stats box moves under the h1, the key-fact cards become a horizontal pinned carousel, and the menu is a full-screen black sheet with large centred uppercase items.

## 10. Performance & degradation

| | Desktop 1440×900 (DPR 2) | iPhone 13 preset 390×664 (DPR 3) |
|---|---|---|
| TTFB / FCP | 0.98 s / 2.04 s (the grey loader) | 0.82 s / 1.86 s |
| Loader hands over (`data-trionn-ready`) | **8.40 s**; headline visible 8.18 s | **8.54 s**; headline 8.18 s |
| LCP | **9.9 s** (a headline character, `div.chars`) | **13.5 s** (a `div.chars` paragraph) |
| CLS at landing | 0.18 | 0.19 |
| `load` event | 5.9 s | 6.8 s |
| Frame rate | the page's own rAF steady at 60 fps everywhere measured (median 16.7 ms, p95 18.3 ms, no frame over 33 ms, even across the image sequence) | rAF 60 fps (headless on an M5 laptop, not a real phone) |
| Hero canvas | 2160×1350 (DPR capped 1.5) | 390×664 (DPR 1), no particle field |

- Readiness is from `logs/probe-ready-*.json`. LCP and CLS come from a `PerformanceObserver` installed before load. CLS in the journey probe (9.9) is scroll-driven pin movement and means nothing.
- **Transfer (home page, whole scroll):** 504 responses, about **21 MB**, counted from the run log's network list because resource timing stopped at its 250-entry buffer:
  - **12.9 MB: the 371-frame stone sequence**, downloaded **eagerly** from about 9.9 s to 28.7 s after load, while the visitor is still on the hero. It is fetched on mobile too.
  - about 4.8 MB of MP4, with **both the desktop and the `_m` encode of every video fetched** on both form factors
  - 1.6 MB of JPEG (the Dribbble orbit cards)
  - 0.6 MB of MP3
  - JS 0.87 MB over the wire (2.6 MB decoded), plus reCAPTCHA (346 KB) and gtag on every page
  - fonts 98 KB
- **Frame feel.** Clip stats show a p95 of 35–50 ms in the work and services sections, but a page-side rAF probe run during the same scroll (`04-pages.js` re-shoot) measured a steady 16.7 ms median and 18.3 ms p95. The gaps are the screencast idling while nothing repaints during scroll pauses, not the site dropping frames. On this machine the site holds 60 fps. The hero's physical material with a live cube map, and the two concurrent WebGL contexts in the Dribbble section, are the likely cost on weaker GPUs; the site's only guards are the DPR caps and pausing off-screen render loops.
- **Mobile tier.**
  - **The same page, lighter where it counts:** hero DPR 1, particles off, a wider camera, `_m` videos shown (though the desktop ones download as well), 300 % instead of 400 % hero pin, keyfacts as a pinned horizontal card carousel, and a black full-screen menu.
  - **What is lost:** hold to blast (the hint is hidden below 1024 px, and a long press only produces a one-frame tremor, `57-mobile-long-press-hero.mp4`). Touch still triggers the shard beeps and, when a touch lands on a line, the lightning weld.
  - The loader is identical and ends at the same 8.5 s. LCP is worse (13.5 s).
- **Reduced motion.** Only one line in the whole bundle reads `prefers-reduced-motion`: the hero logo's idle spin drops from 0.0042 to 0.0015 rad per frame.
  - With `reduce` emulated, the loader, the shard assembly, the blast with its tremor, the scroll bursts, the stripe wipe, the ribbon, the belts transition and the team scanner all run unchanged (`70-rm-cold-load.mp4`, `72-rm-hero-idle-hold-to-blast.mp4`, `73-rm-hero-scroll.mp4`).
  - Lenis smoothing stays on. No CSS `@media (prefers-reduced-motion)` rule exists.
  - **In effect there is no reduced-motion tier.**
- **Accessibility notes seen on the way:**
  - HoverBlur doubles every nav label's accessible name.
  - Canvas interactions have no DOM or keyboard equivalent.
  - The loader blocks scroll for about 8 s.
  - On the plus side: real headings and copy, a labelled sound `<button>` with `aria-pressed`, `lang="en"`, and a proper meta description and Organization JSON-LD.

## 11. Ideas worth taking

The standing constraints are numbered as in the map Notes:

1. GSAP-only animation, with Three.js only drawing
2. real-HTML text
3. chat usable within 1 s, with no gating preloader
4. reduced-motion and mobile tiers, with 3D and audio loaded lazily
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free or self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **A press-and-hold gesture that moves the real page** (hold to blast).
   - **What makes it work:** Trionn's best moment is not the WebGL. It is that the HTML itself (headline, buttons, nav) trembles, comes loose into 3D perspective and snaps back, in step with the 3D object and the sound. The text stays real, selectable HTML throughout; only `transform` changes.
   - **Why it fits:** this is a direct, concept-tied answer for the AI entrypoint. "Hold to talk" or "hold to wake the bot": the page trembles and leans towards the bot while you hold, then settles when the chat opens or the answer lands. The same transforms could serve as a tool effect the agent triggers.
   - **Build it with GSAP:** `gsap.quickTo` on each element's `x/y/rotationX/rotationY` with `transformPerspective`, driven by one `hold` value. Trionn writes `style.transform` every frame by hand and resets it with a CSS transition.
   - **Strains:**
     - Constraint 4: Trionn has **no touch path** (its handler needs `mousedown`; a long press never sends one, and the hint is hidden below 1024 px) and no reduced-motion branch. Ours needs a pointer-events version that works on touch, a keyboard version (hold Space on a focused button), and a reduced-motion version that changes state without the tremor.
     - Constraint 3: the chat itself must never be part of the debris.
2. **Drag something onto the AI and let it identify it** (the /about team scanner).
   - **What it is:** drop a masked portrait on the scanner box and the site runs a short, voiced scan ("Identifying." … "Detected.", a bracket sweep, typewriter text), then rewards you: the person lifts off the lion mask. The gesture has a clear goal and a real payoff (`77-rm-about-team-drag-to-scanner.mp4`).
   - **Why it fits:** it inverts the chat's tool effects. Instead of the agent moving the page, the visitor moves a piece of the page (a project card, a skill, a role on the timeline) onto the bot or the chat bar, and the agent "identifies" it and answers about it. It explains the AI entrypoint by doing, not by telling. Two or three short spoken state words, primed on the sound toggle, would carry the scan, with the same words shown as text.
   - **Strains:**
     - Accessibility: it needs a click/tap alternative (Trionn switches to "TAP A MEMBER" on touch) and a keyboard path ("Ask about this" buttons).
     - Constraint 3: the chat stays usable without the gesture.
     - Constraint 4: audio and voice load lazily and stay off by default.
     - Assets: the voice must be self-made (browser TTS, or a render from a free-licence TTS).
3. **Code-synthesized, playable UI sound: the footer harp.**
   - **What it is:** about 175 hairlines tuned to a pentatonic scale, synthesized live (sine plus two harmonics, a gentle filter, a 0.14 s echo), rate-limited to one pluck per string per 100 ms, with the string wobbling under GSAP. An `AnalyserNode` on the output feeds a background shader, so sound and image breathe together. No audio files at all.
   - **Why it fits:** it matches Janriz's sound answers point for point: code-generated sound is fine, hover sounds are in, and stacked SFX are fine (a pentatonic scale cannot clash, however many notes overlap). The portfolio's hairlines (section rules, the timeline, the bot's antennae) could be strings; a streamed chat reply could pluck quiet notes as tokens arrive.
   - **Strains:** constraint 4 only: audio off until a gesture, a reduced-motion version with no string wobble, and nothing heavier than a few oscillators on mobile. It must also be tied to the concept, or it becomes a template trick.
4. **One energy value drives both the picture and the mix.**
   - **What it is:** in the hero, `p = max(scroll, blast, intro)` moves the shards, and the woosh bed's gain is `0.07 + 0.93 × p`. The bed swells exactly as the object bursts, from a single 4.6 s loop.
   - **Why it fits:** give the portfolio one "agent energy" value (idle, listening, thinking, streaming, tool effect firing), tween it with GSAP, and let it drive the bot's pose and a bed's gain and filter together. This is cheap, coherent, and the same shape as the Edolus stem-mix idea, reduced to one number.
   - **Strains:** assets (the bed must be self-made or code-generated), and constraint 4 (audio lazy and off by default).
5. **A procedural 3D mark, extruded from its own SVG path.**
   - **What it is:** the logo is three bezier shapes → `ExtrudeGeometry` → faces split by normal into shards. There is no model file, so the hero's 3D costs a few kB of code. The drama comes from lighting: dark metal, with three moving orange point lights as the only accent.
   - **Why it fits:** Janriz's monogram (or the bot's face) could be built the same way, with zero asset weight, and fits "procedural or self-modelled 3D" exactly. Shards split by normal give a free "assemble on arrival / come apart on interaction" motion.
   - **Strains:** constraint 5. Trionn's `MeshPhysicalMaterial` with transmission and a live `CubeCamera` is heavy. Use a cheaper standard material with a baked or static environment map and keep Trionn's DPR caps (1.5 on desktop, 1 on phones). Constraint 4: mount it after first paint.
6. **Sound hygiene worth copying.**
   - Sound is off by default and not persisted; it mutes during page transitions and while the tab is hidden.
   - The toggle is a real `<button>` with `aria-pressed` and a label.
   - Each bed is owned by its section and fades by that section's scroll progress, so beds never overlap.
   - Improve on it: preload every SFX when the toggle is pressed (Trionn lazy-loads the shatter, so the first blast is silent for about 1 s).

**What to avoid:**
- **A gating loader on every visit.** The logo loader plays on each load, remembers nothing, cannot be skipped, and Lenis is `stopped` until it ends: no scrolling and no controls for about 8 s (§3, §10). This breaks constraint 3 outright.
- **Hidden affordances.**
  - The shard hover, the line welds and the blast all live only in the canvas: the DOM under the pointer reports cursor `auto` everywhere, and nothing is focusable.
  - The one hint ("hold to blast") is hidden below 1024 px, where the gesture does not work anyway.
  - The drag-to-rotate code is dead (its canvas is `pointer-events: none`).
  - Ours should be discoverable, keyboard-reachable, and have a touch path.
- **No reduced-motion branch.** Only the logo's idle spin slows. The loader, the scrubbed bursts, the stripe wipe, the ribbon and the tremor are all unchanged (§10).
- **Eager weight.** 371 WebP frames (12.9 MB) download in the first 30 s while you are still on the hero. Every video is fetched twice (desktop and `_m` encodes), and reCAPTCHA (346 kB) loads on every page. Constraints 4 and 5.
- **Pins that outstay their welcome.** A single 13 050 px pin for work plus services, on a wheel scaled down to 0.6.
- **The generic layer:** lightning bolts with additive glow tubes, the fbm smoke, the storm clouds. They are well made, but they are exactly the glow/atmosphere effects our effects rule bans, and they are the least Trionn-specific part of Trionn.


## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | cold load, landing, first scroll + scroll-ratio check, JS saved to `logs/src/` | `01`–`04` |
| `02-hero-play.js` | desktop, sound on: logo hover sweep, touch the lines, 0.3 s hold, **hold to blast 3 s**, blast peak still, drag while blasted, hero scroll burst/reassemble, hold at 1 vh | `05`–`16`; `logs/probe-mix-hero.json`; crops `logs/07-logo-sweep-detail.png`, `logs/08-lines-weld-detail.png` |
| `03-journey.js` | desktop, sound on: vision → key facts → work track → services (thunder, stone) → testimonials → Dribbble ribbon → footer harp → fast scroll up | `17`–`33`; `logs/probe-mix-journey.json`; crop `logs/31-footer-harp-detail.png` |
| `04-pages.js` | re-shoot of 21/23/25 with page-side rAF timing (clips deleted as duplicates, numbers in `logs/notes.md`), menu, /work, first 404 attempt | `37`–`42` (38/39 are home key-fact cards: see notes) |
| `07-about-contact.js` | page transitions both ways, /about lion curtain drag, team cards, 404 blast | `45`–`54` |
| `05-mobile.js` | iPhone 13: cold load, long press, taps, menu, swipes down the whole page | `55`–`64`, `69`; `logs/probe-ready-mobile.json`, `probe-perf-mobile.json` |
| `06-reduced-motion.js` | `prefers-reduced-motion: reduce`: cold load, hold to blast, hero scroll; "Let's talk" popup; /about **team scanner** | `70`–`78`; crop `logs/77-team-scanner-detail.png` |
| `08-type-colour.js` | computed type/colour + text map at 14 home stops, /about, /work; desktop and `MOBILE=1` (no media) | `logs/probe-type-colour.json`, `logs/probe-type-colour-mobile.json` |

Shared probes: `scenarios/_probe.js` (DOM, runtime, perf, LCP/CLS, listener registry, Web Audio mix sampler, readiness, page rAF timing, `scrollToY`) and `scenarios/_style.js` (type/colour). Console output of runs 04–08 is in `logs/console-run-*.txt`. Audio analysis is in `logs/audio-probe.md`, with PNGs next to each file in `audio/`.
