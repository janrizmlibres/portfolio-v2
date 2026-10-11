# Finalize the wake-up, round 1: the moment every load opens on

PROTOTYPE, built on the `redesign` branch (uncommitted) on 2026-10-04. Shown on the real site, in takes.

## See it

- **Open** `http://localhost:3000/`. In your browser the wake-up plays on every load; automated browsers skip it unless the address says `?wake=on`. `?wake=off` skips it for you too.
- **The take switcher** (top left) flips between:
  - `wdraw`: line, silhouette or still;
  - `wspot`: stage or corner;
  - `wcharge`: band or log;
  - `wpace`: slow or real. Slow holds each segment at least 0.45 s, as a slow phone line would, so the charge can be judged. On a warm dev load the real pace is over in about a second.
- **The sequence:** the charge, then the takeover, then the doze with `[ WAKE ME ]`. Click or tap anywhere, or press Enter or Space on the chip. He wakes, flies to his corner from the stage, greets, and his bubble opens on the greeting.

## What each part is, and how it's made

| Part | Made by | Weight |
|---|---|---|
| **The flat sky** | An inline script, run as the HTML is parsed, projects the 93 stars with the hero's camera (`lib/wake/flat-sky.ts`, tested against three's own camera math) and draws them as SVG before first paint. Once the 3D has taken over, the drawn stars sit within **0.07 px** of the sky's own projection at 1440 and 390. | stars ≈ 6 KB, script ≈ 2 KB |
| **Tycho, line** | Blender's Line Art from `explorer.glb`, through the rig's exact camera (`flat.py`), simplified into SVG paths (`build.py` → `lib/wake/drawing.ts`). It lies on the render's edges to the pixel (`out/match-overlay.png`). | 6 KB gz with the outline and glyphs |
| **Tycho, silhouette** | The union of every projected triangle (Shapely), filled flat and unlit. | in the same 6 KB |
| **Tycho, still** | His own rig's first frame, grabbed headless (`match.js`) and saved as WebP. | 12 KB, a separate request |
| **The lit parts** (eyes shut, beacon, charge band) | Each glyph projected and hulled in Blender. All eight band segments face the camera (visibility 0.77–1.0). Unlit `#ffa95a`, as the rig draws them. | — |
| **The charge** | A segment per real milestone of this load: the page painted, the 3D started, the stars, three.js, his model, the ship, the first scene built, and two frames drawn by both (the warm-up). It never goes backwards. | — |
| **The takeover** | The 3D sky held at the drawing's frame (`sky.cam.az` set to the hero's), and the rig held at rest (`rig.idle(false)`: no bob, no sway, no look-at), eyes shut, band full. Line: the render's light fills the drawing in (0.9 s), the sky's light comes up (1.6 s). Silhouette: one diagonal wipe over the whole frame from the key light's side, linear, 0.75 s, with a bright edge (US Avionix's numbers). Still: he swaps with no visible cut, and the sky's light comes up. | — |
| **The doze and the chip** | `rig.doze()`, then a leader line drawn out of his head to a bare `[ WAKE ME ]` chip in the hand's manner. Its brackets spread with the pointer's speed. Its accessible name is "Wake Tycho (turns on sound)". | — |
| **The lock** | No scroll (wheel, touch, keys), no clicks reaching the page, no route map, no stars, no ask buttons, until he wakes. | — |
| **The wake** | A stand-in chime: three sine partials rising, until *Finalize the score* gives him his chirp. Then `rig.wake()`, the chip closing on its words, the flight to his corner (stage take: a gentle arc, 1.25 s), `rig.idle(true)`, greet, and the bubble opens on the greeting. | — |

**Tiers:**
- **Reduced motion:** the drawing is still and the segments step without easing. The takeover is a 0.3 s crossfade on every take, and the wake fades him out on the stage and in at his corner.
- **Phones:** the stage is 150 px over the sky's lower half, with the chip under him on the centre line. The corner is 92 px.
- **No WebGL:** no wake-up (the inline script checks `data-film`).

## Evidence

- **Contact sheets:** `shots/sheet-1440.png` and `shots/sheet-390.png`. Each take shows first paint, mid-charge, the doze, waking and the greeting.
- **Reduced motion:** `shots/*-still-1440-*.png`.
- **Recordings (MP4, 60 fps, 1440):** `recording/wake-{line,silhouette,still}-stage-band-1440.mp4` and `recording/wake-line-corner-log-1440.mp4`.

## Not in this round (Build the wake-up's)

- The 10 s fallback into the plain page.
- A deep link landing on its reading spot after the wake. Today the wake-up starts the page at the top.
- The returning visitor's welcome back: the bubble always opens on the first greeting.
- Server-side stars sized to the real viewport. Today the script draws them for the window it finds.
- Frame cost while charging: both canvases draw hidden, as they did before.

## Scripts

`flat.py` (Blender, headless) → `build.py` (Shapely, writes `lib/wake/drawing.ts`), `match.js`, `shots.js`, `sheet.py`, `record.js`.

## Round 2: its own loading page (2026-10-04)

**Janriz's turn:** "I actually want to be its own loading page. No name, text, and hero section yet. Tycho is at dead center. Just make sure we have a nice background."

**What changed:**
- **The loading page covers the hero.** The name, the text, the route map and the stars' hand are hidden until he wakes. The page's HTML is still complete underneath, for crawlers and screen readers.
- **Tycho is dead centre** at min(38vh, 340 px), or min(52vw, 220 px) on a phone, with the chip and the log centred under him. The `wspot` take and the leader line are gone.
- **The wake:**
  - the loading page gives way to the hero;
  - he flies from the centre to his corner (an arc, 1.35 s);
  - the name's rows rise in with the prototype's arrival (1.1 s, expo.out, staggered 0.09 s);
  - he greets, and his bubble opens.

  Under reduced motion every part of it is a 0.3 s fade.
- **The hero's sky waits at its first frame** (`sky.cam.az` held) until he wakes, so the page always gives way to the same frame.

**The background, `wbg`** (built by the inline script before first paint):

| Take | What it is | On the wake | Weight |
|---|---|---|---|
| **focus** | the hero's own sky out of focus: a capture of the 3D sky's first frame (`bg.js`), shrunk and softened into an inline WebP, then upscaled under a CSS blur | the page pulls focus onto the real sky (blur 26 px → 0, scale 1.08 → 1, 1.9 s) | 1.6 KB landscape, 1.2 KB portrait |
| **sky** | the hero's own sky, sharp, without the name: the 93 stars projected as in round 1, and the 3D sky takes over from them at the takeover | the name rises into it | the round-1 stars, ≈ 6 KB |
| **field** | a deep field of its own: near-black, seeded fine stars (about one per 2,600 px²), 45 % of them along a faint band of the galaxy | it dissolves into the hero (1.4 s) | the script only |

**Evidence:**
- **Contact sheets:** `shots/sheet-r2-1440.png` (every background with the line drawing, plus silhouette on focus and still on focus with the log) and `shots/sheet-r2-390.png`.
- **Recordings:** `recording/r2-wake-line-{focus,sky,field}-band-1440.mp4` and `recording/r2-wake-line-focus-band-390.mp4`.

## Round 3: a loader first, then Tycho in 3D (2026-10-04)

**Janriz's turn:** "I don't like it. Take a look at Edolus and Trionn loading pages at the very start. Maybe let's just adopt that. After the load we then see Tycho already in 3D form with a 'mock' charging up then clicking will turn sound on. This is how Edolus does it."

**What changed:**
- **The loader comes first** and covers everything. It counts the real load, never backwards: the page, the 3D starting, the stars, three.js, his model, the ship, the first scene built, and two frames drawn by both. The count is a continuous %, capped at a full count in 0.8 s (3.6 s on `wpace=slow`). A screen reader hears it as a polite status every 25 %.
- **Then Tycho, already 3D,** at dead centre over the hero's sky. The name isn't there yet, and the sky is held at its first frame.
- **He charges up as a show** (the load is done): the band fills a segment every 0.28 s. Then he dozes, and `[ WAKE ME ]` shows under him.
- **The click** turns sound on (the stand-in chime), wakes him, and flies him to his corner while the name rises in. Then he greets, and his bubble opens.
- **Gone from rounds 1–2:** the flat drawings at first paint (only the line drawing survives, as Trionn's mark), the backgrounds, the log, the wipe, the flat-sky projection and the out-of-focus images.

**The loader, `wload`:**

| Take | After | What it does |
|---|---|---|
| **edolus** | Edolus's cold load (`case-studies/edolus/motion/08-cold-load`) | Black. The name types in a letter every 75 ms, in Jost capitals tracked wide, with a small DM Mono count under it. At 100 a hairline of the stars' light sweeps across the name (0.9 s), the name goes, and the black fades onto the sky (0.8 s). |
| **trionn** | Trionn's cold load (`case-studies/trionn/motion/01-cold-load`) | Light grey `#d2d2d2` with a "+". Then a frame with corner ticks draws round Tycho's line drawing (the mark), which slides up into it, with "JANRIZ · LIBRES" under it and a three-reel counter at the bottom. At 100 the count and name go, the ticks spread, and the grey fades out onto the sky. The frame is Tycho's own box, so the 3D Tycho is exactly where his drawing was. |

**Evidence:**
- **Contact sheets:** `shots/sheet-r3-1440.png` and `shots/sheet-r3-390.png`, showing first paint, mid-load, the charge-up, the doze and the greeting.
- **Reduced motion:** `shots/r3-edolus-still-1440-*`.
- **Recordings:** `recording/r3-wake-{edolus,trionn}-1440.mp4`.

**Still to do in the build:** the inline script belongs in `<head>` beside the tier script, so the loader is up before anything else paints.

## Round 4: the charge-up made sleek (2026-10-04)

**Janriz's turn**, on round 3's charge-up: "It looks like a diorama or a view of an unfinished 3D game scene with the default camera. I want it to look sleek. Like professional." He pointed at Trionn's hero and Edolus's landing.

**What made it read as a toy:** light from every side (a room environment and a front key), a small figure dead centre, the rig's straight-on default camera, and a busy nebula behind him.

**What changed (rig: `look()` and `view()`):**
- **Low-key light.** He's dark but for two cool edges from behind. The band's own warm light grows with the charge and falls on his visor's rim and his chest, so the charge is what shows him (warmth is energy, ADR 0002).
  - `lowkey`: key 0.16, rims 3.6 and 2.8, environment 0.035, band 0.65.
  - `backlit`: the same with more fill, against the sky.
- **A cinematic camera.** He fills the frame (82 vh). He starts from low and off his right (az 0.7, el −0.18, 1.3× out) and comes round and in over 4.4 s to a three-quarter angle (az 0.34, el −0.1, 0.9×).
- **A dark stage.** `reveal` is black; `backlit` has the hero's sky behind him at 40 %, blurred 7 px. When he wakes, his everyday light and framing come back (1.4 s) and the sky comes up sharp (1.6 s) as he flies to his corner.
- **The wake button** (`wcta`): the bare chip, or Edolus's white button with corner ticks, low on the screen.
- **The charge-up is slower:** a segment every 0.42 s, then 3.8 s before he dozes.

**Evidence:** `recording/r4-wake-edolus-{reveal-bracket,backlit-edolus}-1440.mp4`, and frames in `shots/r4-*`.
