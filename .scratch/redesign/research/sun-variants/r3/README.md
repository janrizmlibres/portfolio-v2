# Finalize the hero and home, round 3: Earth bigger, the solar system, the take switcher

Janriz's answers to round 2 (2026-10-02), and what was done with each:
1. **The sun: dayside.** "Can't see anything with crescent and eclipse." Crescent and eclipse are gone. He also asked for Earth "bigger just like in Edolus to make it more cinematic", so there are two takes on that (below).
2. **The portrait: pinned to Cebu.** The column take is gone. Phones and the plain page still show the portrait in the column, as before.
3. **The threads: beam**, but he dislikes text arriving by light at all and asked for the prototypes from before it (see Before the light). Filament and hairline are gone; the beam stays until he decides.
4. **The planets: kept**, through the dive and the zoom-out, and re-made so the solar system grows as you near it rather than planets popping in. He asked whether they went at About for performance: no. They cost nothing measurable; I faded them because they crowded About.
5. **Mid-round:** "make it easier to switch between the takes / choices so I don't have to manually change the params". There's now a take switcher on the page.

Measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See it

With the dev server on :3000. The voyage is what a returning visitor sees.

- **The take switcher** is the "Takes" chip at the top left. Click it and pick a take. The page reloads on the same frame.
  - It only exists in development, and automated browsers don't get it, so no evidence shot shows it.
- **Or by address:** `http://localhost:3000/` is the horizon (the default), and `http://localhost:3000/?earth=disc` is the disc.

## Earth at About: two takes (`?earth=`)

- **horizon** (default): as close as Edolus's Earth. Its limb arcs across the frame from the bottom left, Earth fills the lower right, and his star rises over the limb behind it: a sliver of the disc, the prominences and the corona's glow. Cebu is on the visible face, pinned to the card at the bottom left.
  - **On a phone:** Earth fills the top of the frame, the sun rising at its edge, with the lines below.
- **disc**: the whole Earth, about 1.8 times as big as in round 2 (its radius 0.6 of half the frame's height, was 0.34), with his star huge behind it to the right. On a phone, Earth fills the top half.

**How it's shot:**
- **The camera turns, it doesn't shift its lens.** Putting Earth's centre off the frame with a lens shift stretched everything far from the frame's centre into ellipses; turning the camera doesn't.
- **Cebu is put where the shot wants it** by casting a ray from the camera at About's reading spot through that pixel. Turning the Earth sets only its longitude, so its axis leans as well, as near upright as puts Cebu's latitude (10° N) there.
- **The light on Earth turns towards the camera wherever it's seen from** (the dayside cheat, now following the camera), so it never reads as a black disc from afar.
- **The sea's glint** mirrors where the sun really is, not the cheated light, so there's no hot spot in the middle of the ocean.

## The solar system (`planets.ts`)

- **One system round his star**, laid out in one plane through Earth's orbit: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.
- **The scale is a film's, in order.** Orbits and sizes are each the real ratio to Earth's raised to a power (0.6 for orbits, 0.4 for sizes), so:
  - the sun is the largest body by far (5.9 Earths across);
  - Jupiter and Saturn are next (2.6 and 2.5 Earths);
  - Mercury and Mars are the smallest;
  - the orbits widen outwards the way they really do.
  - In round 2 the giants were bigger than the sun.
- **Nothing appears from nothing.** From the start of the dive (0.05 screens) each planet is a faint point of reflected light round his star. It brightens and grows into a disc as you near it. At 0.4 they're dots strung out round the star; by 0.8 you see a solar system.
- **The dive passes the giants**, alternately on each side. The camera path is the same as before (no extra keys).
- **Earth is one of them.** It comes out from behind the sun's limb at 1.4 and grows through the arc, rather than fading in at 1.35.
- **They stay** through About and the zoom-out to "Around home", where the system shows small round the sun, Saturn's rings and all. They go as the camera turns for the road (6.45 to 6.95 screens).
- **They're kept out of About's frame:** each giant is 65° or more round its orbit from the dive's side, so seen from Earth it's well clear of the sun.
- **Each is lit with the light turned most of the way towards the camera**, so a planet passed between the camera and the sun shows its lit face.

## The threads

Only the beam remains (`thread-look.ts`). Whether lines arrive by light at all is open: see below.

## Before the light: the earlier prototypes

The light idea (a line written along a hairline of its star's light) came in with *Finish one scene*. Before it:

| Round | How text arrives | Link | Command |
|---|---|---|---|
| Storyboard round 1 | each hold's text arrives at its own pace and fades as you leave; the camera holds still for it | http://127.0.0.1:4178/ | `.scratch/redesign/prototypes/voyage-storyboard/serve.sh` |
| Storyboard round 2 | text writes in and dissolves word by word, tied to the scroll (backwards too); each About line lights the stars it's about as it writes | http://127.0.0.1:4179/ | `.scratch/redesign/prototypes/voyage-storyboard-2/serve.sh` |
| Storyboard round 3 | text arrives the way its scene moves: About's words come out of their stars and go back (no light), monolith text is cut into the stone, crawler words do what each stage does | http://127.0.0.1:4180/ | `.scratch/redesign/prototypes/voyage-storyboard-3/serve.sh` |
| *Finish one scene* (the light idea) | lines written along a hairline of their star's light; titles letter by letter | http://127.0.0.1:4181/ | `.scratch/redesign/prototypes/finish-one-scene/serve.sh` |

All four were running on 2026-10-02. The real site's film engine already has round 2's and round 3's word modes (`lib/film/modes.ts`), so whichever he picks can go onto About as a take in place.

## Contrast (`aa-<take>.txt`)

Every reading spot passes AA in both takes, at 1440, 390 and 844 × 390.

| Take | Worst title | Worst text | Worst small print |
|---|---|---|---|
| horizon | 5.5:1 (390, "Around home") | 7.5:1 (390) | 6.4:1 (1440, the caption) |
| disc | 5.9:1 (390, "Around home") | 7.1:1 (390, About) | 6.4:1 (1440, the caption) |

About itself in the horizon: title 9.4:1 and text 7.9:1 at 1440; 8.1:1 and 7.5:1 at 390; 10.6:1 and 8.1:1 at 844 × 390.

**Fails found and fixed:**
- **The corona washed the left of the horizon frame.** With Earth hiding most of the sun, the round-2 eclipse logic brought up the bare corona and washed the sky behind the lines pink: text at 4.0:1 at 1440 and 3.7:1 at 844. The bare corona now shows only at totality. While any of the disc shows over the limb, its light drowns the corona out, as it really does.
- **On a phone, the horizon's title rode onto Earth's clouds** (1.5:1). Earth fills the frame past the point it rides from, and pinned to the frame's edge it sat on the clouds. A title whose point is out of the frame now heads its lines instead (`placeTitle`, test-first).
- **On a phone held sideways, About's lit stars sat behind the lines** (4.3:1). There the horizon turns the camera further, which takes them out from behind.

## Frame cost (`frame-cost-<take>.txt`)

Measured as before: the stretch from 0 to 6.45 screens played through in 10 s, then 150 frames at each reading spot. GPU times are mean / p95 in ms.

The two takes measured back to back, in the quietest pair of runs (the hero at 2.0 ms, as in round 2):

| | 1440: the stretch | 1440: About | 390: the stretch | 390: About |
|---|---|---|---|---|
| Round 3's bar | 4.66 / 7.21 | | 4.56 / 8.40 | |
| Round 2 (crescent) | 3.58 / 6.20 | 4.89 / 6.58 | 1.30 / 2.05 | 1.94 / 3.14 |
| **disc** | 3.64 / 6.54 | 4.55 / 7.41 | 1.75 / 4.28 | 2.06 / 4.68 |
| **horizon** | 4.56 / 9.67 | 6.15 / 9.35 | 1.78 / 3.98 | 2.34 / 5.02 |

- **Both hold 60 fps.** Each run drops 0 to 2 frames over 20 ms in the stretch.
- **The disc is under the bar.** The horizon's mean is under it, but its p95 is over (9.67 against 7.21 ms) and its About is about 35% dearer than the disc's.

- **The measurements this round are noisier than round 2's.** Janriz's own Chrome was rendering the site in the background (its GPU process at about 20% CPU), sharing the GPU. In the noisier runs the hero, where nothing new draws, rose by 0.6 to 1.1 ms in both takes, and hiding the planets didn't lower it (2.13 ms without them, 1.68 with). The horizon's About measured anywhere from 6.2 to 8.5 ms across runs. The table is the quietest pair; compare the takes with each other.
- **The horizon's About costs about 1.6 ms more than the disc's.** Earth covers most of the frame there, and every pixel of it is drawn three times: ground, clouds, air. If the horizon is picked, folding the clouds into the ground pass (which already reads the cloud map) is the first saving.

## Engineering

- **New:** `components/voyage/TakeSwitcher.tsx`; `withTake` and `TAKE_NOTES` in `takes.ts`.
- **`planets.ts` rewritten:** the system's plane through Earth's orbit, compressed scale, the point layer, and the light turned towards the camera.
- **`earth.ts`:** `lean(pole)`; the glint from the real sun (`uSun`); the maps wrap; polar clouds thin out; 4096 maps.
- **`home.ts`:** home is drawn as a point among the planets (its disc from about 5 px across there); the corona only at totality.
- **`stage.ts`:**
  - the two Earth takes;
  - About's keys turn the camera (`aboutPose`, `aboutKey`);
  - Cebu by ray cast and lean;
  - Earth's light follows the camera;
  - the planets always on;
  - the crescent and eclipse takes gone.
- **Removed:** the sun, photo and thread takes; filament and hairline (`thread-look.ts` is the beam alone); the CSS for the column take.
- **`placeLabels`:** the whole box clears the parent's disc. **`placeTitle`:** an out-of-frame point sends the title to its lines. The label's clearance includes the air (`ax: 1.08`).
- **TDD:** `takes` (the new shape, red then green), `withTake`, `placeLabels`' whole-box clearance and `placeTitle`'s out-of-frame rule, each red then green.
- **Refactor verdicts:**
  - **`placeLabels`:** the box's x formula, written twice, went into one helper (`boxX`). The 4 px step search stays: a closed form for a box against a circle isn't worth it.
  - **`placeTitle`:** an `inFrame` helper was considered and rejected; it has one caller.
  - **`withTake`:** three lines, keep.
  - **The noise GLSL in `sun.ts` and `planets.ts`:** still two copies. Now that the planets stay, sharing it is worth doing when the picked take is finished.

## Fixed along the way

- **The cloud map clamped at its edge instead of wrapping.** East of the date line, the drifting clouds smeared the map's last column into streaks. Round 2 had it too, but that part of the Pacific never faced the camera.
- **The cloud map's polar rows are smeared** in the source, so clouds thin out from 72° of latitude. The polar ice in the day map holds there.
- **A label set out a given way now keeps its whole box clear of its parent's disc**, not just the end of its leader. Where the rim slopes away under it, the label goes further (`placeLabels`, test-first). It also clears the air round the disc.

## Left for finishing the picked take

- **At 2.0 screens** Jupiter, Venus, Mars and Mercury line up to the sun's right as the arc passes, which reads a little like a diagram. Mars and Venus sit in nearly the same direction as Jupiter; moving them round their orbits fixes it.
- **The horizon's cost:** fold the clouds into the ground pass.
- **The 4096 maps:** decide whether everyone gets them, or only wide screens or idle loading.
- **The shared noise GLSL** (see Refactor verdicts).

## Weight

| | Round 2 | Round 3 |
|---|---|---|
| Earth's day map | 2048, 139 KB | **4096, 403 KB** |
| Earth's clouds | 1536, 197 KB | **4096, 993 KB** |
| Earth's maps in all | 545 KB | **1.60 MB** |
| The planets | 121 KB (Jupiter's map) | 121 KB |

The horizon puts Earth's surface 2,000 device pixels across on a retina screen, and at 2048 the clouds were soft. Everything here loads after first paint. If 1.6 MB is too much, the 4096 maps could load only on wide screens, or after the 2048 ones once the page is idle.

## Evidence

`./evidence.sh` re-runs all of it, with the dev server on :3000.
- **Every reading spot:** `shots/<take>/` at 1440, 390 and 844 × 390.
- **Every 0.2 screens from 0 to 6.4:** `shots/<take>/inbetween/` at 1440 and 390.
- **Walkthroughs:** `out/opening-<take>-1440.mp4` and `out/opening-<take>-390.mp4`.
- **Contrast:** `aa-<take>.txt`. **Frame cost:** `frame-cost-<take>.txt`.
- **Tuning shots:** `tune/`. **The 2048 maps:** `maps/orig/`.

## Credits

- The Earth's maps: NASA Visible Earth (Blue Marble Next Generation, Black Marble 2016, Blue Marble clouds); its relief, the GEBCO Compilation Group's GEBCO 2008 Grid as rendered by NASA Visible Earth.
- Jupiter: NASA/JPL/Space Science Institute, Cassini (PIA07782).
