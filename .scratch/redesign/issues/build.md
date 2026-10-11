# Builds

Merged 2026-10-10. Every build ticket (33–50, 66–70): what shipped on the `redesign` branch and how it was checked. Each section is the ticket's Answer, verbatim; the questions and comment threads were dropped on 2026-10-10.

| # | Ticket | Gist |
|---|---|---|
| 33 | [Set up the stack groundwork](#t33) | on the `redesign` branch: ScrollSmoother with deep links anchored and Back exact; the sky (B+C, PCA, Flare) in plain three.js on `gsap.ticker`, loaded after first paint and faded in, with colour as light per region in OKLab; software WebGL counts as unsupported; 2.1 ms GPU at 1440 and 0.8 ms at 390, 60 fps scrolling, 141 KB after first paint, phone LCP unchanged. |
| 34 | [Build the film engine](#t34) | the stand-in film (grey blocks) plays the whole voyage on the real site: one camera path, the pace from reading stretches, text written by the scroll in its modes, reading spots for deep links, focus and reload, stills under reduced motion, the plain page without WebGL, portrait composed; the storyboard's timing kept to 0.01 screens; 60 fps through the film at 1440 and 390. |
| 35 | [Build the hero and home](#t35) | scenes 1–3 on the real site in those final forms, on the AFK round's skeleton. The dropped frame at 2.8 is development-mode React only. The lockup's arrival on load goes to *Build the wake-up*. |
| 36 | [Build the peel and the road](#t36) | scenes 4–5 in 52's look, made cheap: the inscription is cut in the plate's shader from textures laid once (nothing redrawn on the ride), sunk or tiny monoliths are culled, standing ones are opaque, and a fade shows only the nearest surface. On a phone the camera looks straight at the plate it reads, and the route dims behind the road's start's line. 390 holds 60 fps on a fast scroll; 1440's remaining long frames are GPU- and compositor-bound round the gates and the HTML ink. |
| 37 | [Build the gates](#t37) | the Work route's long frames were the monolith plates' HTML ink (a soft text-shadow re-rastered every frame under its matrix3d), now a tight halo: 0 frames over 20 ms on a fast scroll at 1440 and 390. The gates draw their CubeSats instanced, fade without recompiling, and skip dark lights. Each gate's CubeSats turn on a phase that keeps them and their labels off the role's words, labels move out ahead of a thrown CubeSat, and the route goes behind a role's lines. |
| 38 | [Build the look back and the spur](#t38) | scene 10 in 54's form, finished: where the spur's capture orbit passes in front of Athena it dims across her exact silhouette (an ellipsoid per pixel, `hairlines.ts` `uEll`, `occlude.ts`), and it goes behind Projects' and Athena's words (two boxes, the stills included); on a phone the crawler comes in after Projects' lines; the role labels stay an overlay, culled outside their window; 60 fps with no frame over 20 ms on a fast scroll at 1440 and 390. |
| 39 | [Build Athena](#t39) | scene 11 in its final form: culled out of frame and out of her scene (body, ring, records, her shadow pass), lit by her own star's key alone (in-shader, `lib/voyage/dark-lights.ts`, which also makes the rig's dark keys free), dark seams as she closes, her ring's wings only adding light, records glinting as they join her lit side and read as slabs upstream, moons and records taking the fling; 60 fps with no frame over 20 ms on a fast scroll at 1440 and 390. |
| 40 | [Build the crawler](#t40) | the refinery built to its finalization on round 3's skeleton: its service ring's struts (now code-made) draw back as it splits so the rings drop clear; it culls itself at render time (bodies, posing and its shadow pass off out of frame) and its folded pipeline is drawn only through the lens or once it opens; on a phone a held camera key shows the split in the top half, and its lines carry a dark halo; 60 fps on a fast scroll at 1440 and 390. |
| 41 | [Build the pipeline and its climax](#t41) | the picked pipeline finished to the bar: records split into `swarm.ts` and `report.ts` and culled to their stretch of the fall; on a phone the climax draws back so the whole shaft stands above "Paid for once"; the route goes behind the pipeline's text; leader-line labels whole by their spot; 60 fps on a 3 s scroll at 1440 and 390. |
| 42 | [Build the record's flight and the ribbon](#t42) | the ribbon finished on its finalization's code: the card square to you centred at each project's reading spot (the turn lands on a card there), the pull-out shows only the ribbon folding (every other body hidden while out of frame), opaque-while-whole surfaces lit by their own star cut the GPU cost by over half, screenshots after the wake, reduced-motion stills fixed; 60 fps at 1440 and 390. |
| 43 | [Build Contact](#t43) | the trajectory goes as the pull-out starts, so Contact is read against stars alone (overrides *Finalize Contact*'s whole route); drag at Contact turns on both axes (67's spatial drag); the bodies' key lights stay in the scene, dark, so nothing recompiles mid-film (`lib/voyage/rig.ts`): the pull-out holds 60 fps at 1440 and 390; the title rides the beacon off its spikes (`star` side). |
| 44 | [Build the pointer layer](#t44) | a hovered star twinkles as a real star scintillates (log-normal flicker at 3–14 Hz, colours a beat apart, spikes thrown further on bright instants), its envelope that of its hover shimmer; held still under reduced motion; ask chips tick and click; the moons can be asked about; where the sky answers the hand is the script's `sky` windows; the chip's plate is 0.62 for 4.5:1 over white screenshots; 60 fps, no frame over 20 ms while sweeping the stars at 1440 and 390. |
| 45 | [Build the route map](#t45) | every link goes through `goToSection`: another section warps (through `warpTo` in `lib/film/warp.ts`, a glide until the warp is built), Start replays, and the section you're in glides back to its first reading spot. The spur on the miniature curls round Athena as the look back draws it. Every name clears 4.5:1 at all 40 reading spots (a map's halo, and the film's faint plate when open). Titles keep 222 px clear; the map costs no frame time. |
| 46 | [Build the wake-up](#t46) | the wake-up plays in production: Edolus's loader (the name there from first paint, faint, typing in bright, so LCP is about 0.25 s), the low-key charge-up, the bracket `[ WAKE ME ]` (Janriz, 2026-10-04, over the white button), the gate and lock tested (`lib/wake/`: no scroll, clicks, pointer, chat or stars until the click; Esc never wakes), deep links and a reload's place landing after the wake, and the 10 s fallback onto the plain page with the flat Tycho. 60 fps through the charge and the wake at 1440 and 390. |
| 47 | [Score the voyage](#t47) | every sound on the real site, every hook checked end to end (one silent emote fixed); decoded audio held to 72 MB desktop / 41 MB phone (notes and small sounds mono, tails cut at −60 dBFS, scene changes held only near their moments, the thinking layer on demand; the stems alone keep 64/32, ADR 0006 amended); the warp's riser timed off `onWarp` so its swell lands on the jump; the replay dips the score under the black; a −1 dB ceiling; the renderer in `scripts/audio/render/` (`pnpm audio:export --render`); the toggle's trace and the headphones line hardcoded; sound costs no frames at 1440 or 390. |
| 48 | [Build the audio engine](#t48) | the real site plays the stand-in score from the wake-up on one context (`lib/audio/`). Its mix follows the film's scene, its speed and the chat, sending only changes. The chat duck sits on the score's bus alone. 202 KB before the wake (105 KB on phones), decoded in 33 ms; 52.7 MB decoded for all six stems; LCP unchanged. `pnpm audio:export` renders code or takes WAVs, checks seams and keeps unchanged stems' hashed names. |
| 49 | [Build the bubble](#t49) | Tycho's bubble and the log are built on the real chat stream, in production. The chat panel, the phone sheet and State 1 are gone, and the store holds only the conversation. The reveal shows 4 words a second, never ahead of the stream. One question at a time, the fold once nothing is appearing, the welcome back with "Open the log", focus that goes in and comes back, sentences announced, and the flat Tycho without 3D. His talking is told through `lib/chat/talk.ts` for the voice and the score. |
| 50 | [Rewrite the chat in Tycho's voice](#t50) | the prompt is Tycho's (third person, the AI act, confidentiality at full strength, the latest role and the nameable employers taken from the page's roles); the errors, greeting and starters live in `lib/chat/lines.ts`; Pip is Tycho in the code; `scripts/tycho-voice-check.ts` asks the fixed set, and Janriz passed round 4. |
| 66 | [Build Tycho in the film](#t66) | Tycho keeps 10 px clear of the 3D subjects on screen as well as the text (ADR 0011 amended): one shared footprint registry (`lib/film/footprints.ts`) the stage fills with each scene's bodies (`lib/voyage/bodies.ts`); his flights bow round them and stay in frame; with no spot clear he takes the least-covered one and shrinks. The rules are test-first in `lib/tycho/think.ts`; his frame cost is unmeasurable against 60 fps at 1440 and 390. |
| 67 | [Rework About on the ring ship](#t67) | the ring is home (the truss a take), finished in Blender with a docking crew capsule; About is read with the ring too big to fit (Janriz's settle), reached by a brief tour round its outside, with a close pass past the rim before a pull-out to a bigger Around home constellation; the hero and Contact drag on both axes (`lib/film/turn.ts`). |
| 68 | [Build the warp](#t68) | rebuilt (2026-10-05) after Janriz rejected the first build's streaks and stretching Tycho: route-map links and the agent's `scroll_to` play *Warp or scroll*'s wormhole journey, ported from the prototype's code, after the pull-back and a question's flare. Tycho flies his circle in 3D on his jets' fire, the ring winds into a spark, it bursts into a black hole the real sky falls into, he dives, the page jumps under the horizon, the throat carries the section left behind, and a portal opens onto the destination's white hole while he lands back on his spot. About 6 s for a link, 7.5 for a question. The hole is drawn in the sky's frame through its `overlay`, and the sky skips drawing under the throat; 60 fps with no frame over 20 ms at 1440 and 390. Start replays and the section you're in glides; a click, tap or Esc hurries it; it's a crossfade under reduced motion. |
| 69 | [Performance pass over the whole voyage](#t69) | the whole film holds 60 fps at 1440 and 390 (fast scroll, fling, warps, replay), with nothing compiled mid-film; only the first scene loads before the wake (the throttled phone's 3D ready 9.1 → 5.0 s, 3.9 → 1.9 MB before the button), every later scene loading, parsing and warming up after he's landed (`lib/voyage/later.ts`); the ship opaque while whole (About's GPU p95 10.4 → 6.6 ms at 1440); the sky's resolution governed down to DPR 1 when the GPU can't hold 60 fps (`lib/universe/governor.ts`); the greeting clear of the lockup on a phone, Tycho off titles, the reduced-motion still of the road's start fixed, README and AGENTS on the one page. |
| 70 | [Light the sky from the chat](#t70) | the chat stream sends each search's stars as a transient `data-stars` part (star ids only; the chunk → star map stays on the server) and the sky flares them where they sit, in its own chat pair (`flare`/`read`) so the film's lit stars are never touched; a reply's move waits for its stars, so the question warp flares them; `highlight_project` is the point (go to the subject's block, warping from another section, and Tycho points at it from his spot); the prompt, page context and view context follow the voyage. Live lighting waits on the retrieval index (ivfflat, probes 1). |

---

<a id="t33"></a>

## 33 · Set up the stack groundwork

*task · resolved · blocked by —*

Built on the local `redesign` branch (2026-10-02), uncommitted. The real site now scrolls natively, with ScrollSmoother, over the drawn sky at 60 fps on this machine. The sky loads after first paint and fades in, with no loading screen.

**What's built:**
- **The sky** (`lib/universe/sky.ts`): a TypeScript port of the prototype's `sky.js`, kept to what *Prototype the visual language* settled.
  - It draws B+C (gas, with threads only on hover and between read stars), the PCA layout, Flare lighting (`light(hits)` flares, recedes and turns to face) and the far galaxies at the "clear" level.
  - Plain three.js 0.186 (the prototype's revision), rendered from a `gsap.ticker` listener (ADR 0002). Colours are display values and nothing is tone mapped.
  - It has a `drive` hook through which *Build the film engine* hands in the camera's pose, and orbits the sky without one.
  - Dropped from the prototype: UMAP and its morph, and the trace and beam lightings with their trails.
  - The far galaxies are generated once at load from a fixed seed. That's the "bake": a cube-map bake would need about 2,560 px a face to keep the 1.6 px specks sharp.
- **Colour as light per region** (`lib/universe/light.ts`, `region-light.ts`):
  - It uses round 4's OKLCH values, including the storyboard's crawler (amber) and own-time (green) regions, blended in OKLab.
  - For now each section's light is full once its top reaches mid-screen. The film engine replaces this with its camera keys.
- **Readiness** (`lib/universe/loader.ts`): waiting → loading → ready | failed | unsupported. It waits for `load` plus an idle moment, then checks WebGL2.
  - **Software rendering counts as unsupported** (`failIfMajorPerformanceCaveat`). Under SwiftShader the sky starved the main thread: setTimeouts ran ~700 ms late and a chip click never submitted. Chrome falls back to it on GPU-blocklisted devices.
  - A StrictMode remount discards a universe nobody will show.
  - `components/universe/Universe.tsx` imports three.js only through a dynamic import. It's a fixed canvas behind the page, and `data-universe` carries the state.
- **The tier** (`lib/universe/tier.ts`):
  - Full: DPR capped at 2, then lowered until the canvas fits 4.2 M px (never below 1), with 24,000 galaxies.
  - Phone (coarse pointer or short side < 600): DPR 1.5 and 8,000 galaxies.
- **ScrollSmoother** (`components/scroll/SmoothScroll.tsx`): `smooth: 1`, touch native, and none under reduced motion. The scrollbar, keyboard (ScrollSmoother's own `focusin` handling) and find-in-page work.
- **Deep links** (`lib/scroll/deep-links.ts`). The smoothed content sits in a fixed wrapper, so the browser can't scroll to a fragment by itself.
  - A loaded hash lands on its section and stays anchored to it until the visitor's first input. A returning visitor's sections appear mid-hydration, and the first landing hit a transient 8,156 px layout.
  - In-page links glide and push the hash. Back and Forward return to the exact spot left, saved in `history.state` alongside the Next router's data.
  - A typed hash jumps.
- **Fallout on today's page:**
  - The desktop chat rail's `position: sticky` can't work inside transformed content, so it's a ScrollTrigger pin while the smoother runs (`lib/scroll/use-pinned-rail.ts`).
  - The mobile sheet moved outside the wrapper.
  - `scroll_to` glides through the smoother.
  - `AmbientBackdrop` (gradient bloom and grain, a banned effect that would also tint the sky's light) is deleted.
  - `AGENTS.md` gained the structure rows and two conventions (fixed and sticky under ScrollSmoother; three.js only through the dynamic import).

**Tests:**
- TDD for:
  - the light (OKLab blend, gamut clamp);
  - the tier;
  - the readiness state and `whenIdleAfterLoad`;
  - the software-rendering refusal;
  - deep links.
- Each had a named Refactor verdict: `Rgb` type split and shared jump helper done; the rest kept.
- Unit tests: 72/72.
- `tests/e2e/smooth-scroll.spec.ts`, 6 tests passing 3× over: native scroll height; deep link, smoothed and under reduced motion; link, then Back to the exact spot, then Forward; keyboard End/Home; the universe settles without gating the page.
- `landing.spec.ts` fails at line 29, identically on the pre-ticket baseline. `getByText` matches both the sent message and the chip. That's a stale test, not a regression.
- Lint is clean except `app/page.tsx:61` (`react-hooks/refs`), also on the baseline.

**Measured** on this M5 machine: headless Chromium with `--enable-gpu --use-angle=metal`, production build, State 2. Scripts are in [research/perf/](../research/perf/).

| | 1440 (DPR 2 device → 1.8 drawn) | 390 phone (DPR 3 device → 1.5) |
|---|---|---|
| GPU per frame, median / p95 | 2.1 / 3.8 ms | 0.8 / 2.1 ms |
| CPU per frame (the sky's listener) | 0.2 ms | 0.3 ms |
| Frames while scrolling the whole page natively | mean 16.65 ms, p99 17.7 ms, 0 over 20 ms | mean 16.66 ms, p99 17.7 ms, 0 over 20 ms |
| Universe ready after navigation | 0.6 s | 0.5 s |

- **Bytes after first paint:** 141 KB transferred (three.js plus the sky: 138 KB gzip in one lazy chunk, plus a 1.4 KB chunk and 1.7 KB of star data). First-load JS grew 6.5 KB (ScrollSmoother plus this code).
- **LCP**, median of 11 loads against the same build without this ticket:

  | | Before | After |
  |---|---|---|
  | 390, 4× CPU and fast-4G throttle | 768 ms | 764 ms |
  | 1440 | 388 ms | 472 ms |

  On the phone it's unaffected. The 1440 shift is Chrome's accounting, not a later paint. About's portrait (bigger on screen than the headline) is painted at first paint in every build. Before, the grain overlay hid it from LCP; now Chrome sometimes counts it on a later repaint while the sky loads. Fading the canvas by opacity alone (no `visibility` flip) removed the repaint the fade itself caused. Field LCP uses this same accounting, so the desktop figure may read a little higher; it's far inside 2.5 s either way.

**For later tickets:**
- *Build the film engine* sets `sky.drive` and replaces `followRegionLight`'s section stops with its camera keys.
- The rail pin goes when *Build the bubble* retires the rail.
- `landing.spec.ts` goes with the two-state UX.
- The trace and beam lightings, trails, UMAP and the hover labels stay in the prototype until a ticket needs them.


---

<a id="t34"></a>

## 34 · Build the film engine

*task · resolved · blocked by 19, 31, 33*

Built on the local `redesign` branch (2026-10-02), uncommitted. The stand-in film (grey blocks in the real sky) plays from the hero to Contact on the real site, 42.45 screens in one take, with every block's text at its reading spot and all three tiers working. Walkthroughs: [film-engine-1440.mp4](../research/film-engine/out/film-engine-1440.mp4) and [film-engine-390.mp4](../research/film-engine/out/film-engine-390.mp4), about 93 s each, scrolled by wheel at about 2 s a screen (`node .scratch/redesign/research/film-engine/record.js`, `MODE=phone` for 390).

**The engine** (`lib/film/`, generic, plain TypeScript):
- **Camera:** `track.ts` is the monotone cubic (Fritsch–Butland). `path.ts` builds one path from keys in screens: target, direction, log distance, framing, and light blended in OKLab.
- **Pace:** `pace.ts` integrates the pace from the reading stretches (a base pace plus a gaussian per stretch), with its inverse for placing windows.
- **Text:** `windows.ts` gives the rows and word windows, and `modes.ts` the ten word modes. Words arrive in their scene's tint and settle to white.
- **Placement:** `place.ts` covers titles riding their subjects, labels on leader lines pushed apart, and the projective map of a monolith's face.
- **The runway:** `spots.ts` sets reading spots and lays the runway out. Each block is as tall as the scroll to the next spot, so landing on any block or `sec-*` section lands on its reading spot.
- **The clock:** `clock.ts` keeps the picture 0.2 s behind the scroll.
- **Tiers:** `tier.ts` holds them on `<html data-film>`.
- **Moving through the film:** `scroll.ts` has `jumpTo` for deep links, Back and reload, and `glideTo` for in-page links and focus.
- **The runtime:** `runtime.ts` plays the runway each frame, keeps the stills under reduced motion, and handles focus, resize and his live clock.
- **The stage:** `stage.ts` is the slot the lazily loaded stage arrives through.

**The voyage** (`lib/voyage/`):
- `script.ts` holds every block, scene and named time, as plain data. The runway is server-rendered from it, so all text is in the HTML at first paint, in page order.
- `route.ts` is the road without three.js. It matches three's centripetal Catmull–Rom point for point, so the road the text is timed on is the road the camera rides.
- `world.ts` and `stage.ts` are the 3D side, loaded after first paint. Grey blocks stand for every subject. `stage.ts` holds the storyboard's camera keys ported, a paused GSAP master timeline of discrete states, and drivers for spins, orbits, the bead rings and the monoliths rising and sinking. Its `StageView` places text: anchors, leader points, faces and stars.
- The copy is `lib/content/voyage.ts`, the storyboard's stand-in copy. It still waits for the copy pass.

**Tiers:**
- **Film:** the sky is drawn by the film once a frame (`sky.setManual`), so text and picture share one camera.
- **Reduced motion** (`still`): one still per reading spot, captured on demand from the stage, crossfaded. The text hands over in turn, out in the first half and in in the second.
- **Plain** (no WebGL): every block flows as a page, ScrollSmoother on.
- **Choosing the tier:** a head script asks for a real WebGL2 context, refusing software rendering as the universe does. It costs about 20 ms here, and the plain page is plain from first paint instead of flipping to it later.
- **Portrait** is composed separately: framing keys, body boxes, and labels as lists, except Athena's patterns, which keep riding.

**Decisions made here:**
- **No ScrollSmoother in the film.** ADR 0003 now has an amendment saying so. In the film nothing on the page scrolls by: the text is fixed in the frame, which a transformed ScrollSmoother content would break. So the film's own clock is the easing, as in the storyboard. ScrollSmoother smooths only the plain page. AGENTS.md has the convention.
- **Text out of play** is `opacity: 0`, not `visibility: hidden`, so every word stays in the accessibility tree and links stay in reach of the keyboard.
- **A reload keeps its frame** through sessionStorage. A returning visitor's runway appears only after hydration, by which time the browser has given up restoring the scroll.
- **The old State 2 sections are gone** (Hero, About, Work, Projects, Contact, plus `Eyebrow` and `SectionHead`); the voyage is State 2.
- **Interim, until *Build the bubble*:** the desktop chat rail starts folded and opens when a block's "Ask Pip about …" button is pressed, and the phone sheet rests at 12vh. Each block's ask button sends its question to the current chat.
- **`followRegionLight` and `lightAt` are gone:** the camera keys carry the light.

**Fixed on the way** (groundwork):
- StateTwoView tweened its grid from 0px at mount, which reflowed the plain page.
- ScrollSmoother kept a stale scroll limit when the content grew without a window resize. It now refreshes on a content resize and before a glide.

**Tests:**
- **TDD:** Red → Green with a named Refactor for the camera path, track, pace, word windows, modes, placement, spots, clock, magnitude, `textTint`, the route (three.js as the oracle) and the script.
- **Script parity:** all 40 blocks keep the storyboard's windows and reading spots within 0.01 screens, and every word is fully in at its reading spot.
- **Refactor verdicts:**
  - path: named row offsets;
  - spots: dropped the duplicate `top`;
  - modes: removed `settledWeight` and kept the switch (one site);
  - route: a discriminated union for stops;
  - windows: matched the storyboard's extras fallback;
  - the rest kept.
- **Unit:** 165/165.
- **e2e:** `tests/e2e/voyage.spec.ts`, 10 tests, which launches with ANGLE on Metal. Together with `smooth-scroll.spec.ts`: 48/48, three times over.
  - It covers the runway's order and height, deep links to sections and projects, a typed hash, an in-page glide and Back, keyboard focus, every block in at its reading spot with its title in frame, reload, the reduced-motion stills, plain, and the phone's label lists.
  - The deep-link e2e was written after the wiring. Its logic was test-first in `spots`.
  - `landing.spec.ts` still fails at line 29, as on the baseline.
- **Lint:** clean except the baseline `app/page.tsx:62`. `pnpm build` passes.

**Measured** (M5, headless with GPU, production build; scripts in the session's scratchpad, numbers here):

| | 1440 (DPR 2) | 390 (DPR 3) |
|---|---|---|
| Playing the whole film at 2 screens/s | mean 16.67 ms, p99 18.6 ms, 0 frames over 20 ms | mean 16.67 ms, p99 18.6 ms, 0 over 20 ms |
| GPU per frame (dev, timer query) | 2.4 ms mean, 4.8 ms p95 | 1.7 ms, 3.4 ms |

- **After first paint:** 157 KB, up from 141 KB; the stage is about 10 KB of it.
- **LCP**, median of 7:
  - 390 with 4× CPU and fast 4G: 872 ms (764 before). The head WebGL check under the CPU throttle and the three new font families account for it.
  - 1440: 244 ms.

These grey-block numbers are the baseline each scene's finish is measured against.

**For later tickets:**
- **The scene tickets:** each replaces its stretch in `lib/voyage/stage.ts` (and its timing in `script.ts`), keeping the storyboard's keys. Left to them:
  - the peel animation (the ring fades and the route draws for now);
  - Athena's wedges, the pipeline's records and climax;
  - the record's flight, and the ribbon's curved cards and flat turn;
  - the hero lockup's arrival.
- ***Build Athena*:** her moon labels and the patterns' labels overlap at her reading spot.
- ***Build the pointer layer*:** the stars' buttons, chip, lens, push and fling hang on `StageView`; the subjects can be resolved there.
- ***Build the bubble*:** retires the folded rail and the 12vh sheet.
- **The tool effects:** `scroll_to("work")` targets `#sec-selected-projects`, which no longer exists, so it does nothing. That belongs to the warp and the point.
- **Content:** `lib/content/work-timeline.ts` (and so the JSON-LD's `worksFor`) still says LogoLife "Data / AI Engineer", where the decided title is "Full-Stack / AI Engineer".
- **Known gap:** find-in-page finds the text but can't scroll to it in the film, since the text is fixed in the frame.


---

<a id="t35"></a>

## 35 · Build the hero and home

*task · resolved · blocked by 34, 51*

Resolved 2026-10-03. Scenes 1–3 play on the real site in the final forms [Finalize the hero and home](finalize.md#t51) settled (its answer has each one). Janriz on the result: "looks good".

- **Built on this ticket's skeleton:** the camera, the timings, the composition, the phone compositions and the tiers, as the AFK round ported them. Then:
  - **home:** the finished truss ship (`lib/voyage/ships.ts`, `public/voyage/ship/truss.glb`), with the ring kept as a take;
  - **his portrait:** a riding label with a photo (`Runway.tsx`, `voyage.css`), with the slab gone;
  - **About's text:** written in word by word, with the threads, the letters and their SVG layer gone;
  - **the sun and the orbit:** as built here.
- **What changed from the storyboard (round 3), and why:**
  - **The AFK round's changes stand** (the comment above): the text windows, the phones' framing, his star lit from the first pixel of scroll, home's single fade.
  - **About's lines are written in word by word, not out of their stars along a thread:** Janriz disliked text arriving by light. Each line still lights the stars of what it's about, which is the stage's doing.
  - **His portrait rides a label from the ship,** not a slab on the orbit: Janriz's pick of three takes.
  - **Home is a ship,** not a planet: Janriz's reset.
- **The dropped frame at 2.8 screens is development-mode React only.** It was this ticket's to find. On a production build, two runs at 1440 and 390 show no frame over 20 ms through the opening (2026-10-03, a probe with no page hooks, scrolling as a visitor would). Round 4 of the finalization traced it to a React task in development.
- **The lockup's arrival on load** (question 2 above) is carried to [Build the wake-up](build.md#t46), which owns the first moment.
- **Tests:**
  - unit 179/179;
  - `voyage.spec` and `smooth-scroll.spec` 18/18;
  - tsc and `pnpm build` pass;
  - eslint flags only the pre-existing `app/page.tsx` error.
- **For later tickets** (from the AFK round, unchanged):
  - *Build the peel and the road* straightens the orbit's `hairlines` (`relayRing`) into the route;
  - *Build the route map* matches `ROUTE_MAP_CLEAR` to the map's real size;
  - *Build the bubble* replaces the interim chat rail.


---

<a id="t36"></a>

## 36 · Build the peel and the road

*task · resolved · blocked by 34, 52*

AFK round built, 2026-10-04. Evidence is in [`research/road-build/`](../research/road-build/): `out/road-1440.mp4` and `out/road-390.mp4` with their contact sheets, `shots/spots/` (every reading spot of scenes 4–5 at 1440 and 390, sheets `sheet-*.png`), `shots/noface/` (the engraving with the HTML hidden), `shots/fade/`, `shots/peel/`, `shots/tail/`, `shots/reduced/`, `shots/lookback/`, and the profilers (`profile-fast.js`, `probe-*.js`).

**What was built** (on 52's look, which was already on the site):
- **The engraving is cut in the shader.** Each plate's inscription is laid once, while the page is idle after load: every word cut whole into a one-channel mask, a map naming which word each texel belongs to, and a one-texel-a-word table. As the page writes and wears its words, only that table changes (a few hundred bytes), so nothing is redrawn and no 1.3-megapixel texture is re-uploaded on the ride. The cut is read once a pixel, and its walls' slope comes from screen derivatives. It reads as before: bare aluminium under the HTML ink, walls catching the light (`shots/noface/`). The logic is in `lib/voyage/engrave.ts`, tested.
- **Culling.** A monolith that is sunk, not yet reached by the road, let go by the film, or under ~5 px on screen isn't drawn, and nothing about it is posed (`lib/voyage/road-cull.ts`, tested). Monolith posing moved from `stage.ts` into `road.pose()`.
- **No see-through fade.** A standing monolith is opaque. While it fades it draws a depth-only twin first, so only its nearest surface shows, never its insides. Both programs, and the sealed one, are warmed up before first sight.
- **The sealed coat is a material of its own**, swapped in only while the look back's glint asks for it, so the ride never pays for the clear coat.
- **The peel** straightens whichever orbit home draws. It's checked on the ring ship, now the default (`shots/peel/`).

**What changed from the storyboard, and why:**
- **On a phone, the camera looks straight at the monolith while it's read** (the target lerp at the reading spot goes from 0.85 to 1, phone only). The plates had sat against or past the frame's right edge. Every one is now whole and centred at 390.
- **At the road's start, the route all but goes behind the line under the launch mark.** On a phone it ran straight through "Where it starts, out by my university's stars." The mark itself stays lit.

**Measured** (headless M5, ANGLE Metal, dev server, a fast scroll of 8 screens a second over 5.6 → 19 and back):
- **Before:**
  - At 6 screens/s and 1440, two long frames (34 ms), both at the peel.
  - Under a 4× CPU throttle, two 165 ms frames at the peel. These were lights leaving the scene and forcing recompiles, now gone with 43's light rig.
  - Redrawing and re-uploading the engraving took 189 ms of canvas drawing and about 255 ms of texture upload per 6 s run, all of it in the frames near a monolith.
- **After:**
  - The engraving costs nothing measurable on the ride (no canvas, no upload).
  - **390:** 0 frames over 20 ms in four runs (mean 16.6 ms, max 18.7).
  - **1440:** 1 to 17 frames over 20 ms per run of about 190, depending on the machine's load. The long frames are the main thread waiting on the GPU or compositor, not script. They cluster round the gates and the plates.
  - **GPU at reading spots:** the road costs 0.6–3.7 ms of the sky's GPU time at 1440 (noisy with the machine shared) and the gates 0.4–1.5 ms. Raster of the HTML ink on the faces runs at 2–3.6 ms a frame on the raster threads near plates, against 0.2 elsewhere.
- **What else costs on the Work route** (not this ticket's files):
  - Tycho's rig (`apply`), about 0.9 ms a frame, plus his shadow pass.
  - The ship's and the gates' fades flag `needsUpdate` about 1,000 times in 200 frames of fast scroll, each one a program lookup.
  - Every lit surface now loops over all four directional keys (the light rig's +0.6 ms).
- **Tests:** unit 165/165 in `lib/voyage` (engrave 7, road-cull 5 new, each red first); `tsc` clean for these files; eslint clean.
- **Refactor:** I considered three candidates.
  - Moving the monolith loop out of `stage.ts` into `road.pose()`: done.
  - Merging `signShows` into `engrave.ts`: kept apart, since one is culling and one is the cut.
  - Dropping the canvas measurement in `layEngraving` for the runtime's own word rects: kept, because the runtime doesn't measure words.

**For Janriz to look at:**
1. `out/road-1440.mp4` and `out/road-390.mp4`: the ride, each plate at its reading spot, and the road's start.
2. The phone plates, now centred (`sheet-390-a.png`, `sheet-390-b.png`).
3. The route dimming behind the road's start's line on a phone (`shots/tail/390-18.34-tail.png`).
4. Whether the 1440 fast scroll feels smooth on your machine now. If it still drops, the next costs are the gates (37), the HTML ink's raster, and Tycho's rig and shadow.

- 2026-10-04 — From [Build the look back and the spur](build.md#t38) (resolved): `hairlines.ts` gained two optional uniforms, both off by default: a second occlusion box (`uOcc2`) and a body occluder (`uEll`/`uEllK`). The route is unaffected. Seen in passing: under reduced motion on a phone, the route crosses the road's start's line ("…university's stars.") at 18.34 (`research/lookback-build/shots/reduced/390-18.34-tail.png`).


---

<a id="t37"></a>

## 37 · Build the gates

*task · resolved · blocked by 34, 36, 53*

Resolved 2026-10-04, pending Janriz's reaction (HITL). Built on what *Finalize the gates* put on the site. The camera path, timings, composition and text are the storyboard's. The work here was performance first, then the finalization's leftovers. Evidence is in [`research/gates-build/`](../research/gates-build/): the profiler `fast.js`, the stills `shots.js`, the phase sweep `phase.js` and `out/gates-1440.mp4` / `out/gates-390.mp4`.

**What was costing the frames.** The Work route's long frames at 1440 weren't the gates. Profiling a fast scroll with CSS variants pinned them on the monolith plates' HTML ink:
- The plate's face rides a `matrix3d`, so Chrome re-rasters it every frame its scale changes, which is the whole ride. It also inherited the shot's soft 28 px `text-shadow`.
- That cost 1.5–4.7 ms of raster per frame on the ride, and the compositor sat 2–8 ms a frame waiting on the GPU (`IOSurfaceImageBacking::WaitForCommandsToBeScheduled`). The 33–68 ms frames were all in that wait.
- Without the shadow: raster ~0.3 ms, wait 0.2 ms, no long frames. `will-change: transform` on the face made it worse (11 long frames).

**What changed:**
- **The plate's ink** (`app/voyage.css`): a tight 2 px halo in place of the soft shadow. The plates are dark, so the stills look the same (`shots/shadow/`).
- **The gates** (`lib/voyage/gates.ts`, new `gates-cull.ts`, tested):
  - **The CubeSats are instanced.** A CubeSat was 16 draws. Each one's parts are now baked into one geometry per material, and each gate draws its CubeSats as one instanced draw per material. Their bounds follow them, so three's frustum test culls them correctly.
  - **Shared materials.** A gate's parts share one material per kind (it was one clone per mesh, 240+).
  - **No recompile on fade.** Each material is a pair, opaque and see-through, both compiled at warm-up. The fade picks one, so crossing whole never flags `needsUpdate` (it was ~130 flags per material per fast scroll; now 0).
  - **Dark lights skipped.** They're lit through `lightBy` from `dark-lights.ts`, so the rig's dark keys cost nothing.
  - **Culling.** A gate out of its scene, not yet reached by the route, or under ~5 px isn't posed or drawn (`gateShows`).
- **Labels and CubeSats keep clear of the role's words:**
  - Each gate's CubeSats turn with a phase of their own (`PHASE`). It's found by sweeping one spacing at each reading spot at 1440 and 390, and keeps every CubeSat and label at least 14 px from the title and lines, neighbouring phases included. Before, LARAVEL touched the Yearbook's first line (3 px at 1440), and at 390 some CubeSats sat on the lines.
  - A label now hangs from where its CubeSat would be untumbled, so a hard scroll carries it out ahead of its CubeSat. The finalization's still-held label was flown over. It still never tumbles.
- **On a phone:**
  - The throw is smaller: 0.26 out / 0.12 towards you, against 0.42 / 0.22 (`throwOf`).
  - The role's lines get the crawler's close dark halo, since the white collar closes in under them as they go.
- **The route at a gate** (`lib/voyage/road.ts`): from the role's lines writing in until they're gone, the route all but goes behind them, as it does at the road's start. Before, it ran through them at Tolstoy and the Yearbook on a phone.
  - Bug found on the way: the road's-start occluder was on for the whole ride (`start.vis` is 1 once the route is drawn), dimming a strip where the tail's line would stand. It now applies only while its block is in play.
- **Tycho's footprints** (66's registry): the ring's parts register as before, the instanced CubeSats are skipped, and each CubeSat is its own spot (`gateSet.spots`). Two lines in `stage.ts`.

**Measured** (headless M5, ANGLE Metal, dev server; a fast scroll of 8 screens a second over 5.6 → 19 and back, ~200 frames a run, 2 runs):

| | frames > 20 ms | worst frame | p95 frame | draw calls (mean / max) |
|---|---|---|---|---|
| 1440 before | 1, 2 | 33.8 ms | 18.6 ms | 82 / 360 |
| 1440 after | 0, 0 | 17.8 ms | 17.7 ms | 31 / 136 |
| 390 before | 0, 0 | 18.7 ms | 18.6 ms | 51 / 200 |
| 390 after | 0, 0 | 17.7 ms | 17.6 ms | 26 / 101 |

- **Raster on the ride at 1440:** 1.5–4.7 → ~1 ms a frame. **Compositor wait:** 2–8 → mostly under 1 ms.
- **The sky's GPU time** moves 2–5 ms between runs with the machine shared (other sessions' builds), so differences under that are noise. At the reading spots the gates add ~0.7–2.6 ms at 1440.
- **Tycho:** hiding him took the last long frames out of a 1440 run and lowered the compositor wait. His canvas draws with MSAA and a 1024 soft shadow map every frame (66's, told).

**For Janriz to look at:**
1. `out/gates-1440.mp4` and `out/gates-390.mp4`: the four gates at a reading pace, then a hard scroll back over the Yearbook's (the deploy and the labels moving out ahead).
2. Whether a fast scroll through Work feels smooth on your machine now. The plate ink was the drop.
3. On a phone, as the camera closes in (8.45–8.6), the collar passes under the role's lines while they fade (`shots/spots3/390-8.55-asis.png`). The halo keeps them legible. The alternative is a soft scrim under the phone's lines at every gate.
4. In shade (Tolstoy, Elinnov) the latches read as dark notches on the slate collar. Left as lit.
5. For a few frames at the very end of a role's fade, the next plate takes the route's single occluder, so the route shows through the last faint words.


---

<a id="t38"></a>

## 38 · Build the look back and the spur

*task · resolved · blocked by 36, 54*

Resolved 2026-10-04. Scene 10 is built to *Finalize the look back and the spur* on round 3's skeleton: camera, times and text unchanged, and no block id renamed (`mark-*`, `role-*`, the spur's cue). This was mostly the finish-bar work 54 left open. Evidence is in [`research/lookback-build/`](../research/lookback-build/):
- recordings `out/lookback-1440.mp4` and `out/lookback-390.mp4`;
- reading-spot shots `shots/final/`, in-betweens `shots/base/` and `shots/occ*/`, stills `shots/reduced/`.

**What changed**
- **The spur no longer crosses her** (39's find at 24.3). Where the capture orbit, or the arc, passes in front of Athena it dims to 0.22 across her exact silhouette, with a soft edge. Her ice is tested as an ellipsoid per pixel, so it is her shape, not a disc. Behind her, the depth test already hid it.
  - How: `hairlines.ts` gained an optional body occluder (`uEll`, off by default) whose math is twinned and tested in `lib/voyage/occlude.ts`. `athena.ts` exposes `ellipsoid()`.
- **The spur no longer crosses text.** It goes behind the words of Projects (20.75–20.9, as 54 found) and of Athena's title. It uses two boxes, the latest block's heading and the lines in the column, so the orbit still shows between a phone's title at the top and its lines at the bottom. Under reduced motion the boxes come from the still's own block, because the runtime draws a still before it shows the block. `hairlines.ts` gained a second box, `uOcc2`.
- **On a phone, the crawler and its companions come in once Projects' lines are gone** (from 21.1, not 20.1). Its relay satellite crossed the PROJECTS title at 20.3. Landscape is unchanged.
- **The role labels' overlay is culled:**
  - outside 18.80–19.68 it's hidden once and nothing is projected or written;
  - while it's up, a tag's visibility is written only when it changes;
  - the timing moved into `roleTagsAt` (`spur.ts`, tested).
- **The glint allocates nothing per frame** (it reuses its vectors).

**Kept from the storyboard and 54, and why**
- **The role labels stay an overlay of their own** rather than going into the runtime's label layer. The runtime turns labels into a list on phones, and its placement doesn't do what these need: hang off the side away from the road, flip only when clearly better, and stay clear of each other. A labels-only block would also add a reading spot at 19.2.
- **The far plates' glint still flashes white** for an instant, as Janriz picked (54). Under the storyboard's camera the node is still at the frame's bottom-right for about 0.2 screens. Near plates at the frame's edge still go black in the fly back, as black metal off the light does.
- **The sealed coat's cost on the ride** was already solved by 36: the coat is swapped in only while the glint asks for it.

**Measured** (fast scroll 17.8 → 24.6 and back; headless GPU Chromium, ANGLE Metal; 2 runs at 8 screens/s and 1 at 14):

| | Frames over 20 ms | Frame time (p95 / max) | GPU (p95 / max) |
|---|---|---|---|
| 1440, before | 0 | — | 14.2 / 19.0 ms |
| 1440, after | 0 | 17.6 / 17.7 ms | 8.1–9.0 / 13.5 ms |
| 390, before | 0 | — | 8.1–9.0 / 12.9 ms |
| 390, after | 0 | 17.6 / 17.7 ms | 5.4–6.4 / 10.5 ms |

- At 14 screens/s there were no frames over 20 ms at either size.
- Part of the GPU drop is other tickets' culling landing meanwhile (gates, Athena).
- The 33 ms frame 54 couldn't trace didn't show up in 6 runs.
- Draw calls peak at 156–171 (1440) round 20.0, where the road, the gates, Athena and the crawler are all briefly in frame.

**Tests**
- TDD: `bodyCover` and `textBoxes` (`occlude.test.ts`) and `roleTagsAt` (`spur.test.ts`), each red, then green. One red was a wrong test case of mine, which I fixed.
- `lib/voyage` + `lib/routemap`: 212/212. tsc 0. eslint 0 on the touched files.
- `spurPath` is unchanged, so the route map's spur (45) stays in sync; `chart.test.ts` passes.
- **Refactor, candidates and verdicts:**
  - folding my two-box text occlusion into 41's `textOcclusion`: **keep separate**. Its single union box suits the pipeline's column, and changing it would touch a resolved module.
  - the GLSL twin of `bodyCover`: **kept**. It can't be shared, so the soft edge is one constant (`BODY_SOFT`) used by both.
  - extracting the label placement loop into a pure function: **keep**. It's 54's code, unchanged.

**For Janriz to look at**
- 24.2–24.4, the close pass: the orbit is now a faint line over her face. Is 0.22 dim enough, or should it go entirely?
- 20.7–21.0 on a phone: the spur slips behind Projects' lines and Athena's title.
- The far plates' white flash in the glint (19.2–19.4): keep it, or cap it to a grey sheen?
- Seen in passing, not mine:
  - Tycho briefly over the ATHENA title as it writes in at 20.9 (1440 recording; 66);
  - under reduced motion on a phone, the route crosses the road's start's line at 18.34 (36).


- 2026-10-04 — **From [Build the gates](build.md#t37) (resolved), in `road.ts`:**
  - The road's-start occluder (the route all but going behind the tail's line) was on for the whole ride, because `start.vis` is 1 once the route is drawn. It now applies only while the tail block is in play (`.shot.on`).
  - The same rule dims the route behind a role's lines from `tIn[0]` to `tOut[1]`. A monolith being read still takes precedence. Your `uOcc2` and the look back are untouched.


---

<a id="t39"></a>

## 39 · Build Athena

*task · resolved · blocked by 34, 55*

Built 2026-10-04 on round 3's skeleton, in the final form *Finalize Athena* settled; everything its Answer left for this build is done. Resolved pending Janriz's reaction: the one change he hasn't seen is her light (below). Recordings: [`out/athena-1440.mp4`](../research/athena-build/out/athena-1440.mp4), [`out/athena-390.mp4`](../research/athena-build/out/athena-390.mp4).

- **What was built** (`lib/voyage/athena.ts`; new `athena-cull.ts`, `dark-lights.ts`, each with tests):
  - **Culling.** Her scene holds her (`vis` 1) from the spur's end to the pull-out, through the crawler, the pipeline and the ribbon. Each frame her body (as opened), her ring and the stream's reach are tested against the camera's frustum (a little larger, since the camera takes its pose only when it draws), and her body fades by its size under ~16 px as every block does. What's out isn't drawn, nothing of hers is posed, and her star's 2048 shadow map isn't redrawn while her body is out of frame or under 10 px (the light rig's `shadowOff`). The records were never culled; now they are.
  - **Her light: her own star's alone.** Round 1's look had her lit by three keys, hers plus the crawler's and home's (every key is a directional light and reaches every surface), which is why she read evenly white. Her shaders now take only her own star's key (`lightBy` in `dark-lights.ts`, matched by direction in the shader, so no light comes or goes), plus the region's fill. She has a real terminator, her Dark Red Spot reads on her arrival, and at her opening the hot core is the brightest thing in the frame. The records still take every key, since they travel between two stars. Take `?athLight=all` (on the switcher) brings back round 1's light.
  - **Dark lights cost nothing.** The light rig (*Build Contact*) keeps every key in the scene all film long. `lightBy` skips a light whose colour is zero, both its shading and its shadow map, and the ring ship (67) now uses it too.
  - **Her closing.** The cut faces darken with how far apart the wedges are, since light only reaches inside the gap as it opens. Closing (and a barely-peeking wedge) now shows dark seams, not pale bands.
  - **Her ring's shadow.** The faint wings round the band now only add the light they scatter (premultiplied), so in her shadow they just go. Her shadow's edge is soft, since her star is near and wide. The dark slab that stood past the band, the "faint dark arc", is gone.
  - **The records.** They join her ring on her lit side, gliding towards the point nearest her star, and each one tips its plate to her star and you as it joins, so it shows as a glint, the way the monoliths' plates do in the look back. Along the upstream reach they're drawn up to 2.2× larger, so they read as engraved slabs where the camera follows the stream (40's ask).
  - **The fling.** A hard scroll throws her moons straight out from her (to 1.45× their distance), tumbling, one after the other (`staggered`, the fling's `lag`). It throws the records off the stream, each its own way across it.
- **Unchanged from the storyboard:** the camera path, the timings, the text, the composition and the labels. The peek, the phone's list and the reduced-motion stills are as *Finalize Athena* built them.
- **Measured** (M5, headless, GPU on, on a machine shared with six sessions, so read the paired runs):
  - **Fast scroll** through her scenes (20.3 → 25.6 screens and back in 1.2 s each way, about 4.4 screens a second, fling engaged): 60 fps, no frame over 20 ms, at 1440 and 390, her shown or hidden.
  - **What she adds, GPU mean** in paired sweeps: about 1.2 ms at 1440 (7.75 / 7.18 against 6.34 / 5.89 hidden) and about 0.6 ms at 390 (4.24 / 4.52 against 3.65 / 3.90).
  - **At her opening spot,** in paired medians of 8 alternations (before the own-key light): her body about 1.9 ms, her shadow pass about 0.7 ms, her ring about 0.
  - **Through the crawler and the pipeline** (25.6 → 33) she's culled. Shown and hidden measure the same within noise (6.4 / 7.9 against 8.8 / 7.5).
  - **Round 3's bar can't be judged from this machine:** the site's frame without her (5.9–6.3 ms at 1440) is above round 3's grey blocks (4.5), and these sessions' own runs drift by several ms. A quiet re-measure is the performance pass's job ([69](build.md#t69)).
  - **Contrast** (`aa-athena.js`): every reading spot passes. At 1440 the title is 15.1, text 10.6, small print 6.8 and labels 8.8 (the worst). At 390 the title is 11.1, text 11.1 and small print 6.4.
  - **Tests** (each written failing first): `athena-cull.test.ts` (12: culling, the fling on her moons, the records' size) and `dark-lights.test.ts` (5), plus the `athLight` take in `takes.test.ts`. `lib/voyage` and `lib/film` give 380 passing; the one failure is the frozen solar-system prototype under `.scratch`. tsc and eslint are clean on the changed files.
  - **Refactor verdicts:**
    - `joinAt` precomputes its basis (done).
    - `lightBy` moved out of athena.ts into `dark-lights.ts` so the ship and ribbon can use it (done, at 43's ask).
    - The gates' inline stagger could use `staggered`: kept, since that's another ticket's file mid-wave.
    - The `ownLight` time window was replaced by the in-shader key match, and removed with its tests.
- **For Janriz to look at:**
  - **Her light** at 22.53 and 23.0: her own star's alone (default) against round 1's flat white (`?athLight=all`). [`cmp-onekey.png`](../research/athena-build/shots/cmp-onekey.png). It's darker, documentary and low-key; her far wedge falls into the region's fill.
  - **Her closing** (about 23.6–24.1), now with dark seams.
  - **The records' glint** as they join her ring, and their size upstream (25.0).
  - **A hard scroll** at her opening: the moons thrown and the records scattered (the recording's second half).
  - **The close pass at 24.3:** the camera goes by her night side, so she's mostly dark there. That's true to her own light; `?athLight=all` shows the old one.


- 2026-10-04 — From [Build the look back and the spur](build.md#t38) (resolved): the spur's capture orbit now dims to 0.22 where it passes in front of you, across your exact silhouette (your ice as an ellipsoid, tested per pixel). `athena.ts` gained one getter, `ellipsoid()` (your `ellInv` while your body is drawn); nothing else of yours changed.

- 2026-10-04 — From [Build the record's flight and the ribbon](build.md#t42) (resolved): Athena and her moons are now hidden at F1+0.1 (were faded at G1+0.6), so the pull-out shows only the ribbon. The ribbon's materials take only their own star's key through `lightBy(m, own)`.


---

<a id="t40"></a>

## 40 · Build the crawler

*task · resolved · blocked by 34, 56*

Resolved 2026-10-04 (AFK build; the HITL feel check is Janriz's look at the recordings below). The crawler is built on the round 3 skeleton in the final form *Finalize the crawler* settled (the refinery, the ghost lens, the split, the folded pipeline, the relay and the tug). This ticket closed what that answer left open, and culled the scene. Evidence: [`research/crawler-build/`](../research/crawler-build/) (`out/build-1440.mp4`, `out/build-390.mp4`, stills in `shots/`, perf logs in `out/`).

- **What was built:**
  - **The struts under its service ring draw back as it opens.** The model had three struts running from the service ring in under the column to its axis, so every dropping ring passed through them. They're now made in code and stripped from the model's frame on load (`lib/voyage/refinery.ts`, the geometry; `crawler.ts`, the meshes). They retract into the ring as the halves part, and stay back while any ring is low in the gallery, so the rings pass whichever way you scroll. Tested: no ring meets a strut through the whole drop and fold-back, at 1440's and a phone's shaft size.
  - **Culling.** Whether it's in frame is decided as the frame draws, in the scene's own render hook, chained to whatever else hooks there. That's the point where the film has posed the camera. Its bounds take in its companions' orbits. Out of frame, its bodies aren't drawn, its moving parts aren't posed, and its key light's shadow pass is skipped (the light rig's `shadowOff`), unless the pipeline is falling under it. The light itself stays, so no shader recompiles. Measured: out of frame from Athena's arrival (21.5) until the stream reaches it (25.0 on a phone).
  - **The folded pipeline is drawn only when it can be seen.** That's through the lens, in the reduced-motion still, or once the crawler opens. Before this, the pipeline (rings, mast, swarm, magazines) was posed and drawn every frame from 20.55 on, all through Athena, hidden inside a closed fairing.
  - **The phone:**
    - A portrait-only camera key at C0 + 0.6 holds the camera back while it opens. The split now reads whole in the top half before the dive, which it never did on a phone.
    - The crawler's text has the hand labels' dark halo (one scoped CSS rule), so its lines still read as the rings drop behind them while they leave, at 26.1 to 26.7. The same halo covers 1440's in-between, when the white fairing passes behind the lines as the camera comes upstream.
  - **The lens it opens on its own** (touch, and the reduced-motion still) is now a window of at most 0.3 of its disc, inside the fairing. Before, on a phone, it covered the whole crawler and turned it to a black ghost. With the pointer, the lens is unchanged (Edolus's 0.18 of the screen's height).
  - **Its companions draw off as it opens** (C0 + 0.5, over 0.35), labels with them. Before, the closing camera carried the tug's label into the route map's corner.
  - **Its title's anchor reaches out as the halves part,** so the title keeps clear of them.
- **Bugs fixed on the way:**
  - The seam's turn was computed before the model loaded, so which side the rock ended up on depended on load order. It now settles once the halves exist. The rock stays on the left, the side Janriz approved.
  - A reduced-motion still now poses everything before it draws once.
- **What changed from the storyboard, and why:**
  - The portrait key, because the crawler drawn at 1.3× put its rings behind a phone's lines.
  - The companions fading at the split, because of label collisions.
  - The struts, because of the finalized model, which the storyboard didn't have.
  - Landscape camera path, timings, composition and text are unchanged.
- **Stream records:** at Janriz's shot line ("close enough that its records read as slabs"), Build Athena (39, which owns the stream) grows them along the upstream reach. At 25.0 at 1440 they read as engraved slabs, about 70 px.
- **Measured:** headless Chrome, ANGLE on Metal; a fast wheel scroll from 20.4 to 27.7 and back (120 px every 12 ms).

  | | fps | frames > 33 ms | GPU mean / p95 (ms) |
  |---|---|---|---|
  | **Before, 1440** | 59.7 | 1 (a 51 ms stall) | 6.1 / 11.9 |
  | **Before, 390** | 59.2 | 2 (up to 67 ms) | 3.4 / 7.2 |
  | **After, 1440, the crawler's stretch (24.4 to 27)** | 60 | 0, and none over 20 | 5.2 / 9.6 |
  | **After, 1440, whole run** | 59.4 to 60 | 0 to 3 single dropped frames | |
  | **After, 390** | 59.8 to 60 | 0 to 1 | 3.2 to 3.5 / 7.5 to 8.0 |

  - The odd dropped frames on the whole 1440 run show up with the crawler hidden too (around Athena, 20.4 to 24.6). Machine noise, not the crawler.
  - The crawler's share of a fast scroll at 1440 is about 1.2 ms GPU mean.
  - The heaviest frames left are inside the shaft (26.8 to 27.1, up to 16.6 ms GPU at 2× DPR). That's the pipeline, for 41.
- **Tests:** `refinery.test.ts` 4/4, typecheck clean for these files, eslint clean. Not run: the e2e suite (one heavy job at a time).
- **For Janriz to look at:**
  1. The phone's opening (`build-390.mp4`): does the hold, then the dive, feel gentle enough? The dive is now quicker, 0.4 screens instead of 1.
  2. The struts drawing back into the service ring as it splits.
  3. The halo on the crawler's lines: is it fine to keep, or should it be site-wide for text over hardware?
  4. Still open: in the reduced-motion still, the companions' labels sit on the craft rather than beyond them. This was there before this ticket (runtime label placement in a single drawn still).
  5. Not the crawler: Tycho now parks top-right at the crawler's reading spot, near the route map and the tug's label (66/49's).
- 2026-10-04 — From [Build Athena](build.md#t39) (resolved): the stream's records are drawn up to 2.2× larger along the upstream reach (`slabSize` in `lib/voyage/athena-cull.ts`), take the fling, and are culled when the stream is out of frame. Athena's key no longer lights anything of the crawler's: her own shaders take her key alone. The crawler's own light is unchanged.

- 2026-10-04 — From [Build the record's flight and the ribbon](build.md#t42) (resolved): the crawler (with its companions and moons) is now hidden at F1+0.1 instead of fading at G1+0.6, because it came into frame mid pull-out. `crawler.ts` itself is untouched; its key goes dark through `root.visible` as before.

- 2026-10-05 — **The crawler showed in the hero after a resize** (Janriz). A resize lays the film out again, and the stage's `reset()` hid home, the sun and the ring, but not Athena, the crawler, their moons, the gates or the monoliths. Their fade-ins only apply their start once the film reaches them, so a resize made past Projects left them shown from the very start (frames in `research/crawler-hero/repro-sheet.png`). `reset()` now hides every body the film fades in. A dev-only `__shown()` hook reports each body's visibility. A new voyage e2e test resizes at the crawler and goes back to the hero: it fails 3/3 without the fix and passes 4/4 with it.


---

<a id="t41"></a>

## 41 · Build the pipeline and its climax

*task · resolved · blocked by 40, 57*

Resolved 2026-10-04 (AFK; Janriz's reaction still welcome). *Finalize the pipeline and its climax* had already put its picked form on the site, so this build finished it to the bar: culling, the module split, the phone's climax, and three defects found in the stills. Evidence is in [`research/pipeline-build/`](../research/pipeline-build/README.md): MP4s at 1440 and 390, stills at every reading spot and in between, and reduced motion.

- **What was built:**
  - **The split.** `pipeline.ts` (580 lines) now holds the rings, mast, ring light, text zone and the front. The records are in `swarm.ts`: the swarm, the queries, the search's hairlines and the rush. The bars and the −70% hairline are in `report.ts`.
  - **Culling** (`pipeline-cull.ts`, tested). The swarm is drawn only from the queries leaving Start until the last record has sunk into Save. The search's hairlines are drawn only while a page is being fetched. The rush is drawn only while the front runs. Posing the swarm allocates nothing per frame now (it made several vectors per record), and stage depths are looked up once.
  - **The phone's climax.** The camera draws back further (0.2 → 0.265) and the shaft rides higher (cy 0.4 → 0.32 as the climax comes). The whole shaft now stands in the top half, with Report's lit ring and the bars above "Paid for once". Before, the text sat over Save, the deck and the bars.
  - **The route never crosses the pipeline's text** (`text-occlusion.ts`, tested). While the shaft is shown, the road's route line all but goes behind the block being read, as it does behind a plate. Under reduced motion it uses the text zone, because a still is drawn before its block is in play. Before, it ran through "Paid for once" at 1440.
  - **Leader-line labels are whole at the reading spot** (`lib/film/label-times.ts`, tested, wired in `runtime.ts`). The 0.07 stagger closes up when a block's spot comes too soon after its text is whole. Report's fourth label (Saved) was about 70% at its spot.
  - **"Layer 1" and "Layer 2" no longer orphan the digit** on a phone. The stage title binds it with a no-break space, and `Runway.tsx`'s word splitter now keeps a no-break space inside one word.
  - **Footprints:** the shaft's registration skips the search's hairlines and the rush (`pipeSet.notSubjects`). They aren't subjects, and the hairlines' geometry box isn't where they draw.
- **Changes from the storyboard:** only the phone's climax camera (above). The shot list puts the shaft in the top half on a phone, and the drawn-back camera had let the text cover the climax's payoff. The landscape camera, every timing and every text manner are the prototype's.
- **Measured** (shared GPU, M5):
  - **Fast scroll** (26.3 → 34.5 in 3 s, and in 10 s): 60 fps at 1440 and 390, no frame over 20 ms (max 18.5 / 18.7 ms). That matches before the build, which also held 60 fps.
  - **GPU mean on the 3 s scroll:** 7.9 ms at 1440, 5.4 ms at 390.
  - **Per part:** the pipeline costs 0.5–2.5 ms of GPU at 1440, heaviest at Save. No part (rings, fixtures, mast, records, the crawler key's shadow pass) is over about 1 ms alone.
  - **Tests:** 402 pass in lib/film, lib/voyage and components. ESLint is clean on the touched files. tsc's only errors are in other tickets' work in progress (gates.ts, wake.spec.ts).
- **Refactor verdicts:**
  - Split `pipeline.ts`: **done**.
  - `LABEL_FADE` for the runtime's two 0.14 literals: **done**.
  - Cache the crawler key's shadow map while the shaft's casters are still: **keep as is** (about 0.5 ms, within noise).
  - Frustum-cull the magazines and the mast: **keep** (tiny, and their bounds move).
  - Move the text occlusion into `road.ts` for every scene: **keep it scene-scoped** (other scenes have their own text rules).
- **For Janriz to look at:**
  1. The phone's climax framing: the end of `out/pipeline-390.mp4`, and `look/390-t33.70-s.png`.
  2. At 1440 the drawn-back climax still sets the report's deck on the frame's bottom edge (the prototype's camera, kept).
  3. As "Paid for once" writes in at 1440 (about 33.3), a small craft, apparently a gate's CubeSat on the route, drifts across the title. I've flagged it to *Build the gates*.
  4. Tycho parks near the shaft and the deck at Report and the climax: *Build Tycho in the film*'s footprints.


---

<a id="t42"></a>

## 42 · Build the record's flight and the ribbon

*task · resolved · blocked by 34, 41, 58*

Built 2026-10-04 on *Finalize the record's flight and the ribbon*'s round-2 code, which was already on the site. This pass finishes it: the finish bar, the phone, reduced motion, performance and Janriz's pull-out note. Evidence: [`research/ribbon-build/`](../research/ribbon-build/README.md). It holds MP4s at 1440 and 390 (`rec/`), stills at every reading spot before and after (`before/`, `after2/`, `rm/`), and the pull-out frame by frame (`pullout/`).

- **The card square to you is centred at each reading spot** (the finalization's open phone issue). FlowStack's and PulseVR's spots fell between two cards, so the flattest card sat half a card off to one side and was clipped: at 390 FlowStack's spanned −114 to 231 px and PulseVR's 154 to 498. The camera still comes round evenly, but at each project's reading spot it is now round at the card nearest where the even turn would be. That's a monotone curve through those points, never more than half a card from the even turn and never stopping (`lib/voyage/ribbon-turn.ts`, tested). Now the cards sit at 16 to 372 and 15 to 371 px, filling the width. At 1440 PulseVR's card is no longer clipped at the right edge either. The path and the scene's timings are the storyboard's; only the pace of the turn near each spot changed.
- **The pull-out shows the ribbon folding up and nothing else** (Janriz's note). Athena, the crawler (rock, fairing, relay, tug) and the moons were visible until G1+0.6, and the crawler sat mid-frame from G1+0.65 to G1+1.15. They're now hidden (vis 0, not dimmed) at F1+0.1, while out of frame: from F1 on, nothing of LogoLife's is in frame at either size. Home is hidden at G1−1.0, and the route and spur are gone between G1−0.3 and G1+0.1, before the camera draws back. Their keys go dark through their own modules (the rig contract). A frame-by-frame probe across the pull-out (`probe-pullout.js`) finds only the ribbon and his star's own billboard. The ribbon is gone by G1+1.7, before Contact is read.
- **GPU cost cut by more than half.**
  - Every surface used to be transparent (for the fade), so it was drawn far to near with nothing skipped, and two-sided ones twice. Now each draws opaque while whole and turns transparent only while fading. Both programs are compiled in `warm`, so no first-sight hitch.
  - The metal takes only his star's key (`lightBy(m, own)`), not the rig's dark keys.
  - Cards out of frame are culled.
  - Result: GPU at the reading spots went from 8.9–12.7 to 3.7–6.8 ms at 1440, and from 4.1–4.6 to 2.6–3.0 ms at 390. Draw calls went from 43/64/114/70 to 30/44/94/50. The ribbon's own cost is now about 1.6 ms at 1440 (it was about 4.3).
- **The pull-out hitch is gone.** The light rig (43) had already fixed it. A 3 s and a 1.5 s scroll from F0−0.4 to the end, first pass included, runs at 60 fps at 1440 and 390, worst frame 18.7 ms, and nothing recompiles (89 programs, steady).
- **The screenshots load after the wake**, one after another in the ribbon's order. Each goes to the GPU as it arrives (`whenUnlocked`, `lib/wake/lock.ts`).
- **Reduced motion was broken, now fixed.** Its stills showed the cards turned edge-on, because the ribbon faced the camera's last pose: the film poses the camera only when it draws. The stage now hands the ribbon the posed eye, and his star's direction in view space is set as each part draws. A still taken before its screenshot arrived is retaken: `stillsStale()` / `onStillsStale()` in `lib/film/stage.ts`, which the runtime listens to.
- **On a phone the text zone starts higher** (0.40–0.47 of the height from the bottom), so the canister dims where it passes behind the title and the card above stays whole.
- **Unchanged:** the own-* block ids and the ribbon (63's cues), the fold-back at G1+0.3 and the path's removal (43), the bracketed real-HTML links, and the pointer subjects. `ribbon.ts` reads `REC` from `swarm.ts`. Content is untouched, so no SEO/GEO sync row fires (`llms.txt` matches `personal-projects.ts`).
- **Draw calls are not merged further.** Instancing the seven unfolded cards would save about 14 calls, but the cost was fill and overdraw, not calls. Recorded as not worth the complexity at these numbers.
- **Contrast:** every reading spot passes. The lowest is PulseVR's title at 390, at 10.6.
- **Tests:** `ribbon-turn.test.ts` was red first (5 failing against a stub), then green. `stage.test.ts` and `keyTimes` came during refactor.
  - **Refactor candidates:** the spot-key splicing inline in `stage.ts`, extracted to `keyTimes` and tested; the `finish`/`own` material wrappers, kept; the per-material `fadeTo`, kept; the ribbon's `__ribbon` dev hook, kept (the scripts need it).
  - Results: vitest over `lib/voyage` and `lib/film` 344/344; `tsc` 0; eslint 0 on the touched files.

**For Janriz to look at:**
- `rec/ribbon-390.mp4` and `rec/ribbon-1440.mp4`: the card square to you at each project, and the pull-out with only the ribbon folding.
- `pullout/sheet-1440.png` and `pullout/sheet-390.png`: the pull-out every 0.15 screens.
- Whether the camera easing onto each project's card near its reading spot reads well, or feels like a nudge.
- The project links carry `rel="noopener me"` (`Runway.tsx`, shared with Contact). "me" claims the demo site is his identity; for project links plain `noopener` is more correct. Left as is; it's a one-line change if he agrees.


---

<a id="t43"></a>

## 43 · Build Contact

*task · resolved · blocked by 34, 59*

Built 2026-10-04 on the real site, to Janriz's 2026-10-04 brief over *Finalize Contact*. Evidence: [`research/contact-build/`](../research/contact-build/README.md) (MP4s at 1440 and 390, stills at every 0.3 screens of the pull-out and at the reading spot, film and reduced motion).

- **The trajectory is gone at Contact** (Janriz's change 1): the route (its ticks, the gates' burns, the launch mark) and the spur fade out over G1 + 0.1 to G1 + 0.7 as the pull-out starts, before they could come into frame. Only the bodies shrink away, and Contact is read against stars alone. `route.far` is no longer raised. This replaces *Finalize Contact*'s "whole route" pull-out.
- **Drag-to-turn at Contact is spatial** (change 2): yaw and pitch, with the pitch clamped to 0.5 rad either side of the rest and the heavy coast on both axes. Ticket 67 built it once for the hero and Contact (`lib/film/turn.ts`, `hand.ts`, stage `seek()`). Here it's checked at Contact: a drag moved az 0.71 → 2.18 and el 0.18 → 0.68 (the clamp), and it coasts on both axes (recording).
- **The pull-out's hitches are gone:** 60.0 fps, worst frame 17.8 ms, at 1440 and 390, first pass included, played in 3 s and in 1.5 s. They were 150, 134, 101 and 83 ms frames.
  - **Cause:** Athena's, the crawler's and the ribbon's key lights lived in their bodies' roots, so hiding a body hid its light. The light count changed and three recompiled every lit material in view (23 programs, then 13).
  - **Fix:** `lib/voyage/rig.ts` (tested) keeps the lights in the scene, dark while their body is hidden, so the film compiles about 74 programs once instead of 157 along the way. It also skips a dark light's shadow pass; a body skips its own with `key.userData.shadowOff`. This holds across the whole film: ticket 36 saw its 165 ms frames at the peel go too.
  - **Cost:** +0.6 ms GPU mean at 1440's reading spots (6.3 → 6.9 ms; worst 12.6 ms, unchanged), nothing measurable at 390.
  - **The last dropped frame** (33 ms at G1 + 1.97) was the route map's SVG re-rendering; ticket 45 memoised it.
- **The title rides the beacon off its spikes** (changed from the storyboard): the Flare's level and upright spikes crossed "CONTACT". On a phone the title was clamped back over the star (7 px from it). A new title side, `star` (`lib/film/place.ts`, tested), sets it above and right of the star, or above and left where the frame can't hold it.
- **AA at the reading spot** (the text's colour against the sky behind it): the title 5.3:1 (1440) and 12.1:1 (390), the lines 13.1:1, the clock's line 7.7:1, the links 18.7:1 and up. This holds in reduced motion too.
- **Kept as *Finalize Contact* settled them:** the Flare beacon, the live `<time>` clock and the replay (lands at t 0 with `#sec-hero`, checked). Phones: the sky in the top half, the lines below, "Back to the start" clear of the bottom. Reduced motion: the still sky with the beacon lit, the title riding it.
- **Tests:** `rig.test.ts` (5) and `place.test.ts`'s `star` cases, each red first, then green. Rig, place, replay, turn and script: 83 passed. `tsc` exit 0. **Refactor:** the candidates were the rig's unused `lights` field (removed), the `__rig` dev hook in `stage.ts` (kept: the GPU-cost script needs it), and the now-unused `right` title side (kept: it's engine vocabulary, tested, and costs nothing).

**For Janriz to look at:**
- `rec/contact-1440.mp4`: the pull-out with no path, then the drag on both axes and its coast.
- The title above-right of the beacon (`spots/sheet-1440.png`), and above-left of it on a phone (`spots/sheet-390.png`).
- Whether a drag at Contact should carry its turn back to the hero after "Back to the start". Today it does, as the yaw already did: the replay lands on the turned sky (`spots/1440-replayed.png`).

- 2026-10-04 — From [Build the record's flight and the ribbon](build.md#t42) (resolved), per Janriz ("seeing the crawler as we pull out is off putting"): the pull-out's timings in `stage.ts` changed. Athena, the crawler and their moons are hidden (vis 0, not dimmed) at F1+0.1, home at G1−1.0, and the route and spur are gone over G1−0.3 to G1+0.1, all while out of frame. They used to fade at G1+0.6 and G1+0.1. Only the ribbon folds in frame on the way out. The ribbon's fold-back at G1+0.3 and its fade at G1+1.3 are unchanged. Measured: 60 fps through the pull-out at 1440 and 390, first pass included.


---

<a id="t44"></a>

## 44 · Build the pointer layer

*task · resolved · blocked by 19, 34, 49, 60*

Resolved 2026-10-04. The hand was already in its final form from *Finalize the pointer layer*. This ticket adds the twinkle, closes 60's leftovers, takes the layer's frame cost out of layout, and evidences it at 1440, 390 and 844 × 390.

**What was built**
- **A hovered star twinkles** as a real star scintillates through air (`lib/universe/sky.ts`, the star shader).
  - Its light is log-normal about its mean, from three bands of smooth noise, most of the flicker between 3 and 14 Hz.
  - Red and blue run 35 ms behind and ahead of green (the air's dispersion), so it flashes faintly red and blue at the edges.
  - Its brighter instants throw its spikes further, even on a faint star that has no spikes at rest.
- **The twinkle's envelope follows its hover sound** (`lib/film/twinkle.ts`, tested).
  - It flares in 60 ms, as hard as the pointer was fast: 0.45 for a slow pointer, 1 at 1500 px/s (the shimmer's own scale).
  - It settles over the shimmer's 0.9 s to a steady twinkle (0.5) while the pointer stays on the star, then dies away over 0.45 s once the pointer leaves.
  - It follows the raw star under the pointer, as the sound does, so a sweep (at Contact too, before the label's dwell) leaves a trail of stars dying away.
  - A tapped star on a phone flares as if struck, for its label's 1.5 s.
  - It rides the state texture's free alpha channel, 0 everywhere else: no new draw, no recompile.
- **Reduced motion:** the hand draws the hovered star's twinkle held still, as a cross of spikes caught at a bright instant, inside its ring. The sky's clock stops and its twinkle is forced to 0.
- **The ask chips sound:** `ui-hover` as the chip comes onto a new subject (not while he answers), and `ui-click` when a chip, a tap on a subject or a block's "Ask Tycho about …" button asks. Stars keep their own sounds. Dragging has no sound.
- **The moons can be asked about** by name ("Ask about the Counselor Dashboard"), only while the block naming them is in play. The ribbon's screenshots were already registered by 42.
- **Where the sky answers the hand now lives in the script** (60's leftover): `script.sky` = `{ stars, contact, drag }` windows. The hand reads them, and the stage's `spinsLive` reads `sky.drag`, so the drag and the sky's own turn can't drift apart.
- **The keyboard's button** carries the chip's plate. A button that asked keeps "Answering about …" pinned on its subject. A question asked elsewhere never pins a stale subject: the hand checks `answeringFor()`.
- **`[ DRAG TO TURN ]` waits** until the pointer has rested off every star and subject for 400 ms. In the first recording, a sweep across the hero's stars flashed it between every star.
- **Frame cost:**
  - The label's, chip's and pinned chip's sizes are measured only when their words change (they were read every frame, after the runtime's writes, which forced a layout every frame while one showed).
  - Stars are projected only while one could be under the pointer, labelled or pinned.
  - The brackets' tweens start at most once a frame, not on every pointer event.

**What changed from 60's form, and why**
- The chip's plate went from 0.5 to 0.62. At 0.5 the chip measured 3.6:1 over a white ribbon screenshot (Mercado) and 4.2:1 pinned over a lit gate with the route behind it. At 0.62 the same frames measure 5.5:1 and 5.2:1.

**Measured** (the pointer swept through the stars once a frame for 5 s, then resting 2 s, at the hero, round home, the road's start and Contact):
- **1440:** 60 fps, 0 frames over 20 ms, p95 17.6 ms. Sky GPU 3.5–6.4 ms mean with the hand, against 3.4–6.2 ms with `?nohand` (within the run-to-run noise).
- **390 (mouse):** 60 fps, 0 frames over 20 ms. The GPU means were within the same noise.
- Up to 10 stars twinkled at once during a sweep.
- **Tests:** `twinkle.test.ts` 7, `hand.test.ts` (`within`) 1, `voyage/hand.test.ts` 7, each red first, for the right reason.
  - lib/film, lib/voyage and lib/universe: 508 pass. The 1 failure is an old prototype under `.scratch`.
  - eslint is clean on these files. tsc's only errors are in other tickets' in-progress files (`ribbon-turn.test.ts`, `subjects.ts`).
- **Refactor verdicts:**
  - *Split the askables from their screen hits:* done. It's what made them testable.
  - *The twinkle's `level` as one function with a hovered and a leaving branch:* kept (short, one shape).
  - *Share the 1500 px/s "fast pointer" with `lib/audio/hand-sound.ts`:* kept apart. That file is the score's, and the twinkle's floor differs from the sound's.
  - *The bracket tweens out of `pointermove`, into the frame:* done.

**For Janriz to look at**
1. **The twinkle** (`out/hand-wide.mp4`, 0–10 s: the star held, then the sweep).
   - Is the steady twinkle strong enough under the hover ring? It's 0.5, at about ±35% light.
   - Is the colour flicker (red and blue a beat apart) right, or should it be white only?
2. **Reduced motion's held twinkle** (`out/shots/still-star-hero.png`): a cross of spikes in the ring.
3. **The plate at 0.62:** a touch heavier over dark space, for 4.5:1 over white screenshots.
4. **Moons as subjects:** `[ ASK ABOUT THE COUNSELOR DASHBOARD ]`.

- 2026-10-04 — From *Light the sky from the chat* (70): sky.ts gained a second per-star pair for the chat, `flare` and `read` (the texture packs max(heat, flare), max(lit, read)); `light()`/`clearLit()` take `{ inPlace }`. Your twinkle channel and shader are untouched.


---

<a id="t45"></a>

## 45 · Build the route map

*task · resolved · blocked by 34, 61*

Built 2026-10-04 on the `redesign` branch, uncommitted. Most of the map was already built in *Finalize the route map*'s look; this round wired its links to Janriz's navigation rules, fixed what the finish bar turned up, and measured it. Evidence is in [`research/route-map-build/`](../research/route-map-build/): `out/route-map-{1440,390}.mp4`, `shots/{1440,390}/` (the map's corner at all 40 reading spots), `spots-{1440,390}.json`, and the scripts (`spots.js`, `overlap.js`, `cost.js`, `record.js`).

- **Every click goes through `goToSection`** (`lib/routemap/go.ts`, test-first, 12 cases), whose rules come from Janriz's 2026-10-04 brief:
  - **Another section warps** to that section's first reading spot. The warp is one function, `warpTo(sec, t, { reduced })` in `lib/film/warp.ts`, which glides for now. *Build the warp* swaps its body, and nothing else changes.
  - **Start replays,** as "Back to the start" does. The replay can now be started from code (`start(href)` in `lib/film/replay.ts`, ok'd by *Build Contact*, with a test). The map's Start link no longer carries `data-back`.
  - **A link to the section you're in** doesn't warp. It glides back to that section's first reading spot, with no trip in miniature.
  - **Start while you're still in the opening** follows the same rule: it glides back to the start, without the black. *For Janriz to confirm.*
  - **Back stays honest:** a warp or glide saves where you were and pushes the section's address, as the deep links do. The three copies of that code are now one helper, `pushDeepLink` in `lib/scroll/deep-links.ts` (Refactor, below).
  - **Left alone:** a modified click (a new tab) and the plain page's links go to the browser and the deep links.
- **The spur on the miniature** is now drawn as the look back draws it: it leaves the road on its tangent and curls once round Athena in her capture orbit. It's ported into the chart without three.js, so the map stays in the first-paint HTML, and a test pins it to `spurPath` within 0.002 of the chart's width. While Athena is read, "you are here" sits on her orbit.
- **Contrast of the names, at all 40 reading spots** (the worst case: the 95th-percentile brightest background pixel under each name):
  - **At rest:** bright bodies crossing the corner (the pipeline's longerons, a slab's rim) took the name down to 2.0:1. The names now carry a map's halo, a tight dark edge round each letter. The lowest is now **5.15:1 at 1440 and 7.0:1 on the pill at 390.**
  - **Open:** the road's hairline and the mast cut through the grown names (down to 1.1:1). Each grown name now sits on the film's faint plate, the one the chips and the gates' names use. The lowest is now **4.82:1.**
- **`ROUTE_MAP_CLEAR`** now matches the measured map:
  - **Wide screens:** at rest the map reaches 209 px in from the right edge (its longest name, "Projects"), so riding titles keep **222 px** (it was 150).
  - **Phones:** the pill reaches 52 px down, so titles keep 70 px from the top (unchanged).
  - **Checked:** no title, label or chip lands under the map at any reading spot, at 1440 or 390 (`overlap.js`).
- **Sound** (asked by *Finalize the score*): hovering a link plays `ui-hover`, and a link or the pill plays `ui-click`. Both are silent until the wake and while the sound is off.
- **A frame drop fixed** (found by *Build Contact*): each section change re-rendered every star in all three maps, a 47 ms React run on the pull-out in development. `MapSvg` is now memoised. The longest React run there is 2.1 ms.
- **E2E** (`tests/e2e/routemap.spec.ts`, 10 cases): rest, hover, focus order and Escape; a warp with Back; the same-section glide; Start replaying; Start in the opening; the pill's 44-px rows, Escape returning focus to it and a tap outside folding it; a row taken on a phone.
- **Measured:**
  - **Frame cost:** a fast scroll through Work (12 screens in 3 s, two passes) costs the same with the map shown or hidden: a 16.6–16.9 ms mean and a 17.2–18.2 ms p95 at 1440 and 390, so 60 fps.
  - **Recordings:** both play at a median of 16.7 ms a frame.
- **Tests:** 84 unit (the map, the replay, the deep links, placement), tsc, lint, and 10 e2e all pass.
- **TDD:** go.ts, replay `start()` and the chart's spur were each red (for the expected reason), then green.
- **Refactor, candidates and verdicts:**
  - the history save-and-push in three places: **extracted** to `pushDeepLink`;
  - the chart's spur duplicating `spurPath`'s maths: **keep**, because the chart must stay three-free and a test pins the copy;
  - the trip setup inline in the map's warp leg: **keep**, until *Build the warp* drives the trip.
- **Changed from the storyboard:** nothing in the map's form.

**For Janriz to look at:**
- `out/route-map-1440.mp4`: Projects warps (still the glide), Projects again from Athena glides back to its first spot, and Start goes black and comes back.
- `out/route-map-390.mp4`: the pill, its sheet, and a row taken.
- **The faint plates under the grown names:** a legibility fix in the film's own vocabulary. Say if they read too boxy.
- **Start while still in the opening** glides back instead of replaying.

**Left for others:** the warp itself, and the trip in miniature following it, are *Build the warp*'s (comment there).

- 2026-10-04 — From [Build the look back and the spur](build.md#t38) (resolved): `spurPath` and the orbit (2.9 radii, 55°) are unchanged, so the map's spur stays in sync (`chart.test.ts` passes). Only how the spur is drawn changed (it dims over Athena and behind text).

- 2026-10-04 — From *Light the sky from the chat* (70): RouteMap's miniature mirrors max(lit, read) and max(heat, flare), so the chat's stars show on it too (one line).

- 2026-10-05 — **Links land on a section's first entry (Janriz: "just align the section start on navigation on the 1st entries").** The intros stay in the film, and the scroll still passes them. A link, a warp (the map's, or Tycho's `scroll_to`) or a `#sec-…` deep link to Work lands on LogoLife (8.24) instead of Work's intro (7.26), and Projects lands on Athena (22.53) instead of its intro (20.45). Projects' intro had landed mid-flight on the spur, with nothing to look at.
  - **How:** both intros carry `intro: true` in the script. `layRunway` gives each section a `land`, its first block that isn't an intro. The section's `data-spot` is that, and `data-top` is where the section starts, which is what `sectionHere` reads. A link's warp focuses the heading of the block it landed on: on the intro's heading, the film's focus glide would pull back to the intro.
  - **Plain page:** unchanged. A deep link scrolls to the section element, so it still opens on the "Work" heading.
  - **Checks:** vitest repo 754/754, tsc 0, eslint 0; e2e routemap/warp/voyage/wake 34/34 against :3000. One voyage test failed once on a cold first load (it reads `__film` before the film exists) and passed on a rerun; it's an older race, not this change.

- 2026-10-05 — **The fold plays the opening backwards** (Janriz: the lines stayed until the map had shrunk, then vanished). The names fade, then each leader line draws back into its mark, last line first, and the lines are gone by 0.2 s. The dots fade, and only then does the map shrink (0.18 to 0.48 s). Each open or fold now kills the one before it: until now, coming back mid-fold let the old fold's last step strip the reopened map of its names and lines. Two new e2e tests cover both; routemap 12/12, tsc 0, eslint 0. Frames are in `research/routemap-fold/fold-sheet.png`.

- 2026-10-05 — **Alt-tab no longer opens the map** (Janriz). Coming back to the window, the browser gives focus back to the link that had it, and that focus opened the map. That one focus is now ignored: the first focus after the window comes back, until the visitor next presses a key or the pointer. Tab still opens it. New e2e test; routemap 13/13.


---

<a id="t46"></a>

## 46 · Build the wake-up

*task · resolved · blocked by 19, 24, 35, 49, 62*

Built 2026-10-04 as *Finalize the wake-up* settled it, with Janriz's one change: the wake button is the bracket. It plays in production now on every load in a person's browser (an automated one only with `?wake=on`; `?wake=off` skips it). Evidence: `research/wake-build/` (MP4s in `recording/`, stills in `shots/`, the numbers in `p-*.txt`, scripts `run.js`, `record.js` and `stall.js`).

**What was built**
- **Mounted in production.** `<WakeUp />` moved from the dev-only line in `Voyage.tsx` to the top of `app/page.tsx`, so its loader is the first thing in the page. Its head script (`lib/wake/script.ts`) runs in `<head>` right after the tier script and marks `html.wake` before first paint.
- **The loader:** black, the name in Jost capitals, a small count of the real load, the sweep at 100. The count is now a tested module (`lib/wake/count.ts`): nine real milestones, at most a full count in 0.8 s, never backwards, and a polite status every 25 %.
- **The charge-up and the doze,** as 62 has them (low key, the camera coming round and in, the band a segment every 0.42 s). His rig is reached through `currentRig()` and the sky through `onSky()`, so it works in production, not only through the dev-only window hooks.
- **The wake button:** a bare `[ WAKE ME ]` in DM Mono capitals at 13 px, with the headphones line under it. The brackets spread with the pointer's speed, stand a little open on hover or focus, and close on the words at the wake. It's the first tab stop.
- **The gate** (`lib/wake/gate.ts`, tested) decides what each input does in each phase:
  - a click, a tap, Enter or Space wakes him once he dozes. Esc never does;
  - until he's awake, the wheel, a touch's drag and the scrolling keys do nothing;
  - no click or pointer reaches the page underneath, so the hand's stars can't be tapped through the wake.
- **No chat or stars before the wake.** `#runway` is `inert` until the click. `#tycho`'s keyboard keys are hidden, and the hand and route map wait until he has landed (the route map then fades in). This is the lock *Build the bubble* left open.
- **Deep links and a reload's place land after the wake** (`lib/wake/lock.ts`, tested). The page is held at the top during the wake-up. `SmoothScroll` lands the hash and the film runtime restores a reload's place on `whenUnlocked`, so the link lands as the sky comes up.
- **The 10 s fallback:** if the 3D fails, or is still loading 10 s after navigation:
  - the tier goes plain under the loader, and `Universe` now cancels a load that arrives after that;
  - Tycho turns flat (`Tycho.tsx`'s `plain` follows `onTier`);
  - the button shows on the loader, and the wake fades it onto the plain page with the flat Tycho in his corner, who greets.
- **Reduced motion:** the name shows whole, the charge steps, and every move is a fade of 0.3 s or less. The film's stills are hidden on the stage too: before this, the sky showed behind him.
- **Takes:** `wload`, `wlook`, `wcta` and `wpace` are gone from `takes.ts` along with their code paths, and Trionn's loader with them. `wake` (on/off), `tycho` (the probe is kept) and the `snd*` takes stay.

**Changed from the finalization, and why**
- **The bracket instead of Edolus's white button,** on Janriz's word (ADR 0005's amendment now says so).
- **The name is in the loader from first paint, faint (9 % ink), and types in bright over itself.** When it typed in from nothing, LCP was the headphones line at 8.5 s: hidden letters don't count, and that line was the largest thing painted before the click. Now LCP is the loader's first paint.
- **Tycho's stage canvas is 1.22× the square he fills, with the camera pulled back to match.** He's the same size, but the camera coming in from below no longer cuts his antenna off at the top.
- **On a phone the button sits just under his feet,** not at 86 % down, which left a gap of about 150 px. Desktop keeps 86 %.
- **`lib/wake/drawing.ts` stays.** *Build the bubble*'s flat Tycho is drawn from it.

**Measured** on a production build (`next start`), each a cold browser context, with ANGLE on Metal:

| | LCP (loader) | load done | button | charge frames > 20 ms | wake frames > 20 ms |
|---|---|---|---|---|---|
| 1440 | 0.28 s | 2.7 s | 8.4 s | 1 of 342 (33 ms) | 0 of 180 |
| 390 | 0.23 s | 2.6 s | 8.3 s | 0 of 342 | 0 of 180 |
| 390, 4× CPU, 4 Mbit/s, 150 ms | 0.80 s | 11.0 s | 16.7 s | 0 of 343 | 1 (the click's own frame, 48 ms) |

- p95 is 18.5 ms everywhere: 60 fps holds through the charge and the wake.
- A screenshot taken during a run stalls a frame for up to 400 ms. The frame numbers above come from runs without screenshots.
- Tests: unit tests on the count, the gate and the lock. A new e2e spec, `tests/e2e/wake.spec.ts` (9 tests), covers the lock, click, tap, Enter, Space, not Esc, deep links, the 10 s fallback, failed 3D and reduced motion. The full e2e suite (48 tests) passes, and tsc and eslint are clean.
- **Refactor:** I weighed three candidates.
  - Splitting `WakeUp.run` into loader, charge and wake modules: kept as one. It's a single timeline, and splitting it would scatter the phase it shares.
  - Folding `stallDue` into `respond`: kept apart. One answers an input, the other is a clock.
  - Moving the button's placement maths into CSS: no. It depends on which phase he's in.

**For Janriz to look at**
1. `recording/wake-1440.mp4`, `wake-390.mp4` and `wake-1440-still.mp4`. Is the faint name in the loader acceptable?
2. **The throttled phone's load finishes at about 9.8 s, close to the 10 s fallback.** A slower phone falls to the plain page. The ticket's "everything past the first scene loads after the wake" isn't done: `createVoyageStage` still builds every scene before the universe is ready. Building only the first scene before ready would cut this, but it needs `stage.ts`.
3. On a phone, the greeting bubble covers the hero's lockup, since the bubble spans the width above him (*Build the bubble*'s placement).
4. The fallback, `shots/1440-stall-button.png` and `1440-stall-woken.png`: the bracket on the black loader, then the plain page.

- 2026-10-04 — **From [Score the voyage](build.md#t47) (resolved):** Janriz picked the headphones line "Turns the sound on · best with headphones", so the `sndphones` take is retired. `lib/wake/script.ts` no longer writes any `data-*` take (it had only that one), and `WakeUp.tsx`'s `PHONES` is that one string (the `TAKES` import is gone).


---

<a id="t47"></a>

## 47 · Score the voyage

*task · resolved · blocked by 14, 34, 48, 63*

Resolved 2026-10-04 (AFK; Janriz's ear is the last check). The voyage plays the A2 score and every sound effect on 63's list, end to end on the real site. The work was finishing and verifying: 63 had made the sounds, and this ticket checked the hooks, brought memory down and settled the rest. Evidence is in [research/score-build/](../research/score-build/).

**The score and the toggle, as they stand.** The score is A2 (Surge XT rendered offline, D minor Dorian, 78 BPM, six stems), mixed per part and following speed and the chat (*Finalize the score*). The toggle is the bracketed DM Mono chip bottom left with the `trace` hairline of the real output. The headphones line under `[ WAKE ME ]` reads "Turns the sound on · best with headphones". Janriz picked both, and the `sndtoggle` and `sndphones` takes are retired (`takes.ts`, `lib/wake/script.ts`, `WakeUp.tsx`, `SoundToggle.tsx`).

**What changed:**
- **Decoded memory** (`lib/audio/memory.ts`, the engine). It was about 98 MB desktop and 49 MB phone with everything loaded.
  - Notes and small sounds (chirp grains, emotes, UI ticks, relay, toggle) decode mono on every tier. The notes were dual-mono already, and the small sounds are narrow (measured side/mid).
  - Each one-shot is cut where it falls below −60 dBFS (`trimTail`, at export): 109 s became 95 s.
  - Scene changes are held only 3 screens before to ½ a screen after their stretch (`keep`, `heldScenes`).
  - The thinking layer loads when Tycho first thinks.
  - A muted visitor's note requests wait for the sound to come on (they used to download 2 MB of bell notes).
  - **Result at the busiest moment, at 48 kHz: 71.5 MB on a desktop and 40.1 MB on a phone**, with Tycho thinking. The page measured 71.5 MB live, and 60.5 MB on a desktop and 32 MB on a phone without a chat.
  - **The original 64/32 MB can't hold everything without cutting the score:** its stems alone are 56/28 MB, and they're wide (side/mid −2 to −12 dB), so mono stems on a desktop would be heard. ADR 0006 is amended: 72/41 MB for everything, with the stems still inside 64/32. A test reads the real manifests and fails an export that breaks either.
- **The replay's dip.** Under "Back to the start" the score sinks to −14 dB with the 0.6 s fade to black and comes back over the 1 s fade in. It never stops, and one-shots aren't dipped (`dip()` on the score bus; `createReplay`'s `dip` dep).
- **The warp, off `onWarp`'s legs** (`lib/audio/warp-sound.ts`; the play calls left `lib/film/warp.ts`).
  - The riser starts so its swell (3.3 s in) lands on the jump.
  - A question's warp with a flare now waits up to 1.8 s before rising, where it used to peak 1.8 s early and leave a silent gap before the arrival.
  - From the hero, a link warp starts 0.66 s into the riser.
  - Hurrying the warp cuts the riser, and the arrival plays as the destination opens.
  - Under reduced motion the crossfade gets the arrival alone, at half level.
- **A −1 dB ceiling after the limiter.** The climax reached 0.0 dBFS in the first recording (31 samples above −0.1).
- **A bug fixed:** the rig played `emote-allgood`, lowercased, so "all good" was silent. Names now come from `lib/audio/hooks.ts` (`emoteSound`), and a test checks every name the page plays has a file.
- **The renderer has a home: `scripts/audio/render/`** (score.py, shots.py and their modules, requirements.txt).
  - `fetch.py` fetches every source into `~/.cache/portfolio-v2-audio` (or `$AUDIO_SOURCES`). `sources.json` lists them with their licences: Surge XT 1.3.4, the Artemis II pad recording (cut 7:25 + 120 s), Jack Lyons Hall's response, 11 Freesound CC0 recordings and the 11 soft celesta notes.
  - `pnpm audio:export --render score|shots` renders and exports. A bare run still refuses.
  - Verified: the fetch reproduced every Freesound and celesta file byte-identical, and the hall's response sample-identical. A render from the repo gave the same files for every recorded sound. The Surge-made ones differ sample by sample, since Surge starts its oscillators at random phases, but they sound the same.
  - The public files are the WAVs Janriz heard (from `prototypes/score/out/fx`), trimmed. Surge's download and the NASA cut weren't re-fetched here: their code paths ran only against the existing copies.
- **Fixed in passing:** a lint error in the dev-only Mixer (setState in an effect).

**Every hook, checked end to end:** headless Chromium on the M5 GPU at 1280×800, the chat stood in for by canned streams, and every `play()` and note logged. In `listen-1280.log.json` every row fired and sounded:
- the wake's relay and chirp, and greet;
- celesta at the hero's first frame (5 notes) and at Contact (39), and a clicked star at Contact (strong, and it asks);
- bells on a hovered star just past the first frame (9);
- ui-hover (23) on the route map and the hand's chips, ui-click (2), ui-open (4), ui-fold (4);
- Tycho thinking, the chirp grains (21) and star-lit (5);
- dive, peel, dock ×4, slide ×13, spur, open, fairing, climax, ribbon and pullout;
- toggle ×2, a link warp and a question warp (each with its arrival), dip down and up, emote-point, and 66 other emotes.

Athena's `open` sounded a second time as the question warp landed on her, since the landing glide plays that stretch in.

Hook probes (`hooks.js`, `hooks2.js`) checked the keyboard's ask button → question warp → point, and a click on a star at Contact.

**Tiers:**
- Phones load the mono stems (`webm mono`, 5 stems until a chat).
- Under reduced motion (`reduced.js`, tier `still`) the cues fire as the stills change (dive, peel, dock ×4, slide ×13, spur), no emotes play (he doesn't move), and the warp's crossfade plays the soft arrival.
- A hidden tab pausing is covered by 48's unit tests only: headless never hides a page.

**Frame rate, sound on against off** (`perf.js`: the whole film there and back at 4 screens/s, 2 runs each). At 1440 the mean frame was 16.66 ms either way, p95 17.2–17.4 on and 17.5–17.6 off. At 390 it was 16.66, p95 17.2–17.3 on and 17.3 off. No frame over 20 ms in any run: the sound costs nothing measurable.

**Listening pass:** `research/score-build/out/listen-1280.mp4` (H.264 + AAC 192k, 3:45). It runs the wake, the hero's sky, About with the route map, an ask at LogoLife, the whole voyage at about half a screen a second, Contact's instrument and a star click, the toggle off and on, a link warp, "Back to the start" and a question warp from the hero. Output peak −1.45 dBFS, RMS −17.2 dBFS. `listen-1280.wave.png` is its waveform and `listen-1280.sheet.png` 16 frames.

**Test-first:** Red → Green confirmed for each of these:
- the engine's mono notes and small sounds, scene holding, thinking on demand, resident bytes, dip, `from` offset, ceiling and deferred `prepare`;
- `heldScenes`, `shotChannels`, `peakDecoded` and the budget;
- the scene holder, `trimTail`, `warpRise` and `followWarp`, the replay's dip, the hook names and the retired takes.

One exception: `memory.ts`'s first two functions were written in the engine's green step, before their own tests (which then caught a wrong expectation in the test, not the code). 159 tests in the touched suites, tsc clean, eslint clean on the touched files.

**Refactor verdicts:**
- engine's hold/let-go/`onDemand` → keep;
- `prepare` waiting for the sound → simplified to one `whenOn` promise;
- `stats().resident` computed on read → keep (development only);
- the replay's dip calls beside the veil's fades → keep;
- `warpRise` as a pure function → keep;
- callers' `"ui-hover"` literals moved onto `UI_SOUNDS` → declined (it would touch three other tickets' files, and the contract test covers the names);
- export's `renderWithPython` → keep.

**iPhone QA (for the QA plan's real-device pass; Janriz has none):**
1. The wake's tap starts sound: the relay, his chirp, then the bed fading in over 2 s. No sound before the tap.
2. With the Silent switch on, the score and every effect are silent (the `ambient` session). Off, they play. The visitor's own music keeps playing under the site.
3. Opus/WebM decodes in iOS Safari (`__sound.stats().format` in a dev build reads `webm mono`). If not, the MP3 fallback plays (`mp3 mono`), with no gap at the loop seams of the bed (37 s), the pulse (30.8 s) or the drone (11 s).
4. Lock the phone or switch apps mid-score, then come back. The score fades back in within a second. If it stays silent, `[ SOUND STUCK? RESTORE ]` appears and restores it.
5. A tap on a star at Contact plays its celesta note, then asks. A tap on the hero's first frame does the same. There's no note on a drag.
6. Scroll fast through Work: the docks and slides are cut short rather than ringing on, and there's no crackle.
7. A question's warp: the riser swells into the jump, then the arrival's boom and chord.
8. "Back to the start": the score dips under the black and comes back. It never cuts out.
9. Turn the sound off with the toggle, reload: the wake is silent, the headphones line is hidden, and the network panel shows no `/audio/` requests until the toggle is turned on.
10. Memory: Safari's Web Inspector (Timeline → Memory) stays near 40 MB of audio through the crawler with a chat open, and the tab isn't reloaded by iOS over a whole voyage.

**For Janriz to look at:**
- Listen to `listen-1280.mp4`, the whole voyage with its sound. Headphones are best.
- The budget call: everything now fits 72/41 MB, not the original 64/32, unless you'd rather lose stereo or length in the score.
- A question warp's riser now waits up to ~1.8 s and rises during the stars' flare. Is that right, or should something fill the pull-back?
- A fast scroll still cuts each scene change short (0.25 s fade), as you asked. Whether a fast pass should keep a short trace is still open from 63.

### Comments
- 2026-10-01 — From [Audio stack verdict](14-audio-stack-verdict.md) (resolved; ADR 0006):
  - **The score is code rendered to stems,** played sample-locked with a per-section mix table. The instrument, Tycho's chirp and emotes, and UI sounds are live. It runs on [Build the audio engine](build.md#t48), which this now waits on.
  - **Janriz's ear on the stand-in bed:**
    - no constant noise wash (the air layer's sweeping "swoosh" was unpleasant);
    - the section changes ease well;
    - the instrument's 16-voice cap is fine.
  - **Settled there,** so off this ticket's list: a mute is remembered, iOS's Silent switch is respected, a hidden tab pauses, phones hear mono stems, reduced motion leaves sound alone.
  - Still yours: the composition, the toggle's look and place, the headphones line, volumes, and whether scene-change sounds are rendered or live.
- 2026-10-01 — **Janriz's ear on the stand-in,** after the verdict:
  - **It isn't production sound.** In his words, "it sounds like a soundboard being mashed together… more like a 2d pixel video game rather than production-level sfx". Every layer was a raw oscillator (saw, square, triangle, sine) or filtered noise, which is what retro game chips play. So code is no longer the assumed source (ADR 0006 now leaves it here).
  - **Ask Tycho's sounds were drowned out by the score.** The duck was only −3 dB, and the chime and the thinking layer went through it too. The engine now ducks only the score's bus ([Build the audio engine](build.md#t48)). The volumes are still this ticket's.
  - **The drone was faint.** It sat at 0.07 and rose only with speed on the road.
- 2026-10-04 — From [Voice verdict](20-voice-verdict.md) (resolved; ADR 0010): **Tycho's voice is his chirps over the suit radio,** made to *Finalize the score*'s answer.
  - His emotes' sounds should sit in the same family: FM chirps through the radio. A servo whir may mark his turns and points.
  - The waking chirp at the wake-up should match.
- 2026-10-04 — From [Build the audio engine](build.md#t48) (resolved): **how the real score plugs in.**
  - Export the stems from the music tool as `<layer>.wav`, each exactly one loop long. Run `pnpm audio:export --wavs <dir>` (or `--score <module.js>` for a score written as code), which checks their seams and writes hashed files plus `lib/audio/stems.json`.
  - Retune the parts, levels, speed reactions and the chat's duck in `lib/audio/mix.ts`. The hero's layers (which load under the charge) are whatever the hero part sounds.
  - Add scene-change and emote one-shots with `define(name, shot)` (`sampleShot` for recordings), and give the instrument a voice with `instrument.use()` (`pluckVoice` is the stand-in; `sampleVoice` plays a recorded note).
  - The sound toggle's look and place are a stand-in in `components/sound/`.

- 2026-10-04 — **Janriz, orchestration brief:** **the voyage must have sound effects, not only the score**: Tycho's chirps and Quindar tones with the bubble, his emotes, UI sounds (route map hover/click, ask chips, bubble open/fold, sound toggle), scene changes (gate docking, monolith rise, Athena opening, the crawler's fairing, the ribbon paying out, the pull-out), the wake, the warp and the replay, and the instrument at Contact. Production sound, never chiptune. Timbres and volumes are *Finalize the score*'s (63) answer; this waits for 63.
- 2026-10-04 — From [Build the bubble](build.md#t49) (resolved): **the hook for Tycho's chirps and the Quindar tones is `lib/chat/talk.ts`.** `onTalk(fn)` hears every moment of his talking, in order and synchronously:
  - `ask` fires inside the asking click, tap or key, so unlock audio there;
  - `open` is the reply's first word, where the opening tone goes;
  - `sentence` carries `span`: its words' unit range, its text and `question`;
  - `show` carries `blocks` and `visible`, every frame a word shows;
  - `hush` is a tap that showed the rest, or a close mid-reply, after which the rest stays silent;
  - `done` is the reply shown in full, where the closing tone goes.

  Sentences come from `spansOf` in `lib/chat/sentences.ts`. Today `components/bubble/voice-link.ts` maps these events onto `voice/engine.ts` (`unlock`/`reset`, `update`, `stop`, `end`). Replace that link, not the bubble. The engine's own `sentencesOf` duplicates `spansOf` and can switch to it. The score's chat mix still comes from `currentSound()?.setChat(…)` in `Tycho.tsx` on each phase change (thinking → `submitted`, streaming → `streaming`, else `ready`). UI sounds for the bubble (open, fold, the log) aren't wired yet: the card's open and fold timelines are in `Tycho.tsx`'s layout effect on `isOpen`.
- 2026-10-04 — **From [Build the warp](build.md#t68)** (resolved): the warp's sound hooks are `currentSound()?.play("warp")` as it sets out (the handle is stopped if it's hurried at 4×) and `play("warp-arrive")` as the destination opens. A link's warp keeps the page 4.8 s: light travel from about 2.7 to 3.8 s, the hidden jump at about 3.3 s, arrival from about 3.8 to 4.8 s. A question's keeps it 7 s. For sound that follows speed, `onWarp(fn)` in lib/film/warp.ts tells each leg with the plan's times. 63 has the names.

- 2026-10-04 — From *Light the sky from the chat* (70): sound hooks: `star-lit` once per star as it flares (level = its brightness, 0.45..1, up to ~6 per search, 80 ms apart) in lib/chat/sky.ts, and `emote-point` from `rig.pointAt`.
- 2026-10-04 — From [Finalize the score](finalize.md#t63) (resolved; ADR 0006 amended): **the sound is settled, and most of it already plays on the site.**
  - The A2 score is in `lib/audio/stems.json`. All 32 one-shots, the celesta and the bell are in `public/audio/fx/` with `lib/audio/shots.json`. The film's cues are in `lib/audio/cues.ts` (cut short on a fast scroll), the hand's sounds in `lib/audio/hand-sound.ts`, and the levels in `lib/audio/levels.ts`. The sources and render scripts are in `.scratch/redesign/prototypes/score/`.
  - 63's Answer has a table giving the timbre, the moment and the level of every sound on this ticket's list.
  - What's left for this ticket:
    - bring decoded audio inside ADR 0006's budget (mono one-shots and notes, shorter tails);
    - the replay's dip under the black;
    - retime the warp for a question's 7 s;
    - check the hooks the builders call (emotes in the rig, ui-* on the route map, the ask chips and the bubble);
    - commit the renderer somewhere reproducible, or record that the scratchpad sources are needed to re-render;
    - the phone pass and the iPhone QA.
  - The `sndtoggle` and `sndphones` takes are still on the switcher. Take their first variants unless Janriz picks.
- 2026-10-04 — From 63: Janriz picked the toggle's `trace` and the headphones line's `sound` ("Turns the sound on · best with headphones"). Retire both takes and hardcode them: `lib/voyage/takes.ts` (sndtoggle, sndphones), `lib/wake/script.ts`, `components/wake/WakeUp.tsx`'s PHONES (and its `?? "best"` fallback), `components/sound/SoundToggle.tsx`.
- 2026-10-05 — **Janriz:** "I hate the wander sfx of Tycho. Let's just not do any sound when he moves", and "remove the star hover sound on the hero section. Leave it on Contact."
  - **Moving:** his flights (wander, keeping clear, home, the shoo's scoot, a flick) and a drag make no sound. The emotes he plays as he moves pass `{ quiet: true }` to `rig.emote` (`lib/tycho/roam.ts`: the takeoff's anticipate, the landing's settle or all good, the drag's flinch). The shake's reactions (flinch, notice, apologise, glance) still sound, since he plays them parked.
  - **Hero:** a hovered star makes no sound anywhere in the hero (before its scene's end, `HERO_END` in `components/voyage/Voyage.tsx`). Contact's instrument is unchanged, and so is the bell elsewhere. A star tapped on the hero's first frame still plays its note.
  - Checked on :3000, headless: two wanders and a drag-and-flick played nothing, 26 hovered hero stars played nothing, and the same sweep at Contact played 21 notes.


---

<a id="t48"></a>

## 48 · Build the audio engine

*task · resolved · blocked by 14*

2026-10-04. **The real site plays the stand-in score from the wake-up, and its mix follows the film's scene, its scroll speed and the chat.** It's checked headless on :3000 (Chromium with the GPU, audio muted at the output), on the `redesign` working tree, uncommitted.

**What's built:**
- **`lib/audio/engine.ts`.** One context; the graph is in its header.
  - Stems start on one grid time; a late stem joins in phase and fades in at its part's level.
  - The mix's targets are sent as `setTargetAtTime`, only on change.
  - Discrete fades are `rampTo` (`ramp.ts`), which pins the current value.
  - **The chat duck sits on the score's bus only.** The instrument, one-shots, Tycho's suit radio and the Quindar tones join after it, at `post`.
  - The toggle fades over 1 s, then suspends; the mute is remembered (`mute.ts`, key `jrz-sound-v1`).
  - A hidden tab fades over 0.25 s and suspends, then resumes and fades in over 0.6 s.
  - A restore is offered when the context won't resume or its clock is frozen (a 500 ms check).
  - Nothing schedules while the sound is off: in Chrome, a source started after a gesture resumes a suspended context.
- **The mix** (`mix.ts`). A part per scene, falling back to its section's: hero, home, road, athena, crawler, own, contact. Speed reactions on the road and at the crawler. Chat: `submitted` brings the thinking layer in and ducks to 0.72, `streaming` ducks to 0.88. The table is the stand-in's, for *Score the voyage* to retune.
- **The film follower** (`follow.ts`). The scene comes from the film's time; speed is the film clock's rate, full at 2.5 screens a second, sent past a 0.04 step.
- **Loading.** The hero's layers come from the table (for the stand-in, only the pad, since the air layer is out). They load under the charge as a `sound` milestone in the wake-up's count, and decode before the click. The rest load after the wake. The format comes from `canPlayType` (`format.ts`); MP3 is used when Opus fails to decode, and kept for the rest. Phones (`pointer: coarse`) get mono.
- **A visitor who turned the sound off** downloads nothing until they turn it on, and their wake leaves the context asleep.
- **The instrument and one-shots.** A 16-voice pool (`voices.ts`): the oldest is cut in 40 ms, and each note sounds at most every 100 ms. `instrument.use()` takes a synthesised voice or a recorded sample (`standin.ts`: `pluckVoice`, `sampleVoice`). `play(name)` / `define(name, shot)` handle one-shots (stand-ins: `wake`, `chime`; `sampleShot` for recordings).
- **Tycho's chirps** (`components/bubble/voice/engine.ts`) play on the engine's context, through its suit radio. They follow the toggle and the mute.
- **The pipeline:** `pnpm audio:export` (`scripts/export-audio.ts`, helpers in `scripts/audio/stems.ts`).
  - Its sources: code (`--score`, default `scripts/audio/standin-score.js`, rendered by `OfflineAudioContext` in headless Chromium, two cycles keeping the second) or WAVs (`--wavs <dir>`).
  - It checks every stem's length and seam (at most 4× an average step); a failure writes nothing.
  - It encodes Opus/WebM 64k/32k (constrained VBR) and MP3 128k/64k, bit-exact. Files are content-hashed into `public/audio/`, the manifest goes to `lib/audio/stems.json` (3.7 KB), and stale files are pruned.
  - **Chromium's offline render isn't bit-stable** for the stems with a large room send, so each stem's audio is fingerprinted (`scripts/audio/fingerprints.json`). A re-export that sounds the same keeps its files and names: three exports in a row gave identical names. The run takes about 9 s.
- **Wiring.**
  - `WakeUp.tsx`: the `sound` milestone, and `sound.wake()` in place of the stand-in chime (Janriz chose to wire it here).
  - `Voyage.tsx`: `followFilm` and `<SoundToggle />`.
  - `Tycho.tsx`: the bubble's phase goes to `setChat`.
  - `components/sound/SoundToggle.tsx`: a stand-in `[ SOUND ON ]` chip at the bottom left, with `[ SOUND STUCK? RESTORE ]`. Where there was no wake-up, the toggle is how sound comes on.
  - `next.config.ts`: `/audio/:path*` gets `public, max-age=31536000, immutable` (confirmed on :3000).
  - `AGENTS.md` gained the folders and a "One AudioContext" rule. `CONTEXT.md` gained **Stem** and **One-shot**.

**The numbers.** Desktop is 1440, Opus stereo, M5. The phone is throttled (4× CPU, 4 Mbit/s, 150 ms), Opus mono.
- **Bytes before the wake:** 202,600 (the pad, stereo), or 105,388 on the phone. A muted visitor: 0.
- **Decode time:** 33–36 ms for the hero's stem before the click (19 ms on the throttled phone), and 233–237 ms for all six.
- **Decoded memory:** 52.7 MB stereo and 26.4 MB mono for all six; the hero's stem alone is 8.8 MB.
- **All stems:** 1,186 KB Opus stereo and 603 KB mono, within ADR 0006's 1.5 MB / 0.75 MB and 64 / 32 MB.
- **Click → context running:** 37–38 ms.
- **Level per scene** (dBFS RMS): hero −27.3, About −21.5, Work −24.6, Athena −20.8, crawler −18.7, Contact −25.7.
- **The road at speed:** rate 1 → 1.49, drone 0.15 → 0.98, back to 0.15 when it settles.
- **Chat:** the duck went 1 → 0.72 → 0.88 and the thinking layer 0 → 1 → 0.
- **Toggle:** −18.7 dB at the start, −33.5 dB halfway through the fade, then suspended; on again, running. Turned off, it's remembered, and the next load wakes silent with the toggle off.
- **Hidden tab** (simulated through `setHidden`, since headless never hides a page): suspended, then running.
- 0 console errors.
- **LCP unaffected:** phone median 816 ms with the stems against 844 ms with every audio request blocked (4 loads each).
- **Time to the wake chip** (phone, dev server): median 20.1 s with the stems against 19.3 s blocked. The ranges overlap (19.0–20.4 and 19.0–21.3). The pad stem finishes at 5.7 s, about 5 s before the ship model, so it isn't on the critical path. The 19 s is dev-mode bundles under 4× throttling, not the production figure.

**Test-first** (Red → Green confirmed for each): the mix per scene, speed and chat, and that only changes are sent; the duck leaving the instrument, one-shots and Tycho's radio alone (by graph routes on a fake context); ramps pinning; the format choice and the fallback; the remembered mute; the hidden-tab and restore states; the loading order; the voice pool; the follower; the seam check, hashed names, pruning and fingerprints. That's 67 tests in `lib/audio/*.test.ts` and `scripts/audio/stems.test.ts`. One case went in together with its fix (nothing plays while the sound is off) and was confirmed red afterwards by removing the guard.

**Refactor verdicts:**
- mix: the chat's special cases as table rows → keep.
- format/voices: a loader object, a ring buffer → keep.
- engine: one `pickFormat` call → applied; `push()`'s branch on the target key → applied as a table of setters; the restore flag's single derivation → keep.
- follower's send condition → keep.
- seam helper → keep.
- the export's reuse decision as a pure function → keep (it's glue).

**Not covered, and where it goes:**
- **On the plain page** (no WebGL) the toggle can start the sound, but the mix stays at the hero's part, since there's no film time to follow. That belongs to retiring the two-state UX / the plain page.
- **Scene-change and emote one-shots** aren't defined yet. They're *Score the voyage*'s, through `define()` or recorded samples.
- **WebKit** wasn't re-run here; *Audio stack verdict* checked the formats there. The real-iPhone pass (Silent switch, backgrounding, Opus in iOS Safari) stays in the QA plan.
- **The restore and hidden-tab paths** are unit-tested and simulated, not seen on a real backgrounded device.
- **`.webm` is served as `video/webm`.** `decodeAudioData` doesn't care.
- **The toggle and restore chips** are stand-ins; their look and place are *Score the voyage*'s.
- **Not committed:** the redesign branch's working tree holds it all.


---

<a id="t49"></a>

## 49 · Build the bubble

*task · resolved · blocked by 24, 25, 34, 64*

Built 2026-10-04 (AFK). The bubble and the log are on the real site in production, on the real chat. The old chat panel, the phone sheet and State 1 are gone. Evidence is in [research/bubble-build/](../research/bubble-build/):
- recordings: `out/bubble-1440.mp4` and `out/bubble-390.mp4`, with their contact sheets;
- screenshots at 1440 and 390 in `out/shots/`: open, thinking, mid-reveal, a long reply mid-reveal and finished, folded, the log, and reduced motion mid-reveal and finished;
- the scripts: `record.js`, `perf.js` and `reduced.js`. They stand in for the chat server with a canned stream, so runs repeat exactly and cost nothing.

**What was built**
- **The exchange as plain state:** `lib/chat/conversation.ts`, test-first. It covers:
  - one question at a time, with drafting allowed and Send held off;
  - thinking, then the reveal at `PACE`, never ahead of the stream, with a tap that shows the rest;
  - done only once the stream has ended and every word shows;
  - closing mid-reply: the rest shows at once and the reply finishes into the log;
  - the fold: 0.8 screen of scroll distance once nothing is appearing, never during a reply. Every close is the same change.
- **The bubble** (`components/bubble/Tycho.tsx`, `Bubble.tsx`, `Log.tsx`) builds the settled look on the real stream, through `components/chat/use-tycho-chat.ts` (`useChat` with the store). The card is placed by `placeCard`, the leader draws, the card unfolds, and the words rise. While he waits, his thinking emote plays. After a reply the bubble offers the starters not yet asked. Errors are his lines.
- **The store holds only the conversation** (`lib/chat/store.ts`). `activated` is gone, and old saves still load. `lib/chat/log.ts` reads the store as exchanges. A question whose reply was cut off keeps its place with no reply.
- **A first visit** opens on the greeting. **A returning visitor** opens on the welcome back ("Welcome back. Want to pick up where we left off?"), with "Open the log" beside fresh starters. Both are in `lib/chat/lines.ts`. Neither reopens the old exchange.
- **Keyboard:**
  - "Ask Tycho" and "Move Tycho" are real buttons, shown when focused.
  - `#tycho` now mounts in `app/page.tsx` before the voyage, so they come first in the tab order. His moving body is not a tab stop.
  - The bubble is a dialog that doesn't trap focus. On desktop focus goes to the input, on phones to the card.
  - Esc goes from the log back to the bubble (focus returns to Log), and from the bubble back to where focus came from. A closed card or sheet is `inert`.
- **Screen readers** hear "Tycho is reading his notes." once, then each finished sentence (`lib/chat/sentences.ts`, test-first).
- **Tiers:**
  - **No WebGL,** or 3D that failed or wasn't ready in 10 s: the flat Tycho (`FlatTycho.tsx`, from the wake-up's drawing), parked and with no roam.
  - **Reduced motion:** the card and the log fade, and words fade in place at the same pace.
  - **Phones:** the card spans the width and is opaque. While the keyboard is up, the card sits on top of it (`visualViewport`).
- **Hooks for the dependent tickets:**
  - `lib/chat/ask.ts` (`askTycho`);
  - `lib/chat/answering.ts`, plus `html[data-answering]`, with `aria-disabled` on the page's "Ask Tycho about …" buttons;
  - `lib/chat/talk.ts`, his talking moment by moment: `ask` (in the gesture), `open`, `sentence`, `show`, `hush`, `done`. `components/bubble/voice-link.ts` feeds the chirps engine from it; `voice/engine.ts` is untouched (63's);
  - `lib/tycho/current.ts` (`currentRig`/`onRig`);
  - the `tycho:greet` event, which opens the bubble.
- **Removed:**
  - `components/state1/` and `components/state2/`;
  - `ChatPanel`, `MobileBottomSheet`, `MessageList`, `ToolCallLine` and `ChatInput`;
  - `lib/gsap/use-state-transition.ts` and `lib/scroll/use-pinned-rail.ts`;
  - `components/bubble/canned.ts`;
  - `tests/e2e/landing.spec.ts`.
- **AGENTS.md** is updated: the `components/chat/`, `components/bubble/`, `lib/chat/` rows, a "One page, and Tycho's bubble" section in place of the two-state one, and the testing lines.

**What changed from the storyboard, and why**
- **State 1 is retired here.** Without the flag nothing can switch the page between two states, so the page is the voyage on every load. The first visit's moment stays the wake-up's (46).
- **Tycho ships in production.** He was dev-only. TychoLab stays dev-only.
- **Clear waits while he answers,** so a reply can't land in a log that has just been emptied. The log shows a reply still arriving as it lands.
- **The plate background** offered by *Finalize the bubble* (`rgba(3,4,10,0.5)`, 6 px blur) was not tried. The settled card is unchanged.

**Tests**
- **Unit** (Vitest, red first): `conversation` 16, `sentences` 8, `log` 5, `store` 7 (rewritten), `talk`/`ask` 4. 92 pass across `lib/chat`, `lib/tycho` and `lib/gsap`. `tsc` and `eslint` are clean.
- **E2E** (`tests/e2e/bubble.spec.ts`, `bubble-flat.spec.ts`), 11 passing against :3000:
  - the tab order, focus and Esc;
  - one question at a time, with a draft;
  - the tap;
  - the log, its Esc, and Clear;
  - the fold, and no fold during a reply;
  - an old saved state, with the welcome back and a dropped reply;
  - an error line;
  - the announcements;
  - phones;
  - the flat Tycho.

  These were written after the code, not red first.
- **Refactor** candidates and verdicts:
  - `visible()` re-parses the reply each frame: **keep** (replies are short, and the frame cost is measured below);
  - the leader and placement out of `Tycho.tsx` into a hook: **keep** (they're bound to its open/fold timeline);
  - `spansOf` duplicates the engine's `sentencesOf`: **keep for now**. The engine is 63's; 47 can switch it to `spansOf` through `talk`'s `sentence` events;
  - the bubble's state in one object (`conversation.ts`) instead of eight `useState`s: **done**.

**Measured** (fast wheel scroll, about 7 screens a second for 3 s from About into Work; headless Chrome with ANGLE on Metal; dev server; rAF frame times p50/p95/p99, frames over 20 ms):

| Size | Bubble closed | Bubble open mid-reveal |
|---|---|---|
| 1440 | 16.7 / 18.7 / 33.3, 4 of 178 | 16.7 / 18.7 / 34.1, 7 of 174 |
| 390 | 16.7 / 18.2 / 18.7, 0 of 181 | 16.7 / 17.9 / 18.6, 0 of 182 |

60 fps holds. The bubble's own cost is in the noise. It re-renders only when a word shows (4 a second). When nothing is streaming, the ticker callback does no work.

**For Janriz to look at**
- **The reveal's pace** (`PACE = 4` words a second, in `components/bubble/Tycho.tsx`). A 100-word reply takes about 25 s, and the bubble holds open, unfoldable, the whole time.
- **The fold distance** (0.8 screen) on the real scroll.
- **The welcome back** with "Open the log" (it shows once a conversation is saved).
- **The flat Tycho** (open with WebGL off). Its ink stroke on a dark fill is a first pass.
- **The "Ask Tycho" and "Move Tycho" keys:** where they show when focused (Tab once on load).


---

<a id="t50"></a>

## 50 · Rewrite the chat in Tycho's voice

*task · resolved · blocked by 24*

Resolved 2026-10-04: Janriz read round 4's replies ("the replies are fine").
- Everything the chat says is now in Tycho's voice. The system prompt is Tycho's: the third person about Janriz, the AI act, confidentiality at full strength and still prompt-only, his most recent role and the employers he may name taken from the roles the page shows, and the sample replies as its examples.
- The words live in `lib/chat/lines.ts`: the three errors with the email as a link, `errorLine()`, the greeting, the starters and the reading line. The route and the old chat use them; *Build the bubble* takes them from there.
- Pip is Tycho throughout the code.
- `scripts/tycho-voice-check.ts` is the fixed set, to rerun whenever the prompt changes; its rounds are in `../voice-check/`.


---

<a id="t66"></a>

## 66 · Build Tycho in the film

*task · resolved · blocked by 49, 65*

Built ADR 0011 (amended), test-first where there's logic. Evidence: [research/tycho-build/](../research/tycho-build/): `out/tycho-tour-1440.mp4`, `out/tycho-hands-1440.mp4`, `out/tycho-phone-390.mp4`, and a still at every reading spot at 1440 and 390 with the footprints drawn over them (`out/spots-1440.sheet.jpg`, `out/spots-390.sheet.jpg`; open any page with `?prints` in development to see them live).

**What was built**
- **Clear of the subjects, not only the text** (Janriz's 2026-10-04 brief):
  - One shared footprint registry, `lib/film/footprints.ts` (three-free, so Tycho reads it without bundling three.js). `lib/voyage/bodies.ts` projects each registered body.
  - The stage registers every scene's bodies in one block in `stage.ts`: the ship, the road's monoliths, the gates and CubeSats, Athena, the crawler, its shaft and the ribbon, plus his star's disc as it burns at Contact. No scene's code was touched.
  - **A footprint is one box per drawn part.** A sprawling part, like the ring ship whose modules are merged into a few meshes, gets the grid cells its vertices cover, so a ring keeps its hole. A plain part (a slab, a card) keeps its whole box.
  - **Left out:** lines laid as meshes (the orbit, the route), parts behind the camera, and anything over half the frame, which is the setting.
  - **Cost:** the projection runs only when it's read, at most once a frame. Tycho reads it 4 times a second, at about 0.1–0.5 ms a read.
- **The rules, in `lib/tycho/think.ts`** (pure, tested), which `roam.ts` now only carries out:
  - Text or a subject coming under him sends him, hurried, to the clear spot nearest home.
  - With no spot clear he takes the least-covered one, never one on text if any is off it, and shrinks to 0.7. He grows back once his spot clears. He hops only to a spot covered less than half as much, so he doesn't ping-pong.
  - Home base after a settled scroll, never a shooed spot.
  - The wander: 7–12 s, 240–900 px, only to a clear spot along a clear flight.
- **Flights** bow to whichever side keeps clearer and never out past the frame's edge (`bowFor`). Before this, a hop along the left edge swung him half out of the frame.
- **Sound:** each emote plays `emote-<name>` (in `rig.ts`, after the reduced-motion check, lower-cased to match the shot names). The bubble plays `ui-open` and `ui-fold` as it unfolds and folds.
- **For the warp:** `currentRoam()` in `lib/tycho/current.ts` gives `spot()` and `hold(on)` (the comment on 68).
- **Kept:** the probe take on the switcher, and so the dev-only TychoLab, until the probe is settled.

**Changed from the reference build, and why**
- `pickSpot` is replaced by `placeSpot`, which knows page from subjects and returns the small fallback.
- The arc's maths lives once, in `spots.ts`'s `arcPoint`.
- His transform is written only when it changes, so a parked Tycho costs the page nothing.

**Numbers**
- **Placement:** at all 40 reading spots he's on no text at either size, and on a subject at full size at none. At 390 he's small at 3 spots: Yearbook, GPT-4o, and the pipeline's start, where the shaft fills the lower half.
- **Frame cost:** a fast scroll through the whole film at 6 screens/s holds 60 fps.

  | | Mean frame | p95 | Frames over 20 ms |
  |---|---|---|---|
  | 1440, with him | 16.66 ms | 18.5 ms | 0 |
  | 1440, his canvas gone | 16.72 ms | 18.3 ms | 2 |
  | 390, with him | 16.66 ms | 18.4 ms | 0 |
  | 390, his canvas gone | 16.66 ms | 18.6 ms | 0 |

  On the main thread his rig's draw is about 0.36 ms a frame, and the footprints about 30 ms over the 14.7 s sweep.
- **Tests:** 57 across `lib/tycho`, `lib/film/footprints` and `lib/voyage/bodies`. tsc is clean, and eslint is clean on my files.

**Red → Green → Refactor**
- **Red, each for the expected reason:** the functions weren't built yet, the bow went out of frame, the plain slab's face was left open.
- **Refactor, candidates and verdicts:**
  - drop `pickSpot`: **done**;
  - reuse `arcPoint` in `travel`: **done**;
  - the wander's filter straight through `inFrame` and `isClear`: **done**;
  - fold `project`'s three cases into one: **keep** (each reads plainly);
  - TychoLab: **keep** (the probe's still open).

**For Janriz to look at**
- `tycho-tour-1440.mp4`: does keeping clear of the ship, rings and plates feel right, or is he too shy (he hugs the left edge through the pipeline)?
- Shrinking to 0.7 on a covered spot: the right size?
- **Move Tycho** skips corners that aren't clear. At Athena it goes top left, bottom right, top left.
- Footprints are conservative: a few cells round a part's vertices, and a plate's slab edges as well as its face.

### Comments

- 2026-10-04, from *Finalize Tycho in the film*: build ADR 0011, not a guide.
  - **No guide:** no spots per scene, no dives. He lives on the frame's edges in every scene, with a lively wander.
  - **The reference build** is `lib/tycho/roam.ts`, with `lib/tycho/spots.ts` and `lib/tycho/card.ts` already test-first. It runs on the real site through `components/bubble/Tycho.tsx`.
  - **Left for this build:**
    - a test-first pass on the home-base and recheck logic now inside `roam.ts`;
    - "Move Tycho" sitting beside the real "Ask Tycho" button;
    - measuring the frame cost.

- 2026-10-04 — **Janriz, orchestration brief:** keep the probe take on the switcher: the final bot design is still being weighed.
- 2026-10-04 — From [Build the bubble](build.md#t49) (resolved): what Tycho in the film inherits.
  - **The bubble is built:** `components/bubble/Tycho.tsx` (body, rig, roam), `Bubble.tsx` (the card) and `Log.tsx` (the sheet). The exchange is plain state in `lib/chat/conversation.ts`, where `open` is the "talking" that holds him still. `createRoam({ talking })` reads it as before.
  - **"Move Tycho"** now sits beside the real "Ask Tycho" key. Both are `.tycho-key` and show when focused; `#tycho` mounts before the voyage, so they're first in the tab order. His body is `tabIndex=-1`.
  - **The card's place and leader** are still `placeCard` plus `layLeader` and `placeBubble` in `Tycho.tsx`. They're measured when it opens and on resize, but not while he moves. He holds still while it's open.
  - **The flat Tycho** (no 3D) skips roam entirely.
  - **The rig** is published to `lib/tycho/current.ts` (`currentRig`/`onRig`).
  - **TychoLab** is still mounted, dev-only and hidden from automated browsers, for this ticket to retire.
  - **The probe take** stays on the switcher (`takes(location.search).tycho`).

- 2026-10-04 — **From [Finalize the score](finalize.md#t63), via the orchestrator:** sound calls are in the tree, used only through `currentSound()?.play(...)` from `@/lib/audio/current`. They are no-ops while the sound is off or before the wake.
  - Tycho's emotes: add `currentSound()?.play(`emote-${name}`);` at the top of `emote(name)` in `lib/tycho/rig.ts`. Every name in `EMOTES` has a sound.
  - The bubble: `play("ui-open")` / `play("ui-fold")` as it unfolds and folds (in `components/bubble/`; `voice/engine.ts` is 63's).

- 2026-10-04 — **Janriz, orchestration brief:** **tighten the wander rule: Tycho keeps clear of objects, not just text.** Where he parks and every hop he takes avoid the 3D subjects on screen (the ship, the monoliths, gates and their CubeSats, Athena, the crawler and its shaft, the ribbon, the beacon at Contact) as well as the text, and he moves off when a subject slides under him. Take each subject's on-screen footprint from the stage (its projected bounding box or sphere each frame, from one shared registry the scenes add their bodies to, not per-scene code in Tycho), padded like the text's 10 px. Test the placement logic first (Red → Green). If no edge spot is clear, he takes the least-covered one and stays small. Mind the cost: the projection runs once per frame for the bodies in view only.

- 2026-10-04 — From [Build the pipeline and its climax](build.md#t41) (resolved):
  - **The shaft's registration now skips** the search's hairlines and the rush (`prints.add(pipeSet.root, { …, skip: pipeSet.notSubjects })`). They're light, not subjects, and the hairlines' geometry box isn't where they draw.
  - **In my stills** Tycho parks right beside the report's deck and bars at Report (32.21, 1440) and next to the shaft in the climax (33.4–33.7). Look at `research/pipeline-build/look/1440-t32.21-s.png` and the end of `out/pipeline-1440.mp4`.
- 2026-10-04 — From [Build the wake-up](build.md#t46) (resolved): **the wake hands Tycho to roam at his CSS corner.** It flies him from the centre of his stage to bubble.css's corner (128 px, or 92 px on a phone), clears its transform and calls `rig.resize()`. About 0.8 s after he lands it takes off every `wake` class, and roam owns him from there. wake.css no longer repeats the corner rule, so moving his corner in bubble.css moves the landing with it. `Tycho.tsx`'s `plain` now follows `onTier`, so the wake-up's 10 s fallback (`setTier("plain")`) turns him flat.

- 2026-10-04 — From [Build the look back and the spur](build.md#t38) (resolved): in the 1440 recording, Tycho sits over the ATHENA title for a moment as it writes in, about 20.9 (`research/lookback-build/out/lookback-1440.mp4`, around 0:17). The spur and the orbit are lines, so they aren't footprints.

- 2026-10-04 — **From [Build the gates](build.md#t37) (resolved):**
  - **Footprints:** the gates' CubeSats are now instanced per gate. `stage.ts` skips them in `prints.add(gateSet.root, { skip: gateSet.notSubjects })` and adds each CubeSat as its own `prints.addSpot` (`gateSet.spots`), since an instanced draw's box would span the ring, hole and all. The ring's parts register as before.
  - **Cost:** on a 1440 fast scroll through Work, hiding `#tycho` took out the run's last long frames and lowered the compositor's GPU wait (`research/gates-build/attr-1440.txt`). His canvas renders with MSAA and a 1024 PCF-soft shadow map every frame. Three r186 also warns that `PCFSoftShadowMap` was removed and falls back to PCF. Worth a look: shadow redraw only while he moves or emotes, or no MSAA at DPR 2.
- 2026-10-04 — **From [Build the warp](build.md#t68)** (resolved): additive changes in `lib/tycho/rig.ts`. `warp()` returns its timeline, which the warp drives. `drawing(on)` pauses or resumes the render loop. `screenOf(x, lift)` gives a point on his canvas. The stage Tycho is `lib/tycho/flight.ts`: made ahead, laid exactly over the corner one, using `currentRoam().hold()` and `spot()`. He lands back on his spot, and the corner one takes over.

- 2026-10-04 — From *Light the sky from the chat* (70): rig.ts gained `pointAt(x, y, hold)` (additive, beside the point emote): head turns and the arm on the subject's side rises. The point handler waits until his roam spot is still, then `hold(true)` for the gesture and releases it after.

- 2026-10-04 — **From [Score the voyage](build.md#t47) (resolved):** `rig.emote()` played `emote-${name.toLowerCase()}`, so `allGood` asked for `emote-allgood`, which doesn't exist (the file is `emote-allGood`): "all good" was silent. The rig now plays `emoteSound(name)` from `lib/audio/hooks.ts` (the name as it is), for the emotes and `pointAt`'s point; a test checks every emote in `EMOTES` has its file. Exact edits only (import + two calls). Every emote was heard in the listening pass (66 emote sounds besides greet and point).


---

<a id="t67"></a>

## 67 · Rework About on the ring ship

*task · resolved · blocked by 35*

Resolved 2026-10-04 (AFK, with Janriz's two mid-build directions folded in). Evidence is in [`research/ring-about/`](../research/ring-about/): recordings `out/about-ring-{1440,390}.mp4` (with contact sheets), the reading spots `shots/spots/`, the tour and the close pass `shots/r3`, `r4`, the settle beside Janriz's frame `out/settle-vs-janriz.png`, Around home `shots/r6`, the drag `shots/checks/`, the reduced-motion stills `shots/checks/still-*`, `aa.txt`, `frame-cost*.txt` and `logs/probe*.txt`.

- **The ring is home's ship by default; the truss is a take** (`?ship=truss`, `lib/voyage/takes.ts`), held three-quarters on as before. The probe stays on the switcher, untouched.
- **The ring, finished** to the truss's level, by script in Blender ([`ring.py`](../research/ring-about/ring.py), built headless by [`build.sh`](../research/ring-about/build.sh), so a shared Blender is never touched), with occlusion baked in Cycles. 46k triangles, `public/voyage/ship/ring.glb` 947 KB (meshopt, WebP).
  - What reads its size up close: rows of small windows, dark glass that catches his star with about one in three lit from inside; handrails, berthing mechanisms, grapple fixtures, bellows nodes, RCS quads, ribbed radiators; a finer, shallower foil crinkle and panels smaller than the first pass's; an elevator car on one spoke.
  - **A crew capsule** (the model's `visitor` node, about 1:50 of the ring) flies in along the axis and docks at the hub while About is read, rolling to match the ring's spin, with its strobe flashing (steady under reduced motion).
- **The camera** (`lib/voyage/about.ts`, tested), one way round, on curved paths, the world's up throughout:
  - **the tour:** past his star it comes round the ship's outside, low along the rim, and lands on the settle as About's words finish writing in;
  - **the settle** (Janriz's frame): the ring this close, running off the right and bottom of the frame, seen from a little above, the hub on the right third, the words in the clear dark on the left. Its distance is solved per screen shape so the ring's near-left edge stops at 41% of the width. It's held while About is read, drifting a few degrees round;
  - **the close pass:** while no words are up (About's out, Around home's not yet in), it swings in past the rim, low over the plane, his star raking the modules;
  - **the pull-out**, on round to Around home.
  - On a phone the ring fills the top of the frame like a horizon, hub centred, and running off both sides.
- **Around home's constellation is bigger** (`spreadView`): the stars About lit, seen across their widest and framed into a box larger than the right of the frame, so they spread across it and a few threads run out of it, the ship among them. Its heading moved to head the column, clear of the threads. The stars are drawn at the size they had before, so the spread doesn't dim them.
- **The portrait card** hangs from the ring's near-left rim, below About's words and left of the ring (`ships.ts` `edge`). On a phone it's still the row in the list.
- **The spatial drag** (the hero and Contact): `lib/film/turn.ts`, tested. Yaw and pitch turn as a grab, the pitch is clamped to ±0.5 rad round the hero's elevation, and the coast is heavy on both axes. It's applied through the stage's spin offset, so Contact gets it too (43 tunes it there). Tycho's sound hooks (`createHand({ sound })`) are in for 63.
- **What changed from the storyboard, and why:**
  - About's camera, the settle's closeness and the tour are Janriz's 2026-10-04 asks;
  - Around home's words start writing in at 4.2 instead of 3.99 (its reading spot is unchanged), to leave a quiet window for the close pass;
  - the orbit's hairline now draws in on the pull-out rather than at the arrival, because the camera stands inside it while About is read;
  - Around home's frame has a new direction and distance (his ask).
- **Measured** (M5, headless GPU):
  - **Contrast passes at every reading spot:** 1440 titles 17.1/17.3, text 12.3/12.0; 390 titles 16.9/16.8, text 11.2/12.1.
  - **Frame cost, hero → peel:** 60 fps with no frame over 20 ms at 1440 and 390, both at a steady pace and a fast scroll (2.1 screens/s).
  - **GPU at the settle:** 8.8–13.6 ms mean at 1440 (DPR 1.8; the machine's run-to-run noise was large) and 4.3–5.0 at 390. The rig's dark keys cost 3–4 ms there until the ship's materials took 39's `lightBy` skip; with it, removing the dark keys no longer changes anything. What's left is the ring filling about 60% of the frame at DPR 1.8. Passed to 69.
- **Tests:**
  - **TDD:**
    - `turn.test.ts` was red (no module), then green;
    - the takes' default was red, then green;
    - the first `about.test.ts` was red (no module), then green;
    - the settle and spread tests were added after the code, when Janriz's directions came in.
  - **Results:**
    - `lib/film` and `lib/voyage` 361/362: the one failure is the frozen prototype's copy under `.scratch/`, not the site;
    - tsc passes;
    - eslint passes on the touched files.
- **Refactor verdicts:**
  - the one-axis coast (`createCoast`, `dragSpeed`, `turnFor`) is removed from `lib/film/hand.ts` with its tests, superseded by `turn.ts`. Done;
  - `spreadView` stays in `about.ts`: it has one caller, and it's About's. Kept;
  - the truss's old About keys stay behind `take.ship !== "ring"` while the truss is a take. Kept;
  - `edge()` branches by ship in `ships.ts`, where both poses live. Kept.
- **For Janriz to look at:**
  1. the settle beside your frame (`out/settle-vs-janriz.png`): the ship is lit by his star here, where yours caught it dark;
  2. the tour's length: it's brief (1.65 → 2.75 screens), as asked;
  3. the close pass between About and Around home;
  4. Around home's size: the ship is small among the spread stars (about 20 px across at 1440);
  5. the capsule docking;
  6. the drag's pitch range (±0.5 rad).

### Comment — 2026-10-04: the ship went dark at About (diagnosed and fixed)

- **Symptom:** at About's settle the ring showed only its window lights and the dim fill; his star's key was missing. It wasn't capture timing.
- **Root cause:** while the ribbon is read (`Your own`, F0+0.5 → G1+0.6), `stage.ts` dims the other keys with `k.intensity *= 1 - own`, once a frame. Athena's, the crawler's and the ribbon's keys are set afresh in their own updates each frame, so that dims one frame only. The ship's key (`ships.ts`) was set once at creation and never again, so the dim compounded frame after frame to 0 and stayed there. The probe read home's key at 5.341 cold and 0.000 from `own` onwards, then 0.000 back at About.
- **Trigger:** reaching `Your own` (by scroll, the route map, the chat's warp or Contact), then coming back to About or anywhere the ship's key lights by any route. A reload cleared it. The gates and the road, lit by the same key, went dark the same way.
- **Fix:** the ship's `update()` sets `key.intensity = L.key` each frame, as every other body does. `stage.ts` got a comment-only note that the dim lasts one frame. `dark-lights.ts` and `rig.ts` were not involved: the light itself was at 0.
- **Test:** `lib/voyage/ships.test.ts` was red (5.3e-120 vs 5.341) and is now green. Rig and dark-lights tests also pass.
- **Verified** (`research/dark-models/verify.js`, `verify.txt`, `settle-*.png`) at 1440 and 390, starting at About cold, then scrolling back from `own-flowstack`, then warping back. Home's key was 5.341 and the settle was lit each time.


---

<a id="t68"></a>

## 68 · Build the warp

*task · claimed · blocked by 45, 66*

**Rebuilt** as *Warp or scroll*'s wormhole journey, ported from the prototype's code (`prototypes/warp-or-scroll/`: `main.js`'s `warpHole`, `wormhole.js`, `flight.js`, `trail.js`, `debris.js`, `rig.js`'s boosters and acting), not re-derived from the legs' summary. *Make every scroll a scene*'s pull-back and flare play before the hole. Waiting on Janriz's reaction to the recordings.

- **The beats** (`lib/film/warp-plan.ts`, tested), at the prototype's own pace:
  1. The text leaves and the camera pulls back to the whole sky. Meanwhile Tycho's boosters pop out, his jets fire and he flies his one clean circle in 3D. Its fire closes into a ring.
  2. On a question, the explored stars flare while the ring hangs.
  3. The ring winds into a spark as he perches with his back to us and winds up.
  4. The burst: a flash, a shock and a shake, and he's thrown back at us. Then the swallow, the glance, the grin and the dive.
  5. The page jumps when the horizon covers the frame.
  6. The throat: the section left behind tumbles past while he drops back with a wave and barrel-rolls off.
  7. A portal opens onto the destination's point of light and its white hole, cooling into the region's hue, as the camera comes in from 40× away. He swoops out and lands on his spot, dizzy and then all good, and the corner Tycho takes over.
- **Timing:**
  - A link gives the page back after about 6 s, a question after about 7.5 s. His landing plays out about 1.2 s after that.
  - The hero skips only the pull-back.
  - `WARP_S` tunes it, and in development so does `?warp=<s>`.
- **Tycho flies in 3D** (`lib/tycho/flight-path.ts`, tested: no S curves, he leaves from rest, he stops low on the circle):
  - His stage rig runs in a new flight mode (`lib/tycho/rig.ts`). He's seen from where the visitor's eye is, he leans into his motion like a drone, and at rest he shows his corner's three-quarter view, so the handover doesn't jump.
  - His three jets fire flames (JetMain, JetL and JetR), each with a glow at the nozzle and their light on his underside. The hatches and pods follow `boost.deploy`.
  - His acting ports the prototype's, with arms added: ignite, wind up, cast, whoa, strain, glance back, grin (a thumbs-up), the dive (arms ahead), soar, wave, burst, brake, and the land (squash, hop, spiral eyes spinning, then a happy face).
  - `lib/tycho/flight.ts` lays his canvas where the eye sees him, as big as his depth makes him, under the warp's shake and roll, and sizes his drawing buffer to that.
- **The hole** (`lib/voyage/warp-hole.ts`) is drawn by the sky's renderer through a new `overlay` hook in `lib/universe/sky.ts`. The sky skips its own drawing while the throat covers the frame.
  - The prototype's shaders: the disk, the photon ring, the shadow, the charge, the shock, the throat (log-polar, no streaks), the portal and the white hole.
  - The sky that falls in is the real frame, copied as it's drawn, lensed and spiralling in, and read mirrored past its edges so its edge never shows.
  - It's drawn into a target capped at 1.5 M px (0.6 M on a phone) and composited.
- **His fire** (`lib/voyage/warp-trail.ts`) and **the section left behind** (`lib/voyage/warp-debris.ts`: the runway's biggest visible words, a label plate or two and the portrait, painted one a frame) are ported from the prototype. The ribbon breaks between the ring and the loose fire.
- **Kept from the first build:** the input lock and the hurry, the reduced-motion crossfade, the plain page's jump, the trip in miniature (now drawn down the throat), the focus and the announcement, the sound hooks, and making everything ahead after the wake.
- **Sound:** unchanged and still plan-driven. The riser's swell lands on the jump (now about 3.8 s into a link and 5.2 s into a question), and the arrival plays as the portal opens. The burst has no sound of its own yet; `onWarp` now tells a `burst` beat, for when one is authored.

**Changed from the prototype, and why:**
- The sky falls into the hole, not the page: the text has already left with the pull-back (*Make every scroll a scene*).
- He lands on his own spot and plays his landing there (ADR 0011), not beside the target.
- He has arms, so the acting uses them.
- His fire and the throat's pieces are drawn by the sky's renderer, under his own canvas, so there's no third context.

**Measured** (`research/warp-rebuild/perf.js`; four warps in a row, About → Work → Projects → Contact → About; Apple M5, ANGLE Metal, against :3000):
- 1440 at dsf 2: mean 16.67 ms, p95 17.0–17.2 ms, and no frame over 20 ms. The sky's GPU time averages 3.8–4.9 ms (max 11.3 ms).
- 390 at dsf 3: mean 16.67 ms, p95 17.2–17.4 ms, and no frame over 20 ms. The GPU averages 1.6–2.1 ms.

**Tests:**
- Vitest repo: 94 files, 751 tests green. tsc 0, and eslint 0 over app, components, lib, tests, db and scripts.
- E2E against :3000: warp, routemap and sky-chat, 17 green.
- TDD: `warp-plan` and `flight-path` went red first. The riser's two timing cases were updated to the new plan. The journey, the shaders and the rig were checked by recordings and e2e.

**Refactor**, candidates and verdicts:
- The flare leg built in two steps: folded into one.
- The plan's beat table: kept, since it reads as the score.
- Tycho's size was placed twice a frame: now one formula.
- The hole as a mesh in the sky's scene, or the `overlay` hook: the hook, so the sky can skip drawing under the throat.
- The `hex()` helper is copied in `warp-hole` and `warp-trail`: kept, two lines, each module stands alone.
- `journey()`'s length: kept as one timeline, so the beats read in order; the math lives in the pure modules.

**Evidence:** `research/warp-rebuild/rec/`
- `warp-about-work-1440.mp4`
- `warp-about-work-390.mp4`
- `warp-chat-1440.mp4` (a question with lit stars, Work → About)
- `warp-hero-projects-1440.mp4`
- `warp-hurry-1440.mp4`
- contact sheets beside each

The first build's tunnel is kept at `research/warp-build/replaced/warp-tunnel.ts`.

**For Janriz to look at:**
- The five MP4s, beside the prototype's `recording/motion/24`–`25`.
- Whether 6 s for a link is right (try `?warp=5` in dev).
- How long the sky takes to fall in.
- Whether the burst needs its own sound.


- 2026-10-05 — **Tab goes on in the section you're in** (Janriz: after navigating, Tab went back to the previous section). A link's warp already focused the heading it landed on, and Tab went on from there. After Tycho's jump, though, focus stays in the chat (by design), and Tab ran through Tycho's buttons and the route map into the page's first button (LogoLife's), gliding the film back. Now Tab coming into the text from outside it enters at the block on screen (`lib/film/tab-entry.ts`, wired in the film's runtime): going forward, the first button at that block or after; going backward, the last of that block. Shift+Tab still reaches everything earlier. This is the in-page-link convention (the browser moves its Tab starting point to the target), so it's within WCAG 2.4.3; focus is never taken out of the chat box. Unit tests 5/5; a new voyage e2e test (from the route map forward, and from the sound chip backward, at Athena).


---

<a id="t69"></a>

## 69 · Performance pass over the whole voyage

*task · resolved · blocked by 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 49, 66, 67, 68, 70*

Done 2026-10-04. The whole film holds 60 fps at 1440 and 390 in every run: fast scroll, fling, warps, replay. Nothing compiles mid-film now. GPU cost at About's settle is down about a third. The throttled phone's 3D is ready 4.1 s sooner, well clear of the 10 s fallback. On a slower GPU, the sky's resolution now steps down by itself.

Evidence is in `research/perf-pass/`: scripts `film.js`, `load.js`, `wake.js`, `titles.js`, `gov.js`, `mkbuild.sh`; numbers in `before/` and `after/`; stills in `shots/` and `after/shots/`.

**Method.** Each run is a production build (`next build` + `next start` on :3200) from an rsync'd copy, with node_modules APFS-cloned (Turbopack refuses a symlink out of the root). The only patch is the dev-only window hooks left on. Next 16 builds don't clobber `.next/dev`, but the copy froze a true "before". Runs are headless Chromium on ANGLE Metal on the M5. GPU is the sky's own timer query.

**Before → after** (GPU mean / p95 / max in ms; frames > 20 ms in brackets)

| 1440 | before | after |
|---|---|---|
| fast scroll, 8 screens/s, there and back | 4.3 / 8.2 / 15.3 [0], 1 compile | 3.2 / 6.6 / 11.8 [0], 0 compiles |
| fling (wheel bursts) top to bottom | 4.5 / 8.3 / 17.2 [0] | 4.0 / 7.1 / 13.8 [0] |
| warps to Contact / About / Projects / Work | 3.0–5.2 mean, max 14.1 [0] | 3.3–5.5 mean, max 11.5 [0] |
| replay, then on into About's settle | 5.6 / 10.4 / 13.5 [0], 65 calls | 3.9 / 6.6 / 9.1 [0], 44 calls at the settle |
| held at each of 40 reading spots | mean 5.8, worst 7.9 (Save) | mean 5.0–5.6, worst 7.4–8.4 (noisy: a monolith or Save) |
| held at the spots, forced to DPR 1 (the governor's floor) | n/a | mean 2.7, worst 4.5 |

- **390:** 0 frames over 20 ms in every phase, before and after. GPU means are 0.7–2.4 ms; fast-scroll p95 went 3.0 → 2.4, and the one mid-film compile is gone.
- **Load,** throttled phone (4× CPU, 4 Mbit/s, 150 ms), medians:
  - LCP stays 0.79 s (the loader's name; About's portrait is no longer the LCP);
  - universe ready 9.10 → 5.01 s (7 runs, all within 30 ms);
  - wake button 15.9 → 11.8 s;
  - before the button, 3.9 → 1.9 MB.
  - At 1440, LCP is 0.24 s.
- **What loads after the wake:** every later scene's 9 models (2.8 MB), the ribbon's screenshots, the warp's tunnel and Tycho's stage. Before the wake: the ship, Tycho and the sky.

**What changed**
1. **Only the first scene before the wake.**
   - `lib/voyage/later.ts`: `afterWakeLoader()` holds a scene's fetch until the wake. It parses the model once he's landed and his greeting has unfolded, one job per idle moment (queue in `lib/wake/after.ts`, three-free so `warp.ts` can use it). Meshopt decodes in 2 workers.
   - `warmAfterWake()` compiles a warm-up's draws in parallel first (`compileAsync`). Then it draws once for real, with every shadow map forced. That's what catches the dark keys' depth passes, which otherwise compiled mid-film at 25.9 and 32.8.
   - `stage.ready` is the opening's alone. `stage.whole` / `data-stage="whole"` says when the rest are in, then the stills are retaken.
   - Gates, Athena, the crawler, the pipeline, the ribbon and the road all load and warm through it. So do the warp's tunnel and stage Tycho (`warp.ts`) and the ribbon's screenshots.
2. **The ship is opaque while whole** (`ships.ts`, gates' `fadePair`). It was transparent all film long, so at About it filled the frame drawn back to front, its two-sided parts twice. About's settle: GPU p95 10.4 → 6.6 ms, max 13.5 → 9.1, draw calls 65 → 44. It looks the same (`after/shots/1440-about-settle-after-replay.png`).
3. **The sky's resolution is governed** (`lib/universe/governor.ts`, wired in `sky.ts`).
   - It steps DPR 1.8 → 1.53 → 1.30 → 1.08 → 1.0 while the GPU timer reads over 12 ms per half second. With no timer it uses missed frames.
   - It steps back up once the finer step is expected under 9 ms for 2 s, never below DPR 1.
   - The warp holds it (`sky.holdScale`), since it copies the frame.
   - On the M5 it never engages, so the look is unchanged. Faked over budget in the real page, it stepped down in 2.8 s with 0 frames over 20 ms and came back up in 9 s (`after/governor.txt`, `after/shots/1440-about-governed-low.png`).
4. **Tycho's cost** (37's note):
   - his shadow map is PCF (the removed PCFSoft fell back to it and warned);
   - it's 512 in his corner and 1024 when he fills the frame;
   - the warp's stage Tycho draws at DPR ≤ 1.5.
5. **Lights audit** ("Your own" dims `k.intensity *= 1 - own`). It multiplies three keys: Athena's (`athena.ts` sets it every frame, on both paths), the crawler's (every frame) and home's (every frame since the dark-models fix). None compounds.
   - After "Back to the start", the settle is lit at 1440 and 390 (`after/shots/*-about-settle-after-replay.png`), and the replay has 0 long frames.
6. **Leftovers:**
   - **The greeting on a phone** rises above the lockup (`card.ts`'s `avoid`, fed the shown blocks' titles and lines in `Tycho.tsx`): `after/shots/390-woken.png`.
   - **Titles count as text:**
     - with no clear spot, he leaves the words for a spot only bodies cover (`think.ts`);
     - he thinks at 8 Hz while the page scrolls (`roam.ts`).
     - Full-film probes at 1440 before: 19 and 1 frames on a title (it depends on where his wander has taken him; the crawler and the fall were the bad stretch). After: 0 and 0. At 390: 1, a monolith's plate sweeping past for one sample.
   - **The report's deck** is in the footprints already: its bars are meshes under the pipeline's root, registered with only the hairlines and rush skipped.
   - **The route at the road's start on a phone under reduced motion:** a still was drawn before its block was `on`, so the road found no line to go behind. `runtime.ts`'s `capture` now lends the block `on` while it draws (`after/390-still-tail.png`).
   - **README.md and AGENTS.md:** the two-state page is gone from README. AGENTS gains rows for the wake-up, route map, `lib/tycho` and `lib/wake`, the after-wake and governor conventions, and every e2e spec.
- **Tests** (Red → Green each): `lib/voyage/later.test.ts` (5), `lib/universe/governor.test.ts` (7), `ships.test.ts` (+1, opaque while whole), `card.test.ts` (+3), `think.test.ts` (+1).
- **Refactor.** I weighed these candidates:
  - **later.ts's two renderer proxies:** folded into `drawingWith`. That's the one refactor made.
  - **Rewriting each module's warm-up async:** no. The proxy runs them unchanged, twice.
  - **Moving the queue into `lock.ts`:** no. The lock is the lock; the queue is a scheduler.
  - **Pulling the step's application into the governor:** no. The sky owns the renderer.
  - **The ship's own fade code:** replaced by reusing `fadePair` rather than copying it.
  - **`card.ts`'s rise loop and `think.ts`'s words-first rule:** kept as they are.

**Final checks.** There is no `.github/workflows` in the repo, so CI's steps are the package scripts:
- `pnpm lint` exits 1, entirely from 2,533 errors under `.scratch` (case studies, prototypes, research). `pnpm lint --ignore-pattern .scratch` exits 0.
- `pnpm tsc --noEmit` exits 0.
- `pnpm test --maxWorkers=2` exits 1, all 7 failing files under `.scratch` (one prototype's `path.test.ts`, six prototype e2e specs picked up by vitest). With `--exclude ".scratch/**"`: 93 files, 740 tests, exit 0.
- e2e against :3000 (temporary config, headless, `--workers=2`): 55 passed, exit 0.
- `next build` exits 0.
- SEO/GEO curls: robots.txt, sitemap.xml and llms.txt (53 lines) are served; 6 JSON-LD blocks (Person, WebSite, ItemList and the rest).

**For Janriz to look at**
1. **The trade at the wake.** Before, the wake had no long frame because everything had loaded under the loader. Now the wake itself is still clean, but once he's landed and greeted, the later scenes build at the hero:
   - 0–1 frame of 33–67 ms at 1440 and on a phone;
   - 5–7 frames of 33–134 ms on the throttled phone, about 4.4–5.3 s after the click.
   - Splitting a module's build across idle moments is the next lever.
2. **A visitor who scrolls or warps fast within about 2–5 s of the wake** can reach a scene before its models are in. They pop in. Warps and deep links could wait on `stage.whole` if that shows.
3. **The governor's thresholds** (down over 12 ms, up under 9) are set from the M5. A real mid-range laptop is the check.
4. **Every `.shot` still carries the 28 px text-shadow** (37: about 0.7 ms of raster a frame on the ride). I kept it for contrast.
5. **The lint and test noise from `.scratch`** could go with an ignore in `eslint.config.mjs` and an exclude in `vitest.config.ts`: your call.
6. **README's "Live" link** (janrizlibres.vercel.app) and `lib/seo/site.ts`'s host (jrz-dev.vercel.app) differ. That predates this ticket.
7. **I stopped your :3000 dev server by mistake** (an over-broad `pkill`) and restarted it at once with `pnpm dev`. It now runs detached, logging to `.locks/dev-3000.log`.


---

<a id="t70"></a>

## 70 · Light the sky from the chat

*task · resolved · blocked by 25, 49, 68*

**Built** 2026-10-04 (AFK). Tycho now lights the stars he reads, the question warp flares them, and `highlight_project` is the point. Evidence is in [research/sky-chat-build/](../research/sky-chat-build/). The scripts are `record.js` and `perf.js`. They stand in for the chat server with a canned stream, so they cost no model calls.
- **Recordings** (`rec/`):
  - `sky-light-1440.mp4` and `sky-light-390.mp4`: in the hero, a question's search lights six stars;
  - `sky-point-1440.mp4` and `sky-point-390.mp4`: from About, "Tell me about Athena": the stars light, the question warp flares them, and Tycho points at her;
  - `sky-here-1440.mp4`: at Tolstoy's gate, a point with no move.
- **Stills:** a contact sheet for each recording, and a still at each point (`*-point.png`).

**What was built**
- **Stars from the chat stream** (test-first):
  - When `search_wiki`'s output passes through `withholdRetrievalOutputs`, the server maps its rows to star ids (`lib/ai/star-ids.ts`, from the server-only `lib/sky/chunk-stars.json`). It sends them as `{ type: "data-stars", id: <the call's id>, data: { stars: [...] }, transient: true }`, just before the nulled output.
  - The part holds star ids only, best first, each once. A chunk with no star is dropped.
  - It's transient, so the SDK hands it to `onData` and never keeps it in a message, the store or a posted conversation.
  - `route.test.ts` asserts the part's exact shape and that no chunk text, title, source path or chunk id appears anywhere in the body.
  - One live request on :3000 (one model call) confirmed it end to end: `data-stars` arrived, no `wiki/` path appeared, and the model chose `highlight_project("athena")` by itself.
- **The sky lights them where they sit:**
  - `lib/chat/sky.ts` calls the sky's own `light()` with `inPlace`: the warm flare a beat apart, best first, cooling to a brighter white. It keeps them lit until the next question (or Clear).
  - `inPlace` leaves out the recede and the turn, because the film owns the recede and the camera. An `overwrite: true` tween on `uRecede` would have killed the film timeline's recede at About.
  - **New in `sky.ts`:** stars have a second pair for the chat, `flare` and `read`, and the state texture takes `max(heat, flare)` and `max(lit, read)`. Before this, the film's timeline owned `lit` on About's stars, his star and the road's start, so the sky's old `kill()` would have killed the film's tweens. No shader or twinkle change.
  - The route map's miniature mirrors the pair. The warp's question flare now finds the chat's stars (`read`) and flares `flare`; before, it caught the film's lit stars too.
- **What a reply does, in order** (`lib/chat/page-effects.ts`, tested):
  - Each search's stars light as they arrive.
  - A move waits for the stars of any search in flight (at most 4 s), so the warp's flare has them, plus 250 ms for a sibling move.
  - A point beats a warp asked with it, and only the first point goes. A later step's move goes too.
  - The reply's end makes a waiting move at once; a new question drops it and puts the stars out.
- **The point** (`components/effects/PointEffectHandler.tsx`, replacing `HighlightEffectHandler`):
  - **Subjects** (`lib/voyage/subjects.ts`, tested): Athena, the crawler, the four moons, the three personal projects and the four companies' gates, each with its block and stage ref. A personal project has no ref and points at the biggest footprint in frame, its card. `ai-crawler` is an alias.
  - **The way there:** it stays put if the block is being read, glides within the section and warps (a question's) to another. Then it waits until Tycho is parked.
  - **The gesture:** Tycho is held (no wander or shoo) and `rig.pointAt(x, y)` turns his head and raises the arm on the subject's side, held 2.6 s. That's new and additive in `rig.ts`.
  - **Screen readers** hear "Tycho points at Athena."
  - **Reduced motion:** the warp's crossfade, and he only looks. **Plain page:** it scrolls to the block.
- **Tool and prompt:**
  - `highlight_project` takes the voyage's subjects.
  - The prompt allows at most one move per reply, the point over `scroll_to`, and no move to where the visitor already is.
  - `page-context.ts` is now built from `lib/content/voyage.ts` (tested). LogoLife's role is "Full-Stack / AI Engineer", where it used to say "Data / AI Engineer".
  - The view context follows the film: the section and the block being read (`lib/state/use-active-section.ts`, which named sections the voyage no longer has).
- **AGENTS.md:** the effects row and the "Retrieved chunks stay on the server" rule (the one opaque field).

**Changed from the storyboard and ADR 0005, and why**
- **The subject doesn't warm for 3 s.** Warming every kind of subject means per-material work in five scenes' modules (Athena, the crawler, the gates, the ribbon is 42's, in progress). The point is Tycho's gesture plus the block's own title and labels, which show at its reading spot.
- **The rest of the sky doesn't recede and turn to face what's read in the film.** The film owns both. Stars flare in place, as the ticket asks.
- **Brightness follows rank, not similarity.** Similarities stay on the server; only ids go.

**Measured** (Apple M5, ANGLE Metal, dev server; `perf.js`):

| Size | While 6 stars light (4 s) | Fast scroll through the film, 6 screens/s, stars lit |
|---|---|---|
| 1440 at dsf 2 | 16.67 ms mean, p95 18.6, 0 frames over 20 ms | 16.67 ms mean, p95 18.6, 0 frames over 20 ms |
| 390 at dsf 3 | 16.67 ms mean, p95 18.6, 0 frames over 20 ms | 16.67 ms mean, p95 18.6, 0 frames over 20 ms |

**Tests**
- **Vitest,** written red first, each failing for its expected reason: `star-ids` (4), `route` (+1), `page-effects` (9), `subjects` (9), `page-context` (4). Across lib/ai, app/api/chat, lib/chat, lib/voyage, lib/film, lib/tycho and lib/universe, 643 pass. The one failure is a `.scratch` prototype's copy of `path.test.ts`, which Vitest collects.
- **tsc 0. ESLint 0** on my files.
- **E2E** against :3000, headless: `tests/e2e/sky-chat.spec.ts` (4: stars light and go out; the point warps then points; a point at what's being read stays put; reduced motion) plus bubble, bubble-flat, warp and routemap, 28 of 28 green. The e2e were written after the code.
- **Refactor** candidates and verdicts:
  - the section-and-time helpers shared by the warp handler and the point: **done** (`lib/film/here.ts`);
  - the old highlight handler, which pulsed DOM cards that no longer exist: **removed**;
  - the runway's blocks re-read every scroll frame by the view context: **done** (read once);
  - the second `announce` live region beside the warp's: **keep** (moving it would mean editing 68's module for little gain);
  - `whenParked` and `whenStill` as one wait helper: **keep** (one counts still frames, the other is a one-liner);
  - a rank API on the sky instead of synthetic similarities: **keep** (the sky's `light()` already spreads brightness).

**Blocker for live lighting (chat backend, out of this map's scope):** production retrieval still returns 0–1 rows per search. `wiki_chunks_embedding_idx` is `ivfflat` with lists=100 over 95 rows, at `probes = 1`, which *Export the sky* found. So live, a question lights about one star. Fix, Janriz's call: drop the index (95 rows scan exactly in well under a millisecond), or run `SET LOCAL ivfflat.probes = 100` in a transaction round the query in `lib/rag/retrieve.ts`.

**For Janriz to look at**
- `sky-light-1440.mp4`: the flare, then the lit stars' brighter white. It's subtle once they cool. Should read stars stay brighter?
- `sky-point-1440.mp4` and `-point.png`: Tycho's point from his corner. Is the arm angle right? Should the subject warm (ADR 0005), worth a follow-up?
- The retrieval index above, which decides how much the sky lights live.
- Sound: `star-lit` per star (level = brightness), and `emote-point`, are hooks for 63/47.

- 2026-10-04 — **Retrieval fix landed (Janriz picked option 1).** `lib/rag/retrieve.ts` runs each search in its own transaction with `SET LOCAL ivfflat.probes = 100` (test first: red on the missing transaction, then green; 19/19 in lib/rag + lib/ai, tsc and eslint clean). Live, read-only check with three real questions: rows returned went 0 → 6, 2 → 6, 0 → 6. Refactor considered: pulling the probe count into a named constant tied to the index's `lists`, and a shared helper for exact vector search. Verdict: keep. There's one caller, and the comment states the rule.
