# One quality level a visit

Status: accepted (2026-10-13).

Janriz wants the site to run well on low, mid-range and high-end devices, phones most of all. The only device split
was the sky's tier (`pickTier`): a phone (a coarse pointer, or a short side under 600 px) got a sky capped at DPR 1.5
and a third of the far galaxies. The warp made its own call (`phone()` in `warp.ts`: portrait, or a short side under
600) and disagreed with it. The governor scaled only the sky's pixel ratio, never under DPR 1. Everything else cost
the same everywhere: 2048² shadow maps for home and Athena and 1024² for the crawler and the relay, redrawn every
frame, and Tycho's own canvas at DPR 2 with MSAA and a shadow, ungoverned. On a phone GPU, several times slower than
the M5 the film was tuned on (an estimate, not measured), the governor would sit at its floor and still miss frames,
with nothing left to give.

## Decision

- **One quality level for the visit: `high`, `mid` or `low`** (`Quality` in `lib/universe/tier.ts`), and a table of
  what each means (`DETAIL`). Everything that draws reads it there (`quality()`, `detail()`); nothing else decides
  whether it's on a phone for cost.

  | | high | mid | low |
  |---|---|---|---|
  | sky DPR at most (where the governor starts) | 2 | 1.5 | 1 |
  | far galaxies (made once, at load) | 24000 | 8000 | 4000 |
  | shadow maps (share of each one's full side, never under 256) | 1 | 1/2 | 1/4 |
  | Tycho's canvas: DPR at most, MSAA | 2, on | 1.5, on | 1, off |
  | the warp's stage Tycho: buffer at most | 1280 | 768 | 512 |
  | the warp lighter (coarser, plainer hole; fewer pieces) | no | yes | yes |

  `high` is the laptop's film exactly as it was; `mid` is what phones already had, plus half-size shadow maps and
  Tycho at DPR 1.5.
- **None of it changes composition, the camera or timing.** What's in the frame, where, and when is the same at every
  level; a lower level is softer and its shadows coarser. The one composition choice the warp's `phone()` made (how big
  Tycho flies on a small or portrait screen) stays a question of the screen's shape, not of quality.
- **A visit starts from cheap signals** (`startQuality`): a phone starts at mid; little memory and few cores (both
  reported, `deviceMemory` ≤ 4 GB and `hardwareConcurrency` ≤ 4) take a level off, and so does a GPU from a short list
  of well-known weak families (old Mali and Adreno, PowerVR, Intel HD Graphics before UHD), read from the renderer
  string the head script's WebGL probe already has in hand (`data-gpu`).
- **It only steps down, by the governor's judgement.** The sky's governor already judges each half second; once its
  pixel ratio is at its floor (DPR 1, or the step where fewer pixels stopped helping) and frames are still missed (with
  the GPU timer, the GPU over budget too) for four half seconds in a row, it asks for a level lower. Two steps at most
  (high to low), and never back up within a visit: shadows and a canvas that sharpened and softened by turns would read
  as a fault. A level change takes effect live where it can (shadow maps, Tycho's pixel ratio, the warp's next run); the
  galaxies and Tycho's multisampling stay as the visit started.
- **`?quality=high|mid|low` forces a level and holds it**, read like `?wake=off`, in development and automated
  browsers only.

## Considered

- **Redrawing a shadow map only when its light or casters move.** Most shadowed bodies move on the clock while
  they're shown, so their maps can't be held even while the film is still: home's ring turns on its own clock in About,
  Athena's moons and the crawler's settle on the clock after a hard scroll throws them, and Tycho never stops moving.
  The relay's map follows film time alone while it's lit, so it could be held while the visitor isn't scrolling, but
  proving nothing clock-driven enters its box (home's ship stands near it) and that a resized map is drawn again is
  more than its saving (about a quarter of a 2048 map's 2.6 ms at 1440 on the M5, less at mid and low) earns now.
  The light rig's culling (a dark light's map, or home's out of frame, isn't redrawn) stays the only skip.
- **A second judge for quality** (its own frame timer): two judges of one frame would fight. The governor's windows
  decide both, the pixel ratio first.
- **Stepping back up** once frames are cheap again: the cost that sent it down comes back with the next scene.
- **Calibrating during the wake-up's loader**, where the visitor waits anyway. During the wake only the hero's sky
  draws (3 draw calls, about 2 ms at 1440 on the M5, pure fill) and Tycho's canvas; the film's heavy scenes cost in
  shadow passes and geometry (120 to 250 draw calls, up to 720k triangles), so the wake's frame says little about a
  GPU's balance of fill against geometry. Calibrating for real would mean drawing the later scenes under the loader,
  and those load only after the wake by design. The governor already judges the wake's frames, so a device that can't
  hold even those steps down before the film starts.

## Measured (2026-10-13, Apple M5, headless Chrome on Metal; `.scratch/redesign/research/perf/`)

- `high` at 1440 matches the film before the change: the same draw calls, sky GPU ms within the run-to-run spread in
  most scenes, and frames that differ from the old ones no more than two shots of the old film differ from each other.
- At phone size (390×844, DSF 3), the sky's GPU ms a frame falls from high to mid by 21 to 37% and from mid to low by a
  further 9 to 29% (work 4.2, 3.0, 2.4 ms; crawler 5.1, 4.1, 3.2 ms; median of 3 runs each).
- Under a 12× CPU throttle (the M5 drops nothing at 4×), playing the film at a screen a second drops 720 frames of
  about 1900 at high, 674 at mid and 622 at low (median of 3). With the GPU timer hidden, as on most phones, a visit
  starting at mid stepped to low on its own during the film and dropped 534 to 549; a 1440 visit stepped high, mid, low.
