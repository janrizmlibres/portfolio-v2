# Finalize the hero and home: the sun behind home, the portrait, the threads, the planets

Round 2 of the opening's finalization, after Janriz picked the Earth (2026-10-02). He asked for:
- realism, "just like Edolus";
- the star the dive zooms into becoming an actual sun, with Earth seen against it ("Earth is the main focus just like now but with the sun as the backdrop");
- no rings ("earth doesn't have rings"), so the portrait moves;
- the threads ("the light streaks that spawn the text") and the portrait's frame finished;
- maybe the whole solar system in the dive, if it isn't too heavy.

Every open choice is a take on the real site, picked by the address. Measured on the `redesign` branch, uncommitted, on 2026-10-02 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## See them live

With the dev server on :3000 (the voyage is what a returning visitor sees). Each switch is independent, and the first take of each is the default.

| Choice | Takes | Address |
|---|---|---|
| Where the sun stands | **crescent** (default), dayside, eclipse | `?sun=dayside` |
| Where the portrait sits | **pin** (default), column | `?photo=column` |
| How a thread looks | **beam** (default), filament, hairline | `?thread=filament` |
| The other planets | **off** (default), on | `?planets=on` |

They combine: `http://localhost:3000/?sun=eclipse&photo=column&thread=filament&planets=on`.

`takes.ts` holds the switch. It goes once Janriz picks.

## What changed for every take

- **Home is the Earth** (`earth.ts`). The tiny world, the stone world, the stand-in and `?home=` are gone. The Blender file stays in `research/home-variants/`.
  - It leans on the Earth's real axis (23.4°) and turns west to east.
  - It's turned so the Philippines face you at About's reading spot.
  - **Lit from behind, its air glows:** light scattered forward through the atmosphere rings the night side, white towards the sun and reddening where it crosses the most air. Its day side warms where the light comes in low.
- **The sun is an actual sun** (`sun.ts`, written in code). It's drawn cheaply enough to stay under round 3's frame bar (see Frame cost). Far off it's still the sky's star. As the dive nears it, its own body takes over, by its size on screen, so the twinkle becomes the sun.
  - **The surface:** granulation that slowly boils, with a coarser network of brighter ridges. Cells under a few pixels across average out rather than shimmer.
  - **Its features:** sunspots with dark umbrae and streaked penumbrae, and faculae near the limb.
  - **Limb darkening** falls off faster in blue than in red, so the disc goes white-gold at the centre to deep orange at the edge.
  - **Round it:** a thin red chromosphere with spicules, three prominences arching off the limb, and the corona's glow with faint streamers.
  - **Under reduced motion** its surface holds still.
- **The dive, re-staged around it.** Same reading spots and timings.
  - 0 → 1.2: the dive into the star, which grows into the sun.
  - 1.2 → 1.55: skim past the sun's limb, with the sun filling half the frame and Earth ahead.
  - 1.55 → 2.2: an even arc round Earth, closing in, until the sun stands behind it at About.
  - As About reads, the camera drifts and the sun slides further behind Earth.
- **No ring, no plate.** The orbit, its hairline and the slab are gone (Janriz: "earth doesn't have rings").
- **The sizes:**
  - Earth's radius went from 0.0062 to 0.0015 sky units, so the sun (0.0088) can stand big behind it.
  - Home's position, the road and every later scene are unchanged.
  - At "Around home" the Earth is too small to show (only stars are points), and the sun is a small bright disc among the lit constellation.
  - **Where the sun stands on screen:** up and to the right of Earth on a wide screen. On a phone it stands to Earth's right, since the title rides above Earth there; above, it put the title on the sun's glow at 1.7:1.

## The takes

### Where the sun stands (`?sun=`)

- **crescent** (default). The true light: the sun huge at the upper right, behind Earth.
  - Earth shows a thin lit crescent towards it, its night side with city lights, the Philippines among them.
  - As About reads, the sun slides behind Earth's limb.
- **dayside.** The same frame, with the light Earth is lit by turned 54° towards the camera, so most of its day side faces you, as it did before.
  - It's a film cheat: the sun you see and the light on Earth don't quite agree.
- **eclipse.** The sun smaller (0.0034), so Earth can hide it whole.
  - Over the arc the sun slides behind Earth, and About opens on a total eclipse: Earth's night side, its air ringed with sunset light, and the bare corona streaming round it.
  - As About reads, the sun creeps back out towards the upper right.
  - On a phone the eclipse stays partial.

### Where the portrait sits (`?photo=`)

One element, two places, so either take renders the same page.
- **pin** (default). Like Edolus's labels on its 3D objects: a dot on Cebu's lights on the Earth, a leader line, and a card with the portrait, "CEBU, PHILIPPINES" and its coordinates.
  - The card is set out to the lower left, clear of Earth's disc. To do that, a label can now be given a direction and kept clear of its parent's disc: `placeLabels`, test-first.
  - It shows only while Cebu faces you.
- **column.** The portrait at the head of About's lines.
- **The frame, for both:**
  - a fine hairline, with its corners marked like a sighting;
  - the photo cropped to him (no more roof edge), and graded down into the scene's light so a bright, misty day doesn't glare out of the dark.
- **Phones and the plain page** show it in the column in both takes. On a phone it sits small beside the first lines, so they keep their room above the chat sheet. It fades in once About's lines are written.
- **A phone held sideways** has no room for it, so it isn't shown there. About's words say where he is.

### How a thread looks (`?thread=`)

The threads are now drawn as light: screened onto the picture, brightest at the free end where they're writing, fading back towards the star (`lib/film/thread-look.ts`).
- **beam** (default): a ray, with a fine white core in a softer band and a wide faint glow, its head a spark of light.
- **filament:** three fine strands braided along the way, as a prominence's are, converging on the star and the head.
- **hairline:** the single fine line it was, for comparison.

### The other planets (`?planets=on`)

The dive passes them on its way in, slowing by each:
- Neptune and Uranus far out;
- Saturn and its rings (shadowed by the planet);
- Jupiter, from Cassini's map;
- Mars;
- Venus crossing the sun's face as a small dot.

**How they're made:** Jupiter is NASA's Cassini map (public domain). The rest are written in code: banded gas giants, rusted Mars, cloud-wrapped Venus.

**How they're lit:** flying at the sun, every planet ahead is lit from behind, so they're laid out to the side, where you see their lit faces as you pass.

**They belong to the dive:** they fade as the camera turns round Earth. Left in, they crowded About and "Around home" like an orrery. A Moon by Earth was tried and dropped for the same reason: at About, Earth stands alone with its sun.

**It's a first take:** they're small in frame and pass quickly.

## Weight

| | Before | Now |
|---|---|---|
| The Earth's maps (day, night, clouds, relief) | 1.82 MB (JPEG, day and night at 4096) | **545 KB** (WebP, 2048; clouds at 1536) |
| The planets take | none | **+121 KB** (Jupiter's map); the others are code |
| glTF loader and Meshopt decoder | about 21 KB gzipped | not loaded (no `.glb` any more) |

## Evidence

- **Every reading spot:** `shots/<take>/` at 1440, 390 and 844 × 390, for default, dayside, eclipse, column and planets.
- **Every 0.2 screens, from 0 to 6.4:** `shots/<take>/inbetween/` for default, eclipse and planets.
- **Walkthroughs:** `out/opening-<take>-1440.mp4` (default, dayside, eclipse, planets, filament, hairline) and `out/opening-<take>-390.mp4` (default, eclipse), each with a `.sheet.png`.
- **Re-running:** `./evidence.sh`, with the dev server on :3000. `sheet.py` makes a contact sheet of any folder of shots.
- **Tuning shots:** `tune/` holds the shots taken while tuning.

## Contrast (`aa-<take>.txt`)

Every reading spot passes AA in every sun take. The portrait and the threads take no part in contrast.

| Take | Worst title | Worst text | Worst small print |
|---|---|---|---|
| crescent (default) | 5.9:1 (390, "Around home") | 7.0:1 (390, About) | 6.4:1 (1440, the caption) |
| dayside | the same as crescent | | |
| eclipse | 4.1:1 (1440, "About", over the corona; large text needs 3:1) | 7.5:1 | 6.4:1 |

**One fail found and fixed:** on a phone the sun stood above Earth, under About's title, at 1.7:1. It now stands to Earth's right there.

## Frame cost (`frame-cost-<take>.txt`)

Measured as before: the stretch from 0 to 6.45 screens played through in 10 s, then 150 frames at each reading spot. GPU times are mean / p95.

| | 1440: the stretch | 1440: About | 390: the stretch | 390: About |
|---|---|---|---|---|
| Round 3's bar | 4.66 / 7.21 ms | | 4.56 / 8.40 ms | |
| crescent (default) | 3.58 / 6.20 | 4.89 / 6.58 | 1.30 / 2.05 | 1.94 / 3.14 |
| eclipse | 3.12 / 5.73 | 4.97 / 6.02 | 1.16 / 1.85 | 1.80 / 2.96 |
| planets on | 3.60 / 6.46 | 4.79 / 6.61 | 1.37 / 2.39 | 1.63 / 1.77 |

- **Every take holds 60 fps.** The stretch is under the bar everywhere.
- **About on desktop** averages 4.8 to 5.0 ms: within 7% over the bar's mean, under its p95. The sun fills a quarter of the frame there.
- **Dropped frames:** each run drops 0 to 2 frames (33 ms) in the stretch. One of them is the old drop at 2.8 screens, already noted on *Build the hero and home*.
- **The sun's first draft cost 13 ms at About.** I brought it down by working its surface out more cheaply, at the same look:
  - the cell search went from 27 neighbours to 8;
  - hashes without `sin`;
  - noise of two octaves, not four;
  - sunspots and faculae worked out only where they show;
  - the corona stopped where it's too faint to see.

## Credits

- The Earth's maps: NASA Visible Earth (Blue Marble Next Generation, Black Marble 2016, Blue Marble clouds); its relief, the GEBCO Compilation Group's GEBCO 2008 Grid as rendered by NASA Visible Earth.
- Jupiter: NASA/JPL/Space Science Institute, Cassini (PIA07782).
