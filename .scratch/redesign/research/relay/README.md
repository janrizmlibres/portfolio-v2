# The relay: Work as a chain of jump points, round 1 (2026-10-10)

Janriz, 2026-10-10, on Work: "Lots of swerving left and right it me dizzy the entire sequence … the dock thingys … look
out of place … It would be nice if they're like 'jump points' or something where one goes to the other. Think Mass
Effect. And I hate the look back."

He picked idea A, a chain of relays run oldest first:
- LogoLife's relay stands near home. You leave from it at the start, unnamed.
- It throws you back to August 2023, by his university's stars.
- From there the chain runs forward: the Yearbook, Elinnov, Tolstoy, and back to LogoLife, the present, where its
  words are read and Projects branch off.
- The look back goes.

This round settles the relay itself, and the beat at one relay, by eye. The ride, the copy and the site come after.

## Why Work makes you dizzy (measured)

Measured on the rail `stage.ts` builds for the ride (desktop), 10.4 screens of scroll:

| | view turns | left/right reversals | peak turn |
|---|---|---|---|
| as built | 460° | 18 | 267°/screen |
| the road alone (no glances, no swings) | 281° | 3 | 304°/screen |

The road's own winding accounts for 281° of that. The glances at the 13 monoliths (alternating sides) and the swings
out at the 4 rings (alternating sides) add the other 15 reversals.

On a chain of relays, the lanes between relays are straight. The view turns only at a relay, slowly, while you're
holding there.

## The relay

`relay.py` builds it headless in Blender (`run.sh`, under the heavy lock), from the station's own maps
(`../ring-irl/tex/`), so it belongs to the same world. It's our own design in the spirit of Mass Effect's relays, not
a copy.

From the back:
- **The spine:** a lattice truss carrying a power module, two radiator wings and a reactor drum.
- **The yoke:** lattice trusses, a crossbar behind the gimbal and two arms forward to its bearings. Equipment boxes and
  cable trays ride them.
- **The gimbal:** the outer ring turns on the arms' bearings and the inner ring turns inside it, both in blankets, each
  with a dark inner face and an emitter strip looking at the core.
- **The core:** a sphere of light with its own blue light.
- **The throw**, two versions:
  - `barrel` (my pick): six coils closing in round the axis, wrapped in gold insulation foil. You're thrown down them.
  - `rails`: the arms run on forward and close in, lined with coils. It's closer to the Mass Effect silhouette.

The parts are separate nodes, so the site can turn them: `frame`, `ringA`, `ringB` (a child of `ringA`) and `core`.
Each emitter has its own material, so the coils can light in turn. Occlusion is baked per part.

| | triangles | GLB (meshopt, WebP 1024) |
|---|---|---|
| barrel | 83k | 2.0 MB |
| rails | 47k | 1.6 MB |

## The beat at one relay (`harness/`)

Open `http://127.0.0.1:4182/` (served from `harness/`). It's drawn as the site draws: the site's `neutralOut` and
`occludeDirect`, his star as a hard key with a shadow map, a fill about 4% of it, no anti-aliasing at DPR 2.

The beat loops, the end of one throw being the arrival at the next relay:

1. **Arrive:** out of the streaks, slowing.
2. **Hold:** still, behind and left of the relay, looking on along the throw. The role's words sit on the left (a
   stand-in in the site's fonts).
3. **Align:** the camera rises over the gimbal and comes down onto the throw's axis, in the gap before the coils. It
   turns about 50°, slowly.
4. **Charge:** the core brightens, the gimbal spins up, and the coils light from the core out.
5. **Throw:** down the coils, the stars stretching into streaks.
6. **Flash:** the next relay's arrival.

The jump is deliberately not the warp. The warp is a wormhole (`warp-hole.ts`: "no particles and no streaks"); this
is streaks and a flash, with no tunnel.

Controls:
- space: play
- ← and →: scrub
- 1 and 2: barrel and rails
- i: inspect (orbit the model freely)

`capture.mjs` shoots phases headless (`node <copy in repo root> 4182 <outdir> 1440x900 <t,t,…> clean`).

## What the captures show (`shots/r1` to `r4`)

- **r1:** it read as a toy (solid white beams, copper stripes, neon strips), and the hold ran the relay under the words.
- **The fixes:**
  - The frame became lattice trusses with small grey and foil equipment boxes.
  - The coils are wrapped in gold insulation foil, mostly diffuse, so it reads gold under the key instead of mirroring
    black space.
  - The quilting is finer.
  - The emitters stay dark until the charge.
  - The hold stands back (6.4 from the gimbal).
  - The barrel moved forward, leaving a gap to come down onto its axis, and its trusses moved off its top.
- **The move onto the axis** (`r3-sheet.png`, `r4-sheet.png`): turning the view by direction showed empty sky for a
  moment. It now keeps its eye on the barrel's mouth as it comes over the gimbal, so the relay stays in view the whole
  way, and looking at the mouth from the axis is looking down the throw.
- **The streaks:** they need speed. At the throw's peak they run long and radial (`r2`, 0.84 and 0.89), and the flash
  whites out in a beat instead of greying the frame.
- **Rails** (`r4-rails-sheet.png`): it loads and plays, but its move onto the axis still runs the barrel's path, so its
  middle is rough. That's left as is until he picks.

## Not done yet

- **The stack:** the role's CubeSats aren't on the relay. They'd ride the outer ring, as they rode the gate.
- **The phone layout.**
- **Glow:** the site has no bloom pass, so the core's glow here is two sprites.
- **The film itself:**
  - the ride as a take (relays in the sky, straight lanes, the breakthroughs as beacons beside the lanes);
  - the loop from LogoLife's relay near home back to August 2023;
  - Projects branching off LogoLife's relay;
  - the look back cut.
- **Work's intro copy**, drafted for the loop, for him to judge:
  - "First a jump back to August 2023, where it started. Then forward through four roles to now."
  - "Between them, the AI breakthroughs that changed what I could build."

## Round 2 (2026-10-10): on the site

Janriz picked the barrel, the metal finish ("agree with metal for relay"), and against repetition, my picks:
- relays that grow with his career;
- a different beat at each stop;
- lanes that quicken as AI did.

He asked that the concept be easy to reapply as companies are added: see "Work: adding a company" in `AGENTS.md`.

**What plays now**, after Around home:
- **The departure:** the camera turns to LogoLife's relay by home (the flagship, unnamed for now) as Work's intro
  writes in. It rises over the gimbal, drops onto the axis, the relay charges, and it throws you. The flash hides the
  cut to the start.
- **August 2023:** out by his university's stars, which light as the start's words are read.
- **The lanes:** the camera coasts down each lane with its eyes on the relay ahead, past that lane's beacons (the
  breakthroughs, all on the lane's left). The lanes quicken from 0.5 to 0.32 screens a beacon.
- **The stops:**
  - The Yearbook: still being built (one ring, three coils, a scaffold with work lights). The full beat, inside.
  - Elinnov: compact. Flown through: its words read on the glide in, then the dive over its gimbal and the throw.
  - Tolstoy: full. Seen from outside: it fires a beam, the view turns to watch it go, and the camera rides it out.
  - LogoLife: the flagship. The arrival home, held in front of it, its gimbal winding down. Projects' spur rises out
    of it to Athena.

**The code** (`lib/voyage/`):
- `chain.ts`: the plan, plain math: stops, lanes, layout, times; the rule for adding a company.
- `chain-camera.ts`: the camera through the chain.
- `relays.ts`, `beacons.ts` (the road's monoliths, kept whole), `jump.ts` (streaks and the flash), `branch.ts` (the
  spur).
- `finish.ts`: the metal finish, shared with the station's `sfinish` take.

**Removed:** the road, its route, ticks and burns, the gates and their CubeSats, and the look back (`road.ts`,
`gates.ts`, `recap.ts`, most of `route.ts`).
- They're backed up in `road-before/`, test files as `.bak`.
- `world.ts` and `script.ts` there were copied after their first edits, so they aren't the originals.

**The model** is `public/voyage/relay/relay.glb`, built by `site.sh`:
- one model, each grade shown by node: the coils and the scaffold separate;
- 58.6k triangles, 1.8 MB;
- leaner rods, tubes and hoops than the concept's.

**How it moves** (`chain-camera.test.ts`, the old road measured the same way):

| | peak turn | left/right reversals |
|---|---|---|
| desktop | 244°/screen | 6 |
| phone | 306°/screen | 10 |
| the old road (desktop) | 267–304°/screen | 18 |

- Every beacon is read from in front, well inside the frame, on both shapes of screen.
- On a phone the camera stands further back, so its moves round a relay are longer.

**Length:** the film is now 46.89 screens, 5.25 more. Work runs from 5.6 to 23.3, and Athena is reached at 25.7.

**Frame cost** (`perf.js`, `ab2.js`):
- The machine's GPU was shared during the measuring, so absolute numbers ran high: About measured ~11 ms where an
  earlier run measured 4.1.
- In the same session, one relay held in frame costs about what the station does at About (~6 ms each).
- Every beat ran at 60 fps; the governor lowered the pixel ratio to keep it.

**Checks:** 813 unit tests, tsc, eslint (lib, components, app, tests), e2e voyage, routemap, warp and sky-chat
(36/36).

**Open:**
- the beam's look (a soft searchlight), and the flash (a quick white-blue wash);
- the throws borrow the old dock sound;
- the copy (Work's intro, Projects' line "branching off the relay where I built it");
- LogoLife is unnamed at the departure;
- phone polish.

## Round 3 (2026-10-11): buoys for the breakthroughs, and the streaks

Janriz on the monoliths: "They look like shadows that bob up and down. We can either have them their own entity or be
pass by things". He took my pick, comm buoys. He also reported the throw's streaks showing in the hero and on zooms.

**The streaks:** they came on whenever the camera moved fast (`jump.ts`). Now only the throws turn them on
(`streaksAt` in `chain-camera.ts`): in as a throw goes, full at its flash, gone over the first stretch of the next
lane. Speed only stretches them. Checked headless across the film: none in the hero, About, Around home, at the
breakthroughs or after Work; still there in each throw.

**The buoy** (`buoy.py`, `buoy.sh` → `public/voyage/buoy/buoy.glb`, 283 KB, 1,400 triangles):
- Built from relay.py's own helpers and materials: a gold-foil drum, aluminium decks, two solar wings with nav lights
  at the tips (red to port, green to starboard), and a dish on top facing back down the lane.
- A strobe on its mast blinks on the clock: a double flash every 2.4 s. Its glow stays a few px across however far
  away the buoy is, so the buoys ahead show as blinking points down the lane.
- In the relays' metal finish, lit only by their key. It stands still, upright to its lane, with no rise or sink.
- Code: `lib/voyage/buoys.ts`. It replaced `beacons.ts`, the monolith, and `road-cull.ts`, all backed up in
  `beacons-before/`. The space environment map the far worlds reflect moved to `space-env.ts`.

**The card** (`placeCard` in `lib/film/place.ts`): the breakthrough's date, name and why hang on a leader line from the
buoy's drum.
- It hangs above the buoy, reaching left (clear of the next buoy down the lane, which sits nearer the frame's
  middle), past the buoy's wings and mast.
- Where the top can't hold it, it goes left, then right, then below.
- It rides on phones too.

**Where they stand, and how they're passed:** at the old reading distance (0.03 back), five buoys only 0.0096 apart
left up to three already-read buoys in front of the camera. Each is now the nearest one ahead when its card is read
(a new test):
- `laneLine` (in `chain.ts`) is the one line a lane is flown along. The camera flies it, and the buoys stand beside a
  desktop's, spread from 0.3 to 0.75 of the way down it.
- Each buoy is read from 0.012 back on a desktop (0.018 on a phone), smaller (`BUOY_U` 0.00042), 0.0022 to the left
  and 0.001 below.
- The eye looks down the line while the buoys pass, so every buoy sits at the same spot in the frame on a desktop
  (x −0.40, y −0.29). It turns most of the way onto the relay after the last buoy; the come turns it the rest.
- A phone flies the desktop's line past the buoys, leaving its own line before them and rejoining it after.

**How it moves:** the desktop peak turn is 244°/screen, unchanged. On a phone it's 317°/screen (306 before), just
under the test's 320, at the come into home.

**Frame cost** (`perf.js`, 1440×900 at DPR 1.8): 60 fps at each breakthrough, GPU mean 8.5–9.5 ms, 122–194 draw
calls.

**Sound:** the monolith's "slide" one-shot is gone from `fx.py`, `lib/audio/shots.json` and `public/audio/fx/`. No
moment plays it any more, and the engine would have held it all along, which put the budget at 72.2 MB, over its 72.

**Also removed, now unused:** the `etch` word mode, `faceMatrix`, the stage's `face` view and the words' clip path.

**Checks:** 826 unit tests, tsc, eslint; e2e voyage, routemap, warp, sky-chat 36/36. Shots: `shots/buoy-r4/` (by `tools/shots.js`),
with `desk-sheet.png` and `phone-sheet.png`.

**Open:**
- the buoy's look up close (it reads as a classic satellite; the solar wings are dark);
- a sound for a buoy, if one is wanted (a radio blip as its card comes in?);
- the gates' model in `public/voyage/gates/` is no longer drawn (only `later.test.ts` names its path).

## Round 4 (2026-10-11): smoothing the camera, and Janriz's calls

**His calls:**
- The ring's cloth finish is final; the `sfinish` take is gone (ring-irl README, round 6).
- The buoys' radio blip was added, then removed ("nvm remove the blips i hate them").
- Around home: the constellation moved left at the same distance, then zoomed out a little.

**What was jagged, and the cure** (measured with `tools/settle.ts`, `back.ts`, `flips.ts`, `turns-live.js`):
- *Into each barrel* (the departure, the Yearbook, Elinnov), "like when the camera bumps into something before
  settling inside":
  - The drop came from straight above the launch spot, so its curve ran past it and back. `SPOT.down` is now 0.45 back
    along the axis.
  - The eye leapt from the barrel's mouth to far down the axis, and the film eases the eye and its distance
    separately, carrying the camera on and back. The eye now stays one distance off (`eyeOf`) through the drop, the
    charge and the throw, and only turns.
  - The Catmull–Rom curve's speed swelled and sagged stretch to stretch. It's now travelled by its length
    (`byLength`), and the keys there are 0.02 screens apart instead of 0.05.
- *Tolstoy's beam ride:* the eye ran on ahead, and the slide onto the beam outpaced the short run along it, so the camera
  stalled mid-ride and stepped back. The eye's distance is now held and the ride is taken by its length, accelerating.
- *Hero to the ship:* About's first key looked at the hub, a twentieth of a screen after the dive's last key looked
  between the star and the ship (24.5° in one key). About's way in now pans from where the dive looked.
- *Around home to Work:* the two shots look from 159° apart, and easing each component of the direction between them
  whipped round at up to ~1,140°/screen. Now `bridge` (lib/film/path.ts) keys a great-circle turn, and the light eases
  across the regions with it. It starts as Around home's words begin to leave, peaking at 232°/screen.

**Twinkling:** the buoys' strobe glow was a fixed size on screen, so far buoys blinked as points. The glow is now its
own size, and a buoy under 10 px across isn't drawn. The red and green discs inside a barrel are the relay's own nav
lights at its mouth.

**Measured:** across the hero to Work's end, nothing turns faster than 265°/screen outside the four flashes (whose cuts
the flash hides); the phone's peak is 317, at the come into home. The new test `only goes forward as it's thrown…`
allows back-steps under 0.02 of a relay's scale; the bumps were around 0.1.

**Checks:** 837 unit tests, tsc, eslint; e2e voyage, routemap, warp, sky-chat 36/36.
