# Home, built job by job: Work after the jump, round 1 (2026-10-11)

Janriz, 2026-10-11, on Work: "the entire sequence is long … one company one entire scene … would take long. i like the
first jump where the work section is introduced, but after the jump it should be short … i still want to emphasize each
company … the breakthroughs be like brief fly bys". Then, of the relay ideas: "repetitive. i kinda want the relay to only
be the work intro. the actual work entries should be entirely different."

He picked **home, built job by job**: "woah. i like the sound of option 1. let's do it. let's just make sure the work
intro relay is the final constructed form since it's the only relay now."

- **The relay is only Work's intro.** The departure stays as it is: the relay by home, flagship grade (already the most
  built: inner ring, six coils, no scaffold), throws you back to August 2023. It's no longer a company's.
- **The throw is through time, not space.** The flash clears on home in August 2023: the ship from About isn't there
  yet, only its core (the hub, its docking adapter, the aft mast, radiators and dish).
- **Each company builds a quarter of the ring.** The ring is four identical quarters (a spoke, three nodes, a hab, a
  lab and a power bay with solar wings), and there are four companies, oldest first: the Yearbook, Elinnov, Tolstoy,
  then LogoLife, whose quarter closes the ring. Home, now, is the ship About showed, and Projects branch off it.
- **The ring turns a quarter a company**, so each quarter is built on the side facing the camera and its sun: the turn
  is the time-lapse's clock. Once LogoLife closes the ring it keeps turning, as About's does.
- **The camera** holds one side of the ship, lit from the side throughout, and rises slowly from 12° above the ring's
  plane to 36°, drawing back as the ring grows (2.5 to 4.1 of its radii). These are angles About never uses: About
  holds 9° above the plane, close on the modules.
- **A company's quarter builds itself in place** while its card is read (round 2, below; round 1 had its pieces fly in).
- **Breakthroughs are supply craft** that pass close between the camera and the ship (brief, near). The four he built
  with dock at the hub's forward port for a moment.

## Why this framing (rounds r1 to r5 in `shots/`)

- r1: the camera circled the ring with the build. Its quarters ran off the right of the frame, and half the stages
  would have faced the sun (backlit, dark). So the ship turns instead and the camera holds the sunlit side.
- r2: each new quarter in front, nearest the camera. It hid the hub, and the middle stage was edge-on (a flat band).
- r3: starting below the ring's plane and rising through it put the Yearbook's quarter at the top edge, cut off.
- r4: a slow rise above the plane throughout. The Yearbook's quarter still ran off the right.
- **r5 (the pick): `shots/r5/sheet.png`.** The new quarter just right of front, the ship framed in the right 60%.
- `shots/r4/s2-arriving.png` and `s3-craft.png`: a module on its way in, and the crew capsule (×3.5) standing in for a
  supply craft passing close.

## What's here

- `../../../../scripts/models/station.py` now tags each piece as it's built (`core`, `frame-0..3`, `bay-0..11`), and
  its site mode parts them off the baked ship as their own nodes, sharing its occlusion. The geometry is unchanged (same
  bounding radius and rim, 0.958). The site's `real.glb` is untouched until the build.
- `model.sh`: builds that model (`build.sh station --raw`) under the heavy lock and compresses a copy into `harness/`.
- `harness/`: the ship drawn as the site draws it (PBR Neutral, occlusion on direct light, a hard key, a 4% fill, no AA
  at DPR 2). Query: `stage`, `spin`, `orbit=az,el,d`, `aim`, `move`, `place`, `scale`, `visitor`. Served on :4190.
- `capture.mjs <shots.json> <outdir>`: shoots a list of queries headless on the GPU, under the heavy lock.
- `sheet.py`: contact sheets.

## Round 2: the ship builds itself (2026-10-11)

Janriz: "noice, i like the idea. now we just need to figure out how to make it look like the ship is constructing itself
(preferably with the foundations or skeletons so we can really see it getting built in real-time) as opposed to just the
modules falling in place". He agreed to a quarter a company, a supply craft of its own, and the two copy changes.

- **A skeleton.** Each bay now carries its primary structure inside its hull (`cage` in `station.py`): six ring frames
  along it, two narrower ones in its conical ends, and ten longerons, in bare aluminium with no baked occlusion (the
  bake saw it inside the hull). It's hidden by the hull once that's built. +33k triangles (96k in all).
- **Every vertex knows when it's built** (`_BUILD`, exported as a glTF attribute, 0 to 1, quarter i over [i/4, (i+1)/4]),
  and the site draws only what's built by now (a discard in the ship's shaders and in its shadow's). Within a quarter:
  - its spoke's truss runs out from the hub, the transit tube just behind it (0 to 0.34 of the quarter);
  - its skeleton (ring frames, longerons, and the nodes as joints) runs along the ring both ways from where the spoke
    meets it (0.34 to 0.56);
  - the hull closes over the skeleton, the fittings just behind it (0.5 to 0.84);
  - the solar wings' masts run out, their blankets with them (0.86 to 1).
  Times run along each part, so a long face (a module's hull, a longeron) reveals as the build passes along it.
- **The clip:** `out/build-b.mp4` (no seam) and `out/build-b-seam.mp4` (a thin warm line along the build's front), the
  whole of Work after the flash at 24 fps: the bare core, then each quarter building while the ring holds, then turning a
  quarter to bring the next side round; once closed, the ring keeps turning. The camera rises from 12° to 36° and draws
  back. Sheets: `out/build-b-sheet.png`, `out/build-b-seam-sheet.png`, and `shots/build1/sheet.png` (one quarter, step by
  step, closer).
- `clip.mjs` plays the timeline through the harness's `__frame` without reloading.

## Round 3: the supply craft, and the whole stretch in motion (2026-10-11)

Janriz agreed: no seam ("i agree with not having the seam").

- **The supply craft** (`scripts/models/craft.py`, `build.sh craft`): a real cargo craft's plan (Cygnus). A pressurised
  cargo module in the station's quilted blankets with seams, a handrail pair and a grapple fixture, its nose narrowing to
  a docking ring; a service module in gold foil with an engine bell and four thruster quads; two round fan arrays (ten
  pleated gores each, spars, a hub) on short booms, both facing the same way; an antenna dish; a strobe as its own node.
  Built at the station's scale (a module's width, as a real one is beside a station), its origin the face of its docking
  ring, so it docks at the hub's forward port as it is. 3,840 triangles, 0.58 MB. Designed in the live Blender (a scene
  of its own: `LIVE` set), built headless.
- **The clip:** `out/build-d.mp4` (24 fps, 40 frames a screen, so a screen of scroll is 1.7 s): 8.8 screens after the
  flash, against today's 15.1. The bare core (0.6); each company's quarter builds over a screen while the ring holds;
  then the ring turns a quarter while that stretch's breakthroughs come by: those he built with dock at the forward port
  (0.42 each: down the axis, a hold docked, away), the rest pass close to the camera, under the ship and over it in turn
  (0.3 each, one every 0.12). After LogoLife the closed ring turns on. Beats: `out/build-d-beats.json`; sheet:
  `out/build-d-sheet.png`.
- The clip groups each breakthrough after the company it came out during (to the next company's start). The site build
  decides this for real.

## Round 4: a busy timelapse (2026-10-11)

Janriz, of round 3's clip: "the supply ships feel repetitive. are there any other craft we can think of that's used in
space construction? make it look like something out of a sci fi movie ... i want it to look quite busy, we can even have
drones coming in and out like a timelapse ... things are just blazing in and out". He agreed to five hero craft types and
the drone swarm, and added "space construction workers".

- **Five hero craft** (grounded sci-fi, The Expanse / Interstellar), each a script in `scripts/models/` at the station's
  scale, built by `build.sh <name>`: the freighter (`craft.py`), the hauler (`hauler.py`: a tug pushing a rack of
  containers on a truss), the work pod (`pod.py`: a bulbous one-person pod, a three-pane window, roof floodlights,
  folded arms, a docking collar on its back), the shuttle (`shuttle.py`: a Ranger-like lifting body, swept wings,
  canted fins, glowing engine throats), the crane ship (`crane.py`: a truss spine, a control block, a two-part boom
  holding a truss section). Sheet: `out/heroes-sheet.png`. The four he built with dock (GPT-4o the freighter, MCP the pod,
  GPT-4.1 the hauler, GPT-5 the crane ship); the rest pass on four ways (near, high, a dive past the camera, far behind
  the ring), no two in a row the same craft or way (`harness/timeline.ts`, `GAPS`).
- **Drones** (`drone.py`, ~1.5 m, 1.4k triangles): 26 make trips, each in from a staging point round the ring, a launch
  from the hub or (one in five) off the frame, to the build's front (the spoke, the skeleton, the hull, the wings as
  each goes), a hover welding (sparks flicker at the torch), and away. How many are at work follows the beat: all of
  them while a quarter builds, a third between. Their lights are bright points, and trail short streaks (never longer
  than 0.22, so a fast one leaves a streak, not a wire).
- **Workers** (`worker.py`, an EVA suit, ~1.9 m, gold visor, helmet lamps): four hold a spot on the newest quarter for a
  shift, then are gone and on at another, as a timelapse's people are; two jet between spots, trailing their lamps.
- Everything is a pure function of the scroll (`harness/swarm.ts`, `harness/timeline.ts`), so scrolling back plays it
  backwards. The clip: `out/timelapse-a.mp4` (8.84 screens after the flash); sheet `out/timelapse-a-sheet.png`.

## Round 5: on the site (2026-10-11)

Janriz approved round 4's clip: busy "yess. we'll tweak it later if needed after the final build", workers "yepp", the
craft "agree". Built on the site, replacing the chain of relays after its first throw (ADR 0014):
- `lib/voyage/work.ts` (the plan) and `work-camera.ts` (the departure and the build), each test-first; `traffic.ts` (the
  drones, workers and the breakthroughs' craft, instanced); `ships.ts`'s `revealBuilt` (the build in the ship's
  shaders and shadow); pinned cards (`pinCard`, `Block.pin`).
- Models: `public/voyage/ship/real.glb` (pieces, skeleton, 8-bit build times: 1.95 MB) and
  `public/voyage/craft/traffic.glb` (the seven merged: 1.62 MB, after the wake).
- The chain's code and the buoy, never committed, are in `chain-before/` (their tests renamed `.bak`).
- The film: 42.15 screens (46.89); Work after the flash 10.4 (15.1).
- Checks: tsc, 805 unit tests, eslint, the whole e2e suite (71) against :3000, all exit 0; `turns.mjs` peak 260°/screen
  (267 on a phone), both at the relay's align, unchanged; frames held at 16.7 ms (median) through the build at 1440×900.
- Shots: the session's scratchpad `site1`–`site3`.

## Open

- Tuning after Janriz sees it on :3000: the swarm's density, trip speed and streak length; the pinned cards' place.
