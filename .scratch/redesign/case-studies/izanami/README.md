# Case study: Izanami

Captured 2026-09-27 with headless Playwright (Apple M5, ANGLE Metal, 60 fps) through `research/capture/capture.js`. Evidence lives here:

- `screenshots/`: stills at 1440×900 @2x. Mobile stills use the iPhone 13 preset (390×664 @3x).
- `motion/`: MP4 clips, each with a `.sheet.png` contact sheet.
- `audio/`: empty. The site has no sound (§8).
- `logs/`: run logs, JSON probes, frame-grid crops, the Awwwards extract, and the site's own JS and CSS in `logs/src/` (pretty-printed as `index.pretty.js` / `index.pretty.css`).
- `scenarios/`: the scripts that drove every run.

Numbers such as `05-hero-pointer-fluid` refer to those files. **Measured** means read from the page, runtime, network or files. **Inferred** means my reading of what I saw. Bundle line numbers refer to `logs/src/index.pretty.js`.

## 1. At a glance

| | |
|---|---|
| URL | https://izanami-official.com/ (English; Japanese at `/ja/`) |
| Awwwards | https://www.awwwards.com/sites/izanami. **Site of the Day, Jul 18 2026** (7.19) plus a **Developer Award** (7.26). Design 7.16, Usability 7.1, Creativity 7.34, Content 7.29. Developer breakdown: Animations/Transitions **8.40**, WPO 7.40, Markup 7.20, Semantics/SEO 7.00, Responsive 7.00, Accessibility **6.40**. 19 jury votes (5.7–8.7). Source: `logs/awwwards-page.txt` (a WebFetch extraction, not a raw dump) |
| Studio | **baqemono.inc.** (an Awwwards PRO studio), credited with Tomoyuki Nakata. Location not given on the page |
| Awwwards tags | Art & Illustration, Business & Corporate, Scrolling, Typography, Storytelling, Copy design. Technologies: WebGL, GSAP, Figma. Elements: Parallax, **Fluid**, Transition, Sticky, Navigation, Scrolling. Palette: #0A0801, #D9D7D4 |

**Gist.** Izanami is a Japanese-Dubai "harmony" brand with three lines of business (School, Craft, Retreat). The site is a quiet, dark, editorial multi-page site, not a 3D experience. Every page is ordinary HTML. A Three.js layer behind it redraws the page's photos and big headings as WebGL planes that track their DOM boxes, and the whole WebGL layer is viewed through a **stable-fluids simulation driven by the mouse**. The pointer leaves a refractive, water-drop-like bubble in the photos and type that drifts and dissolves in about a second. Headings rise onto the page as if surfacing through water. Pages change with a slow black cross-fade (Swup), and a menu shrinks the page away into black. There is no sound.

**Most memorable thing.** The page behaves like a sheet of water over the photographs. A slow pointer leaves a lens-shaped bubble that bends the fog, the stones and the edges of the photos, then drifts off and heals (`05-hero-pointer-fluid.mp4`, crops `logs/05-fluid-end-detail.png`; the photo edges bulge in `08-scroll-hero-to-philosophy` and `17-sticky-cards-slow`). Nothing announces it, there is no custom cursor, and it applies to everything the WebGL layer draws, so the effect *is* the brand line ("Harmony … is something to be remembered"): the page ripples when touched and settles back.

## 2. Tech found

| What | Detail | How detected |
|---|---|---|
| Build | One Vite bundle `assets/js/index.PhJuwueo.js` (846 KB decoded, 230 KB over the wire) plus `assets/css/index.By0AFpwc.css` (71 KB). Static HTML per page; the contact form posts to `/api/contact.php` | network log (`logs/run-*.json`), hashed file names, the bundle's last 60 lines |
| 3D / WebGL | **Three.js r182**. Two WebGL2 canvases: `.canvas.-common` (`[data-webgl="canvas"]`, z-index −1, 1440×1350 CSS = 1.5 × the viewport, scroll-synced) and `.canvas.-nav` (z-index 75, the menu's text). Both `antialias:false, alpha:true`. Canvas2D canvases draw heading text into textures | `window.__THREE__ = "182"`; the init-script `getContext` hook (`probe-runtime-landing.json` → `gfx`); DOM probe `canvases` |
| Animation | **GSAP 3.14.2** with **CustomEase** and **SplitText** (the 2025+ free plugins). No ScrollTrigger: every scroll effect reads Lenis's `animatedScroll` in its own rAF loop | `gsapVersions` global; `version = "3.14.2"` at 15140/16457/18681; `registerPlugin` calls; SplitText options (`charsClass`, `linesClass`, `autoSplit`) at 19146–19573 |
| Smooth scroll | **Lenis 1.3.17**, default options (lerp 0.1, `smoothWheel`, no `syncTouch`), driven by its own rAF, not `gsap.ticker`. Scroll is native underneath (`scrollY` moves; 800 px of wheel moved it 401 px at DPR 2, so runs use `wheelScale: 2`) | `lenisVersion` global; `html.lenis` class; `class sx` at 2327; the recon scroll check |
| Page transitions | **Swup 4.8.2** with its GA plugin and JS-animation plugin; `animateHistoryBrowsing: true` | `this.version = "4.8.2"` at 18278; `initSwup()` at ~21016 |
| Other JS | **Alpine.js 3.15.12** (only the contact form: `Alpine.data("contactForm")`), **WebFontLoader** (the loader waits on it), valibot-style validation | `version: "3.15.12"` at 951; `wf-active` html classes; bundle tail |
| Fluid | A hand-written **stable-fluids** solver (splat → divergence → one pressure step → gradient subtract → advection, velocity dissipation 0.97, dye 0.98) feeding a full-screen post pass. Desktop only: `isPostEffect() = pcLayout && !touchDevice` | `class VA` 17112, `class WA` 17254, shader `$A` at 17220 |
| Fonts | **Satoshi** (self-hosted `Satoshi-Regular.woff`), **Cinzel**, **Playfair Display**, **Shippori Mincho** (Google Fonts, 400 only). Details in §9 | `assets/font/font.css`; the Google Fonts CSS URL; `document.fonts` |
| Sound | **None.** No `AudioContext`, `Audio`, Howler or media element in the bundle; 0 audio responses; the audio hook logged 0 events in every run | bundle grep; `audioEvents` in every run log |
| Framework | None (vanilla classes per page, a global `APP`) | `window.APP`; no framework markers in the runtime probe |
| Analytics | Google Analytics 4 (gtag), page views re-sent by Swup's GA plugin | network log; `N1({ gaMeasurementId })` |
| Meta | `lang="en"`, a real meta description, OG/Twitter image, `format-detection` off, `notranslate`. Pinch zoom is **not** disabled (`width=device-width,initial-scale=1`) | DOM probe `meta` |

**Architecture (the part worth copying).** Every photo, big heading and hero background is authored as normal HTML with a `data-mesh-manager="…"` attribute (`common-img-mesh`, `common-text-mesh`, `common-background-mesh`, `home-background-mesh`, `nav-text-mesh`, …). On each page enter, a mesh manager (`class NA`, 16890) creates one Three.js plane per element, sized and positioned from `getBoundingClientRect()` every frame, so WebGL follows Lenis exactly. Text sources are painted into a Canvas2D texture with the element's computed font (`class sA`, 15786), and their DOM copy stays in the page with `color: transparent` (CSS line 774), so it is still real, selectable, indexable text. Photos are different: the element is an empty `<div>` whose only `<img>` sits inside `<noscript>` (all with `alt=""`), so with JavaScript on, the photos exist only in WebGL. On page leave the meshes are destroyed and rebuilt from the new DOM.

## 3. Intro & loading

- **What you see** (`01-cold-load.mp4`, readiness poll `logs/probe-ready-home.json`):
  - A near-black screen (#0a0801) with the page's own **H1, "Remember who you are"**, fading in letter by letter (SplitText chars, 1.1 s each, 0.055 s stagger) at left-centre, and a small **0–100 counter** at bottom-left.
  - The counter eases to each new loading fraction over 3 s `expo.inOut`: measured 0 at 1.36 s, 18 at 2.4 s, 86 at 2.9 s, 100 at 4.4 s.
  - The loader then fades out over **3 s `cubic.inOut`** (4.4 → 7.0 s) onto the misty forest. The header and the side "aside" (clocks, SCROLL) fade in and scale 1.05 → 1 over 2 s after a 1 s delay (5.2 → 7.1 s).
  - Lenis starts and the loader element is removed at **7.2 s**. Only then can you scroll or click.
- **What it waits for:** fonts (WebFontLoader, 3 s timeout) and **every image on the page** (`class Wd` image loader over `document.documentElement`), counted as progress steps (`class qd`). The home page is light (3.1 MB in 18 requests), so the counter is mostly theatre: the network is done by ~1.3 s and the images decode by ~5.5 s.
- **Skippable?** No. There is no skip control, no "played once" memory (no localStorage/sessionStorage in the bundle), and it runs on every cold load of any page. Internal navigations skip it: Swup runs a lighter "load the new page's images, then fade" step instead (§4).
- **First contentful paint** is the loader's H1 at 464–996 ms, so the text is real from the first frame. LCP is a cloud `<img>` at **7.2–7.8 s**, which is the loader's fade finishing, not the page being slow.
- **Time to first action: 7.2 s on desktop** (poll of the loader element and Lenis's `lenis-stopped` class, not LCP).

## 4. Navigation & page transitions

- **Pages** (all real URLs, all server-rendered HTML): home, philosophy, projects, projects/school, projects/craft, projects/craft-space, projects/retreat, company, contact (+ thanks, privacy, 404), with a Japanese version under `/ja/` (captured for home only: `60-ja-home.png`, `61-ja-philosophy.png`, where English display headings stay and the body copy switches to Japanese in Shippori Mincho). The language switch (EN / JA, top right) is a full reload (`data-no-swup`), so it replays the loader.
- **Header:** logo (a square kanji-like maze mark over "IZANAMI"), EN · JA, and MENU with a small dot above it. A left "aside" rail shows the section name set vertically ("PHILOSOPHY", "PROJECTS"; `writing-mode: vertical-rl`) and, at the bottom, "©2026", two **live clocks** (GST Dubai, JST Tokyo, ticking seconds; `class fP`) and "SCROLL".
- **Swup page transition** (`31-menu-to-philosophy`, `34-history-back-to-home`, `88-history-forward-to-philosophy-reshoot`, the `footer-next-to-*` clips; crop `logs/31-page-enter-lens-detail.png`):
  1. **Out:** a full-screen `[data-transition]` layer fades to black over **0.8 s `cubic.out`**. Lenis stops, the WebGL render loop stops, all meshes are destroyed.
  2. Swup swaps `#swup`, then the new page's images load as progress steps (no counter shown).
  3. **In:** meshes are rebuilt, the render loop restarts, then after 0.5 s the black layer fades out over 0.8 s. The hero photo arrives through a **barrel lens with a red/blue split** that relaxes to flat (`u_inViewProgress` 0.9 → 1 over 3 s `quart.out`, multiplier −20, R/B offsets ±0.05), and the heading ripples in on top (§6).
  - Total: ~1 s of pure black between pages. The same animation runs for links, the menu, the footer's "next" link, and browser Back/Forward (`animateHistoryBrowsing: true`). Back lands at the top of the previous page (`history.scrollRestoration = "manual"`, and nothing restores the position).
- **Menu** (`27-menu-open`, `29-menu-hover-sweep`; crop `logs/29-nav-hover-detail.png`):
  - MENU click: the page (`[data-content]`) scales to **0.9** and fades out over **0.8 s `cubic.in`**, the header label crossfades MENU → CLOSE, and the nav fades in on near-black.
  - Nav links (HOME, PHILOSOPHY, PROJECTS, COMPANY, CONTACT in Cinzel caps, plus small SCHOOL / CRAFT · IZANAMI SPACE / RETREAT sub-links) are **drawn by a second WebGL canvas** from transparent DOM text. Each slides in from x +1.25vw and ripples into focus with its own delay (0.6–1.1 s); a dot marks the current page.
  - Footer of the menu: Dubai and Tokyo office addresses, a privacy link.
  - **Accessibility done right:** `aria-expanded` on the trigger, `aria-hidden` on the nav, a Tab focus trap, focus moves to the first link and back to the trigger on close, Lenis is stopped while open, Escape closes.
  - **Bug found:** Escape calls `closeAnimation()` directly without clearing `isOpen` (bundle ~20675), so after closing with Escape the next MENU click is swallowed (it "closes" again) and a second click is needed. Journey A's run failed on exactly this.
- **Footer "next" link:** every page ends with a large "→ Next page" link (a long rule and the next page's name in Playfair: Philosophy → Projects → Projects / School → … → Contact), so the whole site reads as one chain (`24-footer.png`, `25-footer-next-hover`).

## 5. Scroll behaviour

- **Smooth scroll:** Lenis with defaults (lerp 0.1) on wheel; **native touch scrolling** on phones (no `syncTouch`). Native scroll underneath, so the scrollbar, `scrollY`, find-in-page and anchors all work (`class Zd` handles `#top`). No wheel hijack, no snap, no velocity effects (the fast scroll in `26-fast-scroll-to-top` shows nothing but the page moving).
- **No ScrollTrigger.** Each scroll effect is a small class with its own `requestAnimationFrame` loop that reads `lenis.animatedScroll`, started and stopped by one shared IntersectionObserver when its element enters or leaves the viewport:
  - **Hero title fade:** "Remember who you are" fades out (`autoAlpha` 0, 0.5 s `cubic.out`) once scroll passes 5 % of the viewport height, and back in at the top (`class X1`).
  - **Clouds:** two layers of cloud photos (`common_fv_cloud01/02.webp`, 0.9 MB + 0.4 MB) drift sideways on a **100 s linear CSS loop** (paused out of view via an `-inView` class) and translate downward at **0.5×** the scroll through the hero (`data-ratio="0.5"`, `class o_`). This is DOM, not WebGL.
  - **Background planes** (hero forest, projects room, company forest): the WebGL plane is moved back by 0.8 × the scroll, so it drifts at **~0.2×** page speed. The company background is **scissor-clipped** to its section box, so the section works as a window sliding over a near-fixed photo (`class lA`; `22-company.png`).
  - **Image planes:** `full` preset photos parallax inside the page and unfold once on first view (§6); `uv-parallax` photos (the project cards) keep their frame and slide the photo *inside* it with scroll progress.
  - **Philosophy's pinned frame** swaps its photo through a growing fisheye circle as each text section passes, in either scroll direction (§7, `33-philosophy-scroll-through`).
  - **Sticky card stack** (desktop and non-touch only, `class l_`): the School / Craft / Retreat cards sit in a pinned wrapper whose height is set in JS; each card's `top` is staggered so the next card slides up over the previous one while the stack translates up by half a card height across the range (`17-sticky-cards-slow`, `18-sticky-cards-end.png`, `19-sticky-cards-mid.png`). Home range: 4723 → 5514 px of scroll (target 1691 px tall).
- **Reveals are once-only.** Text meshes, image lenses and button line-draws fire on the first IntersectionObserver entry and unregister, so scrolling back up shows them settled.
- Home is 8665 px tall at 1440×900; the WebGL canvas is 1.5 viewports tall (1350 px, offset −225 px) so planes entering from below are already drawn.

## 6. Cursor & micro-interactions

Found by clips, hover sweeps (`h.sweep` grids over the hero and the card stack, logged in `logs/run-2026-09-27T12-15-24-762Z.json` → `sweeps`), and the bundle's listeners (`mouseenter`/`mouseleave` only; no `click` handlers besides the menu and links, no raycasting on hover: the two `Raycaster` hits are Three.js library code).

- **The fluid lens** (global, desktop with a fine pointer only).
  - Every `mousemove` adds the pointer's velocity to a velocity field and a fixed amount of "dye" (`cursorPower` 25 × 1e-3, radius `cursorSize` 0.5 × 1e-3) at the pointer. Each frame the solver runs one divergence/pressure/gradient step and advects velocity (×0.97 per frame) and dye (×0.98, dt 8/60).
  - The post pass samples the scene render target at `uv − 2 × 0.5 × normalize(velocity) × dye`: pixels are pushed along the flow in proportion to the dye.
  - **What it looks like:** fast strokes spread the dye thin and barely show; where the pointer slows or rests, dye piles up into a **lens-shaped bubble ~100–120 px across** that bends whatever is under it, drifts with the flow and heals in about a second (`logs/05-fluid-end-detail.png`). On the dark sections it pulls light from the photos into the black like ink in water, and photo edges visibly bulge (`13-button-hover-view-philosophy`, `logs/13-button-hover-detail.png`; `17-sticky-cards-slow`).
  - It distorts **only the WebGL layer**. HTML text on top (body copy, labels, header) stays crisp; headings drawn in WebGL bend with the photos.
  - The timestep and dissipation are per frame, not per second, so on a 120 Hz display the bubble fades about twice as fast (inferred from the code).
  - No custom cursor: `cursor: auto` everywhere except links and buttons (`pointer`). The hover sweeps found **no hidden hotspots**: 15/15 hero points hit the header container or the H1; on the card stack only the "View …" button changed the cursor.
- **Heading ripple-in** (`class sA`, text meshes; crop `logs/08-text-ripple-detail.png`). Big serif headings ("Sharing / the Japanese Spirit / of Harmony", "Designing / the Dimensions / of Life", "Who we are") are drawn in WebGL. On first view each line fades in (alpha 0 → 1, 1.4 s) while a `tan()` ripple on the texture's x-coordinate relaxes (strength 14 → 1 over 2 s `cubic.out`) and a slide settles (translate 1.2 → 0). The glyphs arrive vertically smeared, mirrored and broken, like a reflection on disturbed water, and settle into crisp type. Lines are staggered 0.2 s.
- **Body copy** fades in line by line with SplitText (`linesClass: "line"`, 1.4 s `expo.out`, 0.07 s stagger; `class Vn`).
- **Image unfold** (image meshes, presets `full` / `full-static`; vertex shader before `class tA`): on first view the photo plane rises one frame-height into place while its rows, 25 % wider at first, pull in row by row from the top, so the photo arrives as a flared trapezoid that straightens like settling cloth (`u_inViewProgress` 0 → 1 over 1.4 s `circ.out`, 16×16-segment plane; delay 0.6 s at startup, 0.4 s after a transition). Visible mid-scroll in `08-scroll-hero-to-philosophy`.
- **Buttons** ("View Philosophy", "View School", …; `class So`, `class Oi`; crop `logs/13-button-hover-detail.png`):
  - In view: a short lead rule draws in with a clip-path (`inset(0 100% 0 0)` → `inset(0)`, 0.7 s), a second rule wipes out, and the label's characters fade in (1.2 s, staggered).
  - Hover: the rule slides right *through* the label (0.7 s `quart.out`) while the label rolls up and is replaced by a copy from below (`y` 0 → −130 %, copy 130 % → 0, 0.07 s delay). Leave: the rule returns over 1.1 s.
- **Text links** (footer, header languages; `class jd`): the same roll plus an underline that grows from the left (`scaleX` 0 → 1, 0.7 s `quart.out`).
- **Nav links** (WebGL): hover rolls the word up inside the WebGL texture (`uHoverProgress`, a UV slide) and draws a strike-through line from the left (`scaleX`, 0.7 s `quart.out`) (`logs/29-nav-hover-detail.png`).
- **MENU trigger** (`class mP`): the dot above the word drops and swaps, the word rolls, and a line draws under it.
- **Footer next link** (`25-footer-next-hover`, crop `logs/25-footer-next-detail.png`): the long rule left of the big page name slides right through the word while the word rolls; on leave the rule slides back.
- **All hover modules are skipped on touch devices** (`I.detection.touchDevice`), as are the fluid and the sticky stack.
- **Keyboard:** `:focus-visible` draws a 1 px #d9d7d4 outline (mouse focus gets none). The roll and line animations are bound to `mouseenter`/`mouseleave` only, so keyboard users see the outline but never the hover motion.

## 7. 3D / WebGL

There is **no 3D model, no lighting and no camera move**. Three.js is used as a 2D compositor for the page's own photos and headings.

- **Stage** (`class Ym`, 13936): a `PerspectiveCamera` placed so one world unit = one CSS pixel (`distance = canvasHeight/2 / tan(fov/2)`), a WebGL2 renderer with `antialias:false` at the **device's full DPR** (`window.devicePixelRatio`, uncapped: 3 on the iPhone preset; only the text textures and the fluid are capped), and a canvas 1.5 viewports tall.
- **Planes that mirror DOM boxes** (`class NA` mesh manager): every frame each plane is scaled and placed from its element's `getBoundingClientRect()`. Types:
  - `common-img-mesh` (`class tA`): photos, with presets `full` (parallax + unfold reveal), `full-static`, `uv-parallax` (UV slide inside a fixed frame, with a letterbox `u_mask` painted in the page colour `vec3(10, 8, 1)/255` = #0a0801) and `none`. Geometry 16×16 segments.
  - `common-text-mesh` (`class sA`): headings. The element's computed font, size and weight are drawn with `fillText` into a Canvas2D texture at DPR ≤ 2, rendered white (`uColor` 0xffffff) with the ripple shader. Textures are redrawn on resize.
  - `common-background-mesh` / `home-background-mesh` (`class aA`, `class lA`): full-bleed hero and section photos with the lens-and-RGB-split entrance, slow parallax, and scissor clipping for the company section. Desktop and phone get different files (`data-pc-img-path` / `data-sp-img-path`).
  - `philosophy-img-mesh` (`class PA`, 16491): one pinned, rounded frame holding **three photo textures** (grass, ocean, dunes). As each of three text sections (本質, 地球, 冒険) enters or leaves, a uniform tweens 0 ↔ 1 over 1.3 s and the next photo opens from the centre through a **growing circle with a fisheye rim** (soft `smoothstep` edge, `u_edgeStrength`), which then flattens. The direction uniform follows `lenis.direction`, so scrolling back plays the wipe in reverse (`33-philosophy-scroll-through`, crop `logs/33-philosophy-circle-wipe-detail.png`). This is the site's second-best moment.
  - Also page-specific, not read in detail: `projects-img-mesh` (`RA`, clipped project photos), `retreat-background-mesh` (`LA`, the tree-root band on Retreat), `retreat-cover-mesh` (`DA`, the centred portrait with the split title "Retreat / Return to Your Essence"). See the page clips `39`, `51`.
  - `nav-text-mesh` (`class jA`, on the separate nav canvas): menu words with the hover roll and a ripple.
- **Post pass** (desktop, fine pointer): the whole scene renders into a render target, then a full-screen quad samples it through the fluid's velocity and dye textures (§6). On touch devices the scene renders straight to the screen with no fluid.
- **What it reacts to:** pointer movement (fluid), scroll (plane positions, parallax, UV parallax, sticky stack), IntersectionObserver entries (one-shot reveals), page transitions (meshes torn down and rebuilt). No time-based idle animation except the CSS cloud drift.
- **Technique summary:** DOM-synced WebGL planes + a Canvas2D-to-texture text pipeline + a Jos Stam-style stable-fluids post-process. Assets: 11 WebP photos (2.9 MB) on home, no models, no HDR, no video.

## 8. Sound

**The site has no sound at all.** Measured four ways:

- The bundle contains no `AudioContext`, `webkitAudioContext`, `new Audio`, Howler, Tone, `<audio>`/`<video>` creation or any audio file extension (grep of `logs/src/index.pretty.js`).
- No audio response in any run (`audioFiles: []` in every `logs/run-*.json`), across all 11 pages, the menu, transitions and the contact form. `audio/` is empty, so `audio.sh` had nothing to analyse.
- The capture hook (Web Audio buffer starts, oscillators, media `play()`) logged **0 events** in every run, including after real clicks that would unlock audio.
- The init-script `AudioContext` wrapper recorded no context being created (`probe-runtime-*.json` → `audioCtx: []`).

There is no sound toggle and no "headphones" invite. The mood is carried by the photos, the fog and the slow easing instead.

**What this means for the portfolio:** Izanami is evidence that an award-level "calm" site can skip sound entirely. It says nothing about the mix design questions left open by Edolus.

**Questions for Janriz**

1. Open the site with sound on and confirm silence. (If a browser extension or a later deploy adds audio, the capture would have missed it; the bundle hash in this study is `index.PhJuwueo.js`.)
2. Did the silence feel like something missing, or like part of the calm? Your answer tells us whether a quiet, text-first moment in the portfolio needs any sound at all.

**Janriz's answers (2026-09-27):**

1. Not answered.
2. The silence feels more like something missing. At least in the hero, he wants some ambient music in the background.

## 9. Type, colour, layout

Values come from computed styles at 19 desktop stops (`06-text-type-colour.js` → `logs/probe-type-colour.json`, `logs/probe-text-map.json`), 8 mobile stops (`04-mobile.js` → `logs/probe-type-colour-mobile.json`, `logs/probe-text-map-mobile.json`), and the CSS itself (`logs/src/index.pretty.css`).

**The system in one line:** three free serif families at one weight each, four colours, no letter-spacing, and a fluid size scale written into class names.

### Fonts

| Family | Loaded | Served from | Licence | Used for |
|---|---|---|---|---|
| **Playfair Display** | 400 normal only | Google Fonts (`fonts.gstatic.com`, woff2, 21.9 KB) | SIL OFL 1.1, free | display headings (also drawn into WebGL textures), the hero H1, button labels, the footer "next" link, card titles |
| **Cinzel** | 400 only | Google Fonts (14.2 KB) | SIL OFL 1.1, free | every label and piece of UI chrome: section labels, header (EN · JA · MENU), aside clocks and SCROLL, footer links, menu links (also WebGL), numbers "01". Cinzel has no true lowercase, so the lowercase HTML ("philosophy") renders as small caps |
| **Shippori Mincho** | 400 only | Google Fonts, split into unicode-range slices (2 slices, 38.9 KB on the EN home) | SIL OFL 1.1, free | all body copy, leads, and the Japanese text (kanji titles such as 本質, 地球) |
| **Satoshi** | Regular (`Satoshi-Regular.woff`, 33 KB) | self-hosted (`/assets/font/`) | ITF Free Font License (Fontshare): free for commercial use | **nothing**: no CSS rule uses it, yet WebFontLoader waits for it before the loader can finish |

- Some phone classes ask for weight 500 (`SP_pfd_M14_H100`, `SP_pfd_M20_H100`), but only 400 is loaded, so they render at 400.
- **Canvas text:** WebGL headings are drawn with `fillText` using the element's own computed font, so they are Playfair Display 400 (headings) and Cinzel 400 (menu) at the same sizes as the DOM copy.
- All four are free for a commercial site. No paid font to replace.

### Type scale

Sizes are authored in px for a **1600 px desktop design** and a **402 px phone design**. Class names encode family, weight, size and line height: `pfd_R50_H100` = Playfair Display Regular, 50 px, line height 100 %; `SP_` = the phone variant. Desktop size = `clamp(0.75 N, N/16 vw, 1.125 N)` (e.g. 50 px → `clamp(37.5px, 3.125vw, 56.25px)`); phone size = `N/402 × 100vw` (30 px → 7.46vw). **Letter-spacing is `normal` everywhere** (0 declarations in the CSS); `text-transform` is almost never used.

| Role | Class | Family | Size @1440 (design) | Line height | Colour | @390 phone |
|---|---|---|---|---|---|---|
| Display heading (WebGL-drawn, DOM transparent) | `pfd_R50_H100` | Playfair Display 400 | **45 px** (50) | 1.0 | DOM `transparent`, drawn `#ffffff` | 29.1 px |
| Display heading (plain HTML, e.g. card titles "School") | `pfd_R50_H100` | Playfair Display 400 | 45 px | 1.0 | #d9d7d4 | 29.1 px |
| Footer next link | `pfd_R40_H100` | Playfair Display 400 | 36 px (40) | 1.0 | #d9d7d4 | — |
| Sub-heading ("Preparation") | `pfd_R30_H100` | Playfair Display 400 | 27 px (30) | 1.0 | #d9d7d4 | — |
| Hero H1 / button labels | `pfd_R20_H100` | Playfair Display 400 | 18 px (20) | 1.0 | **#ffffff** (H1), #d9d7d4 (buttons) | 13.6 px |
| Kanji title (地球) | `sm_R50_H100` | Shippori Mincho 400 | 45 px (50) | 1.0 | #d9d7d4 | — |
| Lead ("Nurturing the foundations of life.") | `sm_R20_H180` | Shippori Mincho 400 | 18 px (20) | 1.8 (32.4 px) | #d9d7d4 | 15.5 px / 27.9 px |
| Body | `sm_R16_H240`, `sm_R16_H200` | Shippori Mincho 400 | **14.4 px** (16) | 2.4 (34.6 px) or 2.0 (28.8 px) | #d9d7d4 | **11.6 px** / 27.9 px |
| Menu links (WebGL) | `cz_R30_H100` | Cinzel 400 | 27 px (30) | 1.0 | DOM `transparent`, drawn white | 23.3 px |
| Section label (vertical rail) | `cz_R20_H100` | Cinzel 400 | 18 px (20) | 1.0 | #d9d7d4 | 11.6 px |
| Small links, numbers | `cz_R18_H100`, `cz_R16_H100` | Cinzel 400 | 16.2 / 14.4 px | 1.0 (addresses 1.65) | #d9d7d4 | 10.7 px |
| UI chrome (EN · JA, MENU, clocks, ©, SCROLL) | `cz_R14_H100` | Cinzel 400 | **12.6 px** (14) | 1.0 | #d9d7d4 | 10.7 px |

The phone body size (11.6 px) and label size (10.7 px) are small; the long 2.4 line height keeps the copy readable in the screenshots, but it is below common legibility guidance.

### Colour

All from CSS custom properties (`:root`, CSS line 194) and computed styles. Awwwards lists the same two main values.

| Token | Value | Role |
|---|---|---|
| `--color-black` | **#0a0801** | page background (body, nav, sections), the shader letterbox mask (`vec3(10, 8, 1)/255`) |
| `--color-white` | **#d9d7d4** | all text, lines, dots, SVG icons |
| `--color-white` @ 0.2 | rgba(217, 215, 212, 0.2) | hairline dividers (card separators, form underlines, lists) |
| `--color-white` @ 0.4 | rgba(217, 215, 212, 0.4) | the process-list number boxes |
| `--color-white-pure` | #ffffff | the hero H1; WebGL text is drawn in pure white (`uColor` 0xffffff) |
| `--color-black-pure` | #000000 | the page-transition layer |
| `--color-yellow` | **#caa100** | form error messages only |

Text selection inverts the pair (#0a0801 on #d9d7d4). Everything else colourful comes from the photographs (fog greens, stone and sand browns, ocean blue). There are no gradients, shadows or glows in the CSS. The loader is the page colour (#0a0801) and the transition layer is pure black (#000), so photos appear out of darkness.

### Layout

- **Desktop** (1440 px): 72 px outer margins (5vw) with the header at the top (logo left; EN · JA at x 1044; MENU flush right at 1368). A **180 px (12.5vw) left rail** holds the vertical section label (`writing-mode: vertical-rl`) and, at the bottom, © and the two clocks. Content starts at **x 252** (17.5vw). Body copy runs in narrow columns (~468 px, 32.5vw); photos are placed asymmetrically to the right or collaged in overlapping frames. The rail and footer use 36-column and 10-column CSS grids.
- **Relative to the WebGL layer:** WebGL sits *behind* the HTML (canvas z-index −1). Heading and photo planes occupy exactly their DOM boxes, so the layout is the HTML layout. Full-bleed backgrounds (hero, projects room, company forest) sit under the text; the body copy is always HTML on top, so the fluid never distorts it.
- **Phone** (390 px): one column with ~5vw margins, the rail reduced to a vertical label at the left edge, the header kept (logo, EN · JA, MENU), clocks stacked above © at the bottom-left, photos full-width. Different crops are served for every photo.
- **Which text is WebGL at each stop** (`probe-text-map.json`): only the big display headings (3 lines per section: "Sharing / the Japanese Spirit / of Harmony", "Designing / the Dimensions / of Life", "Who we are", "School / Nurturing Life's / Foundations", "Retreat / Return to / Your Essence", "A / Living / Company", "Where / Conversations / Begin", "Moca Onuma", "Craft") and the five menu links. Everything else (body, labels, buttons, nav chrome, footer, form) is plain HTML. The WebGL headings keep a transparent DOM copy, so all text on the site is real HTML.

## 10. Performance & degradation

| Measure | Desktop 1440×900 @2x | iPhone 13 preset 390×664 @3x | How |
|---|---|---|---|
| Transfer, cold home | **3.14 MB** in 18 requests: JS 230 KB (846 KB decoded), CSS 14 KB + Google CSS 30 KB, fonts ~108 KB, **11 WebP 2.9 MB** | **2.75 MB**: the same, with `sp_` photos (2.5 MB WebP; the two cloud photos are the same 1.3 MB on both) | `probe-perf-*.json` (resource timing), run network logs |
| TTFB / DCL / load | 323 / 843 / 1012 ms (second load); 762 / 1296 / 1696 ms (first) | 339 / 845 / 1097 ms | navigation timing |
| FCP | 464–996 ms: the loader's H1 | 484 ms | paint timing |
| LCP | **7.2–7.8 s**: a cloud `<img>` finishing the loader fade | 836 ms (the same cloud image, painted under the opaque loader) | `largest-contentful-paint` observer. Unreliable either way: the loader decides what the visitor sees |
| **Time to first action** | **7.20 s** (7.43 s with reduced motion) | **7.28 s** | poll of the loader element and Lenis's `lenis-stopped` class (`probe-ready-*.json`) |
| Long tasks | 1–5, total 94–672 ms, max 94–265 ms | 2, max 105 ms | `longtask` observer |
| CLS | 0.0004 | 0.0017 | `layout-shift` observer |
| Frame rate | rAF **60 fps** on every page; clips mostly p95 ≤ 21 ms. Page-enter transitions are the heaviest moments (mesh rebuild and texture uploads, inferred): p95 24.5 ms in `31`, and 29.3 / 26.0 ms in the first takes of the history-forward and craft clips (deleted; the reshoots `88` and `89` measured 24.1 and 19.5 ms) | rAF 60 fps; clips p95 ≤ 21.7 ms | `fpsFn` probe; per-clip stats in `logs/run-*.json` |
| WebGL resolution | common canvas 2880×2700 (DPR 2, 1.5 viewports tall) + nav canvas 2880×1800; the fluid runs at CSS-pixel resolution (1440×1350) | common canvas **1170×2988 (DPR 3, not capped)** + nav 1170×1992 | DOM probe `canvases`; `probe-mobile-device.json` |

- **Frame feel** (inferred from the clips): the scroll is soft (Lenis lerp 0.1) and nothing hitches in steady scrolling. Every page change costs ~1 s of black plus a 3 s lens settle, which makes the site feel slow to move around even though each page is light.
- **Where the time goes:** the loader, not the network. Everything the home page needs has arrived by ~1.3 s (images by ~5.5 s), but the loader always plays a 3 s counter ease plus a 3 s fade and waits for an unused font (Satoshi, 33 KB).
- **Mobile tier** (`04-mobile.js`, `62`–`80`): the same loader and the same WebGL layer (headings, photo planes, lens entrances all run), at DPR 3. Dropped on touch: the fluid post pass, every hover module, the sticky card stack (cards simply stack), and the Lenis wheel smoothing (native touch scroll). Phone-specific photos (`sp_*`) are served through `data-sp-img-path`. The menu, transitions and type scale (N/402 vw) are adapted, not removed.
- **Reduced motion** (`05-reduced-motion.js`, `81`–`87`): **no branch at all.** With `prefers-reduced-motion: reduce` confirmed by `matchMedia`, the loader, the 3 s fade, the heading ripple, the lens entrances, the menu and the fluid all run unchanged (`logs/83-rm-hero-pointer-grid.png`, `logs/84-rm-text-ripple-detail.png`, where the fluid even curls the last WebGL glyphs of "Harmony" while the HTML body copy stays crisp). The bundle, the CSS and the HTML contain no reduced-motion rule. The CSS cloud loop pauses only when off-screen.
- **No-WebGL fallback** (inferred from the code and the rendered HTML, not tested): if WebGL fails with JavaScript on, the big headings are invisible (their DOM copy is `color: transparent` and nothing restores it) and **every photo is missing** (the only `<img>` is inside `<noscript>`). With JavaScript off, the `<noscript>` photos appear but the headings stay transparent. Every photo has `alt=""`.

## 11. Ideas worth taking

The standing constraints are numbered as in the map Notes:

1. GSAP-only animation (ScrollSmoother, not Lenis)
2. real-HTML text
3. chat usable within 1 s, no gating preloader
4. reduced-motion and mobile tiers, with lazy 3D and audio
5. LCP ≤ 2.5 s and 60 fps

The effects rule, free/self-made assets and the generic-effects ban apply throughout.

**Ranked:**

1. **HTML first, WebGL as a mirror of chosen elements** (the `data-mesh-manager` pattern).
   - **Why it fits:** it is the cleanest answer to constraint 2 and the progressive-enhancement baseline seen in any case study so far. State 2 is authored and rendered as ordinary HTML; one fixed canvas behind it redraws *selected* elements (a project photo, a section heading) as planes that follow their DOM boxes, so effects can be added per element without the page depending on them. The heading's DOM copy stays in place (transparent), so crawlers, LLM ingesters and screen readers read the same text.
   - **Strains:**
     - Constraint 1: drive the render and plane positions from `gsap.ticker` and ScrollSmoother's scroll value, not a second rAF loop and Lenis.
     - Constraint 5: cache element offsets and update them on resize/refresh instead of calling `getBoundingClientRect()` for every plane every frame; cap DPR at 2 on phones (Izanami renders at DPR 3).
     - Progressive enhancement: hide the DOM copy only after its plane has drawn (e.g. an `html.gl-ready` class), keep real `<img alt>` outside `<noscript>`, and fall back to HTML if WebGL fails. Izanami does none of this, so a WebGL failure blanks its headings and photos.
2. **Headings that surface through water** (the WebGL ripple-in over transparent DOM text).
   - **Why it fits:** a bespoke, calm reveal for the few big headings (the hero line, section titles, maybe the agent's answer title in the chat drawer). It animates real text without canvas-only copy.
   - **Strains:** constraint 4 (a plain opacity fade under reduced motion; skip on low-end phones), and each heading line needs a Canvas2D texture that is redrawn on resize and after web fonts load. The uniform tweens are GSAP already (constraint 1 holds).
3. **A pinned frame whose image changes through a growing fisheye circle** (the Philosophy page's three-photo wipe, direction-aware).
   - **Why it fits:** a strong match for the Projects section and for the chat's `highlight_project` tool effect: the agent names a project and the pinned frame opens onto it through a lens. Only 3 textures and one plane.
   - **Strains:** constraint 4 (crossfade fallback); constraint 1 is easy (ScrollTrigger callbacks tween the uniforms, as Izanami already does with GSAP).
4. **The pointer fluid as the site's material** (stable-fluids post pass over the WebGL layer only).
   - **Why it fits:** it makes the page feel touchable without a custom cursor, and it leaves HTML text crisp. It could tie to the AI entrypoint: the agent's streamed answer or a tool effect could drop "dye" where it acts, so the page ripples where the agent is working.
   - **Strains:**
     - The effects rule: without a concept link it is a now-common "liquid cursor" template effect. Only take it if the concept is about memory, water or a living surface.
     - Constraint 4: desktop and fine pointer only, and **off under reduced motion** (Izanami forgets this).
     - Constraint 5: run the solver at ¼ resolution (Izanami runs it at full CSS resolution, five passes per frame) and use real frame time (Izanami's fixed 1/60 step makes it fade twice as fast at 120 Hz).
5. **A menu that shrinks the page into the dark, with correct focus handling.**
   - **Why it fits:** a model for opening the chat drawer: the page scales to 0.9 and dims (0.8 s), the drawer takes focus, Tab is trapped, focus returns on close, scroll stops. Simple, calm, GSAP-only.
   - **Strains:** none. Route every close path (button, Escape, link) through one state change; Izanami's Escape path leaves the menu thinking it is still open.
6. **A fluid type scale written into tokens** (`clamp(0.75 N, N/16 vw, 1.125 N)` from a 1600 px design, `N/402 vw` on phones, family/weight/size/leading in one token name) with **one weight per family and a four-colour palette**.
   - **Why it fits:** exact, cheap and easy to audit; all three families are OFL Google Fonts, which the asset rules allow.
   - **Strains:** none, but keep phone body copy at 15–16 px (Izanami's is 11.6 px).
7. **Small signs of place**: two live clocks (Dubai, Tokyo) in the side rail, and a "next page" link that ends every page.
   - **Why it fits:** plain HTML, no cost. A local clock with an availability line, or a "next section" prompt at the end of each section, could carry Janriz's voice.
   - **Strains:** none.

**What to avoid:**

- **The gating loader.** 7.2 s before anyone can scroll or click, on desktop and phone, even though the network is done by ~1.3 s. It fakes progress with 3 s eases, waits for every image and an unused font, and replays on every cold load and language switch. This breaks constraints 3 and 5 outright.
- **No reduced-motion branch at all.** With `reduce` set, the fluid, ripples, lens entrances and 3 s fades all still run.
- **Content that exists only in WebGL when JS runs:** photos live only in `<noscript>` (with empty `alt`), and headings are transparent unconditionally.
- **Slow page changes and lost position:** about 1 s of black plus a 3 s lens settle on every navigation, and Back always lands at the top.
- **The Escape bug** in the menu (stale `isOpen`), and hover-only effects with no focus equivalent (buttons roll on `mouseenter` but not on keyboard focus).
- **Uncapped DPR 3 WebGL on phones**, per-frame layout reads for every plane, and a frame-rate-dependent fluid.
- **The decorative layer:** drifting cloud photos and slow photo parallax are atmosphere without a job (the effects rule's "purposeless parallax").
- **Lenis plus a separate rAF loop per effect** instead of one GSAP ticker (constraint 1).

## Media index

| Scenario | What | Files |
|---|---|---|
| `01-recon.js` | cold load, landing, one scroll (wheel-scale check), probes, source fetch into `logs/src/` | `01`–`04` |
| `02-journey-a.js` | desktop home: readiness poll → hero fluid + sweep → philosophy (ripple-in, image unfold) → button hover → projects → sticky cards + sweep → company → footer → fast scroll up → menu open, nav hover sweep, Escape. Stopped at the second MENU click (the Escape bug, §4); `logs/fail-2026-09-27T12-15-24-762Z.png` | `05`–`30` |
| `03-journey-b.js` | desktop, every page through Swup: menu → philosophy, Back, Forward, menu → projects, then the footer "next" chain school → craft → craft-space → retreat → company → contact, contact form focus/blur (no submit), `/ja/` home | `31`–`61`. **`36` and `45` were deleted** (p95 29.3 / 26.0 ms) and replaced by `88` and `89` |
| `04-mobile.js` | iPhone 13 preset: cold load, swipes (≤ 350 px) through home, menu, menu → philosophy; mobile type/colour and text-map probes | `62`–`80` |
| `05-reduced-motion.js` | desktop with `prefers-reduced-motion: reduce`: cold load, hero fluid, scroll to philosophy, menu | `81`–`87` |
| `06-text-type-colour.js` | the two reshoots, then desktop type/colour and text-map probes at 19 stops across all pages (no other media) | `88`, `89`; `logs/probe-type-colour.json`, `logs/probe-text-map.json` |
| `_probe.js` | shared probes: DOM, runtime and graphics-context hook, perf/LCP/CLS/long tasks, readiness poll, type/colour, text map | — |

Frame-grid crops (in `logs/`): `05-fluid-start-detail.png`, `05-fluid-end-detail.png`, `08-text-ripple-detail.png`, `13-button-hover-detail.png`, `25-footer-next-detail.png`, `29-nav-hover-detail.png`, `31-page-enter-lens-detail.png`, `33-philosophy-circle-wipe-detail.png`, `83-rm-hero-pointer-grid.png`, `84-rm-text-ripple-detail.png`.
