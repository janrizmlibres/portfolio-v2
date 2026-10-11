# Finalize the peel and the road, round 1: the takes, on the real site

Scenes 4–5 (the peel, the road, its 13 monoliths and its start) in every variant Janriz asked to see (2026-10-03), made for real on the real site. Measured on the `redesign` branch, uncommitted, on 2026-10-03 (M5, headless Chromium with the GPU on, ANGLE on Metal).

## Janriz's picks (2026-10-03), now the site's road

He took my recommendation on each ("i agree with the reco"): **the trajectory, the black monolith, the launch mark,** the inscription as it is. The other takes are gone from the site; their code and models are set aside in [`removed/`](removed/) (`road-all-takes.ts`, `takes-all.ts`, `beacon.glb`, `gold.glb`, `probe.glb`), and `road.py` still builds them all. The black monolith is now `public/voyage/road/monolith.glb`. "August 2023" hangs clear of the launch mark's ticks. Unit 186/186, e2e 18/18, tsc and `pnpm build` pass after the cleanup.

The rest of this README is round 1, when every take was on the site.

## See them (round 1)

The dev server on :3000, then the "Takes" chip top left (development only), or the address:

| Choice | Takes (the first is the default) |
|---|---|
| The route | `?route=trajectory` · `beacons` · `tether` |
| The monoliths | `?monolith=black` · `gold` · `probe` |
| The road's start | `?start=launch` · `ring` |

The camera path, the timings, the text and its manners are the storyboard's (round 3). Only the bodies and their light differ.

## What's built

- **The peel** (all takes): as storyboarded, the orbit comes loose at the point nearest the route and straightens into its first stretch (O 6.75–7.45), then the rest of the route draws out ahead. The ship stays home (Janriz, Q7).
- **The routes** (`lib/voyage/road.ts`):
  - **trajectory:** a hairline drawn as the orbit is, like a mission plot. A tick where each month begins, and a pair at each year (into December). The stretch behind you is brighter. The ticks are placed so every monolith and gate sits inside its own month (`monthTicks`, tested), since the stops were spaced for the ride, not by the calendar.
  - **beacons:** a relay beacon where each month begins (38), authored in Blender: a gold-foil hexagonal bus, a lattice mast with a steady lamp, a solar panel, a whip antenna. Instanced, on a fainter line. Each lamp is a point of light a few pixels across, so from far off they read as a row of lights going into the dark.
  - **tether:** a braided cable down the route, his star's catch-light running along it (metal, the braid's grooves darker and rougher), a hairline under it where it's too thin to draw.
- **The monoliths**, authored in Blender (`road.py`), one model stood by each breakthrough, the slab's 1.6 to 1 with rounded corners:
  - **black:** black anodised aluminium, satin, with machined chamfers in bare metal. The inscription is cut through the coating to bare aluminium.
  - **gold:** a thinner gold-anodised plaque like Pioneer's, on four standoffs and a bracket behind. The cut is filled black, as the Apollo plaques' were, so its ink is dark.
  - **probe:** the black plate is the front of a small craft: a gold-foil bus behind it, a dish on a boom looking back towards home, one solar wing (always away from the road, so the model is mirrored on the road's right), a whip antenna, thrusters, a running light.
- **The inscription is engraved in the plate** (Q3): the page's own face is read (its words, fonts and places), each word drawn into the plate's texture as it's cut in and worn away (the same word windows as the HTML), as colour and as height, so the cut has walls that catch the light. The HTML text sits exactly over it as the ink. With the HTML hidden, the engraving reads on its own.
- **Square and level** (Q4): while a monolith is read, it holds its attitude square to you and level with the frame; in between it leans as before (it turns to follow you up to 70°, tipped back while it rises).
- **His star behind you** (Q5): out on the road, the key light lights what's just ahead of the camera from behind it, leaning to his star's side. The road bends, so his star's true place would sometimes light a plate from behind; this is a film's cheat, as About's day side was. The road's metal reflects a space environment: black, a faint glow of the region's light, and his star.
- **The road's start** (Q6):
  - **launch:** no ring; the trajectory starts at a launch mark (a small circle and four ticks) among his university's stars, which light. "August 2023" rides the mark.
  - **ring:** the ring kept, a stand-in until *Finalize the gates* settles the gates' form.
- **Where the route passes in front of the plate being read, it all but goes** (at 390 the camera hangs back across the road from a monolith, so the road can pass in front of it).

## Evidence

Made by [`evidence.sh`](evidence.sh) (`./evidence.sh rec` for the walkthroughs):

- `shots/<take>/`: every reading spot from Work to the road's start, at 1440, 390 and 844 (sheets `spots-sheet-1440.png`, `spots-sheet-390.png`); the peel and the first stretch every 0.1 screens (`in/`, sheets `in-sheet-*.png`).
- `shots/trajectory-black/ride/`: the ride every 0.2 screens to the road's start (sheets `ride-sheet-*.png`); `still/`: the reduced-motion stills.
- **Side by side:** `compare-monoliths-1440.png` (Claude Opus 5.5 and GPT-5), `compare-monoliths-390.png`, `compare-routes-1440.png` (the peel at 6.4, the first stretch at 8.8 and 9.2), `compare-start.png` (launch and ring, 1440 and 390).
- `out/road-<take>-{1440,390}.mp4`: walkthroughs from the peel's run-up to the road's start at a reading pace, then back a little. Each has a contact sheet beside it.

### Contrast ([`aa-road.js`](aa-road.js) → `evidence/aa-*.txt`)

Every reading spot passes in every take, at 1440 and 390. Text over the sky is measured as the opening's was; text on a plate against the plate round it (the cut under the ink is as bright as the ink).

| Take | Worst title | Worst text | Worst small print |
|---|---|---|---|
| trajectory · black | 4.4:1 (390, LogoLife's gate leaving) | 7.3:1 (390, the road's start) | 5.8:1 (390, Claude Opus 5.5's plate) |
| trajectory · gold | 4.4:1 (390, the same) | 4.7:1 (1440, Glasswing's plaque) | 4.6:1 (1440, Glasswing's plaque) |
| trajectory · probe · ring | 4.4:1 (390, the same) | 7.3:1 (390, the road's start) | 5.8:1 (390, Claude Opus 5.5's plate) |
| beacons · black | 5.7:1 | 6.4:1 | 5.8:1 |
| tether · black | 5.9:1 | 7.3:1 | 5.8:1 |

### Frame cost ([`measure-road.js`](measure-road.js) → `evidence/cost*.txt`)

The road (5.6 to 18.8 screens) played in 10 s, then 90 frames at each reading spot in it. Round 3's grey-block storyboard (:4180) measured the same way is the bar. GPU mean / p95, ms.

| | 1440: the road | 1440: reading spots | 390: the road | 390: reading spots | Frames over 20 ms (1440 / 390) |
|---|---|---|---|---|---|
| Round 3, grey blocks (the bar) | 5.59 / 8.36 | 2.88 / 4.33 | 2.03 / 4.53 | 1.37 / 2.13 | 0 / 0 |
| trajectory · black | 2.99 / 4.67 | 3.67 / 4.62 | 1.11 / 1.56 | 1.15 / 1.55 | 5 / 1 |
| beacons · black | 2.74 / 4.55 | 3.57 / 4.75 | 1.15 / 1.62 | 1.23 / 1.75 | 3 / 1 |
| tether · black | 2.97 / 4.70 | 3.58 / 4.73 | 1.16 / 1.64 | 1.27 / 2.03 | 5 / 1 |
| trajectory · gold | 3.23 / 4.81 | 3.51 / 4.78 | 1.16 / 1.64 | 1.20 / 1.61 | 1 / 1 |
| trajectory · probe · ring | 2.93 / 5.13 | 3.64 / 5.49 | 1.34 / 2.54 | 1.29 / 1.70 | 5 / 1 |

- **The road as it plays is under the bar in every take,** at both sizes, at 60 fps.
- **The reading spots at 1440 are 0.6–0.8 ms over round 3's mean** (and up to 1.2 ms at the p95, the probe): a plate in PBR with its engraving and space's reflections fills a third of the frame where a grey block was. Still 60 fps. For the build: a cheaper plate where it's far, or the sheen baked.
- **The long frames** (33–67 ms, a handful a run) come from redrawing the engraving while the road is played at 1.3 screens a second, faster than anyone reads it. Before the warm-up they were up to 168 ms (a monolith's material compiling on first sight); the warm-up and laying each engraving out before it rises took those out. For the build: cut the words into the plate in its shader from a texture laid once, instead of redrawing it.

## Engineering

- **New:** `lib/voyage/road.ts` (the routes, the beacons, the tether, the monoliths, the engraving, the launch mark, the light on the road, the warm-up); `public/voyage/road/` (`black.glb` 10 KB, `gold.glb` 25 KB, `probe.glb` 80 KB, `beacon.glb` 72 KB; 4, 10, 55 and 45 KB gzipped); the Blender source [`road.py`](road.py).
- **`route.ts`:** `monthTicks` and the route's `ticks`.
- **`home.ts`:** the orbit peels (`peel`, `uRing`), as round 3's `ringPt` did.
- **`hairlines.ts`:** the travelled stretch brighter (`here`), a near fade per segment, and a box on screen it all but goes in front of.
- **`stage.ts`:** the road in place of the grey line and slabs; the peel's timeline as round 3's; the monoliths square and level while read.
- **`takes.ts`:** the three choices; **`app/voyage.css`:** the gold plaque's dark ink.

## Tests

- **TDD:**
  - `takes`: the route, the monoliths and the road's start (red, then green);
  - `monthTicks`: a tick a month, every stop inside its own month, empty months sharing their gap, the year's mark (red, then green). One red was the test's own count (38 months from September 2026 back to August 2023, not 37); the count was corrected.
- **Results:**
  - unit 186/186 (`vitest run --maxWorkers=2`, `.scratch` excluded; a plain `pnpm test` also picks up the frozen prototype's copy of the site and a capture script under `.scratch`, which fail as before);
  - `voyage.spec` and `smooth-scroll.spec` 18/18, against the dev server on :3000;
  - tsc passes; `pnpm build` passes;
  - eslint on app, components and lib flags only the pre-existing `app/page.tsx` error.
- **Refactor verdicts:**
  - **`takes()` naming each choice** rather than looping over `TAKES`: keep. Four typed lines.
  - **`monthTicks` recomputing each month's room:** keep. 38 months, a handful of stops, once.
  - **The three routes in one `createRoad`:** keep. Two of them go once a route is picked.
  - **The engraving redrawn as a canvas:** left for the build, which should cut the words in the plate's shader from a texture laid once (the long frames above).
  - **`hairlines` with three new options** (the travelled stretch, a near fade, a box it goes in front of): keep. One shader, every option off by default.
  - **Square and level, posed in the stage:** keep. The stage poses every body to the camera each frame.
- **Fixed along the way:**
  - the gold plaque's ink: dark, its small print as dark as the rest (it measured 4.1–4.3:1);
  - the route in front of the plate being read (MCP's small print at 390 was 2.6:1, the road passing in front);
  - the probe's mirrored plates hid their text (their corners were mirrored twice);
  - a monolith's first sight hitched up to 168 ms (its material compiling): now warmed up as it loads;
  - the stills showed the plates slanted (the camera's up was the frame before's).
- **For the build:**
  - a monolith fading in reads for a moment as a see-through plate (gold looks grey then);
  - on a phone the square plates sit close to the frame's edge (the camera there is the storyboard's).
