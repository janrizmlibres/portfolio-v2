# The ring made real: pre-rendered vs real-time, round 1 (2026-10-10)

Janriz, 2026-10-10: "I want the ring ship … to look like irl. And have it take half of the screen like in Edolus. It will
keep spinning as it does, showcasing the outer exterior to the fullest … since we start with the zoom in, we could have
it pre-rendered and just make sure we pull off the transition. let's settle it by eye first."

Open `compare.html` (a wipe between the two renders, with crops and today's ship for reference).

## What's here

- `tex.py`: tileable maps made with numpy (quilted MMOD blanket, gold and silver foil, aluminium, radiator, solar cells). Both renders use the same files.
- `ring_irl.py`: the realistic ring, built headless in Blender 5.2 by `run.sh` (`MODE=preview|frames|cycles|export`, under the heavy lock). Same plan as the ring he kept (twelve bays, hub, four spokes, radius 1, turning on +z). Its pattern repeats every quarter turn, so a 90° turn loops.
  - Pressurised modules are cylinders in quilted white blankets with conical ends, berthing rings, handrails, grapple fixtures, a few dark windows and cable runs.
  - Labs carry an exposed platform; power bays carry solar array wings above and below the ring.
  - The spokes are lattice trusses with a transit tube.
  - The hub has a blanketed docking adapter with a gold-foil band, and a radiator pair aft.
  - 62,792 triangles.
- `shot.json`: the one shot both renders read. 1440×900 (rendered at 2×), vertical FOV 30°, 18° above the ring's plane, ring on the right. The sun is 1.7π W/m² (the site's key). The fill is a uniform 0.07 (about 4% of the key, roughly earthshine), so shadows read as space shadows. PBR Neutral throughout.
- `harness/`: the three.js render, built from the site's own `neutralOut` and `occludeDirect`, a 2048 PCF shadow map, no AA at DPR 2 (as the site draws).
  - `?msaa&soft&shadow=4096&probe=1` is the pushed version: MSAA, a 4096 map, and a reflection probe captured in linear light.
  - `capture.mjs` shoots it headless on the GPU.
- `out/`: `cycles.png` (Cycles, 256 samples, denoised, 2 min 19 s on the M5), `rt.png`, `rt-pushed.png`, their crops, and `today.png` (cropped from his screenshot).

## What the eye test shows

- **The whole frame:** the two are close. In black space under one hard sun, real-time does well.
- **Close up, Cycles wins on:**
  - **Bounce light:** sunlit modules light the shadowed parts beside them (the silver end cones, the truss's underside, the hub's dark side). In three.js those go near black.
  - **Fine shadows:** the truss's lattice shadow on the hub is crisp. Real-time smears it into blocks at 2048, better at 4096.
  - **Foil:** gold and silver foil reflect the station. In real-time they have nothing to reflect.
  - **Edges:** clean, against slight jaggies on handrails without AA.
- **The pushed real-time version** closes the edges and some of the shadow gap, but not the bounce. A probe from inside the ring mostly sees black space. (PCFSoftShadowMap is gone from this three; it falls back to PCF.)
- **The bigger leap is the model itself:** today's ship against the new one, whichever renderer draws it.

## Not done yet

- **The model's weight:** the raw GLB is 25 MB (2048 PNG maps). The site's would need compressed, smaller maps.
- **No frame-cost measurement** of the new model on the site.
- **No pre-rendered loop:** a 90° loop at 1° a frame would take about 3.5 h of Cycles at 2880×1800.

## His pick, and the build on the site (round 2, 2026-10-10)

Janriz: "I actually like the lighting of the live 3D more … it looks more realistic." He went with real-time and asked for:
- a still camera once About is settled, "lower and much closer to the exterior. Imagine we're panning to a shot of the modules";
- the ring's spin constant once settled, not controllable by scroll, with the scroll moving on to the next section.

What changed:
- **The ship:** a new take, `real`, is the default. The ring as it was and the truss stay on the switcher (`?ship=ring`, `?ship=truss`).
  - Its model is `public/voyage/ship/real.glb` (1.58 MB; today's ring is 0.95 MB), built by `site.sh` (`MODE=site`).
  - The model carries the crew capsule ("visitor") and is scaled round the hub, so it turns true. Its rim is at 0.958 of its bounding radius.
  - Window frames and fittings are painted or anodised: in space a mirror metal reflects black.
- **Light:** the site's About fill was already about 4% of the key, as the harness had it. The difference was the shadow strength, 0.8 on the site. The real ship's shadows are at full strength (`POSE.real.shadow`).
- **The camera:** `aboutHold` in `lib/voyage/about.ts`.
  - It pans from the whole ring down and in onto the modules at an even pace (the distance in log space), its aim moving from the hub to the modules.
  - It holds dead still from About's words being in (2.75) to their having gone (3.94).
  - It pulls out to Around home (4.85), mirroring the way in.
  - The hold (`HOLD`): 1.65 rims from the hub, 9° above the ring's plane, aimed 56° round at the rim. On a phone: 1.75 rims, centred, in the top third.
  - The aim sits at (0.47, 0.56) of the frame. It was (0.64, 0.58) until Janriz, on a wider screen: "it's so far to the right 😭. i want the ship to take up at least half of the screen." The station now starts just left of the middle and runs off the right edge at 1440×900, 1800×990 and 2560×1080 (`shots/r6-sheet.png`).
  - The framing was chosen from captures in `shots/r2`, `shots/r3` and `shots/r5`.
- **The spin:** `ringSpin`. It follows the scroll (0.25 rad a screen) until 2.75, then only the clock (`RING_TURN.rate`, 0.02 rad/s). A spin check (`spin-check.mjs`) shows the ring half changing over 6 s with the scroll untouched while the words' half stays put.
- **Frame cost** (GPU mean / p95, the bar 4.66 / 7.21), `perf/`:
  - About at 1440: 4.10 / 6.03 (today's ring 3.55 / 5.50);
  - About at 390: 1.87 / 2.73;
  - 60 fps throughout.

## Round 3 (2026-10-10): wider screens, the ship gone by Around home, no peel

- **"it's so far to the right 😭. i want the ship to take up at least half of the screen":** the hold's aim moved from (0.64, 0.58) to (0.47, 0.56). See round 2's note and `shots/r6-sheet.png`.
- **"by here [Around home] it should not be visible anymore":** the ship fades out as the camera pulls away (`O(5.55) − 0.6`, over 0.5 screens) and the film never comes back to it.
- **"remove zoom in and unroll as we go to the work timeline. From 'Around Home' it should immediately go to the work section":**
  - The orbit's peel is cut: no return to the ship, no orbit, no unroll.
  - Work's intro writes in as Around home's words leave, while the camera flies straight to the road's start (`ROAD`, 6.32), reached as the intro finishes writing in.
  - The road fades in whole, its rings and monoliths with it.
  - Everything from Work on runs 0.81 screens sooner (`CUT`); the film is now 41.64 screens. The storyboard test confirms a pure shift.
  - The orbit round home is removed from `home.ts`, `world.ts` and the stage, for every take.
  - The peel's one-shot (`peel`) no longer has a cue. Its rendered files stay in `public/audio/` and `scripts/audio/render/fx.py` until the next `pnpm audio:export`.
- Shots: `shots/r8-sheet.png` (Around home to the ride).

## Round 4 (2026-10-10): the hub back in the shot, lower and closer

Janriz: "i want to still see the stem / center of the ship … But the angle is lower and closer. It should be like 1 module almost taking up half of the screen."

- **The hold now looks across the near modules at the hub** (`HOLD`: 5.5° above the ring's plane, aimed 0.1 rims up the hub's axis, the hub's stem at (0.9, 0.46) of the frame). The nearest module fills the middle and the stem stands at the right edge.
- **How far out it stands now comes from the frame's width** (`holdOut`): the closest distance at which the ring's near end, projected from the camera, stays right of About's words (0.345 of the width). That's 2.21 rims at 1440×900, 2.00 at 1800×990 and 1.67 at 2560×1080.
  - A plain formula failed: the ring's thickness and closeness broke it, and on the ultrawide it brought the camera in under the words.
- **The limit:** standing closer (1.35–1.72 rims, `shots/r9`, `r10`) gives a module near half the width, but the ring's near end then runs under About's words at any width. As it stands, the near module covers about a third of the width.
- **On a phone** the station sits across the top half, centred, the words below on clear dark (`HOLD_PORT`: 2.5 rims, 8°).
- Shots: `shots/r13-sheet.png`.

## Round 5 (2026-10-10): a slant, and the portrait card under the ring

- **"it's straight horizontal … make it slightly oblique or slanting like before":** the hold moved round to −55° and up to 9°. The ring is posed tilted, and from there the near modules run from the upper left down to the right, the far side rising to the hub. Compared in `shots/r14` and `r15`; the result is `shots/r16`.
- **The portrait card** hung off the ring's near end and, at 1440×900, covered the end of About's words. For the real ship it now hangs from the near module's underside, out into the dark below the ring (`ships.ts` `edge`). It's clear of the words at 1280×1024, 1440×900, 1800×990 and 2560×1080 (`shots/r17-sheet.png`).

## Round 6 (2026-10-10): the `cloth` finish, and the radiators' speckle

Of the `sfinish` take Janriz liked accents over metal, "but I kinda want it to be more realistic? … Without going full metal?". `?sfinish=cloth` is accents with the rest made real (`lib/voyage/finish.ts`):

- **The blankets are beta cloth.** They keep their own colour, quilting and roughness maps. The normal map runs at ×3, so the wrinkles and quilting show, with a soft sheen and the studio at 0.2. `weave` gives each quilted panel its own white from a 32×16 table (`panelTones`): about a third as they were, a quarter yellowed, a fifth newer and brighter, a fifth greyer, and no two touching panels alike. It adds grime where the baked occlusion is deep: round the hatches, berthing rings and fittings. The panel under a point is found from the quilting's own UVs (`tex.py`'s blanket: four panels across a tile, two down, alternate rows staggered by half).
- **The radiators** are glossy white: their ribs, a light clear coat, the studio at 0.45.
- **The solar cells** keep their grid and its silver fingers (their metalness map; foil's packs its roughness there, so foil doesn't keep it) under a thin film (`iridescence`, 260–420 nm) that shifts blue to violet as the ring turns.
- Tuned live: normal ×1.8, ×3.2 and ×4.5; ×4.5 looks crumpled.

**The radiators' blotches were a defect, now fixed in every finish.** They were the shadows of the lattice spokes, smeared by the key's shadow blur (`shadow.radius` 3, which three samples with a noisy disk) into speckled clouds. With radiators set not to receive shadows they're clean. At radius 1 the shadows are crisp lattice, and his star is near a point, so that's also right. `POSE.soft` in `ships.ts` is 1 for the real ship; the ring and the truss keep 3.

Shots: `../relay/shots/station-cloth/` (accents and cloth at 2.30 and 3.20) and `../relay/shots/station-cloth-sheet.png`. The ring turns on its own clock, so the two aren't the same instant.

**Frame cost at About** (1440×900 @2, the GPU timer, `perf.js` and a fresh page per run, alternated in one session):
- **Resolution held at DPR 1.8:** accents 8.45 and 8.55 ms mean; cloth 10.45 and 9.87; cloth with the blankets reflecting nothing 9.02 and 9.48. The p95s are about the same (14.7–16.5). All at 60 fps.
- **Resolution left to the governor:** cloth's p95 touched 17.6 ms and it stepped DPR from 1.8 to 1.53.
- **Where the cost is:** neither the sheen nor the thin film is measurable on its own. It's the physical shader and the studio sampled over the blankets' large area. Dropping the blankets' studio would save 0.4–1.4 ms.

**Finalized (2026-10-11).** Janriz: "finalize the cloth finish for the ring".
- Cloth is the station's finish for good: `createHome`'s default for every ship take.
- The `sfinish` take is gone, and with it the finishes nothing used any more. `finish.ts` keeps `metal` for the relays and the buoys, and `cloth`; both build on `FITTINGS`, which was accents' table. A ship given no finish keeps the model's own materials.
- Shot of a plain load: `../relay/shots/station-cloth/default/t3.20.png`.
