# Finalize the gates, round 1: the takes, on the real site

Scenes 6–9 (the four company gates, their beads, the fling and the span) in every variant Janriz asked to see (2026-10-03), made for real on the real site. Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## Janriz's picks (2026-10-03), now the site's gates

He took my recommendation on each: **the docking ring, the same at every company, CubeSats on leader lines, deployed by a hard scroll, each role a burn,** and the white collar kept.
- **Set aside:** the other takes are gone from the site. Their code and models are in [`removed/`](removed/) (`gates-all-takes.ts`, `takes-all.ts`, `place-with-beside.ts`, `truss.glb`, `machined.glb`, `tag.glb`, `lamp.glb`), and `gates.py` still builds them all.
- **The picked models:** `public/voyage/gates/gate.glb` (the docking ring) and `bead.glb` (the CubeSat).
- **After the cleanup:** unit 263/263, e2e 18/18; tsc, eslint and `pnpm build` pass. `compare-picked.png` shows the picked gates at every reading spot.

The rest of this README is round 1, when every take was on the site.

## See them (round 1)

The dev server on :3000, then the "Takes" chip top left (development only), or the address. The first of each is the default and my pick:

| Choice | Takes |
|---|---|
| The gate | `?gate=docking` · `truss` · `machined` |
| One form in four | `?form=identical` · `months` |
| The beads | `?bead=cubesat` · `tag` · `lamp` |
| A bead's name | `?name=callout` · `beside` |
| The fling | `?fling=deploy` · `radial` |
| The span | `?span=burn` · `plain` |

The camera path, the timings, the text and its manners are the storyboard's (round 3). Only the bodies, their light, and the title's height above the ring differ (the beads now ride outside it).

## What's built

- **The gates** (`lib/voyage/gates.ts`), authored in Blender by script ([`gates.py`](gates.py)), one model at all four companies, each facing the camera coming at it. Its front looks back down the road; its middle radius is the stand-in torus's.
  - **docking:** a machined docking collar like NASA's docking system:
    - a white collar and a bare mating ring, with its seal and 48 bolts;
    - three guide petals leaning in, painted, a bare rib down each;
    - a silver foil shroud behind, and four gold EVA handrails;
    - a bare rail on twelve posts that the beads ride;
    - latches round the collar (black housings, bare hooks).
  - **truss:** home's truss bent into a hoop, like a deployable antenna's rim:
    - three black longerons, battens and diagonals in 24 bays, bare nodes;
    - a rail outside it for the beads;
    - gold-foil hinge blocks on the front longeron.
  - **machined:** a short interstage ring in black anodised aluminium:
    - its isogrid ribs machined through to bare metal on the inner wall, which is the wall the camera sees;
    - black flanges with bare edges and bolts;
    - a rail off the front flange;
    - bare lugs on the front flange.
- **One form in four** (`form`): **identical** stands the gate's part (latch, hinge or lug) twelve times at every company. **months** stands it once for each month he was there: LogoLife 12, Tolstoy 3, Elinnov 4, the Yearbook 10 (`months` in `route.ts`, tested).
- **The beads**, each one small model standing on the rail, turning round the ring with the scroll as storyboarded:
  - **cubesat:** a 1U CubeSat, bare rails, solar cells on its sides, gold foil on top, a tape antenna;
  - **tag:** the slab in miniature, landscape, black anodised with bare chamfers, on a link. Its name is engraved through the coating in the page's own mono face;
  - **lamp:** a docking light: a black housing on a post, a frosted lens, and a steady point of light.
- **A bead's name** is the page's own HTML label:
  - **callout:** a dot and a leader line out to the label, as before;
  - **beside:** the label right next to its bead, no line, going where it goes (`placeLabels`' `beside`, tested).
  - On phones the names stay a list under the lines.
- **The fling** (`lib/film/fling.ts`, tested) is one value for the whole film: the scroll's speed, from 2.5 screens a second (nothing) to 10.5 (all the way), up in about 0.1 s and back in about 0.7 s, with no bounce, 0 under reduced motion and after a jump. The pointer layer's finalization tunes its feel (`FLING_FEEL`, and `lag` for a staggered feel). The gates throw their beads by it:
  - **deploy:** sprung off the rail like CubeSats leaving a deployer, outwards (0.42 of the ring's radius) and towards you (0.22), tumbling on for as long as the scroll stays hard;
  - **radial:** straight out round the ring (0.32), as storyboarded.
  - **The labels:** a label on a leader holds where its bead rests, and its line stretches to the bead (`rest`, tested). A label beside its bead goes with it.
- **The span** (`span`):
  - **burn:** each role is drawn on the trajectory as a mission plot marks a burn, a wider, brighter stretch from its gate back to where its first month begins, with coasts between (`burns` in `route.ts`, tested).
    - LogoLife's burn holds the five breakthroughs of its year and hands over at Tolstoy's gate, since both share October 2025.
    - The Yearbook's burn runs to the launch mark.
  - **plain:** the trajectory as it was.
- **The title** rides above-left of the ring as storyboarded, a little higher (`ay` 1.08 → 1.45 of the ring's radius), since the beads now ride outside the ring and passed under the title's letters at 390. Labels also keep clear of riding titles now (*Finalize Athena*'s change to `placeLabels`).

## Engineering

- **New:**
  - `lib/voyage/gates.ts`: the gates, their latches instanced, the beads, the lamps, the tag's engraving, the fling's poses;
  - `lib/film/fling.ts` and its test;
  - `public/voyage/gates/`: `docking.glb`, `truss.glb`, `machined.glb`, `cubesat.glb`, `tag.glb`, `lamp.glb`;
  - the Blender source [`gates.py`](gates.py).
- **`route.ts`:** `months` on each gate, and the route's `burns`.
- **`road.ts`:** the burn on the trajectory, and the space environment exported (`env`) for the gates and other scenes.
- **`stage.ts`:** the gates in place of the grey torus and spheres, the stage's `fling` (with a development hook, `__flingForce`, that holds the beads thrown for stills), a bead's `rest` point, and `labelHang` for the beside take.
- **`lib/film`:**
  - `place.ts`: a label's `beside` and `rest`;
  - `block.ts`: `Label.rest`;
  - `stage.ts`: `Stage.fling` and `StageView.labelHang`;
  - `runtime.ts`: the fling's step, its reset on a jump, and the label hang.
- **`script.ts`:** the bead labels' `rest`, and the title's height.
- **`takes.ts`:** the six choices. `takes()` now reads every choice in `TAKES`, so the parallel finalizations only add their own.
- **`CONTEXT.md`:** *Bead* and *Fling*.
- **Shared with the parallel finalizations:**
  - *Finalize the pointer layer* owns how the fling feels: `flingFeel` on the runtime, `lag` and `at()` in `fling.ts`.
  - *Finalize Athena* added the cross-block label `avoid` pass in `place.ts` and `runtime.ts`.
  - *Finalize Contact* reads the route's `far`.

## Evidence

Made by [`evidence.sh`](evidence.sh) (`rec`, `aa` and `cost` for the walkthroughs, contrast and frame cost); [`sheets.sh`](sheets.sh) remakes the sheets.

- `shots/<take>/`: every gate's reading spot at 1440 and 390, for ten takes: `docking` (the default), `truss`, `machined`, `months`, `truss-months`, `machined-months`, `tag`, `lamp`, `beside`, `plain`.
- `shots/<gate>/in/`: LogoLife's swing out and threading, every 0.1 screens, for each gate (sheets `in-sheet-*.png`).
- `shots/docking/ride/` and `shots/plain/ride/`: the ride every 0.4 screens. `shots/docking/back/` and `shots/plain/back/`: the look back down the road, where the burn reads.
- `shots/fling-<take>-<f>/`: LogoLife's beads held thrown at 0.5 and 1 (through the stage's development hook).
- `shots/docking/still/`: the reduced-motion stills.
- **Side by side:**
  - `compare-gates-1440.png` and `compare-gates-390.png`: the three gates at all four companies;
  - `compare-months-1440.png`: identical against months, at Tolstoy (3) and the Yearbook (10);
  - `compare-beads-1440.png`: the beads and their names;
  - `compare-fling-1440.png` and `compare-fling-390.png`: the fling held;
  - `compare-span-1440.png` and `compare-span-back-1440.png`: burn against plain on the ride and looking back;
  - `compare-all-1440.png` and `compare-all-390.png`: every take at every gate.
- `out/fling-*-1440.mp4` are recorded with the staggered fling feel *Finalize the pointer layer* settled (each bead leaves 0.25 s after the one before); `out/before-stagger/` holds the first recordings, with every bead thrown at once.
- `out/`: walkthroughs from just before LogoLife to the Yearbook at a reading pace, with a hard scroll back and forth at LogoLife (`gates-<take>-<size>.mp4`); and the fling alone, three hard scrolls at LogoLife (`fling-<take>-1440.mp4`). Each has a contact sheet beside it.

### Contrast ([`aa-gates.js`](aa-gates.js) → `evidence/aa-*.txt`)

Every gate's reading spot, at 1440 and 390, measured as the road's were: text over the sky against the brightest 2% behind its box. AA is 3:1 for titles and 4.5:1 for everything else. The beads' names are measured at 1440 only (on phones they're a list).

| Take | Worst title | Worst text | Worst small print | Worst bead name |
|---|---|---|---|---|
| docking · cubesat (the default) | 10.9:1 | 9.4:1 | 6.1:1 | 13.6:1 |
| truss | 10.9:1 | 9.4:1 | 5.8:1 (390, Tolstoy) | 13.8:1 |
| machined | 10.9:1 | 9.4:1 | 5.4:1 (390, Tolstoy) | 13.6:1 |
| tag | 10.9:1 | 9.4:1 | 6.1:1 | 13.8:1 |
| lamp | 10.9:1 | 9.4:1 | 5.6:1 (390, LogoLife) | **3.5:1 ✗** (1440, LogoLife: a lamp's light behind a name) |
| beside | 10.9:1 | 9.4:1 | 6.1:1 | 12.0:1 |

- **Before the gates stood smaller on phones,** LogoLife's small print measured 2.1–2.5:1 at 390 in every take with CubeSats or lamps. The lowest bead sat on the role's line; tags passed at 6.9:1. They now stand at 0.86 on a phone, and every take passes there.
- **The lamp take** still fails one bead name at 1440. It would need its lamps kept out from under the labels.

### Frame cost ([`measure-gates.js`](measure-gates.js) → `evidence/cost-*.txt`)

The road from just before LogoLife to the Yearbook (7.6 to 16.8 screens) played in 10 s, then 90 frames at each gate's reading spot. Round 3's grey blocks (:4180) were measured the same way just before, as the bar. GPU mean / p95, ms.

| | 1440: playing | 1440: reading spots | 390: playing | 390: reading spots | Frames over 20 ms (1440 / 390) |
|---|---|---|---|---|---|
| Round 3, grey blocks (the bar) | 4.66 / 8.73 | 3.80 / 5.35 | 2.36 / 3.75 | 1.96 / 3.36 | 0 / 0 |
| docking · cubesat | 4.06 / 7.47 | 5.56 / 10.24 | 3.36 / 5.95 | 2.98 / 6.20 | 5 / 0 |
| truss | 3.41 / 6.60 | 4.37 / 8.85 | 2.03 / 5.88 | 3.58 / 8.22 | 10 / 0 |
| machined | 4.91 / 9.91 | 5.15 / 9.63 | 3.02 / 6.40 | 3.39 / 6.06 | 14 / 0 |
| docking · lamp | 4.42 / 8.77 | 4.38 / 7.48 | 2.26 / 5.80 | 3.78 / 8.02 | 3 / 0 |

- **Everything holds 60 fps** (58–60 while playing at 1440, 60 at 390).
- **Playing:** the gates are at or under the bar, except the machined ring at 1440.
- **The reading spots are over round 3's:** 1.8 ms at 1440 for the docking ring (0.6–1.8 across the takes) and about 1 ms at 390. A ring in PBR fills half the frame where a grey torus was.
- **Noise:** three other finalizations ran captures on this machine at the same time. Two takes with the same docking ring measured 0.6–1.2 ms apart at the reading spots, so read differences under about 1 ms as noise.
- **First sight:** a gate's first sight hitched up to 133 ms before the warm-up, and no longer does. The long frames left (3–14 a run at 1440, all under 51 ms) aren't traced to their source. The likeliest is the monoliths' engraving redrawn at a fast scroll, which the road's own run found and *Build the peel and the road* cuts in a shader. The stretch measured holds nine of them.

## Tests

- **TDD:**
  - `takes`: the six choices, read alongside the other finalizations' (red, then green);
  - `months` and `burns` on the route (red, then green). One red was real: LogoLife began in October 2025, the month he left Tolstoy, so the two burns overlapped. A burn now ends at the next gate where he moved on within its first month;
  - `createFling`: rest at a reading pace, thrown on a hard scroll either way, no bounce closing, still under reduced motion, not after a jump (red: no module; then green);
  - `placeLabels`' `beside` and `rest` (red, then green), and the wider gap beside a bead (red at 10 px, green at 20).
- **Results:**
  - unit 270/270 (`vitest run --maxWorkers=2`, `.scratch` excluded);
  - `voyage.spec` and `smooth-scroll.spec` 18/18 against the dev server on :3000;
  - tsc, eslint on every changed file, and `pnpm build` pass.
- **Refactor verdicts:**
  - **`takes()` reading every choice** instead of naming each: changed. Four finalizations now add choices in parallel.
  - **`placeLabels`' two return branches:** keep. Merging them hides which fields differ.
  - **`burns` finding each role by id:** keep. Four roles, once.
  - **The fling's snap of tiny values to 0:** keep. The stage skips work at rest.
  - **The three gates and three beads in one `createGates`:** keep. All but one of each go once Janriz picks.
  - **The gates' materials:** were always see-through; changed to opaque except while fading. Both programs are compiled in the warm-up, since switching changes three's program.

## For the build (*Build the gates*)

- **The reading spots' cost at 1440:** a cheaper ring where it's far (the seal, the bolts and the shroud are most of its 16K triangles), or its detail baked.
- **On a phone:**
  - the ring still reaches the frame's edges, and as the camera closes in (8.4–8.6) it grows over the lines while they fade;
  - a hard scroll throws a CubeSat across the lines for a moment, so throw less on a phone;
  - the trajectory crosses the lines at Tolstoy and the Yearbook, as it did before.
- **Thrown beads:** for a moment a thrown bead passes over its own held label, or the title.
- **The docking ring's latches** barely show where the collar is in shade (Tolstoy, Elinnov).
- **The road's own:** at Elinnov a rising monolith passes in front of the role's lines.
