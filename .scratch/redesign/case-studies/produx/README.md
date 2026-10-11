# Case study: Produx

Captured 2026-09-27 with headless Playwright (Apple M5, ANGLE Metal, 60 fps) through `research/capture/capture.js`. Evidence lives here:

- `screenshots/`: stills at 1440×900 @2x. Mobile stills use the iPhone 13 preset (390×664 @3x).
- `motion/`: MP4 clips, each with a `.sheet.png` contact sheet.
- `audio/`: the 404 game's six MP3s and the showreel's AAC track, plus their spectrograms and waveforms.
- `logs/`: run logs, JSON probes, `notes.md` (the working log), and the site's own JS in `logs/src/` (pretty-printed in `logs/src/pretty/`).
- `scenarios/`: the scripts that drove every run.

Numbers such as `30-wordmark-morph…` refer to those files. **Measured** means read from the page, runtime, network or files. **Inferred** means my reading of what I saw. I cannot hear, so everything about sound comes from code, runtime sampling and spectrograms.

## 1. At a glance

| | |
|---|---|
| URL | https://www.produx.design/ |
| Awwwards | https://www.awwwards.com/sites/produx-design. **Site of the Day, Aug 9 2026** (7.19: design 7.1, usability 7.1, creativity 7.52, content 7.1) and a **Developer Award** (7.24: animations/transitions 7.80, WPO 7.40, responsive 7.40, accessibility 7.00, markup 7.00, semantics/SEO 6.80). Source: `logs/awwwards-page.txt` (a WebFetch summary, not a verbatim copy) |
| Studio | **Prødux Design** (the studio's own site; Barcelona and Wyoming, © "PRODUX STUDIOS LLC"). Awwwards credits **Alex Socoloff** (founder and creative director, per the journal card "Read a full interview with our founder and creative director") and **Yousuf Soomro** |
| Awwwards tags | Design Agencies, Animation, 3D, Filters and Effects, 404 pages, GSAP, Three.js, Next.js. Its one listed "Element" is the **404 page** |

**Gist.** Produx is a brand-identity studio's portfolio, built on Next.js + Tailwind + GSAP + Lenis with small three.js effects. It is a **DOM-first, long scrolling page (23 viewports)** of text reveals and scrubbed set pieces:
1. a giant **PRØDUX** wordmark that shrinks into the nav
2. about 20 blurred image tiles flying in from depth to **assemble the hero image**, which widens into a showreel
3. project cards that **smear into blocky pixels** under a fast pointer
4. a hover list whose video previews **dissolve in lime pixels**
5. a sticky stage where a **pre-rendered rock turns and grows moss** while the page blooms from black to moss green
6. testimonials and journal
7. a footer wordmark the pointer **paints with moss**.

The 404 is a playable pixel-art Star Wars duel with sound; otherwise the site is silent unless you play the reel.

**Most memorable thing.** The **moss rock** (`48-services-rock-black-to-bloom`, `49-services-green-bloom.png`). As you scroll, a black, sharp-edged rock turns in space; moss and ferns spread over it, and the background opens from the centre into dark green, as the statement "In 14 days, we shape a complete brand identity that moves with confidence" fills in. It is a 270-frame pre-rendered sequence, not live 3D. It is the one image the whole site is built around: the hero tiles assemble into the same moss rock, and the footer wordmark turns to moss under your pointer (`61-footer-wordmark-ink-sweep`). Raw material becoming a living brand is the studio's pitch, told without words.

## 2. Tech found

| What | Detail | How detected |
|---|---|---|
| Framework | **Next.js** App Router, built with **Turbopack** (`/_next/static/chunks/turbopack-*.js`, `self.__next_f` RSC payload, `NEXT_DEPLOYMENT_ID`), React (`jsx`/`jsxs` runtime calls in every chunk). Hosted on **Vercel** (`dpl_…` deployment ids, Vercel Analytics globals `va`/`vaq`/`vam` and `/f450cc47d54ebd15/script.js`) | DOM probe `scripts` (`logs/probe-dom-landing.json`); runtime probe `nonStandardGlobals` (`probe-runtime-landing.json`) |
| Styling | **Tailwind CSS v4**: utility classes (`max-lg:`, `max-sm:`), theme variables (`--spacing`, `--font-weight-*`), named colours (`.bg-outer-space`, `.text-white-smoke`, `.bg-apple-green`…). Almost every size is in `vw`/`vh` | pretty CSS `logs/src/pretty/0hcp-p.-qpzyg.css`; type probe |
| Animation | **GSAP 3.14.2**, bundled as a module (not on `window`). Plugins: **ScrollTrigger** (two module instances, 50 triggers on the home page, **no GSAP pins**: pinning is CSS `position: sticky`), **CustomEase** (`natureSway` `M0,0 C0.08,0.494 0.14,1 1,1`, `premiumGlide`, `customBezier` `M0,0 C0.83,0 0.17,1 1,1`, `custom-bezier`, `spring-500-60`), **Draggable** (logo marquee). Components use `gsap.context()` | A Turbopack init hook (`scenarios/_hooks.js`) wraps each module factory and keeps the gsap/ScrollTrigger exports it imports; `ScrollTrigger.getAll()` in `logs/probe-st-after-scroll.json`; `gsapVersions` global; the bundle |
| Smooth scroll | **Lenis 1.3.16** (`window.lenis`): `lerp 0.05`, `wheelMultiplier 0.9`, `smoothWheel true`, `syncTouch false`, `touchMultiplier 0` (touch scrolls natively), `autoRaf false` | `window.lenisVersion`, `lenis.options` (`logs/probe-structure.json`); a 900 px wheel moved `scrollY` 406 px at DPR 2 (so scenarios use `wheelScale: 2`) |
| 3D / WebGL | **three.js r182**. No single scene: the desktop home page mounts **up to 12 small WebGL2 renderers**, one per effect: 5 project-card distortion canvases, 4 "Pixel Reveal" text headings, the contribution video-preview canvas, the services particle field and the footer ink shader (plus a hidden 2×2 one). There is also one **2D canvas** for the rock image sequence. Mobile mounts 4 (`probe-dom-mobile-landing-canvases.json`) | `window.__THREE__ = "182"`; canvas probe with a `getContext` tag (`probe-dom-landing.json` `canvases`, `probe-text-map.json`); `new WebGLRenderer` per component in the bundle |
| Pre-rendered 3D | The services "rock" is **not** real-time 3D: it is a **270-frame WebP image sequence** (`/optimized_final/rock_0001…0270.webp`) drawn on a 2D canvas and scrubbed by scroll | network log; bundle (`0k4m…js`, `rock_${n}.webp`) |
| Video | HLS **showreel** (`/videos/HeroHLS/showreel.m3u8`, 40 s, 1456×816, 60 fps H.264 + **AAC stereo 48 kHz**) played through a bundled **hls.js**; 4 contribution preview clips (`/ContributionVideos/Vid 1–4.webm`); `PageTransitionLogo.webm` (1080×1080, 2.0 s) for page transitions; project-card videos | DOM probe `videos`; `ffprobe` on the playlist; `hls` strings in `0k4m…js` |
| Debug UI in production | **lil-gui** is dynamically imported on every load and builds "Footer Shader Controls" (Simulation / Distortion / Pixel Edges / Visual) and "Pixel Reveal" panels | `lil-title` buttons in the DOM probe `interactive`; `lil-gui` CSS variables; bundle `0i-.3ea0..wgc.js` |
| Fonts | **At Aero** (Arillatype.Studio, commercial EULA; self-hosted OTF: Retina, Regular, Medium, Light) for display, headings and body; **DM Mono** (Colophon, SIL OFL; self-hosted TTF 300/400/500) for labels, nav and small copy. Canvas headings load `At Aero Retina` again through `new FontFace()`. Details in §9 | network log; `@font-face` rules and `document.fonts` (`probe-type-colour.json` `global`); each file's OpenType `name` table (`logs/fonts/`) |
| Sound | No audio library. The home page's only sound is the showreel's own audio track, unmuted by "Play reel". The **404 page** has a pixel-art game that plays six MP3s through `new Audio()` + `cloneNode()` | bundle `0swtkow.lgrz~.js`; capture.js audio hook (`audioEvents`) |
| SEO / meta | Real `<title>`, meta description, keywords, robots, Open Graph and Twitter cards, JSON-LD `Organization` + `WebPage`; `lang="en"`; zoom allowed | DOM probe `meta`, `scripts` |
| Analytics / consent | Vercel Analytics; a themed cookie banner ("A long time ago, in a browser far far away…", "May the cookies be with you") storing `localStorage["cookie-consent"]` as `"yes"` or `"no"` | bundle `12ll-ra3iv_pb.js`; recon stills |

## 3. Intro & loading

- **No loader, no gate.** The HTML arrives server-rendered and the page is scrollable immediately. First paint and first contentful paint were **400–536 ms** (desktop, three cold loads; `probe-perf-*.json`). DOMContentLoaded 357–460 ms, `load` 472–847 ms.
- **The intro is a type reveal, about 1.0–2.4 s after navigation** (`01-cold-load`, `27-intro-cold-load`):
  1. a black page with only the `[SCROLL DOWN]` cursor label (0.4–0.9 s)
  2. the six letters of the **PRØDUX** wordmark rise out of a mask one by one, left to right, with a soft vertical fade on each glyph (about 1.1–2.3 s)
  3. the H1 "You feel the brand before it speaks®" rises line by line (`heroSection-splitLine`: 1.1 s, stagger 0.2, `power4.out`, `blur(…) → 0`) and the DM Mono blurb follows.
- It is time-based, not skippable, and not needed: nothing waits on it, and scrolling during it works. It replays on every load: the only storage key the site writes is `cookie-consent`, and it uses no sessionStorage, so there is no "seen" flag.
- **The heavy assets load behind the page, on a schedule:**
  - the 270-frame rock sequence loads frames 1–100 **5 s after mount**, frames 101–175 when the projects section reaches the top, 176–250 when it leaves, and 251–270 when the services section arrives
  - WebGL renderers for the project cards are created **in batches** (the first after 1.5 s, the rest 300 ms apart, gated by a promise queue) and each pauses its rAF when off-screen (`IntersectionObserver`, `rootMargin 100px`)
  - the services particle scene is only built when the section comes within 500 px (`IntersectionObserver`), and contribution/journal videos only `load()` near the viewport.
  - The exception is the **showreel HLS stream**, which starts playing muted at load (the video-state sampler saw it playing at `y=0`, 7.9 s in) although it is hidden until the end of the hero scroll.
- **Cookie banner** (first visit only, `localStorage["cookie-consent"]`): a bottom-right card that opens with a clip-path wipe (`polygon` from the bottom-right corner, 1.1 s `power3.out`) after a **3 s delay**, so it never covers the intro. Copy: "A long time ago, in a browser far far away… / A small disturbance in the data. We use cookies to understand how the site performs — nothing sinister, no dark side stuff." Buttons: "May the cookies be with you" / a decline link (`02-landing-7s.png`). The Star Wars joke sets up the 404 game.
- LCP on desktop is reported as the DM Mono blurb span at 400–536 ms. That is right for this page: the hero is text, not canvas.

## 4. Navigation & page transitions

**Pages:** Home (`/`), `/work`, `/studio`, `/lab`, `/journal`, `/contact`, project pages, and a custom 404. It is a Next.js App Router site, so navigation is client-side.

**Navigation chrome.**
- On the landing view **there is no visible navigation.** The nav links sit at opacity 0 and roll in only between `scrollY` 45 and 180, while the giant wordmark shrinks into the nav logo (0–450).
  - Journey B's first click on `[WORK]` at the top of the page did nothing (`28-landing.png` shows the state).
  - After the hero the nav changes to `[ CONTACT ] [ MENU ]`.
- The nav is `mix-blend-mode: difference`, so it reads over the moss, the orange reel and the taupe section alike.
- From the bundle, not captured: `[ MENU ]` opens a full-screen overlay. Characters rise from `y 100 %` with `blur(4px)` and `rotateZ(−5°)`, and an image panel opens with a `clip-path` polygon. The mobile footer repeats the menu as large At Aero links (`98-mobile-footer-menu.png`).

**Page transition (every route change),** captured on `[LAB]` (`76-nav-lab-transition`, `77-lab-page.png`):
1. A **sage panel** (`bg-Hoki`, about `#545e54`) sweeps up from below the viewport, entering **tilted 10° and scaled 1.5×**, and levels out to full-screen (1.2 s `power4.inOut`).
2. On it, `PageTransitionLogo.webm` (1080², 2.0 s) plays: "PRØDUX Ø Branding company" with the **Ø spinning**.
3. The route changes under the panel, and the panel is held until **at least 2 s** have passed since it started.
4. It leaves upward, tilting to −10° (1.2 s `power4.inOut`), onto the new page, whose H1 then rises line by line.

About 3.5–4 s pass from click to readable page.

**Project card "portal"** (`101-project-card-portal-transition`, crop `logs/101-portal-detail.png`, `102-project-page.png`). Clicking a card does **not** use the panel. Instead:
1. The rest of the grid fades to black while the clicked card's image **detaches, grows and slides** into the project page's full-bleed hero position (about 0.8 s).
2. The project title (`H1 Edgerun Industries`) and a mono description rise in above it (about 0.6 s).

From click to landed is about 1.4 s, with no panel and no hold. A small Zustand-style store (`isTransitioning, imageSrc, sourceRect, targetRect, isVideo, videoCurrentTime, portalLanded`) carries the source rect and, for video cards, the playhead, so the media looks continuous. The cards are click handlers, not `<a>` elements: there are no project URLs in the home page's link list, although the target page has one (`/projects/edgerun`).

- **Project page** (`/projects/edgerun`, 7 066 px): H1, "Art Direction", "Creative Process", "See more projects"; no WebGL; two WebM loops (`103-project-page-scroll`, `104-project-page-scrolled.png`).
- **Browser back** from there returns to `/` **at `scrollY 0`**: the visitor who opened a project 6 500 px down lands back on the wordmark (`105-browser-back-to-home`, `106-after-back.png`). There is no scroll restoration.

**Lab page** (`/lab`, `77`, `78-lab-sweep-scroll`, `79-lab-scrolled.png`): "We built it anyway. You'll be glad we did." Two side products (MICROGRAPHICS_OS, a Figma Bento template), no WebGL. Nothing on it reacts beyond hover states.

**404** (any unknown path, `80-404-load`, `81-404-page.png`, `82-404-game-play-with-sound`, `83-404-game-state.png`): a pixel-art page.
- "OOOOPS… 4[Death Star]4 PAGE NOT FOUND", with lime chevrons, a barcode, three hearts and "SCORE: 0".
- A **side-scrolling fight game** in a 1282×100 2D canvas (`imageRendering: pixelated`). You are **Darth Vader**. Two white-armoured enemies walk in: a **Luke** sprite (`luke-*` frames) that duels with a saber, blocking and attacking by AI state, and a **Han** sprite (`han-*`) that fires blasters.
- Controls: **←/→ or A/D** move, **Space** slashes (three frames: top, middle, bottom), and **holding Space** blocks and deflects bolts. A hit flashes the sprite red and costs a heart; "GAME OVER" follows after three.
- On touch there is an on-screen D-pad and A/B buttons ("A slash", "B deflect"); the cabinet start button `play-cap` presses down with `back.out(2.5)`.
- Sound in §8.

## 5. Scroll behaviour

**Engine.** Lenis 1.3.16 smooths the wheel (`lerp 0.05`, `wheelMultiplier 0.9`), and GSAP ScrollTrigger reads the native `scrollY`. Lenis leaves the real document scrolling, so the scrollbar works, and a keyboard handler maps `Home`/`End`/`PageUp`/`PageDown` onto `lenis.scrollTo`. Going back to the home page does **not** restore the scroll position (§4). Touch is native (`syncTouch false`, `touchMultiplier 0`). The desktop page is **20 991 px** tall (23 viewports). There are **no snap points and no GSAP pins**: every "pinned" stage is a CSS `position: sticky` box inside a tall wrapper.

**Effect windows** (desktop `scrollY`, from `ScrollTrigger.getAll()` in `logs/probe-st-after-scroll.json`):

| scrollY | What happens | Mode |
|---|---|---|
| 0–450 | The full-width **PRØDUX wordmark shrinks and slides into the navbar logo** (`NavbarMorphingLogo`) | scrub 1.5 |
| 45–180 | Nav links `[WORK] [STUDIO] [LAB] [CONTACT]` roll in | scrub 1.2 |
| 26–2 276 | **Hero tiles fly in**: about 20 image tiles start at `z −1500`, `scale 0.2`, blurred up to 40 px, and assemble into one image | scrub 1 |
| 273–813 | The H1 words fall away (`y −110 %`, `rotateZ −2°`, stagger 0.04) | scrub 1 |
| 225–5 175 | Main hero timeline: remaining tiles land, the assembled frame (the moss rock with the PRØDUX logo) **widens to 100 %**, and at the end its content **swaps to the showreel video** | scrub 1.5 (sticky wrapper 5 850 px) |
| 5 645 | "Selected projects" header words rise (`natureSway`) | toggle |
| 5 777–8 898 | Five project cards: clip-path reveal at `top 85%` (1.7 s `power4.out`) plus a scrubbed parallax | toggle + scrub |
| 8 453–9 443 | About paragraph **fills word by word** from 20 % to 100 % white | scrub 1.1 |
| 8 977 | Client logo cards drop in from the centre out (stagger 0.04) | toggle |
| 9 699–10 547 | "Where We Contribute" and the four service rows reveal | toggle |
| 10 881–16 281 | **Services stage** (sticky, 5 400 px): the rock image sequence is scrubbed over 10 881–15 381 (frame = `floor(269 × progress) + 1`, eased toward the target at 0.1 per frame) | scroll listener |
| 11 421–13 311 | The background **blooms from the centre to dark green** (`--bg-progress` in a radial gradient) as moss grows over the rock | scrub |
| 13 311 / 13 581 / 13 797 | The three callouts ("Brand Identity in just 14 days", "Stand out and earn trust", "Launch faster & save capital") appear | toggle |
| 16 596–18 306 | Testimonial cards slide horizontally across a sticky stage | scrub 1.5 |
| 18 261–18 711 | Page background tweens `#303930 → #6e6554` (green to taupe) | scrub 1 |
| 18 564–19 122 | Journal statement fills character by character | scrub 0.5 |
| 19 338–20 091 | Footer parallax; at 19 383 the footer wordmark's six letters rise (1.7 s `expo.inOut`, stagger 0.15) | scrub + toggle |

**Scroll-linked vs time-based.** Everything in the hero, the services stage, testimonials and colour changes is scrubbed and reverses exactly (`64-fast-scroll-to-top`: the tiles fly back out and the wordmark re-expands). Text reveals (`natureSway`, `power4.out`) are toggles that play once. Lenis's `lerp 0.05` makes every stop a long glide: a 3 s wheel gesture took about 4.5 s to come to rest.

**Velocity effects.** Only the client-logo marquee reacts to scroll velocity: `ScrollTrigger.getVelocity() × 0.002`, clamped to ±1.5, sets its speed and direction (0.4 s `power2.out`). Nothing skews or stretches with speed.

**Measured check.** A 900 px wheel at DPR 2 moved `scrollY` 406 px (Lenis sees half the delta at DPR 2, times 0.9). All journeys use `wheelScale: 2`, so they feel like a real wheel.

## 6. Cursor & micro-interactions

Found by clips, hover sweeps (`h.sweep`: a grid of pointer stops recording the element, cursor and `:hover` target) and the listeners in the bundle. There is no custom cursor replacing the arrow. Instead, small DM Mono **cursor chips** trail the pointer, and each one names the action available under it.

- **`[SCROLL DOWN]` chip** (landing only, `scroll-down-indicator`, `mix-blend-mode: difference`, `aria-hidden`).
  - It follows the pointer with a **1.2 s `power4.out` lag**.
  - Its **brackets spread apart with pointer speed**, up to 50 px each side (`back.out(1.2)`), and spring back 100 ms after the pointer stops (`29-scroll-down-label-and-nav-hover`).
  - It hides over interactive elements and once `scrollY > 50`, and comes back on returning to the top.
- **`▸ PLAY REEL` chip** over the showreel once it is full width, **`↗ VIEW` chip** over project cards (`39-…`), **`TRUSTED BY` chip** over the logo marquee (`42-about-filled-logo-marquee.png`).
- **Project cards (the pixel smear)**, `PixelDistortionCanvas`, one three.js renderer per card, 5 cards.
  - A 64×64 float `DataTexture` holds a UV offset per cell. Each frame, cells within 8.96 cells of the pointer are pushed by the pointer's velocity (strength `80 × (1 − d/8.96)`), every cell decays ×0.95, and the velocity decays ×0.8. The shader samples the image at `uv − 0.02 × offset` with `NearestFilter`, so the displacement is **blocky**.
  - Result: a fast stroke drags a band of square pixels along the pointer's path, and it settles in about 1 s (`39-project-card-pixel-distortion-sweep`, crop `logs/39-card-distortion-detail.png`, still `40-project-card-distorted.png`). A slow hover barely moves it.
  - Hovering one card **dims and blurs the other cards** and brings its title and tags forward. All 15 sweep points hit the canvas with `cursor: pointer`.
  - Video cards update their texture at 30 fps; renderers pause off-screen.
- **Contribution rows (hover preview)**, desktop only (> 1024 px). Sweep: 5 of 16 points changed state, all on the rows.
  - Hovering a service row indents and brightens it, and opens a **floating video card that follows the pointer** (lag 0.1, width 16.8 vw), tilting with horizontal velocity and warping its mesh slightly.
  - The card **enters, exits and switches clips through a pixel-grid wave** (grid 35, 0.85 s) whose pixels are lime **#CFFF6A** with ±20 % colour noise (`45-contribution-hover-sweep`, crop `logs/45-contribution-pixel-entry-detail.png`, `46-contribution-video-preview.png`).
  - Each row cycles through several project clips (`Vid 1–4.webm`), played only while shown.
- **Logo marquee**: an infinite row of client logos whose speed follows scroll velocity; it can be **dragged** (GSAP `Draggable` on a proxy, `cursor: grab`, cards scale to 0.98 on press) and it keeps some throw (`43-logo-cards-drag`).
- **Nav links**: `[WORK]` etc. are double-stacked text that rolls up on hover; each link's `textContent` is the label twice (`[WORKWORK]`, DOM probe `interactive`). I did not check whether the duplicate is hidden from screen readers. The nav sits in `mix-blend-mode: difference`, so it stays legible over every background.
- **Text-link underline**: `spring-500-60` custom ease, a 0.3 s `scaleX` from the left on enter and to the right on leave.
- **Testimonials**: the card under the pointer lifts and the others blur (`56-testimonials-cards.png`).
- **Journal cards**: an accordion row; the hovered card widens to show its title, blurb and "Read more", and its video plays (`58-journal.png`, `59-journal-card-hover`).
- **Footer wordmark ink**, `FooterShaderCanvas`: see §7. The pointer paints moss into the letters (`61-footer-wordmark-ink-sweep`). The canvas keeps `cursor: auto`.
- **Services stage**: pointer moves the particle camera by up to 0.15 units (lerp 0.05) (`52-services-particles-pointer-parallax`). The rock itself does not react to the pointer.
- **Showreel**: the 404 game aside, this is the only click-driven "moment" on the home page: see §4 and §8.

## 7. 3D / WebGL

There is **no 3D scene** in the usual sense. The "3D" on Produx is three things: pre-rendered 3D delivered as images, 2D image effects written as fragment shaders, and one small particle field. Each effect gets its **own three.js r182 renderer on its own small canvas** (up to 12 WebGL2 contexts on the desktop home page), created lazily and paused off-screen.

| Effect | Canvas | Technique | Reacts to |
|---|---|---|---|
| **Rock image sequence** (services) | 2D canvas, 53 vw wide (763×834 CSS px at 1440), DPR-sized | 270 pre-rendered WebP frames (`rock_0001…0270.webp`, about 98 KB each, **26.6 MB** in all): a dark rock turning, then moss growing over it. Drawn with `drawImage`, rotated **108°** (150° at ≤ 1024 px), frame eased toward the scroll target at 0.1 per rAF. *Inferred:* rendered offline in a 3D tool (grass, moss and lighting are path-traced quality) | scroll only |
| **Particle field** (services) | full-viewport WebGL, `setPixelRatio(1)` | `THREE.Points`, **100 points**, colour `#bbc868`, size 0.02, opacity 0.55, drifting down 0.05 per frame and wrapping; ambient light 3 + directional 1.2 at (2.9, 2.1, 0.7); a `PerspectiveCamera` (fov 75) that eases toward the pointer (±0.15, lerp 0.05) | pointer |
| **Project-card pixel smear** (×5) | per card, `setPixelRatio(2)`, `antialias false` | Orthographic quad; image or `VideoTexture` with CSS-cover UV math; a 64×64 float `DataTexture` of per-cell offsets (see §6) sampled with `NearestFilter`; offset scale 0.02 | pointer velocity |
| **Pixel Reveal headings** (×4, desktop only) | per heading (e.g. 301×180, 1247×236, 330×121, 490×141 CSS px) | Text rasterised from the At Aero font (loaded again with `new FontFace`) into a texture; a shader reveals it through a noisy pixel grid (`uPixelSize`, `uNoise`, `uWaveRand`, `uEdgeSoftness`, `uDirection`), per-line slide and split. Headings: "Selected projects", "Where We Contribute", "Beyond clients. Trusted partners.", "What our partners says about working with Produx" | scroll (reveal on enter) |
| **Contribution video preview** | one full-section WebGL canvas (1440×741, hidden ≤ 1024 px) | A 32×32-segment plane showing a `VideoTexture`; transitions between clips are a pixel-grid wave (`uTexA`→`uTexB`, `uProgress`, grid 35, band 4, lime `#CFFF6A` pixels, 0.85 s); position follows the pointer (0.1), rotation Z from velocity (0.004, damping 0.08), mesh warp 0.002 | hover + pointer |
| **Footer ink wordmark** | 1282×201 CSS px | A GPU **ink simulation** in a ping-pong state texture (`damping 0.93`, `spring 0.005`, `inkDissipation 0.926`, `brushSize 0.64`, `velocityPush 2.18`) stamped by the pointer. Where ink passes `edgeThreshold` on an **80-cell pixel grid**, the white wordmark (texture A) is replaced by a **moss-textured wordmark** (texture B, `footerShaderImages/B.png`) with refraction from the ink gradient, pixelation (150), dither (grid 20). The six letters slide up per-letter inside the same shader (1.7 s `expo.inOut`, stagger 0.15), "same logic as NavbarMorphingLogo" per the shader comment. `gsap.ticker.lagSmoothing(0)` | pointer; ink fades in about 3 s |
| **Hero tiles** | DOM, not WebGL | About 20 `<div>` tiles with CSS 3D transforms (`z`, `scale`, `filter: blur()`, `force3D`) assembled by GSAP | scroll |

- **What ties them together (inferred):** one material story. A **black rock grows moss** in the services stage; the same moss rock is the hero image the tiles assemble into ("We turn direction into identity"); and the **footer wordmark is painted with that moss** under the pointer. The lime `#CFFF6A` pixels and `#bbc868` particles are the same green family.
- **No post-processing, no bloom, no film grain.** All effects are 2D-plane shaders.
- **lil-gui ships to production** for the footer and Pixel Reveal shaders; the panel root is `display: none` (DOM probe), so it is a leftover tuning tool, invisible to visitors.
- Evidence: `48-services-rock-black-to-bloom`, `49-services-green-bloom.png`, `51/67-services-rock-labels`, `52-services-particles-pointer-parallax`, `39-project-card-pixel-distortion-sweep`, `45-contribution-hover-sweep`, `61-footer-wordmark-ink-sweep`, `62-footer-ink-revealed.png`; shader sources in `logs/src/pretty/0k4m.k83bg769.js` (cards, services), `0~lk9iwq5oxqa.js` (Pixel Reveal, contribution), `0i-.3ea0..wgc.js` (footer).

## 8. Sound

**Default: silent, and there is no global sound toggle.** The home page has no ambient score, no UI sounds, and no Web Audio (`AudioContext` never appears in the bundle; the capture hook logged no buffer or oscillator plays). Sound exists in exactly two places, and both are opt-in by a deliberate act:

| Where | Files | Trigger | Level |
|---|---|---|---|
| **Showreel** (home, end of hero) | The HLS stream's own AAC track, extracted to `audio/showreel-audio.m4a` (40.0 s, stereo, 48 kHz, 122 kbit/s) | Click **"▸ PLAY REEL"** on the full-width reel. `video.muted = false`, then `play()`; the reel scales to cover the viewport and a control bar appears with **pause, a thumbnail scrubber, a mute toggle and ×**. Closing re-mutes it | `volume 1`, peak −2.9 dBFS, RMS −14.5 dBFS |
| **404 game** (any unknown URL) | 6 MP3s under `/game/`: `saber-slash-1/2/3.mp3`, `laser-gun-1/2.mp3`, `saber-deflect.mp3` (26–50 KB, 0.61–1.18 s, 44.1 kHz stereo, ~340 kbit/s) | Played through `new Audio(src)`, preloaded at page load, and fired as `cloneNode().play()` so hits can overlap. **Space** = a slash (cycling 1→2→3), holding Space blocks and plays `saber-deflect` when a bolt is deflected, each blaster shot from the Han sprite plays `laser-gun` (alternating 1→2) | `volume 1` for all, no mix, no ducking |

**Measured timeline** (`audioEvents` in `logs/run-2026-09-27T12-36-23-418Z.json` and `…12-42-47-774Z.json`, and the video-state sampler `logs/probe-video-timeline.json`, every 200 ms):

- The showreel plays **muted from page load** (seen playing at `y = 0`, 7.9 s in), and keeps looping muted for the whole visit: still playing at `y = 18 496`.
- Click on the reel at 48.1 s → `muted: false` at 48.4 s. It stayed audible until the × at 67.7 s re-muted it. Contribution and journal videos are muted clips that only play on hover or in view.
- 404 game, one 19 s play-through (`82-404-game-play-with-sound`): **28 SFX plays**. Four Space taps gave `slash-1, 2, 3, 1` 0.54 s apart; while Space was held, 9 plays landed in 2.2 s (a slash, then lasers and deflects interleaved; three plays within 0.14–0.26 s twice). The mix is whatever overlaps: every clone plays at full volume.

**Files, read from spectrograms and `logs/audio-probe.md`** (I cannot hear them):

- **`showreel-audio.m4a` (the music).**
  - 0–5.2 s: a **descending harmonic sweep**, energy gliding from about 2–4 kHz down toward 1 kHz with a pulsing amplitude wobble, over a quiet low bed.
  - 5.2–36 s: a **dense, loud, bass-heavy beat track**, with most energy below 200 Hz and bright transients up to about 13 kHz.
  - It is cut into blocks by **short dropouts (0.1–0.2 s below −40 dB) exactly every 5.05 s**: at 7.2, 12.3, 17.3, 22.3, 27.4 and 32.5 s. The envelope autocorrelation peaks at **5.05 s (r 0.52)** and 10.1 s. *Inferred:* phrases of 8 beats at about 95 BPM, with the video edit cutting on those drops.
  - 36–40 s is silence before the loop restarts.
- **`saber-slash-1/2/3.mp3`**: broadband whooshes of 0.7–1.1 s, heaviest below 300 Hz, with faint tonal lines at about 1.1–1.3 kHz (*inferred:* saber hum). **`saber-slash-1` starts with 0.25 s of silence**, so that slash sounds a quarter-second after the key press; the others start within 0.05 s. The three slash files **peak above full scale (+1.2 to +3.0 dBFS)**, so they will clip at `volume 1`.
- **`laser-gun-1/2.mp3`**: a sharp broadband attack, then a low body that decays by about 0.55 s and a long low tail. Crest 16–18.5 dB, the most transient files in the set.
- **`saber-deflect.mp3`**: 0.61 s, peak +1.0 dBFS, crest 13.8 dB.
- *Inferred:* these are Star Wars-style effects matched to the licensed-character sprites (Vader, Luke, Han); their source and licence are not stated anywhere I could see.

**Mix design.** There is none in the Edolus sense. There are no stems, no state-driven volumes, no pitch or velocity mapping, and no global mute. Sound is either a finished film soundtrack you switch on, or arcade SFX fired at full volume per game event. The design choice worth noting is the opposite of Edolus: **sound only where the visitor has explicitly chosen a "play" moment** (a reel, a game), so the page never needs a sound toggle.

### Questions for Janriz

1. **Showreel, first 5 s:** is the descending sweep a riser into the beat drop, and does the drop at 5.2 s land on a visual cut? Does the whole track feel like it "follows" the edit (cuts every ~5 s)?
2. **Showreel loudness:** after the silent page, does unmuting at volume 1 feel like a jump scare, or right? (RMS −14.5 dBFS is loud for web.)
3. **404 game:** do the slashes feel late? `saber-slash-1` has 0.25 s of dead air at its start, so every third slash should lag the key press noticeably. Do the slashes crackle or distort (they peak above 0 dBFS)?
4. **404 game:** when blocking under fire, 3 sounds can land within 0.5 s at full volume. Does it turn to mush, or does it feel like a satisfying fight?
5. **The whole idea:** would you rather have the Produx model (silent page, sound only inside a "play" moment) or the Edolus model (an opt-in score that follows the page)? It decides whether the portfolio needs a sound toggle at all.

**Janriz's answers (2026-09-27):**

1–4. Not answered.
5. He wants the Edolus model, an opt-in score that follows the page, for the atmosphere it brings. So the portfolio needs a sound toggle.

## 9. Type, colour, layout

All values are computed styles from `logs/probe-type-colour.json` (desktop 1440×900, 20 stops) and `logs/probe-type-colour-mobile.json` (390×664, 6 stops), plus the stylesheet's colour classes (`logs/src/pretty/0hcp-p.-qpzyg.css`). Almost every size is set in `vw`, so the px values below scale with the window.

### Fonts

| Family | Cuts loaded | Served from | Licence | Used for |
|---|---|---|---|---|
| **At Aero** (Pedro Arilla, Arillatype.Studio, 2022) | `AtAero-Retina` (registered as "At Aero", the default text cut), `-Regular`, `-Medium`, `-Light`; OTF, all registered as weight range 100–900 but each file is a single weight | self-hosted: `/_next/static/media/AtAero-*.otf`, plus `/fonts/AtAero-Retina.otf` loaded a second time by the WebGL headings via `new FontFace()` | **Commercial.** The `name` table says "subject to the Arillatype.Studio® End User Licence Agreement" (`logs/fonts/`). Needs a paid web licence | wordmark lettering style, H1, section headings, statements, testimonial names, footer and menu links |
| **DM Mono** (Colophon) | 300, 400, 500 (TTF variations) | self-hosted `/_next/static/media/DMMono-*.ttf` | **SIL OFL 1.1**, free (also on Google Fonts) | nav, labels, blurbs, project descriptions, tags, callouts, footer |

- The **PRØDUX wordmark** is lettering drawn as SVG/DOM (not a font); it shares At Aero's geometry and the slashed Ø.
- **Closest free alternative to At Aero** (my judgement, from its wide round geometric capitals and single-storey shapes): **Satoshi** or **General Sans** (Fontshare, ITF Free Font License, commercial web use allowed; see the font rule in `map.md` Notes), or **Urbanist** / **Outfit** (Google Fonts, OFL). None has At Aero's "Retina" in-between weight; Satoshi Regular at 400 is the nearest in colour.
- `document.fonts` also lists a "Lay 400" face; I could not find where it comes from, and no visible text uses it.

### Type scale (desktop 1440 px → mobile 390 px)

| Role | Font | Size / line height | Other | Colour |
|---|---|---|---|---|
| H1 "You feel the brand before it speaks®" | At Aero (Retina) 400 | **63.9 / 70.3 px** (4.44 vw, lh 1.1) → mobile 46.4 / 51.1 (11.9 vw) | letter-spacing normal; per-line mask reveal | `#f2f2f2` |
| About paragraph (word fill) | At Aero 400 | 45.8 / 57.2 px (3.18 vw, lh 1.25) | words go from 20 % white (`oklab(1 0 0 / 0.2)`) to `#f2f2f2` as you scroll | `#f2f2f2` |
| Services statement "In 14 days…" | At Aero 400 | 41.8 / 48.0 px (2.9 vw, lh 1.15) | `background-clip: text` gradient `linear-gradient(180deg, #FFF −28 %, rgba(255,255,255,0) 114 %)`; solid white on mobile | gradient white |
| Section headings (canvas on desktop) | At Aero 400 | desktop "Selected projects" at 5.2 vw in WebGL; mobile DOM 23.3 / 27.9 px (5.97 vw), "Beyond clients…" −0.58 px tracking | — | `#ffffff` |
| Mobile menu / footer nav links | At Aero 400–500 | 24.0 / 30.1 px desktop (1.67 vw); 31.0 px mobile | — | `#f2f2f2` |
| Testimonial quote | At Aero Regular 400 | 23.9 / 32.9 px desktop; DM Mono 15.5 / 21.3 on mobile | on `#d4cccc` cards | `#303539` |
| Service callouts ("Stand out and earn trust") | DM Mono 300 | 23.9 / 28.7 px | — | `#f2f2f2` |
| "View all works" / "Read all reviews" | DM Mono 400 | 19.9 / 29.8 px | uppercase | `#f2f2f2` @ 0.5 → 1 on hover |
| Hero blurb, body copy | DM Mono 400 | 16.0 / 24.0 px (1.11 vw, lh 1.5) → mobile 13.6 / 17.6 | a `#0e0e0e` duplicate sits under it for the reveal | `#a9a9a9` |
| Nav `[ WORK ]`, `[ MENU ]`, cursor chips | DM Mono 400 | 14.0 / 14.0 px (0.97 vw, lh 1) → mobile 13.6 | uppercase, square brackets as ornament; nav opacity 0.8 | `#f2f2f2` |
| Project description | DM Mono 400 | 14.0 / 18.2 px | uppercase | `#a9a9a9` |
| Footer micro (© line, Privacy) | DM Mono 400 | 14.4 / 20.6 px | uppercase | `#a9a9a9` |
| Project tags ("web design & development") | DM Mono 400 | 9.9 / 14.9 px (0.69 vw) | uppercase, rotated −2°, boxed | `#f2f2f2` |

Letter-spacing is `normal` everywhere except one mobile heading. The system is **two families, no bold**: hierarchy comes from size, the serif-less display face against the mono, opacity and colour, never weight.

### Colour

| Token (Tailwind name) | Value | Role |
|---|---|---|
| `outer-space` | **`#0e0e0e`** | page background, text on light cards |
| (projects band) | `#080808` | projects section background |
| `white-smoke` | **`#f2f2f2`** | primary text, UI lines, nav; `white-smoke/5` `#f2f2f20d` input fill, `/15` borders, `/30` |
| `slate` / `grey` | `#a9a9a9` | secondary text, descriptions, footer |
| `apple-green` | **`#303930`** | services and testimonials background (the moss green; Awwwards lists it with `#545E54`) |
| `valhalla` | **`#6e6554`** | journal section background (taupe), tweened from `#303930` |
| `periwinkle` | `#d4cccc` | testimonial cards |
| `Darkslate-grey` | `#303539` | text on testimonial cards |
| `olive-green` | **`#cfff6a`** | the one bright accent: the contribution pixel wave, the 404's chevrons |
| `red-wood` / `silver` | `#cddbc0` / `#c7cec4` | pale sage text on green |
| Hoki (transition panel) | about `#545e54` (*eyedropped from video frames*, not read from CSS) | page-transition overlay |
| particles | `#bbc868` @ 0.55 | services particle field (from the script config) |
| 404 hearts / hit flash | `#ff302f` | the one red |

The palette is **near-black and off-white, with a moss green that takes over the middle of the page, a taupe close, and a single lime accent**. The imagery (moss, rock, forest aerials) carries the colour; the UI stays greyscale.

### Layout

- **Margins:** `px-[5.5vw]` desktop (79 px at 1440), `4.1vw` at ≤ 1024 px, `5.97vw` at ≤ 640 px. The nav sits at `pt-[5.4vh]`. There is no visible column grid, but content lines up to the margins and a few verticals (for example the hero blurb and the contribution list both start near 52 %).
- **Hero:** the wordmark spans the full content width at the top; the H1 is bottom-left, the mono blurb bottom-right. Below it, the tile assembly centres a 1200-ish px frame that widens to full bleed.
- **Projects:** a staggered two-column layout with deliberately unequal card widths (741, 413, 1094, 423, 756 px) and blurbs under each card.
- **Services (where the "3D" is):** a sticky full-viewport stage. The rock canvas is centred at `left 53 %`, 53 vw wide, rotated 108°. The statement sits bottom-left at the margin, and the three callouts are pinned by leader lines to points around the rock. On mobile the rock sits at `top 38 %` and the callouts become a list.
- **Sections change background** instead of using rules or cards: black → green (radial bloom) → taupe → black footer.
- **Chrome:** 1 px lines in `#f2f2f2` or `white-smoke/15`, square boxes with no radius, bracketed mono labels. The one rounded thing is the contribution preview (`border-radius: 4px`).

## 10. Performance & degradation

**Load (desktop 1440×900, Apple M5, no throttling).** TTFB 176–292 ms, FCP **400–536 ms**, DCL 357–460 ms, `load` 472–847 ms (three cold loads). LCP is the DM Mono hero blurb at the same 400–536 ms: honest here, because the hero is HTML. The page is usable from first paint: no loader, nothing to click through.

**Transfer.**

| Moment | What crossed the wire |
|---|---|
| Landing, about 10 s after load | **17.4 MB** in 229 requests (`probe-perf-landing.json`): 10 MB WebP (the first 100 rock frames load 5 s after mount, plus images), **4.5 MB of showreel HLS segments for a video that is still hidden**, 1.7 MB contribution WebM, 0.94 MB JS (3.0 MB decoded, 30 files, hls.js included), 0.29 MB fonts |
| Whole desktop journey (5.3 min, top to bottom and back) | 599 responses and **about 132 MB** by `content-length` (network log, `run-2026-09-27T12-36-23-418Z.json`): **70 MB of showreel segments** (157 responses for 19 distinct segments: the reel loops muted all visit and is re-fetched; every asset is served `cache-control: public, max-age=0, must-revalidate`), **26.6 MB** for the 270 rock frames, 27 MB of journal MP4s (15 range responses for 5 videos), 4.1 MB WebM |
| Mobile landing (iPhone 13 preset) | **15.2 MB** in 196 requests (`probe-perf-mobile-landing.json`) |

The resource-timing buffer fills at 250 entries, so `probe-perf-end.json` undercounts; the network log is the reliable total.

**Frame feel.** The page's own `requestAnimationFrame` ran at **60 fps at every stop** (landing, tiles, services, testimonials, journal, footer, and after the ink sweep; `logs/probe-fps-desktop.json`). Clip frame intervals had a median of 16.7 ms almost everywhere.
- p95 values of 30–35 ms appear only in clips with idle tails: the screencast only sends a frame when something changes.
- The exception is the **footer**: with the ink shader active, the compositor delivered about **30 fps** in two separate runs (median 31.7 and 33.8 ms) while rAF stayed at 60. *Inferred:* the ping-pong ink simulation plus pixelation at DPR 2 is the heaviest thing on the page. Worth checking in real Chrome.
- **Clips kept above the capture thresholds** (median > 17.5 ms or p95 > 25 ms):
  - `61` and `63` (the footer, about 30 fps: see above).
  - `29, 30, 37, 59, 60, 69, 78, 85, 87, 89, 97, 99, 101, 103`, which all have a median of 16.6–17.2 ms and a p95 of 30–51 ms from idle tails.
  - Reshooting `30`, `60` and `61` in a second run with a different neighbour in the other slot reproduced the same numbers (`notes.md`), so these are not slot contention.
- The site limits itself in several places: project-card video textures update at 30 fps, the particle renderer uses `setPixelRatio(1)`, and every renderer pauses when off-screen or when the tab is hidden.

**Stability.** CLS was 0.19 on the landing (recon) and accumulated to 0.79 over the scrolled journey (the observer counts scroll-driven layout changes, so treat this as indicative).

**Mobile tier** (390×664 @3, touch; `06-mobile.js`, clips `89`–`99`, stills `90`–`100`). Page height is 11 652 px (vs 20 991 desktop), and native touch scroll moved exactly what was sent. What changes:
- **dropped:** the wordmark-to-nav morph (the nav logo and `[ MENU ]` are there from the start), the project-card pixel smear (plain clip-path reveals), the Pixel Reveal WebGL headings (**they become real DOM `<h2>`s**: "Selected projects", "Where We Contribute", "Beyond clients. Trusted partners."), and the contribution hover preview (the canvas is `display: none`).
- **kept:** the tile assembly (shorter: `body` trigger over 155 % instead of 550 %), the rock image sequence (the same 270 frames, rotated 150° instead of 108°) with the green bloom, the particle field, the footer ink canvas and the showreel with a ▸ play button.
- The services callouts become a list, and testimonials become a horizontal card row.
- Mobile LCP was **1.61 s**, and it was the `[scroll down]` indicator, because the H1 was still inside its mask reveal. The H1 was visible at 1.58 s.
- Mobile still downloads the full rock sequence and the HLS reel.

**Reduced motion.** **Not handled.** Neither the JS bundle nor the CSS contains `prefers-reduced-motion`. With the preference emulated (`matchMedia` returned `true` before and after load), the cold load, wordmark morph, tile flight with blur, rock scrub and bloom were identical to the normal run (`84-reduced-motion-cold-load`, `85-reduced-motion-hero-scroll` vs `30`, `87-reduced-motion-services`; stills `86`, `88`). Lenis smoothing also stays on.

**Accessibility notes, seen in passing.**
- Good: real `<h1>` and `<h3>` project titles; `lang="en"`; zoom allowed.
- Problems:
  - The **PRØDUX wordmark is six unlabelled SVGs** (no `aria-label`, no text).
  - On desktop the section headings exist only in WebGL canvases.
  - The duplicated hover text reads as "WORKWORK" or "AAbbrraanndd…" in `textContent` (a doubled-character split in one `<h2>`).
  - **Nav links are invisible (opacity 0) until you scroll 45 px**, so the landing view shows no navigation at all.
  - The project cards are not `<a>` links: they navigate through a click handler.

## 11. Ideas worth taking

The standing constraints are numbered as in the map Notes:

1. GSAP-only animation
2. real-HTML text
3. chat usable within 1 s
4. reduced-motion and mobile tiers, with lazy 3D and audio
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free/self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **One material story that transforms with scroll and comes back under the pointer.**
   - Produx has one motif: a bare rock grows moss while the page blooms green. The same moss rock is the image the hero tiles assemble into, and the footer wordmark gets painted with that moss wherever the pointer passes.
   - **Why it fits:** it is the most memorable thing on the site, and it is *concept*, not effect. For this portfolio the motif could be the AI entrypoint itself: something raw that "grows" knowledge section by section (the wiki behind the agent), with Janriz's name at the close revealed in that same material under the pointer. It turns the page into one story rather than a stack of sections.
   - **Strains:**
     - Constraint 5, if copied literally (26.6 MB of frames).
     - Constraint 4: it needs a static per-section pose under reduced motion, and a lighter mobile version.
     - The footer reveal must stay decoration over a real-text name (constraint 2).
2. **Pre-rendered 3D as a scroll-scrubbed image sequence**, instead of a real-time scene.
   - Path-traced grass and moss for zero WebGL cost: GSAP scrubs a frame index, the canvas eases toward it (0.1 per frame), and frames load **in chunks tied to earlier sections** (1–100 after 5 s, then batches as the visitor approaches).
   - **Why it fits:** Janriz can render such a sequence himself in Blender (the Blender MCP route in *3D routes*), which meets the self-made-assets rule and gives offline render quality. The staged loading is a ready answer to "3D loads lazily after first paint".
   - **Strains:**
     - Constraint 5: the frame count, resolution and format must be budgeted. For example 60–90 AVIF frames, half-resolution on phones, and a single still on slow connections.
     - Constraint 4: under reduced motion, show the end frame (or one frame per section).
     - It does not react to the pointer, so any interactivity has to be layered on top.
3. **Cursor chips that name the action**, in the mono face and with brackets: `[SCROLL DOWN]`, `▸ PLAY REEL`, `↗ VIEW`, `TRUSTED BY`. The brackets spread with pointer speed and spring back.
   - **Why it fits:** it is a calm, text-first cursor language that matches the chat's legible, quiet role. A chip could say `[ ASK ]` over the AI entrypoint, `[ OPEN CASE ]` over a project, or `[ AGENT IS TYPING ]` while a tool effect runs. It extends the bracket typography rather than adding a gimmick.
   - **Strains:**
     - Constraint 4: no chips on touch, and no lag under reduced motion.
     - Accessibility: the chips are `aria-hidden`, so every control still needs its own visible, focusable label.
     - It is only bespoke if the bracket system runs through the whole design.
4. **One pixel language across every transition**: the card smear (a 64×64 offset grid, `NearestFilter`), the lime pixel wave on hover previews, the pixel-edged ink in the footer, and the pixel-art 404.
   - **Why it fits:** a single, recognisable "texture of change". For a chat-driven site it could become the signature of *the agent touching the page*: when a tool effect such as `highlight_project` or `scroll_to` fires, the target resolves through the same pixel wave, so visitors learn to read "the AI did this".
   - **Strains:**
     - Constraint 5: Produx runs up to 12 WebGL renderers; ours should share one canvas, or use Canvas2D or CSS for small ones.
     - Constraint 4: an instant swap under reduced motion.
     - The effects rule: a pixel dissolve is borderline generic unless it is tied to the agent in this way.
5. **Section colour as the divider, scrubbed**: black, then a radial moss bloom (a CSS custom property in a radial gradient), then taupe, then black.
   - **Why it fits:** a big change of mood for almost no cost; it could map to State 1 → State 2, or to "chat active".
   - **Strains:** none beyond a stepped reduced-motion branch. It is GSAP on a CSS variable.
6. **Sound lives only inside a moment the visitor chose to play** (the reel, the game), so the page needs no sound toggle.
   - **Why it fits:** it is the cleanest possible answer to constraint 4's "audio after a gesture". Weigh it against Janriz's Edolus answers (he liked transition sounds and a state-following score), which point the other way. See the §8 questions.
   - **Strains:** it conflicts with the direction Janriz already stated, so it is an option, not a default.
7. **A shared-element "portal" from card to page**: the clicked card's media grows into the next page's hero, with the video playhead preserved, and lands in about 1.4 s with no overlay.
   - **Why it fits:** it keeps the visitor's eye on the thing they chose. For the portfolio, a project card (or a chat answer that cites a project) could open its case this way. With a persistent chat drawer the AI entrypoint never leaves the screen, which suits constraint 3 far better than a full-screen panel.
   - **Strains:**
     - Constraint 1: build it with GSAP Flip, not a bespoke store.
     - Constraint 4: a crossfade under reduced motion.
     - Produx loses the scroll position on back; ours must restore it.
8. **A 404 that is a real mini-game** in the site's own visual language, with a score, hearts and keyboard controls.
   - **Why it fits:** it is a cheap place for play that never touches the critical path. A portfolio version could have the agent answer "what were you looking for?", or a tiny game with the roaming bot.
   - **Strains:** none of the five. The assets must be original: Produx uses Star Wars characters and sounds.

**What to avoid:**

- **A muted showreel streaming from page load and looping all visit.** It is hidden until about 5 000 px down, yet it pulled 4.5 MB before first scroll and **70 MB over a 5-minute visit** (re-fetched each loop, `max-age=0`). Start media when it is about to be seen, and stop it when it leaves.
- **A 26.6 MB frame sequence shipped to phones unchanged**, and about 130 MB for one full desktop visit.
- **One WebGL renderer per effect** (up to 12 contexts on one page): browsers cap live contexts and drop the oldest.
- **Canvas-only section headings on desktop**, and a hero wordmark made of six unlabelled SVGs. This breaks constraint 2. Their mobile tier proves the DOM version was easy.
- **No reduced-motion branch at all**: tile flights with 40 px blur, scrubbed morphs and Lenis smoothing stay on under `reduce`.
- **Navigation hidden at landing** (links at opacity 0 until 45 px of scroll), **project cards that are not links**, and **no scroll restoration** on back.
- **A minimum 2 s page-transition hold** on every navigation (overlay 1.2 s in, held to 2 s, then 1.2 s out). This breaks constraint 3 on any route change.
- **Debug tooling in production** (lil-gui imported on every load), and duplicated hover text that reads as "WORKWORK" / "AAbbrraanndd".
- **Licensed IP and unmastered SFX** in the 404: Star Wars sprites and sounds, slashes peaking above 0 dBFS, and one slash with 0.25 s of dead air.
- **The generic layer**: blur-in word reveals on every heading, word-by-word colour fills, a dimmed-siblings hover. They are well executed but not Produx-specific. The effects rule would cut them for us.

## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | cold load, landing, first scroll probe (wheel moved half: `wheelScale 2`) | `motion/01`, `screenshots/02`–`05` |
| `02-structure.js` | Lenis options; stills every 1 100 px down the whole page (page map) | `screenshots/06`–`26` |
| `03-probes.js` | no media: ScrollTrigger inventory through the Turbopack hook (`ST_ONLY=1`), text map and computed type/colour at 20 stops; its functions are reused by 06 | `logs/probe-st*.json`, `probe-text-map.json`, `probe-type-colour.json` |
| `04-journey-a.js` | desktop journey: intro, cursor chip, wordmark morph and tiles, showreel and Play reel (sound), projects and pixel-smear sweep, about fill, logo drag, contribution hover sweep, services rock, testimonials, journal, footer ink sweep, fast scroll to top | `27`–`65` (50, 55, 57 deleted: reshot as 67–69) |
| `05-journey-b.js` | reshoots with page rAF per stop (`probe-fps-desktop.json`), page transition to `/lab`, the 404 game with sound, then reduced motion (emulated in the same context) | `67`–`69`, `76`–`88` (66, 70–75 deleted: no better, or the `[WORK]` click hit the invisible nav) |
| `06-mobile.js` | iPhone 13: cold load, the whole page in 340 px swipes with type/colour and text map per stop | `89`–`100`, `probe-*-mobile.json` |
| `07-portal-menu.js` | superseded: the menu click missed and the card click fell off-screen; all media deleted | `logs/superseded-*` |
| `08-portal.js` | the project-card portal transition, the project page, browser back | `101`–`106`, `logs/probe-page-project.json` |
| `_probe.js`, `_hooks.js`, `_fetch-src.js` | shared probes; the Turbopack module hook that exposes GSAP/ScrollTrigger; the source fetcher (`logs/src/`, `logs/src/pretty/`) | — |

Detail crops: `logs/39-card-distortion-detail.png` (pixel smear), `logs/45-contribution-pixel-entry-detail.png` (lime pixel wave), `logs/101-portal-detail.png` (portal). Mobile stills on one sheet: `logs/mobile-stills-grid.jpg`.
